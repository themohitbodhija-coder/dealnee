# Inquiry implementation and setup

The user removed CAPTCHA from scope on 10 November 2026. This supersedes CAPTCHA
requirements for inquiries in the original migration plan. There is no widget,
provider request, provider secret or CAPTCHA bypass switch in this implementation.
General contact and property detail forms use the same component.

## Local contract

Apply migrations through `20261110000800_inquiries.sql` in timestamp order. Deploy
`supabase/functions/submit-inquiry` after migration. Its configuration explicitly
sets `verify_jwt = false`: the public handler validates every submission before
calling narrowly granted service-only RPCs. Browser roles cannot insert inquiries,
execute the submission RPCs, or access private rate/idempotency state. Administration
uses the caller's JWT and live `view_inquiries` permission (admin bypass included).

POST JSON fields: `name` (1–120), `email` (max254), optional `phone` (max32 raw,
7–15 normalized digits), `message` (1–5000), optional `property` UUID,
`idempotencyKey` UUID, empty `website` honeypot, `startedAt` Unix milliseconds.
The form must be open at least two seconds, with a maximum age of one day. Time and
honeypot checks are supplemental; client fields are not trusted proof of humanity.
Body is stream-limited to16KiB even without Content-Length. Unknown fields,
status/actor/snapshot injection, invalid contacts and property IDs are rejected.
Responses contain only `accepted` and opaque `reference`; no name/email/message,
property snapshot or Auth identity is returned. Errors are generic with request IDs;
no request bodies or raw client IPs are logged by the handler. Messages render as
React text, including HTML-like input.

The existing database trigger generates property display ID/title snapshots. The
submission transaction locks the associated listing against deletion while creating
the lead. Deleting the listing leaves the snapshot and sets its UUID to NULL.

Admin list: `list_inquiries(page,limit,status)`, default10/max100, stable descending
creation time/UUID, exact total/page count; detail atomically changes only new→read,
preserving replied; status and hard-delete RPCs enforce permission and not-found
errors. RLS also protects direct table requests; only status has an UPDATE grant.

## Server environment

- Platform `SUPABASE_URL` and service-role key, or server-only
  `APP_SUPABASE_SECRET_KEY` override (same pattern as account administration).
- `APP_ALLOWED_ORIGINS`: exact comma-separated browser origins, e.g.
  `http://localhost:3001,https://example.company`. No wildcard.
- `APP_RATE_LIMIT_HASH_SECRET`: independent random value of at least32 characters,
  held only as an Edge secret. Used for HMAC-SHA256 of rate identities and digests.
  Keep stable across worker instances/restarts; rotating changes bucket identities
  and makes older idempotency records unreachable.
- Optional `APP_INQUIRY_TRUSTED_IP_HEADER`: **leave unset by default**. Set only after
  verifying that every request path into your hosting ingress strips/overwrites
  that header and that the function's direct endpoint cannot bypass this guarantee.
  Do not assume a header named `cf-connecting-ip` is safe just because of its name.
  X-Forwarded-For is never selected or parsed automatically.

Without a proven IP header, all callers share a conservative unknown-client bucket
of five attempts/minute. This prevents spoofed forwarding headers from rotating
identity but can throttle legitimate visitors together. Hosted IP provenance is an
explicit deployment verification gate; do not silently enable a client header to
increase throughput. Configure and test an enforcing trusted ingress if hosted
platform guarantees are insufficient. Changing the mode does not remove the
independent email/day and global limits.

Browser: `REACT_APP_BACKEND=supabase`, `REACT_APP_SUPABASE_URL` and publishable key;
rebuild after configuration changes. No inquiry-specific browser secret is needed.
The legacy Express mode remains available for existing source compatibility.

## Abuse and retry behavior

Each POST first consumes atomic IP and global attempt buckets, including malformed
requests; initial limits five/minute/IP and300/minute globally. Email accepts at most
20 new leads per UTC day, atomically; rejected attempts persist counters. Fixed
windows permit a boundary burst. Retry-After is conservative60s or86400s. Successful
retries within seven days return the original reference, even if the lead was later
deleted; a changed payload reusing the same key returns409. The UI retains fields
and key after failures and assigns a fresh key when the payload changes. There is
no email-delivery side effect and no claim that a staff member has read the lead.

Rate state expires after two windows; the admission RPC deletes expired inquiry
buckets and inquiry idempotency records older than seven days. No cleanup job is
needed for active traffic; expired records remain inert until the next request.
Agree customer lead retention separately; accepted leads are retained until staff
hard-delete them. Database backup retention is a separate company decision.

## Verification and deployment gate

Use Node22 (`/Users/mohitbodhija/.nvm/versions/node/v22.23.2/bin/node` here).

```
node scripts/test-inquiries.mjs
node --test supabase/tests/edge/inquiries.test.mjs
cd frontend
CI=true npm test -- --watchAll=false --runInBand --runTestsByPath src/services/inquiries.test.js src/components/user/InquiryForm.test.jsx src/pages/admin/ManageInquiriesPage.test.jsx
```

The first command starts and destroys an isolated local PostgreSQL cluster, never
accepts a remote URL, runs grants/RLS/live-permission/snapshot/pagination tests and
opens24 separate transactions each for email quotas, idempotency and IP limits.
`supabase/tests/database/006_inquiries.sql` is also automatically discovered by the
shared native/Supabase harness. Edge tests use mocked RPC responses, frontend tests
use a DOM and mock services; they do not establish hosted gateway behavior.

Before production: apply migrations, set Edge secrets, deploy `submit-inquiry`,
verify anon/publishable-key submission and forbidden direct insert/select over the
actual Data API; test forged forwarding headers on every ingress path; submit and
remove synthetic general/property leads; verify read/status/delete as permitted and
revoked staff accounts; test browser CORS, reload, failed retry and double click.
A frontend push/Vercel build alone does not deploy the Supabase migration/function.
No remote resources, schema changes or deployment are performed by these local tests.

Local verification completed 10 November 2026: inquiry database assertions and
three24-connection race checks passed; nine Edge handler tests passed; ten inquiry
frontend tests plus13 shared adapter tests passed. The ordinary production build
compiled. After removing inquiry hook warnings, the strict CI build still found an
unused import in the parallel property workstream's `PropertyDetailsStep.jsx`;
that shared release check must be rerun after integration. Deno executable, actual
hosted Supabase gateway/Data API tests and real-browser end-to-end checks were not
available/run in this workstream. No CAPTCHA provider integration is required.
