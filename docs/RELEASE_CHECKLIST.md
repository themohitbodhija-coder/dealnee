# GitHub / Vercel release

Latest user scope: complete property saves, photo uploads and inquiries, then push
verified combined code to the existing GitHub main branch. Vercel is already linked
according to the user. Property view counting and CAPTCHA are explicitly excluded.
This supersedes those requirements in the earlier migration planning documents.

## Frontend configuration

Vercel project root must be `frontend`, build command `npm run build`, output `build`.
Use Node 22 or newer (repository CI targets Node 24). `frontend/vercel.json` supplies
SPA route fallbacks, including authentication callbacks and admin links.

Set these browser-public build variables in Vercel for the target environment:

- `REACT_APP_BACKEND=supabase`
- `REACT_APP_SUPABASE_URL` — target project's HTTPS URL
- `REACT_APP_SUPABASE_PUBLISHABLE_KEY` — publishable/anon key only
- `REACT_APP_IMAGE_BASE_URL` — configured HTTPS CloudFront image origin

Local `.env` files are ignored and must not be committed. Adding a local variable
does not configure Vercel. No service-role, secret API key, AWS private credential or
SMTP password belongs in a `REACT_APP_` variable.

## Backend-first release prerequisite

GitHub/Vercel frontend deployments do not apply Supabase database migrations or
deploy Edge Functions. Apply versioned migrations to the intended Supabase project,
deploy the functions and configure their server-side secrets before activating the
frontend against that backend. Use the individual workstream setup documents for
the exact function list, AWS/CDN policies and scheduler configuration. Configure
production SMTP, site URL and confirmation/reset/invite redirect allowlists.
Bootstrap the first administrator with the existing controlled bootstrap utility.
Never reset a remote database to deploy migrations.

## Verification

Run the native database assertions, Edge handler tests, complete frontend suite and
strict `CI=true REACT_APP_BACKEND=supabase npm run build` before the release commit.
Check staged files for credentials, omit local notes and temporary files, and push
without force to the existing authorized branch. Then confirm the GitHub revision
and Vercel deployment result when access is available. Real Supabase Auth/email,
AWS image delivery/decoding and browser integration require separate hosted checks;
passing mocked handlers or a static build does not prove those integrations.

Category mutation integration and permission-filtered dashboard statistics remain
outside these three workstreams and are still pending unless implemented separately.
