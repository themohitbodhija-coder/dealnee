# Property saves — local implementation and setup

Implemented by migration `20261110000700_property_writes.sql`, after the photo migration `006`. Deploy `property-save` and `property-delete` only after migrations are applied in order. No remote deployment or provider provisioning was performed by this workstream.

## Configuration

Both Edge Functions require `SUPABASE_URL`, `APP_SUPABASE_PUBLISHABLE_KEY` (or platform `SUPABASE_ANON_KEY`), and comma-separated exact `APP_ALLOWED_ORIGINS`. They use the verified caller JWT and user-scoped RPC client; they do not require a service-role key. Configure frontend `REACT_APP_BACKEND=supabase`, Supabase URL/publishable key and `REACT_APP_IMAGE_BASE_URL` per the existing environment examples. Photo upload/finalization additionally requires the separate AWS/CDN/decoder setup in `PHOTO_UPLOAD_SETUP.md`; unavailable uploads must remain unavailable until that setup succeeds.

## Contract and behavior

POST `property-save` with `{requestId, property, images, id, version, createSessionId}`. Create has null id/version and a stable UUID create session. Edit has UUID id, positive expected version and null create session. `property` is the explicit camelCase contract projected by `frontend/src/utils/propertyWritePayload.js`; database field rules reject unknown root/nested keys, wrong scalar types, enum/array values, date/range/precision errors and mismatched subtype/category. All 19 seeded subtypes are supported. Optional blank browser inputs are omitted or null; decimal inputs stay strings. Rooms, floors, zero coordinates and false booleans survive round trips. Unit rows require positive super-built-up/carpet/price and carpet smaller than built-up; partial units are rejected. Plot dimensions are required for new project plots. Area/dimension values follow the selected listing area unit (linear plot dimensions use its corresponding linear unit); the UI's ceiling/frontage measurements retain their existing labels.

Canonical price is monthly rent for RENT and entered sale/lease price otherwise. Area uses commercial built-up area for COMMERCIAL. Canonical furnishing, age and room fields live in typed columns; legacy duplicate inputs must agree and are stripped from stored JSON. DTO aliases are reconstructed for the existing UI. Common active form fields are retained in a validated `common_info` object. Staff can correct type/subtype on edit; the originally allocated human display ID stays stable. New classifications must supply applicable details and a matching system category.

`images` uses the actual photo contract's ordered `{imageId}` / `{uploadId}` references; arbitrary URLs and object keys are never accepted. The photo-owned `private.attach_property_images` runs in the property save transaction, so metadata/details/units/counter allocation/image attachments either commit together or roll back. First image is cover. Empty image list removes all images. Removal and property deletion use the photo cleanup outbox.

POST `property-delete` with `{requestId,id,version}`. Both mutations require live active admin or `manage_properties` subadmin access. Ordinary users, anonymous sessions and unrelated staff capabilities cannot write through RPC or tables. Changed versions return HTTP 409. Reload the current listing before editing/deleting again; the UI keeps the existing form after failure.

Exact retries return the original response without repeating the mutation or incrementing the version. Browser request IDs persist across reloads. A create session permanently binds to one successful listing, so changed request IDs after an uncertain create cannot duplicate it, including after deletion. Request records contain public listing data and remain private. Keep create-session tombstones; any future request-ledger retention job must specify a supported retry window and preserve the session uniqueness invariant.

IDs are allocated transactionally at successful save, never by a browser preflight. Deleted IDs are not reused. New wizard shows “Assigned on save”; saved IDs appear in the admin list. Drafts retain validated upload UUIDs/create session and omit blob/data previews. Upload reservations expire after 60 minutes; remove and select expired images again. Existing image UUIDs are preserved during edit/reorder.

## Verification and external gates

- `node scripts/test-database.mjs`: disposable native PostgreSQL applies all migrations and tests actual SQL permissions/validation/transactions. Property tests exercise all 19 create/edit round trips, idempotency/session deduplication, conflicts, bad JSON/arrays/dates/precision, rollback and inquiry retention. Separate concurrent connections check exact-retry deduplication, competing create requests and optimistic edits.
- `node --test supabase/tests/edge/property-writes.test.mjs`: verified sessions, operation permissions, strict envelopes, CORS/body bounds and safe database error mapping.
- Frontend tests cover 19 subtype projections, decimal/zero/false preservation, draft references and retry/version adapters. CI build must pass without warning suppression.

Native tests use minimal Auth fixtures and synthetic validated photo metadata. They do not prove Supabase gateway/Auth integration, real S3 decoding/CDN delivery, real browser upload/save/delete or deployed permissions. Those remain staging gates with company-managed configuration; never claim provider integration from mocked handlers or synthetic metadata. No AWS, SMTP, CAPTCHA or payment resources are provisioned here. View counting and CAPTCHA are outside this workstream.
