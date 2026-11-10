# Photo upload contract (v1)

Photo-owned migration: `20261110000600_photo_uploads.sql`. No client-supplied object keys or URLs enter a property save.

## Transactional property writer integration

Call `private.attach_property_images(p_actor uuid, p_property uuid, p_create_session uuid, p_images jsonb)` **inside the same transaction** that creates/updates the property. This helper checks current live `manage_properties` permission, locks the property and reservations, and replaces the ordered set. `p_images` is a JSON array of exactly-one-key objects: `{ "imageId": "uuid" }` for retained attached images, or `{ "uploadId": "uuid" }` for validated reservations. Empty array removes all images. Maximum 20; duplicate references and foreign IDs fail. The property writer must validate its own idempotency/version before calling. For creates pass the browser's UUID create session; for edits pass null. New reservations are scoped either to that session or to the existing property. Successful attachment marks uploads attached; retries may reuse already-attached reservations **only for this same property**. Retained image IDs remain stable. First entry is cover. Removed images enqueue deletion via the existing trigger; property cascade delete uses the same outbox. Helper is private, no browser/service direct execute grant.

## Frontend integration

`frontend/src/services/photoService.js` exports `uploadPropertyImage(file, { propertyId, createSessionId, signal })`, `imageReferences(images)` and `createPhotoSession()`.

`ImagesStep` accepts optional `propertyId`, `createSessionId`, `onUploadingChange`. In Supabase mode the parent must create one stable UUID session per new wizard/draft, pass it and include it in property save. It can instead store `formData.createSessionId`; ImagesStep reads that fallback. Existing property scope falls back to `formData.id` or `formData._id`. New images enter the reducer **only after successful server validation** as `{ uploadId, url:serverFinalObjectKey, name, uploadState:'validated' }`. Existing image objects must preserve `id`/`_id` (UUID). Use `imageReferences(formData.images)` for save payload; reject legacy local-file-only images. Disable submit while `onUploadingChange(true)`; failed images are shown with a retry-by-selection message and are not included. Save failure retains validated IDs for retry until expiry. Do not serialize blob previews into drafts; validated IDs/session can be persisted, but reservations expire in 60 minutes.

## Edge API

POST `photo-uploads` with verified bearer session: reserve `{action:'reserve', requestId:uuid, propertyId:uuid|null, createSessionId:uuid|null, mimeType, byteSize, checksum:lowercaseSHA256Hex}`; returns `{uploadId, post:{url,fields}, expiresAt}`. Browser uploads multipart fields plus file to S3. Finalize `{action:'finalize',uploadId}` returns `{uploadId, state:'validated'|'attached', objectKey}` (server-generated final key for CDN preview only, never accepted back as a save reference). Same requestId/payload reservation retry is idempotent; changed payload fails. Signed upload expires after 5 minutes; reservation after 60 minutes. Pending objects remain private. Final keys are unique per validation attempt and never browser writable. Cleanup is POST `photo-cleanup` with dedicated `X-Photo-Scheduler-Secret` header (not a user JWT); bounded leased jobs, expiry scanning and backoff retries. Abandoned selections expire automatically.

Provider setup and tested/unverified boundaries are documented in `docs/PHOTO_UPLOAD_SETUP.md`.
