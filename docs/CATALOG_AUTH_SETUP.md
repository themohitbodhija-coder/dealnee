# Catalog and Auth development setup

This milestone is opt-in for local/staging review. Keep `REACT_APP_BACKEND=express`
for the currently working application until the write and administrative flows
reach parity. Supabase mode never falls back to Express when an operation is
unavailable or unauthorized. Accounts and data remain separate between the two
backends.

## Local Supabase

Use Node 24 (the repository target); the new SDK requires Node 22 or newer.
Implementation checks for this milestone used the installed Node 22.23.2 runtime.
The full local Supabase stack requires Docker. PostgreSQL-only assertions can
still run without Docker via `npm run db:test:native`.

From the repository root, with Docker running and Supabase CLI 2.72.7:

```sh
supabase start
supabase db reset --local
npm run db:test
```

Reset discards only this local project's database. Do not use linked/remote
database flags. Migrations include the ten categories and nineteen subtype rows;
there are no production credentials, privileged accounts or dummy listings.

In `frontend/.env`, provide only browser-public configuration:

```dotenv
PORT=3001
REACT_APP_BACKEND=supabase
REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
REACT_APP_SUPABASE_PUBLISHABLE_KEY=<local publishable key or local legacy anon key>
REACT_APP_IMAGE_BASE_URL=<HTTPS CloudFront origin when available>
```

Do not use a service-role JWT or a secret API key. Those are rejected by the
client configuration guard and never belong in a CRA environment file. Install
with `npm ci` and run `npm start` from `frontend/`. Restart after configuration
changes. Production/staging builds need their own public project URL/key and
image base URL. No hosted project is created by these instructions.

## Implemented contracts

- `list_properties(p_filters jsonb, p_admin boolean)` returns
  `{success,total,page,pages,properties}`. Default page size 12, maximum 100;
  public reads list only available properties. Staff mode requires live
  `manage_properties` or admin access and includes all statuses by default.
- Filters: page, limit, type, category, subtype, minPrice, maxPrice, location,
  locality, bedrooms, bathrooms, minArea, maxArea, furnished, propertyAge, q,
  featured; status is staff-only. Unknown keys and invalid numeric/type/range
  inputs are rejected. Unknown categories/subtypes yield an empty result,
  rather than silently broadening the search. Category labels, immutable codes
  and UUIDs are supported, with the existing new-project/commercial URL aliases.
- `get_property(p_id uuid)` includes available/sold/rented detail and returns a
  controlled not-found error. It does not increment views; the abuse-controlled
  view endpoint is still pending.
- `featured_properties()` returns at most six available featured listings.
  `search_properties(p_query text)` accepts 1–200 characters, caps results at 20,
  and searches literal substrings in title/description/city/address. List `q`
  supports the same literal search combined with other filters and pagination.
  `%`, `_` and regex syntax never become patterns or executable SQL.
- DTOs use UUID `_id` aliases for the existing pages, explicit public fields,
  decimal strings for authoritative prices/areas, canonical room/furnishing
  aliases, normalized BHK configurations and ordered image keys/metadata. They
  never join staff emails/phone/profile records. Listing contact phone is public
  by design. Area filtering retains the original numeric selected-unit behavior;
  automatic cross-unit conversions are not introduced.
- Existing services keep the `{data:...}` envelope. Home/list/detail/category
  reads route to Supabase; the admin property list uses permission-gated
  pagination (25/page) instead of truncating at 100 available records. Property
  mutation controls are disabled in this review build.
- AuthProvider gets the effective role/permissions from `current_account()`,
  never from the old editable session cache or signup metadata. It handles
  loading, account refresh, SDK events, logout and stale-request cancellation.
  Route guards remain UI controls; SQL policies/grants enforce authorization.

## Email and session review

Signup requests confirmation. The new pages are `/forgot-password`,
`/reset-password` and `/auth/callback`. Local confirmation/reset messages are
captured by Inbucket at port 54324. Hosted use requires company SMTP and exact
redirect allowlists matching these paths; default SMTP is unsuitable for public
production delivery.

The SDK handles token persistence/refresh and PKCE code exchange. Session tokens
stay in sessionStorage. Only PKCE proof records use localStorage, expire after
one hour, and are isolated by the project storage key. This permits emailed
links to open in another tab on the same origin/browser without keeping access
or refresh tokens after the tab closes. A link opened on another device/browser
cannot complete that original PKCE flow; request a new reset there. SDK events
and a project-scoped signout notification clear the current UI and account
drafts across tabs. The callback page does not exchange a single-use code twice
or accept arbitrary return URLs.

Normal logout requests global SDK signout, attempts local removal even if the
server is unreachable, and reports a partial logout to the user. Access JWTs can
remain valid until expiry; live database account/capability checks enforce
disabled/deleted account and privilege revocation. Signup/session/logout/reset
transport is covered by mocks; actual Auth, SMTP, browser redirects, refresh
and offline behavior still require full local Supabase/staging integration QA.

References: [Auth events](https://supabase.com/docs/reference/javascript/auth-onauthstatechange),
[password recovery](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail),
[PKCE exchange](https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession).
Storage key handling was also inspected in the installed, pinned
`@supabase/auth-js` 2.119.0 source. Recheck that contract when upgrading the SDK.

## Deliberately pending

Admin account invitations/grants/deletion and last-admin protection; first-admin
bootstrap; dashboard aggregates/redaction; category editor mutation integration;
inquiry submission/administration; view counting; property save/delete, nested
field validation and optimistic versions; S3 signing/validation/finalization,
cleanup workers and actual CDN delivery. Calls to unfinished operations reject
locally with a safe unavailable response. They never send Supabase JWTs to the
legacy backend. This build must not replace production until those gates pass.
