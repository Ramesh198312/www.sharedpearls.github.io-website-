import { session, api, bridge, DASHBOARD } from './client.js';
const status = document.getElementById('status');
const retry = document.getElementById('retry');
const sessionId = new URLSearchParams(location.search).get('session_id');
let running = false;
async function confirm() {
  if (running) return;
  running = true; retry.hidden = true;
  try {
    if (!sessionId) throw new Error('The checkout reference is missing. Open your account to check your membership.');
    if (!await session()) {
      status.textContent = 'Please log in with the account you used to subscribe, then return to this confirmation page.';
      document.getElementById('account-link').hidden = false;
      return;
    }
    for (let attempt = 0; attempt < 8; attempt++) {
      status.textContent = 'Confirming your subscription…';
      const result = await api('checkout-status', { sessionId });
      if (result.active) {
        await bridge();
        status.textContent = 'Your membership is ready. Opening your dashboard…';
        location.replace(DASHBOARD); return;
      }
      if (result.checkoutStatus === 'expired') throw new Error('This checkout has expired. Open your account to start again.');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    status.textContent = 'Your subscription is still being confirmed. Please check again shortly; you do not need to pay again.';
    retry.hidden = false;
  } catch (error) {
    status.textContent = error.message;
    retry.hidden = false;
    document.getElementById('account-link').hidden = false;
  } finally { running = false; }
}
retry.addEventListener('click', confirm);
confirm();
