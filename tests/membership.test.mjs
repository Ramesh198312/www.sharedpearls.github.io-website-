import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../src/index.js';
import { HttpError } from '../src/services.js';
import { hasAccess, isPremiumPath, safeNext, validatePrice, subscriptionRecord } from '../src/policy.js';

const origin = 'https://www.sharedpearls.com';
function fixture(overrides = {}) {
  let assets = 0;
  const services = {
    authenticate: async token => {
      if (token !== 'valid') throw new HttpError(401, 'Invalid session');
      return { id: 'user-1', expiresAt: Date.now() / 1000 + 3600 };
    },
    access: async () => ({ active: true }),
    checkout: async () => ({ url: 'https://checkout.stripe.com/c/pay/test' }),
    confirm: async () => ({ active: true }),
    portal: async () => ({ url: 'https://billing.stripe.com/test' }),
    webhook: async () => ({ received: true }),
    ...overrides,
  };
  const env = {
    SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public-key',
    SUPABASE_SERVICE_ROLE_KEY: 'never-expose-this', STRIPE_SECRET_KEY: 'never-expose-stripe',
    ASSETS: { fetch: async request => { assets++; return new Response('asset:' + new URL(request.url).pathname); } },
  };
  const app = createHandler(() => services);
  return { request: (path, init) => app.fetch(new Request(origin + path, init), env), assetCount: () => assets };
}
const post = (token = 'valid', extra = {}) => ({
  method: 'POST', headers: { Origin: origin, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
  body: '{}', ...extra,
});
test('anonymous visitors cannot download premium HTML, audio, aliases, or encoded paths', async () => {
  const f = fixture();
  for (const path of ['/monthly-premium-dashboard-main.html', '/premium-articles.html', '/premium-articles',
    '/premium-articles/', '/%70remium-articles.html', '//premium-articles.html', '/premium-listening-02.m4a',
    '/lexical-vault.html', '/inversion']) {
    const response = await f.request(path);
    assert.equal(response.status, 302, path);
    assert.match(response.headers.get('Location'), /^\/account.html/);
    assert.match(response.headers.get('Cache-Control'), /no-store/);
  }
  assert.equal(f.assetCount(), 0);
});
test('expired sessions and inactive subscriptions cannot read assets', async () => {
  const f = fixture({ access: async () => ({ active: false }) });
  for (const token of ['invalid', 'valid']) {
    assert.equal((await f.request('/premium-tenses.html', { headers: { Cookie: '__Host-spow_session=' + token } })).status, 302);
  }
  assert.equal(f.assetCount(), 0);
});
test('verified paid members receive protected assets with private caching', async () => {
  const f = fixture();
  const response = await f.request('/premium-articles', { headers: { Cookie: '__Host-spow_session=valid' } });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'asset:/premium-articles.html');
  assert.match(response.headers.get('Cache-Control'), /private, no-store/);
  assert.equal(response.headers.get('Vary'), 'Cookie');
  assert.equal(f.assetCount(), 1);
});
test('database outages fail closed without serving premium content', async () => {
  const f = fixture({ access: async () => { throw new HttpError(503, 'Unavailable'); } });
  assert.equal((await f.request('/premium-tenses.html', { headers: { Cookie: '__Host-spow_session=valid' } })).status, 503);
  assert.equal(f.assetCount(), 0);
});
test('free lessons remain accessible and home resolves correctly', async () => {
  const f = fixture();
  assert.equal((await f.request('/grammar-lesson-1.html')).status, 200);
  assert.equal(await (await f.request('/')).text(), 'asset:/index.html');
});
test('checkout rejects missing, forged, cookie-only, and cross-origin authentication', async () => {
  const f = fixture();
  assert.equal((await f.request('/api/create-checkout', post(''))).status, 401);
  assert.equal((await f.request('/api/create-checkout', post('forged'))).status, 401);
  assert.equal((await f.request('/api/create-checkout', { method: 'POST', headers: { Origin: origin, Cookie: '__Host-spow_session=valid' } })).status, 401);
  assert.equal((await f.request('/api/create-checkout', post('valid', { headers: { Origin: 'https://attacker.test', Authorization: 'Bearer valid' } }))).status, 403);
  assert.equal((await f.request('/api/create-checkout', post())).status, 200);
});
test('session bridge creates a host-only, HttpOnly, Secure cookie; logout clears it', async () => {
  const f = fixture();
  const cookie = (await f.request('/api/session', post())).headers.get('Set-Cookie');
  assert.match(cookie, /^__Host-spow_session=valid;/);
  assert.match(cookie, /HttpOnly; Secure; SameSite=Lax/);
  assert.doesNotMatch(cookie, /Domain=/);
  const cleared = (await f.request('/api/logout', { method: 'POST', headers: { Origin: origin } })).headers.get('Set-Cookie');
  assert.match(cleared, /Max-Age=0/);
});
test('public configuration does not expose backend secrets', async () => {
  const text = await (await fixture().request('/api/config')).text();
  assert.match(text, /public-key/);
  assert.doesNotMatch(text, /never-expose/);
});
test('existing Cloudflare anon-key configuration supports Supabase login', async () => {
  const app = createHandler();
  const env = {
    SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'legacy-public-key',
    SUPABASE_SERVICE_ROLE_KEY: 'private-service-key',
  };
  const response = await app.fetch(new Request(origin + '/api/config'), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    supabaseUrl: env.SUPABASE_URL, supabaseKey: 'legacy-public-key', googleEnabled: false,
  });
});
test('worker code and malformed encoded paths cannot be fetched', async () => {
  const f = fixture();
  assert.equal((await f.request('/_worker.js')).status, 404);
  assert.equal((await f.request('/%2570remium-articles.html')).status, 400);
  assert.equal((await f.request('/premium%5carticles.html')).status, 400);
});
test('only active, unexpired subscriptions grant access', () => {
  const end = new Date(Date.now() + 86400000).toISOString();
  assert.equal(hasAccess([{ status: 'active', current_period_end: end }]), true);
  for (const status of ['trialing', 'incomplete', 'past_due', 'unpaid', 'canceled', 'paused'])
    assert.equal(hasAccess([{ status, current_period_end: end }]), false, status);
  assert.equal(hasAccess([{ status: 'active', current_period_end: '2000-01-01' }]), false);
  assert.equal(hasAccess([{ status: 'active', current_period_end: null }]), false);
});
test('only the requested US$10 monthly price can create checkout', () => {
  const p = { active: true, type: 'recurring', unit_amount: 1000, currency: 'usd', recurring: { interval: 'month', interval_count: 1 } };
  assert.equal(validatePrice(p), true);
  for (const change of [{unit_amount:200}, {currency:'myr'}, {active:false}, {recurring:{interval:'year',interval_count:1}}])
    assert.equal(validatePrice({ ...p, ...change }), false);
});
test('return destinations stay on approved premium routes', () => {
  assert.equal(safeNext('/premium-tenses.html'), '/premium-tenses.html');
  assert.equal(safeNext('//evil.test/steal'), '/monthly-premium-dashboard-main.html');
  assert.equal(safeNext('/account.html'), '/monthly-premium-dashboard-main.html');
  assert.equal(isPremiumPath('/assets/premium-gate.js'), false);
});
test('subscription mapping uses the entitled item billing period', () => {
  const record = subscriptionRecord({
    id:'sub_1', customer:'cus_1', status:'active', cancel_at_period_end:true,
    items:{data:[{price:{id:'price_other'},current_period_end:1},{price:{id:'price_10'},current_period_end:2000000000}]},
  }, 'user-1', ['price_10'], '2026-09-20T00:00:00Z');
  assert.equal(record.price_id, 'price_10');
  assert.equal(record.current_period_end, new Date(2000000000000).toISOString());
  assert.equal(record.cancel_at_period_end, true);
});
