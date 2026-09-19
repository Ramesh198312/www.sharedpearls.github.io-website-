// Cloudflare enforces access BEFORE serving this page. This module refreshes
// the browser session and keeps open pages in sync with subscription changes.
import { client, session, bridge, api } from './client.js';
let checking = false;
async function refresh() {
  if (checking) return;
  checking = true;
  try {
    if (!await session()) throw new Error('Sign-in required');
    await bridge();
    if (!(await api('membership')).active) {
      location.replace('/account.html?need=subscription&next=' + encodeURIComponent(location.pathname));
    }
  } catch {
    // A network failure does not prove that a paid subscription has ended.
    // Subsequent page requests are always checked again by Cloudflare.
  } finally { checking = false; }
}
client().then(({ supabase }) => {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') location.replace('/account.html?mode=login');
    if (event === 'TOKEN_REFRESHED') setTimeout(refresh, 0);
  });
}).catch(() => {});
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
setInterval(refresh, 120000);
refresh();
