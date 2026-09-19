import { createClient } from '@supabase/supabase-js';
export { safeNext, DASHBOARD } from '../src/policy.js';
let clientPromise;
export async function client() {
  return clientPromise ??= (async () => {
    const response = await fetch('/api/config', { signal: AbortSignal.timeout(15000) });
    const config = await response.json();
    if (!response.ok) throw new Error(config.error || 'Membership is temporarily unavailable.');
    const supabase = createClient(config.supabaseUrl, config.supabaseKey);
    return { supabase, config };
  })();
}
export async function session() {
  const { supabase } = await client();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
export async function api(path, body = {}) {
  const current = await session();
  if (!current) throw new Error('Please log in to continue.');
  const response = await fetch('/api/' + path, {
    method: 'POST', headers: {
      Authorization: 'Bearer ' + current.access_token, 'Content-Type': 'application/json',
    }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000),
  });
  let result;
  try { result = await response.json(); } catch { throw new Error('Membership is temporarily unavailable. Please try again.'); }
  if (!response.ok) throw new Error(result.error || 'We could not complete that request.');
  return result;
}
export async function bridge() { await api('session'); }
export async function logout() {
  const response = await fetch('/api/logout', { method: 'POST' });
  if (!response.ok) throw new Error('Could not log out. Please try again.');
  const { supabase } = await client();
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}
export function paymentDestination(value) {
  const url = new URL(value, location.origin);
  if (url.origin !== location.origin && !['https://checkout.stripe.com', 'https://billing.stripe.com'].includes(url.origin))
    throw new Error('Unexpected payment destination.');
  return url.href;
}
