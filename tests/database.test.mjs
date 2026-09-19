import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const alice = '00000000-0000-0000-0000-000000000001';
const bob = '00000000-0000-0000-0000-000000000002';
test('database enforces ownership, blocks self-upgrades and ignores stale webhook writes', async () => {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    insert into auth.users values ('${alice}'), ('${bob}');
  `);
  await db.exec(await readFile(new URL('../supabase/migrations/202609200001_membership.sql', import.meta.url), 'utf8'));
  await db.query('insert into billing_customers (user_id,stripe_customer_id) values ($1,$2),($3,$4)', [alice,'cus_alice',bob,'cus_bob']);
  const row = { stripe_subscription_id:'sub_alice', user_id:alice, stripe_customer_id:'cus_alice', price_id:'price_10',
    status:'active',current_period_end:'2027-01-01T00:00:00Z',cancel_at_period_end:false,observed_at:'2026-09-20T01:00:00Z' };
  const sync = async r => db.query('select membership_sync_subscription($1::jsonb)', [JSON.stringify(r)]);
  await db.exec('set role service_role');
  await sync(row);
  await sync({ ...row, stripe_subscription_id:'sub_bob',user_id:bob,stripe_customer_id:'cus_bob' });
  await sync({ ...row,status:'canceled',observed_at:'2026-09-20T02:00:00Z' });
  await sync(row);
  assert.equal((await db.query("select status from billing_subscriptions where stripe_subscription_id='sub_alice'")).rows[0].status,'canceled');
  await assert.rejects(sync({ ...row,stripe_subscription_id:'sub_wrong',stripe_customer_id:'cus_bob' }), /mismatch/);
  const key1 = (await db.query('select membership_checkout_key($1) as key',[alice])).rows[0].key;
  const key2 = (await db.query('select membership_checkout_key($1) as key',[alice])).rows[0].key;
  assert.equal(key1,key2);
  await db.exec('reset role; set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[alice]);
  assert.equal((await db.query('select count(*)::int as count from billing_subscriptions')).rows[0].count,1);
  await assert.rejects(db.query("update billing_subscriptions set status='active'"), /permission denied/);
  await assert.rejects(db.query('select * from billing_customers'), /permission denied/);
  await assert.rejects(db.query('select membership_checkout_key($1)',[alice]), /permission denied/);
  await assert.rejects(sync(row), /permission denied/);
  await db.exec('reset role; set role anon');
  await assert.rejects(db.query('select * from billing_subscriptions'), /permission denied/);
  await db.close();
});
