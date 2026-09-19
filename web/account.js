import { client, session, api, bridge, logout, safeNext, paymentDestination } from './client.js';
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const next = safeNext(params.get('next'));
let mode = params.get('mode') === 'login' ? 'login' : 'signup';
let active = false;
let busy = false;
let stateVersion = 0;
function say(text, kind = 'error') {
  $('msg').textContent = text;
  $('msg').className = 'msg show ' + kind;
}
function clear() { $('msg').textContent = ''; $('msg').className = 'msg'; }
function setMode(value) {
  mode = value;
  const login = mode === 'login', recovery = mode === 'recovery';
  $('title').textContent = recovery ? 'Choose a new password' : login ? 'Welcome back' : 'Create your account';
  $('lede').textContent = recovery ? 'Enter your new password below.' : login
    ? 'Log in to continue to your premium dashboard.'
    : 'Create an account, then subscribe securely with Stripe.';
  $('submitBtn').textContent = recovery ? 'Save new password' : login ? 'Log in' : 'Create account and continue';
  $('password').autocomplete = login ? 'current-password' : 'new-password';
  $('password').minLength = login ? 1 : 8;
  $('pwHint').hidden = login;
  $('emailField').hidden = recovery;
  $('email').required = !recovery;
  $('switchRow').hidden = recovery;
  $('forgotRow').hidden = !login;
  $('switchText').textContent = login ? 'New here? ' : 'Already have an account? ';
  $('switchBtn').textContent = login ? 'Create an account' : 'Log in instead';
}
async function showState() {
  const version = ++stateVersion;
  const current = await session();
  if (version !== stateVersion) return;
  if (mode === 'recovery') {
    $('authBlock').hidden = false; $('payBlock').hidden = true; return;
  }
  $('authBlock').hidden = !!current;
  $('payBlock').hidden = !current;
  active = false;
  if (!current) return;
  $('signedInAs').textContent = 'Signed in as ' + current.user.email + '.';
  $('title').textContent = 'Your membership';
  $('lede').textContent = 'Manage your Mastery Pass and continue learning.';
  $('payBtn').disabled = true;
  $('payBtn').textContent = 'Checking your membership…';
  const membership = await api('membership');
  if (version !== stateVersion) return;
  active = membership.active;
  $('payBtn').textContent = active ? 'Go to your premium dashboard' : 'Subscribe now — US$10/month';
  $('payBtn').disabled = false;
  if (active) {
    await bridge();
    say('Your subscription is active.', 'ok');
    if (params.has('need') || params.get('mode') === 'login') location.replace(next);
  }
}
async function checkout() {
  if (busy) return;
  busy = true; clear(); $('payBtn').disabled = true;
  try {
    await bridge();
    if (active) { location.assign(next); return; }
    $('payBtn').textContent = 'Opening secure payment…';
    const result = await api('create-checkout');
    location.assign(paymentDestination(result.url));
  } catch (error) {
    say(error.message); busy = false;
    $('payBtn').disabled = false;
    $('payBtn').textContent = active ? 'Go to your premium dashboard' : 'Subscribe now — US$10/month';
  }
}
$('authForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || !$('authForm').reportValidity()) return;
  busy = true; clear(); $('submitBtn').disabled = true;
  try {
    const { supabase } = await client();
    const email = $('email').value.trim(), password = $('password').value;
    const result = mode === 'recovery'
      ? await supabase.auth.updateUser({ password })
      : mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: {
          emailRedirectTo: location.origin + '/account.html?mode=login',
        } });
    if (result.error) throw result.error;
    if (mode === 'recovery') { setMode('login'); say('Password updated.', 'ok'); }
    const current = await session();
    if (!current) {
      say('Check your inbox to confirm your email, then return here to log in.', 'ok');
      return;
    }
    await showState();
    await bridge();
    if (active) location.assign(next);
    // The explicit Subscribe button opens Stripe. Signup itself does not charge.
  } catch (error) { say(error.message); }
  finally { busy = false; $('submitBtn').disabled = false; }
});
$('switchBtn').addEventListener('click', () => { clear(); setMode(mode === 'login' ? 'signup' : 'login'); });
$('payBtn').addEventListener('click', checkout);
$('logoutBtn').addEventListener('click', async () => {
  try { await logout(); location.replace('/account.html?mode=login'); } catch (error) { say(error.message); }
});
$('manageBtn').addEventListener('click', async () => {
  $('manageBtn').disabled = true;
  try { location.assign(paymentDestination((await api('billing-portal')).url)); }
  catch (error) { say(error.message); $('manageBtn').disabled = false; }
});
$('forgotBtn').addEventListener('click', async () => {
  if (!$('email').reportValidity()) return;
  try {
    const { supabase } = await client();
    const { error } = await supabase.auth.resetPasswordForEmail($('email').value.trim(), {
      redirectTo: location.origin + '/account.html?mode=recovery',
    });
    if (error) throw error;
    say('If this email has an account, a password reset link will arrive shortly.', 'ok');
  } catch (error) { say(error.message); }
});
$('googleBtn').addEventListener('click', async () => {
  try {
    const { supabase } = await client();
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google',
      options: { redirectTo: location.origin + '/account.html?mode=login' } });
    if (error) throw error;
  } catch (error) { say(error.message); }
});
setMode(mode);
(async () => {
  try {
    const { supabase, config } = await client();
    $('googleBtn').hidden = !config.googleEnabled;
    $('providerDivider').hidden = !config.googleEnabled;
    supabase.auth.onAuthStateChange((event) => {
      // Do not await auth methods inside Supabase's auth callback.
      if (event === 'PASSWORD_RECOVERY') {
        setMode('recovery'); $('authBlock').hidden = false; $('payBlock').hidden = true;
      }
      if (event === 'TOKEN_REFRESHED') setTimeout(() => bridge().catch(error => say(error.message)), 0);
    });
    // Recovery links are accepted only after Supabase verifies them.
    if (params.get('mode') === 'recovery' && await session()) setMode('recovery');
    await showState();
    if (params.get('checkout') === 'cancelled') say('Checkout was closed. You can continue when you are ready.', 'ok');
  } catch (error) { say(error.message); }
})();
