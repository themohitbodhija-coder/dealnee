# Migration progress

## Database foundation — 10 November 2026

Implemented locally:

- Supabase CLI configuration (CLI 2.72.7, PostgreSQL 17), local confirmation/recovery redirects, email confirmation and refresh-token rotation. Supabase Storage and Realtime are disabled; photos will use Amazon S3.
- Versioned fresh-database migrations: public catalog/profile/inquiry/wishlist tables, private access and upload/cleanup support tables, UUID relationships, decimal price/area types, category/subtype consistency, timestamps and bounded image metadata.
- Ten category seeds and nineteen subtype mappings in a **migration**, so hosted `db push` receives reference data without depending on a local-only seed command. No account, password, inquiry or property fixtures are seeded outside rolled-back tests.
- Signup trigger always creates a regular user regardless of caller metadata. Live capability helpers, self-profile column permissions, private inquiry policies and constrained category RPCs are implemented. Browser property/image writes and public inquiry inserts are closed until the validating Edge flows exist.
- Atomic internal display-ID allocator, including concurrent requests, deletion without reuse and expansion beyond 999. Image metadata deletion writes a durable cleanup job; inquiry property snapshots survive deletion.
- Isolated native PostgreSQL test harness and an unexecuted GitHub Actions workflow for full local Supabase testing after company repository setup.

This foundation milestone is retained below as historical evidence. Catalog and Auth integration has since been added in the second milestone; Express remains the default until full replacement parity is verified. No hosted projects, buckets, paid plans, accounts, DNS records or deployments were changed.

## Verification

Observed results in this workspace: all 67 database assertions passed; 24 concurrent allocations returned 24 unique IDs; the existing backend suite passed 8/8 and frontend suite passed 42/42. Supabase TOML parsed successfully and the test harness passed Node syntax checking. No frontend runtime files were changed in this milestone, so the previously recorded build-with-warnings result remains the baseline. The GitHub workflow is authored but has not run remotely.

`npm run db:test:native` creates its own temporary PostgreSQL cluster with a Unix socket and no TCP listener, runs the migrations and permission/constraint assertions, exercises concurrent ID allocation, stops the cluster and removes the temporary directory. It never accepts a remote URL. Native tests supply minimal Supabase Auth table/role fixtures and **do not** certify the real Auth API, PostgREST, Edge runtime, SMTP or S3.

The SQL assertion suite runs inside a rolled-back transaction. It has 67 assertions covering anonymous and authenticated access, self-only profiles and immutable identity fields, signup metadata escalation, category versus inquiry capabilities, immediate revocation/disable/deletion effects, private-role-table access, invalid property types/areas/coordinates/JSON, protected reference categories, non-recycling counters, cascades and cleanup jobs (including abandoned uploads on account deletion). A separate native-only check uses 24 concurrent connections to catch counter collisions.

The full Supabase workflow requires Docker (not installed in this workspace). On a machine with Docker running:

```sh
supabase start
supabase db reset --local
npm run db:test
```

These commands target the isolated local Supabase instance. `db reset --local` discards its local test database. Do not use `--linked`, a remote connection string, or production credentials for tests. Local development Auth email is captured by Inbucket at port 54324; hosted custom SMTP is a later setup task.

Native alternative (PostgreSQL 17 executables `initdb`, `pg_ctl`, `psql` on PATH, no existing server needed):

```sh
npm run db:test:native
```

The CLI configuration is generated for CLI 2.72.7 and PostgreSQL 17. The `.nvmrc` target is Node 24; the existing shell currently runs Node 18.20.6, which can run the dependency-free native harness. Use Node 24 when installing/building the app and running CI.

## Catalog and Auth integration — 10 November 2026

Implemented locally:

- Added `20261110000400_catalog.sql` with explicit safe property DTOs, public detail/featured/search RPCs and one validated public/staff catalog query. It supports existing category/subtype URL mappings, literal search, combined decimal filters, stable counts/pagination, canonical furnishing/age and status-restricted staff mode. Staff profile/email data is excluded.
- Added an opt-in Supabase frontend transport and pinned SDK 2.119.0. `REACT_APP_BACKEND=express` remains the default. Supabase mode never falls back to the old backend; unfinished operations fail closed. The manifest and lockfile now declare Node >=22, with Node 24 retained as the repository target.
- Replaced editable session-user caches and custom `authChange` events with AuthProvider throughout App, navbar, sidebar, login and registration. Roles come from the live `current_account()` RPC. Guards wait for initialization, and profile/login responses cannot restore a user after logout. The old access-token setter/refresh code is confined to the temporary Express compatibility path.
- Added email-confirmation messaging, forgot/reset-password and callback routes, SDK PKCE session handling and refresh, same-origin redirects, logout handling, account-draft cleanup, and live privilege refresh on tab focus. Only expiring PKCE proof records are shared across tabs; session tokens remain tab-scoped. Server/secret keys are rejected as frontend configuration.
- Connected existing home/list/detail/category reads to the Supabase facade. Fixed search-query forwarding and navbar price-range parameters. Added stale-result cancellation and explicit listing load errors. The admin property list now uses all-status, permission-gated 25-row pagination in Supabase mode. Add/edit/delete controls remain disabled there until the write flow exists.
- Replaced the image-origin fallback in Supabase mode with configured CDN-only final-object resolution. Pending uploads, old `/uploads` paths, executable formats, cross-origin URLs and path traversal do not resolve. This is a delivery adapter, not an implemented S3 uploader.
- Kept the existing Express runtime available while removing its hardcoded remote URL fallback and refresh/login redirect loops. Concurrent refreshes share one request; a late refresh cannot restore a token after logout.

Setup and endpoint/session contracts: [CATALOG_AUTH_SETUP.md](CATALOG_AUTH_SETUP.md).

Observed verification:

- **99 database assertions passed** (67 foundation + 32 catalog), plus 24 concurrent unique display-ID allocations, in a fresh isolated native PostgreSQL cluster.
- **76 frontend tests passed** across 14 suites, including existing form regressions, Auth/session races, route guards, confirmation/reset service contracts, PKCE storage expiry/isolation, configuration boundaries, image origins and Express compatibility refresh behavior.
- **8 existing backend tests passed**.
- Express-default and Supabase-mode production builds succeeded using Node 22.23.2. Existing application ESLint warnings remain; the new AuthProvider/listing counter cleanup warnings found during implementation were resolved. Build output was left in Express mode to match the default configuration. No deployment was performed.
- Package manifest/lockfile consistency checked. The new dependency's engines warning under the original Node 18 shell was addressed by using installed Node 22.23.2 for tests/builds; do not run this SDK under Node 18.

The SQL tests use minimal Auth fixtures, and frontend Auth tests mock the SDK transport. Full Supabase Auth/PostgREST/SMTP/Edge integration, actual email links/refresh/offline behavior, real CDN/S3 delivery and browser visual QA remain unverified because Docker/hosted staging are not available in this workspace. The GitHub database workflow is still authored but has not run remotely. Passing these checks is not a production-readiness claim.

## Remaining implementation

Next: protected account-management Edge Functions and the admin invitation/grant/bootstrap workflow, including last-admin protection and Auth API failure reconciliation. Then complete the property field contract, nested JSON and array allowlists, transactional saves/image attachment, optimistic versions and the AWS upload/decoder spike.

Still pending: S3 signer/finalizer and cleanup worker/scheduler; inquiry submission/CAPTCHA/rate limits and inquiry administration; abuse-controlled view counting; dashboard aggregates/redaction; category editor mutation integration; full frontend write parity; company staging/prod resources; browser/API integration, dependency audit and deployment rehearsal. The database deliberately exposes no browser property mutations or direct public inquiry inserts. Profile images remain empty until a safe contract exists. No admin-grant API or privileged account is seeded.

Company-owned hosted resources, billing, SMTP provider/domain, AWS Activate eligibility, regions and retention decisions remain launch prerequisites from the implementation plan. Local implementation can continue independently.
