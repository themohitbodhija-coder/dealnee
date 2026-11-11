# Admin dashboard

Apply migrations in order through `20261111001000_admin_dashboard.sql` before
deploying the updated frontend. The browser uses its signed-in Supabase session
to call `get_dashboard_stats()`; there is no dashboard Edge Function to deploy,
extra secret, or service-role key. This replaces the Edge aggregation approach
in the original migration plan. Aggregation and authorization occur together in
one protected SQL call, with an empty search path and explicit execute grants.

## Visibility contract

- Active, ready administrators: all counts and recent lists.
- Active, ready subadmins: only their currently granted sections.
- `manage_properties`: all-status property count and five recent properties.
- `manage_users`: regular-account count only; excludes admins and subadmins,
  matching the account directory's delegated visibility. The UI labels this
  card “Regular Users”. Admins see “Total Users”. Counts include pending/disabled
  accounts in the same scope as the account directory.
- `view_inquiries`: total/new counts and five recent inquiries.
- `manage_categories`: category count.
- Anonymous, ordinary, invited, inactive and deleted accounts: denied.

Responses include `visibility` and `stats`. Unauthorized stats and recent lists
are omitted, rather than replaced with zeroes. Recent rows are ordered by creation
time descending, then UUID descending, and are capped at five. Property prices
remain decimal strings. No author profile or account email is joined into listing
rows. Inquiry rows contain only ID, name, email, status and property-title snapshot;
phone and message are omitted. General inquiries have no property. Deleted listing
titles remain visible through the saved snapshot.

The UI intersects server visibility with current account permissions, hides
restricted navigation/cards/tables/alerts, and displays actual empty states for
permitted empty collections. Account changes discard prior responses; errors
replace the dashboard without retaining old rows. An open page refreshes with
the existing Auth provider when the window regains focus. Every new RPC call
rechecks live database access; frontend permissions do not authorize the RPC.

## Verification

`npm run db:test:native` discovers `008_admin_dashboard.sql` and tests the full
permission matrix, combined grants, regular-user counts, omitted sensitive data,
stable bounded lists, empty data, deleted-listing snapshots and stale/revoked
accounts. Frontend tests cover individual sections, server redaction over stale
local permissions, safe text/decimal rendering, errors and account-switch races.
All eight SQL suites and concurrency checks, 139 frontend tests and the strict
`CI=true REACT_APP_BACKEND=supabase npm run build` passed locally.

Before launch, verify the actual hosted RPC through PostgREST with anonymous,
regular, admin and individually scoped subadmin sessions; revoke permissions and
confirm a fresh request redacts data. Check mobile/desktop layout, section links,
empty/error states and focus refresh in a real browser. Native Auth fixtures and
DOM tests do not establish hosted integration or visual QA. No hosted migration
or deployment has been performed by this implementation.
