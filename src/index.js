import { createServices, HttpError } from './services.js';
import { canonicalPath, isPremiumPath, safeNext } from './policy.js';

const COOKIE = '__Host-spow_session';
function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers,
  } });
}
function bearer(request) {
  const value = request.headers.get('Authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
}
function cookieToken(request) {
  return (request.headers.get('Cookie') || '').split(';').map(p => p.trim())
    .find(p => p.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1) || '';
}
function sessionCookie(token, expiresAt) {
  const seconds = token ? Math.max(0, Math.floor(expiresAt - Date.now() / 1000)) : 0;
  return COOKIE + '=' + token + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + seconds;
}
function noStore(response) {
  const copy = new Response(response.body, response);
  copy.headers.set('Cache-Control', 'private, no-store');
  copy.headers.set('Vary', 'Cookie');
  copy.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return copy;
}

export function createHandler(serviceFactory = createServices) {
  return {
    async fetch(request, env) {
      try {
        const url = new URL(request.url);
        if (url.hostname === 'sharedpearls.com') {
          url.hostname = 'www.sharedpearls.com';
          return Response.redirect(url, 308);
        }
        let path;
        try { path = canonicalPath(url.pathname); } catch { return json({ error: 'Invalid URL.' }, 400); }
        if (path.startsWith('/api/')) {
          if (path === '/api/config' && request.method === 'GET') {
            const publicKey = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
            if (!env.SUPABASE_URL || !publicKey)
              throw new HttpError(503, 'Membership is being configured. Please try again shortly.');
            return json({ supabaseUrl: env.SUPABASE_URL, supabaseKey: publicKey,
              googleEnabled: env.GOOGLE_LOGIN_ENABLED === 'true' });
          }
          if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
          if (path === '/api/stripe-webhook') {
            if (Number(request.headers.get('Content-Length')) > 1048576) throw new HttpError(413, 'Request too large.');
            const body = await request.text();
            if (body.length > 1048576) throw new HttpError(413, 'Request too large.');
            return json(await serviceFactory(env).webhook(body, request.headers.get('Stripe-Signature')));
          }
          if (!['/api/session', '/api/logout', '/api/membership', '/api/create-checkout',
            '/api/checkout-status', '/api/billing-portal'].includes(path)) return json({ error: 'Not found.' }, 404);
          // Browser API calls are same-origin and authenticated with a bearer token.
          if (request.headers.get('Origin') !== url.origin) throw new HttpError(403, 'Invalid request origin.');
          if (path === '/api/logout') return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
          const token = bearer(request);
          if (!token) throw new HttpError(401, 'Please log in to continue.');
          const services = serviceFactory(env);
          const user = await services.authenticate(token);
          if (path === '/api/session') return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token, user.expiresAt) });
          if (path === '/api/membership') return json(await services.access(user.id));
          if (path === '/api/create-checkout') return json(await services.checkout(user));
          if (path === '/api/billing-portal') return json(await services.portal(user));
          let body;
          try { body = await request.json(); } catch { throw new HttpError(400, 'Invalid request.'); }
          return json(await services.confirm(user, body.sessionId));
        }
        if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405);
        if (path === '/_worker.js' || path === '/_routes.json') return new Response('Not found', { status: 404 });
        if (isPremiumPath(path)) {
          let active = false;
          const token = cookieToken(request);
          if (token) {
            const services = serviceFactory(env);
            try {
              const user = await services.authenticate(token);
              active = (await services.access(user.id)).active;
            } catch (error) { if (error.status !== 401) throw error; }
          }
          if (!active) {
            const next = safeNext(path + url.search);
            return new Response(null, { status: 302, headers: {
              Location: '/account.html?need=subscription&next=' + encodeURIComponent(next),
              'Cache-Control': 'private, no-store', 'Vary': 'Cookie',
            } });
          }
          // Canonicalize aliases before fetching so checks and asset lookup use the same path.
          if (env.PLATFORM !== 'pages' && !path.split('/').pop().includes('.')) path += '.html';
          url.pathname = path;
          return noStore(await env.ASSETS.fetch(new Request(url, request)));
        }
        if (path === '/' && env.PLATFORM !== 'pages') url.pathname = '/index.html';
        const response = await env.ASSETS.fetch(new Request(url, request));
        const secured = new Response(response.body, response);
        secured.headers.set('X-Content-Type-Options', 'nosniff');
        secured.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        return secured;
      } catch (error) {
        if (!(error instanceof HttpError)) console.error('Membership request failed', error.name);
        return json({ error: error instanceof HttpError ? error.message :
          'We could not complete that request. Please try again shortly.' }, error.status || 503);
      }
    },
  };
}
export default createHandler();
