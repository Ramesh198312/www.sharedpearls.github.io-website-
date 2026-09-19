export const DASHBOARD = '/monthly-premium-dashboard-main.html';
export const MONTHLY_AMOUNT = 1000;
export const CURRENCY = 'usd';

const extraPremium = new Set([
  'inversion.html', 'lexical-vault.html', 'epistemic-modality.html',
  'resume-builder.html', 'ielts-dashboard-claude.html',
]);

export function canonicalPath(path) {
  let decoded;
  try { decoded = decodeURIComponent(path); } catch { throw new Error('Invalid URL'); }
  if (/[\\\x00-\x1f]/.test(decoded) || /%[0-9a-f]{2}/i.test(decoded)) throw new Error('Invalid URL');
  const parts = decoded.split('/').filter(Boolean);
  if (parts.some(p => p === '.' || p === '..')) throw new Error('Invalid URL');
  return '/' + parts.join('/');
}

export function isPremiumPath(path) {
  const name = canonicalPath(path).slice(1);
  const htmlName = name.includes('.') ? name : name + '.html';
  return extraPremium.has(htmlName) ||
    (htmlName.includes('premium') && /\.(html|m4a|mp3|mp4|wav|pdf|zip)$/i.test(htmlName));
}

export function safeNext(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return DASHBOARD;
  try {
    const url = new URL(value, 'https://www.sharedpearls.com');
    return url.origin === 'https://www.sharedpearls.com' && isPremiumPath(url.pathname)
      ? canonicalPath(url.pathname) + url.search + url.hash : DASHBOARD;
  } catch { return DASHBOARD; }
}

export function hasAccess(rows, now = Date.now()) {
  return rows.some(row => row.status === 'active' && Date.parse(row.current_period_end) > now);
}

export function validatePrice(price) {
  return price.active === true && price.type === 'recurring' &&
    price.unit_amount === MONTHLY_AMOUNT && price.currency === CURRENCY &&
    price.recurring?.interval === 'month' && price.recurring?.interval_count === 1;
}

export function subscriptionRecord(subscription, userId, allowedPriceIds, observedAt) {
  const item = subscription.items.data.find(i => allowedPriceIds.includes(i.price.id));
  if (!item) return null;
  const periodEnd = item.current_period_end ?? subscription.current_period_end;
  return {
    stripe_subscription_id: subscription.id,
    user_id: userId,
    stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    price_id: item.price.id,
    status: subscription.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    observed_at: observedAt,
  };
}
