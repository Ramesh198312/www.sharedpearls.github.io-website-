-- Run once in the Supabase SQL Editor. Existing profiles are left untouched.
create table public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  checkout_key uuid,
  checkout_key_expires_at timestamptz
);
create table public.billing_subscriptions (
  stripe_subscription_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null references public.billing_customers(stripe_customer_id),
  price_id text not null,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  observed_at timestamptz not null
);
create index billing_subscriptions_user_id on public.billing_subscriptions(user_id);

alter table public.billing_customers enable row level security;
alter table public.billing_subscriptions enable row level security;
revoke all on public.billing_customers, public.billing_subscriptions from anon, authenticated;
grant select on public.billing_subscriptions to authenticated;
grant all on public.billing_customers, public.billing_subscriptions to service_role;
create policy "Members read their own subscription" on public.billing_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

-- Serialize checkout attempts for each member. Only our verified backend can call this.
create function public.membership_checkout_key(p_user_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  perform 1 from public.billing_customers where user_id = p_user_id for update;
  update public.billing_customers set
    checkout_key = gen_random_uuid(),
    checkout_key_expires_at = now() + interval '23 hours'
  where user_id = p_user_id and (checkout_key is null or checkout_key_expires_at <= now());
  select checkout_key into result from public.billing_customers where user_id = p_user_id;
  if result is null then raise exception 'Billing customer is missing'; end if;
  return result;
end;
$$;
revoke all on function public.membership_checkout_key(uuid) from public, anon, authenticated;
grant execute on function public.membership_checkout_key(uuid) to service_role;

-- Webhooks retrieve the latest Stripe subscription before calling this function.
-- The observation timestamp stops slower, older reads overwriting newer reads.
create function public.membership_sync_subscription(p_record jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.billing_customers
    where user_id = (p_record->>'user_id')::uuid
      and stripe_customer_id = p_record->>'stripe_customer_id'
  ) then raise exception 'Subscription customer mismatch'; end if;
  insert into public.billing_subscriptions (
    stripe_subscription_id, user_id, stripe_customer_id, price_id, status,
    current_period_end, cancel_at_period_end, observed_at
  ) values (
    p_record->>'stripe_subscription_id', (p_record->>'user_id')::uuid,
    p_record->>'stripe_customer_id', p_record->>'price_id', p_record->>'status',
    (p_record->>'current_period_end')::timestamptz,
    (p_record->>'cancel_at_period_end')::boolean, (p_record->>'observed_at')::timestamptz
  ) on conflict (stripe_subscription_id) do update set
    price_id = excluded.price_id, status = excluded.status,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end, observed_at = excluded.observed_at
  where public.billing_subscriptions.observed_at <= excluded.observed_at
    and public.billing_subscriptions.user_id = excluded.user_id
    and public.billing_subscriptions.stripe_customer_id = excluded.stripe_customer_id;
end;
$$;
revoke all on function public.membership_sync_subscription(jsonb) from public, anon, authenticated;
grant execute on function public.membership_sync_subscription(jsonb) to service_role;
