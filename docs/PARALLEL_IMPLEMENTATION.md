# Parallel implementation coordination — 10 November 2026

The user requested three separate chats to complete property saves, photo uploads,
and inquiries. All three work in this local checkout; preserve existing uncommitted
account-management changes. Do not reset, checkout, stash, commit or deploy unrelated
work. Read docs/SUPABASE_MIGRATION_PLAN.md for the agreed architecture and field rules.

## Ownership

- Photo uploads: migration 20261110000600_photo_uploads.sql, photo SQL tests,
  image Edge Functions/shared modules, frontend image service and ImagesStep.jsx,
  photo-specific tests/setup documentation. Own photo-related config sections only.
- Property saves: migration 20261110000700_property_writes.sql, property SQL tests,
  property Edge Functions/shared modules, frontend property mutation adapter,
  AddPropertyPage.jsx, ManagePropertiesPage.jsx and property form mapping/tests.
  Own only propertyService mutation lines/imports in supabaseApi.js.
- Inquiries: migration 20261110000800_inquiries.sql, inquiry SQL tests,
  inquiry Edge Functions/shared modules, frontend inquiry adapter, contact/inquiry
  components/pages and ManageInquiriesPage.jsx. Own only inquiryService lines/imports
  in supabaseApi.js.

Use separate documentation files per workstream. Do not rewrite shared progress
reports, package scripts, test harnesses, or lockfiles wholesale. Make narrow edits
when a shared file is necessary, re-read its current content immediately before
editing, and preserve other workstreams. Tests auto-discover database/Edge test files;
check harness behavior before adding registration. Use Node >=22 (installed
/Users/mohitbodhija/.nvm/versions/node/v22.23.2/bin) for frontend and Edge handler tests.

## Property/photo boundary

Photo implementation owns secure upload reservation/validation and transactional
image attachment. Define the exact API and SQL helper contract promptly in
`docs/PHOTO_UPLOAD_CONTRACT.md`; property implementation should read that file before
implementing attachment and must use the actual helper. The intended interface is
ordered existing image IDs or validated upload reservation IDs, plus a UUID create
session for unsaved listings. Never accept arbitrary final keys/URLs or browser
assertions of validation. Attachment must occur inside the property save transaction,
check live actor permission, reservation ownership, target/create-session scope,
expiry and 20-image cumulative limit. Reordering/removal must preserve retained
images and enqueue deletion for removed objects. Concurrent finalization/attachment
and retries must be safe. Preserve existing DTO response and UI behavior.

Property saves should support idempotency and optimistic version conflicts; allocate
display IDs only on successful save. Property deletion must preserve inquiry snapshots
and enqueue image cleanup. Inquiries own submission abuse controls and lead privacy;
never allow direct public inserts as a shortcut.

Each chat should implement, run focused checks, and report exact changed files,
verification results and outstanding external configuration. Missing AWS/SMTP
credentials should not prevent completion of local implementation, mocks and setup
instructions, but real-provider tests must be reported as unverified. Do not provision
paid infrastructure, publish or change remote data as part of this local request.

## Latest user scope and release authorization

Property view counting and CAPTCHA are excluded by explicit user instruction.
Inquiry validation, honeypot and rate limits remain in scope. After all three
workstreams complete, the parent chat will verify combined changes and push to the
existing GitHub remote; the user says Vercel automatically deploys on push.
Only the parent chat should commit/push. Local .env credentials must stay ignored
and must never be included in commits or frontend secret configuration.

## Account-management integration notes

The account-management chat owns migration `20261110000500_account_management.sql`,
its SQL/Edge/UI tests, `admin-users` Edge handler, masked staff reauthentication,
`/accept-invite`, the invite email template, and first-admin bootstrap. Shared
`supabaseApi.js` edits are restricted to Auth/admin sections; property/inquiry
adapters are preserved. The stale shared test that expected unfinished property
and inquiry mutations was narrowed to the still-unfinished category editor.

A combined database run during parallel work passed migrations 001–008 and tests
001–004, then reported `005_property_writes.sql:70`: expected SQLSTATE 22023 for
an invalid image reference, got 42501. The account-management chat leaves this
property/photo boundary assertion to its owners. `npm run db:test:accounts`
provides an isolated native check through migration 005 while integration changes
continue; the default database command still exercises all workstreams.

`supabase/functions/deno.json` and its lock were introduced for admin Edge checking
with Deno 2.9.6. Photo bundling may adjust module installation for its WASM asset;
preserve the admin SDK pin/lock entries and recheck all entrypoints afterward.
Do not push or deploy account-management work separately while the other changes
and the combined release gate are in progress.
