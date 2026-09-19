import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { hasAccess, subscriptionRecord, validatePrice, DASHBOARD } from './policy.js';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function must(value, name) {
  if (!value) throw new HttpError(503, 'Membership is being configured. Please try again shortly.');
  return value;
}
function check(result) {
  if (result.error) throw new Error('Billing database operation failed: ' + result.error.code);
  return result.data;
}

export function createServices(env, overrides = {}) {
  const db = overrides.db ?? createClient(must(env.SUPABASE_URL), must(env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } });
  let stripeClient;
  const stripe = () => overrides.stripe ?? (stripeClient ??= new Stripe(must(env.STRIPE_SECRET_KEY),
    { httpClient: Stripe.createFetchHttpClient(), maxNetworkRetries: 2 }));
  const priceIds = () => [must(env.STRIPE_PRICE_ID), ...(env.STRIPE_LEGACY_PRICE_IDS || '').split(',').map(s => s.trim()).filter(Boolean)];
  const site = () => new URL(must(env.SITE_URL)).origin;

  async function customerFor(user) {
    let existing = check(await db.from('billing_customers').select('stripe_customer_id').eq('user_id', user.id).maybeSingle());
    if (existing) return existing.stripe_customer_id;
    const customer = await stripe().customers.create({ metadata: { supabase_user_id: user.id } },
      { idempotencyKey: 'sharedpearls-customer-' + user.id });
    check(await db.from('billing_customers').upsert(
      { user_id: user.id, stripe_customer_id: customer.id }, { onConflict: 'user_id', ignoreDuplicates: true }));
    existing = check(await db.from('billing_customers').select('stripe_customer_id').eq('user_id', user.id).single());
    return existing.stripe_customer_id;
  }
  async function syncSubscription(id, expectedUserId) {
    const observedAt = new Date().toISOString();
    const sub = await stripe().subscriptions.retrieve(id, { expand: ['latest_invoice'] });
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const owner = check(await db.from('billing_customers').select('user_id').eq('stripe_customer_id', customerId).maybeSingle());
    if (!owner) return null; // Other Stripe products/customers must not receive access.
    if (expectedUserId && owner.user_id !== expectedUserId) throw new HttpError(403, 'This payment belongs to another account.');
    const record = subscriptionRecord(sub, owner.user_id, priceIds(), observedAt);
    if (!record) {
      // Revoke any previously mapped subscription that moved to a different product.
      check(await db.from('billing_subscriptions').update({ status: 'not_entitled', observed_at: observedAt })
        .eq('stripe_subscription_id', id).lte('observed_at', observedAt));
      return null;
    }
    // A new billing period can start before its invoice is paid. Do not grant
    // the next month's access just because Stripe still reports active.
    if (record.status === 'active' && sub.latest_invoice?.status !== 'paid') record.status = 'pending_payment';
    check(await db.rpc('membership_sync_subscription', { p_record: record }));
    return record;
  }
  async function access(userId) {
    const rows = check(await db.from('billing_subscriptions')
      .select('status,current_period_end,cancel_at_period_end,price_id').eq('user_id', userId).in('price_id', priceIds()));
    return { active: hasAccess(rows), subscriptions: rows };
  }
  return {
    async authenticate(token) {
      const { data, error } = await db.auth.getUser(token);
      if (error || !data.user) throw new HttpError(401, 'Please log in again.');
      // Decode expiry only AFTER Supabase has cryptographically verified the token.
      let expiresAt;
      try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        expiresAt = JSON.parse(atob(payload)).exp;
      } catch { throw new HttpError(401, 'Please log in again.'); }
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() / 1000) throw new HttpError(401, 'Please log in again.');
      return { ...data.user, expiresAt };
    },
    access,
    async checkout(user) {
      const price = await stripe().prices.retrieve(must(env.STRIPE_PRICE_ID));
      if (!validatePrice(price)) throw new HttpError(503, 'The monthly plan is not ready. Please contact us.');
      const customer = await customerFor(user);
      const subscriptions = stripe().subscriptions.list({ customer, status: 'all', limit: 100 });
      for await (const sub of subscriptions) {
        if (!sub.items.data.some(item => priceIds().includes(item.price.id))) continue;
        if (['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete'].includes(sub.status)) {
          await syncSubscription(sub.id, user.id);
          if ((await access(user.id)).active) return { url: site() + DASHBOARD, active: true };
          throw new HttpError(409, 'You already have a subscription that needs attention. Use Manage subscription to update it.');
        }
      }
      // Reuse open checkouts so returning/canceling does not create duplicate subscriptions.
      const open = await stripe().checkout.sessions.list({ customer, status: 'open', limit: 100 });
      const reusable = open.data.find(session => session.metadata?.supabase_user_id === user.id &&
        session.metadata?.price_id === env.STRIPE_PRICE_ID && session.url);
      if (reusable) return { url: reusable.url };
      const key = check(await db.rpc('membership_checkout_key', { p_user_id: user.id }));
      const session = await stripe().checkout.sessions.create({
        mode: 'subscription', customer, client_reference_id: user.id,
        payment_method_types: ['card'],
        line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
        metadata: { supabase_user_id: user.id, price_id: env.STRIPE_PRICE_ID },
        subscription_data: { metadata: { supabase_user_id: user.id } },
        success_url: site() + '/payment-success.html?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: site() + '/account.html?checkout=cancelled',
        allow_promotion_codes: false,
      }, { idempotencyKey: 'sharedpearls-checkout-' + key + '-' + env.STRIPE_PRICE_ID });
      if (session.status === 'expired' || !session.url) {
        // Allow the next attempt to receive a fresh idempotency key.
        check(await db.from('billing_customers').update({ checkout_key: null }).eq('user_id', user.id));
        throw new HttpError(409, 'That checkout has expired. Please select Subscribe again.');
      }
      return { url: session.url };
    },
    async confirm(user, sessionId) {
      if (!/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId || '')) throw new HttpError(400, 'Invalid checkout reference.');
      const session = await stripe().checkout.sessions.retrieve(sessionId);
      const owner = check(await db.from('billing_customers').select('stripe_customer_id').eq('user_id', user.id).maybeSingle());
      if (session.client_reference_id !== user.id || session.metadata?.supabase_user_id !== user.id ||
        !owner || session.customer !== owner.stripe_customer_id) {
        throw new HttpError(403, 'This payment belongs to another account.');
      }
      if (session.mode !== 'subscription' || !priceIds().includes(session.metadata?.price_id)) {
        throw new HttpError(400, 'This checkout is not for the Mastery Pass.');
      }
      if (session.status === 'complete' && session.payment_status === 'paid' && session.subscription) {
        await syncSubscription(typeof session.subscription === 'string' ? session.subscription : session.subscription.id, user.id);
      }
      return { ...(await access(user.id)), checkoutStatus: session.status };
    },
    async portal(user) {
      const customer = check(await db.from('billing_customers').select('stripe_customer_id').eq('user_id', user.id).maybeSingle());
      if (!customer) throw new HttpError(404, 'You do not have a billing account yet.');
      const result = await stripe().billingPortal.sessions.create({
        customer: customer.stripe_customer_id, return_url: site() + '/account.html',
      });
      return { url: result.url };
    },
    async webhook(body, signature) {
      if (!signature) throw new HttpError(400, 'Missing Stripe signature.');
      let event;
      try {
        event = await stripe().webhooks.constructEventAsync(body, signature, must(env.STRIPE_WEBHOOK_SECRET),
          undefined, Stripe.createSubtleCryptoProvider());
      } catch { throw new HttpError(400, 'Invalid Stripe signature.'); }
      let subscriptionId;
      const object = event.data.object;
      if (event.type.startsWith('customer.subscription.')) subscriptionId = object.id;
      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded')
        subscriptionId = object.subscription;
      if (['invoice.paid', 'invoice.payment_failed', 'invoice.payment_action_required'].includes(event.type))
        subscriptionId = object.parent?.subscription_details?.subscription ?? object.subscription;
      if (subscriptionId) await syncSubscription(typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id);
      return { received: true };
    },
  };
}
