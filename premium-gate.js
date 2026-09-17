// ============================================================
// premium-gate.js
// Paste ONE line into <head> of monthly-premium-dashboard-main.html:
//   <script type="module" src="/premium-gate.js"></script>
// Put it BEFORE your other scripts.
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

/* ====== EDIT THESE ====== */
const SUPABASE_URL      = 'https://lgvqmsrhvvjvcrtifcxi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndnFtc3JodnZqdmNydGlmY3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NzYzOTgsImV4cCI6MjEwNTA1MjM5OH0.UoCBmtc7Jv4Bm3C_PyKQswAEUyVBS6lc05pGBCfsT7g';
const ACCOUNT_PAGE      = '/account.html';
/* ======================== */

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hide the page until access is confirmed, so paid content never flashes.
const veil = document.createElement('style');
veil.id = 'spow-veil';
veil.textContent = `
  body > *:not(#spow-gate-msg) { visibility: hidden !important; }
  #spow-gate-msg {
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 1rem; color: #334155;
    background: #F8FAFC; z-index: 99999; text-align: center; padding: 2rem;
  }
`;
document.documentElement.appendChild(veil);

function status(text) {
  let el = document.getElementById('spow-gate-msg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'spow-gate-msg';
    (document.body || document.documentElement).appendChild(el);
  }
  el.textContent = text;
}

function reveal() {
  document.getElementById('spow-veil')?.remove();
  document.getElementById('spow-gate-msg')?.remove();
}

function bounce(reason) {
  location.replace(`${ACCOUNT_PAGE}?need=${reason}`);
}

async function isPremium(userId) {
  const { data, error } = await supabase
    .from('profiles').select('is_premium').eq('id', userId).single();
  if (error) return false;
  return data?.is_premium === true;
}

(async function gate() {
  status('Checking your access…');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return bounce('login');

  const userId = session.user.id;

  if (await isPremium(userId)) { reveal(); return; }

  // Arriving straight from Stripe? The webhook may be a second or two
  // behind the redirect, so poll briefly before turning them away.
  const justPaid = new URLSearchParams(location.search).get('checkout') === 'success';

  if (justPaid) {
    status('Payment received. Activating your access…');
    for (let i = 0; i < 12; i++) {                 // up to ~24 seconds
      await new Promise(r => setTimeout(r, 2000));
      if (await isPremium(userId)) {
        history.replaceState({}, '', location.pathname);
        reveal();
        return;
      }
    }
    status('Payment went through, but activation is taking longer than usual. Refresh this page in a minute, or email support@yoursite.com.');
    return;
  }

  bounce('subscription');
})();
