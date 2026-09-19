# Shared Pearls: activate the US$10 monthly membership

## Current status
The website replacement has passed 23 automated checks and a local simulated signup/payment flow. Production cutover and a Stripe sandbox checkout remain to be completed. The new membership tables and protected backend database functions have been installed in the existing Supabase project; verification confirmed row-level security is enabled and anonymous reads/member inserts are denied.

The live site currently returns a GitHub.com server header, and the repository has GitHub Pages enabled. The existing Cloudflare Pages project `www-sharedpearls-github-io-website` is connected to the correct repository, but its `sharedpearls.com` custom domain is inactive. Its production branch is `cloudflare/workers-autoconfig`; `main` currently creates preview deployments. Build command and output directory are blank. GitHub Pages cannot run the new payment endpoints.

Cloudflare already stores Stripe and Supabase settings, including encrypted backend keys. The configured Stripe price `price_1U4JRwRo3NowbgKuO1Rixoz5` has been verified in Stripe as USD 10.00 per month for Premium Membership Pass, with zero active subscriptions shown. Reuse this price. The keys still need an end-to-end connection test; do not overwrite existing secrets unnecessarily.

The existing Stripe destination `energetic-glow` uses Thin payloads and listens only to three v2 account-person events. It cannot synchronize subscriptions. A new Snapshot destination has been prepared with the eight events below but has not yet been created. Supabase's Site URL and allowed redirects still point to the older `spow.pages.dev` site.

Email signup, email confirmation and custom SMTP are enabled. The owner saved the Gmail SMTP credentials directly; email delivery still needs an end-to-end test. Supabase flags Gmail as personal rather than transactional email, so verify delivery before opening public signup. No email password is included in these files.

The intended flow is:
Create/confirm a Supabase account → log in → select Subscribe → Stripe Checkout → verified subscription → /monthly-premium-dashboard-main.html.

New subscriptions are US$10 per month. Existing Stripe subscriptions are not repriced by this code. No existing customer is charged or migrated automatically.

## 1. Configure Supabase
Use your existing project (lgvqmsrhvvjvcrtifcxi), or a separate project for staging.

1. The migration `supabase/migrations/202609200001_membership.sql` has already been applied to project `lgvqmsrhvvjvcrtifcxi`. Do not rerun it there. For a separate staging project, run it once to add the billing tables and policies.
2. In Authentication URL Configuration, set Site URL to `https://www.sharedpearls.com`.
3. Add redirect URLs:
   - `https://www.sharedpearls.com/account.html?mode=login`
   - `https://www.sharedpearls.com/account.html?mode=recovery`
   - Equivalent URLs for your staging site during testing.
4. Keep email confirmation enabled. Configure production SMTP for confirmation and password-reset emails.
5. Google login is optional. Only set GOOGLE_LOGIN_ENABLED=true after configuring the Google provider and its callback URL.

The old `profiles.is_premium` field no longer decides paid access. Members cannot modify the new subscription records. Only the trusted backend can write them.

## 2. Configure Stripe
1. Use the existing Premium Membership Pass price `price_1U4JRwRo3NowbgKuO1Rixoz5`: **USD 10.00, every month**. The backend deliberately rejects the old $2 price, yearly prices and other currencies.
2. Enable Stripe's Customer Portal with payment-method updates and cancellation at the end of the billing period. The My account screen opens this portal.
3. Create a Snapshot webhook endpoint (not a Thin v2 account-person destination) at:
   `https://www.sharedpearls.com/api/stripe-webhook`
4. Select:
   - checkout.session.completed
   - checkout.session.async_payment_succeeded
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.paid
   - invoice.payment_failed
   - invoice.payment_action_required
5. Copy the endpoint's signing secret into Cloudflare as STRIPE_WEBHOOK_SECRET.

Use matching Stripe test keys, test price and test webhook while testing. Switch all of them together for production. No API-version-specific invoice field is trusted as payment proof: the backend retrieves the current Stripe subscription.

Do not send secret keys in chat or commit them to GitHub. Enter them directly in Cloudflare's secret settings.

## 3. Host the application on Cloudflare
Choose the option matching your Cloudflare project. Merely changing a DNS record does not install the backend.

### Cloudflare Pages (recommended for a GitHub-connected site)
1. Use the existing Pages project `www-sharedpearls-github-io-website`. First merge the prepared source changes into the repository. Once the preview flow works, select `main` as the production branch; do not switch production to the current unmodified static source.
2. Select framework preset **None**.
3. Build command: `npm run build`.
4. Build output directory: `dist`.
5. Use Node.js 22 or 24. Set compatibility flag `nodejs_compat` and a current compatibility date in Functions settings.
6. Add all runtime variables below to the production environment (and separately to preview, using test credentials).
7. Configure Functions to fail closed on quota exhaustion. All routes must pass through the generated _worker.js; retain the generated _routes.json.
8. First deploy to a preview/staging domain with its own SITE_URL and Supabase redirect URLs. Complete the tests below.
9. After approval, attach www.sharedpearls.com to this Pages project. Redirect sharedpearls.com to www.sharedpearls.com so sign-in stays on one hostname. The code also canonicalizes requests reaching it on the apex domain.
10. Disable the old GitHub Pages deployment after the Cloudflare site is working.

The build generates the Pages advanced-mode function automatically. Uploading the raw HTML files or setting the output directory to the repository root would omit the membership backend.

### Cloudflare Workers
The included wrangler.toml configures the equivalent Worker and asset binding:
```text
npm ci
npm test
npm run build
npx wrangler dev
```
For local development, copy .dev.vars.example to .dev.vars and fill in test values. Set production secrets through Cloudflare or `wrangler secret put NAME`. Publish with `npm run deploy` only after the settings and test flow are ready, then attach the custom domains in Cloudflare.

Keep `run_worker_first = true`. It ensures authentication runs before premium HTML or audio can be served. Do not deploy only the dist assets without their Worker.

### Required Cloudflare runtime settings

| Name | Value | Store as secret? |
|---|---|---|
| SITE_URL | https://www.sharedpearls.com (your staging origin for previews) | No |
| SUPABASE_URL | https://lgvqmsrhvvjvcrtifcxi.supabase.co | No |
| SUPABASE_PUBLISHABLE_KEY | Project publishable key or legacy anon key; the existing SUPABASE_ANON_KEY variable is also supported | No |
| SUPABASE_SERVICE_ROLE_KEY | Project service-role key | **Yes** |
| STRIPE_SECRET_KEY | Matching Stripe secret API key | **Yes** |
| STRIPE_WEBHOOK_SECRET | Signing secret for this endpoint and environment | **Yes** |
| STRIPE_PRICE_ID | The new USD 10/month price_... ID | No |
| GOOGLE_LOGIN_ENABLED | true only after Google login is configured; otherwise false | No |

Optional: STRIPE_LEGACY_PRICE_IDS is a comma-separated list of old prices whose already-mapped subscribers should retain access. This does not migrate old Payment Link purchases to Supabase. Reconcile existing paid customers by verifying ownership before adding billing mappings; do not make people buy a second subscription to recover an existing one.

## 4. Protect the content beyond the custom domain
Your GitHub repository is public. People can currently download the lesson source there. To treat that source as paid content, make the source repository private after ensuring Cloudflare retains access. Do not rely on hiding a link or JavaScript alone.

The server protects 82 currently identified premium HTML/audio files, including premium-named files and the nonstandard premium modules listed in src/policy.js. Public lessons, CSS, general images and shared media remain public. Review the policy whenever you add a premium resource, especially files without “premium” in the name.

Disable obsolete public hosting copies and purge cached premium HTML at cutover. Content downloaded before access controls were installed cannot be recalled.

## 5. Verify before accepting real payments
Use a Stripe sandbox/test mode, test credentials and test cards:
- Signup sends a confirmation email; confirmed users can log in.
- An anonymous visitor opening the dashboard, an individual premium lesson, or premium audio is sent to the account page.
- A signed-in unpaid member sees US$10/month and cannot access premium content.
- A successful test subscription returns through payment-success.html and opens the requested dashboard.
- Closing checkout does not grant access; retrying reuses the existing checkout.
- A paid member logging back in reaches the dashboard without another subscription.
- The Customer Portal opens for the current member only.
- Scheduled cancellation preserves access through the paid period; cancellation or a failed renewal updates access through the webhook.
- This implementation requires active status and a future billing-period end; past_due, unpaid, trialing and canceled do not grant access.
- Stripe shows successful webhook delivery; Supabase billing_subscriptions has the correct user, customer and subscription IDs.
- A payment for another user, unsigned webhook or forged URL cannot activate membership.
- Email password reset works, and the www and apex domains do not split sessions.

Automated tests exercise these backend rules with simulated Stripe/Supabase services, real Stripe signature verification and a PostgreSQL-compatible database. They do not replace a live sandbox checkout.

## What changed
- The old Memberstack entry point and $2 Payment Link were replaced with Supabase signup/login.
- A missing /api/create-checkout endpoint is implemented on Cloudflare.
- Only the configured US$10 monthly price is used; the browser cannot submit an arbitrary price or user ID.
- Checkout is associated with the verified Supabase user.
- Stripe webhook updates and checkout confirmation share the subscription synchronization logic.
- Private session cookies allow Cloudflare to authorize premium HTML before sending it.
- The account page includes billing management, logout and password recovery.
- The old incomplete PayPal page redirects to the working membership entry point.
- Both Cloudflare Pages and Workers deployments are supported.
