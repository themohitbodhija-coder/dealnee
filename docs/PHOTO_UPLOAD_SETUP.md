# Photo upload implementation and operations

## Local completion and boundaries

Implemented reservation/signing, bounded object read, checksum/MIME/magic validation, real raster decoding and re-encoding, metadata stripping, immutable final publication, transactional ordered attachment, durable removal/expiry outbox, leased cleanup and retry, scheduler authentication, and React selection/upload/error state. See `PHOTO_UPLOAD_CONTRACT.md` for the property integration boundary. Property save/delete RPCs call the photo helper and existing cascade deletion triggers.

Sources: [Supabase WASM image processing example](https://supabase.com/docs/guides/functions/examples/image-manipulation), [magick-wasm source](https://github.com/dlemstra/magick-wasm), [S3 POST policy](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTConstructPolicy.html), [CloudFront private origins](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html).

Actual local verification: all six database assertion suites and shared concurrent property tests pass in a disposable native PostgreSQL cluster; photo handler tests pass using explicit storage/Auth fakes; frontend photo service tests pass; both Deno Edge entrypoints typecheck, owned frontend files pass ESLint, and the actual AWS presigned-POST signer policy is verified locally without network calls. A separate real magick-wasm test decodes/re-encodes generated 32×24 JPEG, PNG, GIF, WebP and AVIF images and rejects their half-truncated streams and a disallowed PNG dimension. This is real local WASM execution, **not** a hosted Supabase resource-limit benchmark or an AWS/CDN integration test.

No AWS calls, remote database changes, paid resources or deployment were performed by the photo workstream. Real S3 POST/checksum/CORS/IAM, CloudFront OAC, deployed function bundling, hosted Auth gateway behavior, cleanup scheduling and browser end-to-end tests remain launch gates. A passing local SQL test uses minimal Auth fixtures and does not establish production authorization/API behavior.

## Reproducible decoder packaging

Use Node 22 and Deno 2.5.6. The Edge dependency lockfile is `supabase/functions/deno.lock`; `nodeModulesDir:auto` generates ignored npm dependencies locally. Before **every** local serve or deploy from a clean checkout run from repository root:

```sh
deno cache --frozen --config supabase/functions/deno.json supabase/functions/photo-uploads/index.ts supabase/functions/photo-cleanup/index.ts
node scripts/prepare-photo-wasm.mjs
deno check --frozen --config supabase/functions/deno.json supabase/functions/photo-uploads/index.ts supabase/functions/photo-cleanup/index.ts
```

Preparation compresses with Brotli the locked package's x86 WASM into the function's ignored `vendor/magick.wasm.br` and verifies its pinned SHA-256. `config.toml` explicitly bundles that path; the entrypoint reads `./vendor/magick.wasm.br` relative to itself. There is no runtime network fetch, path into an unbundled npm cache, or committed node_modules requirement. Include these preparation steps in any backend deploy job before `supabase functions deploy`; frontend Vercel CI does not deploy these functions. A copied clean checkout containing neither node_modules nor vendor was tested: the frozen dependency command plus preparation rebuilt the verified WASM successfully. Missing or mismatched WASM is an intentional hard failure. The entrypoint decompresses the bundled Brotli file before initializing ImageMagick. This avoids the Management API upload-body limit encountered with the raw 15.5 MB binary. Binary is ~15.5 MB uncompressed; confirm the deployed bundle fits current Supabase limits.

Focused verification:

```sh
npm run db:test:native
node --test supabase/tests/edge/photo-uploads.test.mjs
deno test --frozen --allow-env --config supabase/functions/deno.json supabase/tests/edge/photo-s3.deno.ts
PHOTO_MAGICK_MODULE="file://$(pwd)/supabase/functions/node_modules/@imagemagick/magick-wasm/dist/index.js" node --test supabase/tests/edge/photo-decoder.test.mjs
cd frontend
CI=true npm test -- --watchAll=false --runInBand --runTestsByPath src/services/photoService.test.js
```

The real decoder suite explicitly skips when `PHOTO_MAGICK_MODULE` is absent; skipped means unverified. Run it with the path above for release validation.

## AWS and CDN operator setup

Use separate staging/production private buckets, Block Public Access, bucket-owner-enforced ownership, default SSE-S3 and a bucket policy denying non-TLS. Do not use Supabase Storage. Give the Edge IAM identity only `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on this bucket's `pending/*` and `properties/*`; tighten pending/final permissions further with separate signer/finalizer roles if desired. Do not give users or the browser AWS credentials. The signer creates a five-minute POST policy restricted to one random pending key, exact declared length (maximum 5 MiB), MIME, SHA-256 fields and success status. No ACL is sent. Test that changing each field or signature fails at S3.

S3 CORS must allow exact company Vercel production and approved staging/local origins with POST; do not add wildcard credentialed CORS. Browser sends multipart form fields and file directly, with credentials omitted. Content-Type is a policy field; do not manually set multipart request Content-Type. Server GET/PUT/DELETE use the AWS SDK Fetch HTTP handler with explicit timeouts, scoped credentials and bounded response consumption.

CloudFront must use an S3 REST origin with OAC, HTTPS, and an origin bucket policy bound to this distribution ARN allowing `s3:GetObject` **only** on `properties/*`. A broad OAC `bucket/*` grant would expose pending uploads. The distribution path must preserve `properties/...` keys; no public S3 ACL/policy or S3 website origin. Set `REACT_APP_IMAGE_BASE_URL=https://YOUR_IMAGE_DOMAIN` and include the same image host in frontend CSP. Final objects carry MIME plus immutable one-year cache control, and are written with `If-None-Match:*` to a random candidate key before the database marks validation complete. The browser never receives a final-key write capability. The finalizer uploads the decoded/re-encoded buffer, never copies the browser-writable pending object. Signed POST reuse therefore cannot mutate an attached image.

Bucket lifecycle: expire `pending/*` after one day as a safety net, abort multipart uploads, and remove expired delete markers/noncurrent versions if versioning is enabled under the company's backup retention. Outbox DeleteObject creates a delete marker in versioned buckets; it does not purge historical versions. Do not expire all `properties/*` by age: active listings may be old. Final candidates are recorded before writing; abandoned/expired reservations queue their candidate for deletion after a grace interval. For operational orphan reconciliation, compare S3 Inventory final keys against both property_images and nonexpired upload candidate keys with at least a 24-hour grace; enqueue only confirmed unreferenced keys through an operator-reviewed batch. Inventory reconciliation is an external operating procedure, not a claimed automatic implemented service.

Deletion removes DB references immediately; CloudFront may continue serving a previously known immutable URL until cache expiry. It disappears from the website immediately. Configure a CloudFront invalidation procedure if the company requires urgent global object removal; this implementation does not promise immediate CDN cache purge.

## Secrets and scheduler

Server environment names are in `supabase/functions/.env.example`: APP_ALLOWED_ORIGINS, Supabase user/server keys, PHOTO_AWS_REGION, PHOTO_S3_BUCKET, PHOTO_AWS_ACCESS_KEY_ID, PHOTO_AWS_SECRET_ACCESS_KEY, optional PHOTO_AWS_SESSION_TOKEN, and independent random PHOTO_SCHEDULER_SECRET (at least 32 characters). Never place private values under REACT_APP_ or in tracked files. Use managed secret storage and scoped credential rotation. `photo-uploads` retains gateway JWT verification and also calls Auth getUser plus live current_account; SQL rechecks live capability. Test the selected publishable/JWT key configuration with the hosted gateway before release.

`photo-cleanup` disables gateway JWT verification because it authenticates a separate `X-Photo-Scheduler-Secret`. User JWTs and service-role bearer keys alone do not authorize this endpoint. After function deployment, create Vault secrets `dealinee_photo_cleanup_url` and `dealinee_photo_scheduler_secret` through a secure operator flow, enable Supabase pg_cron/pg_net, then execute `supabase/admin/photo-cleanup-schedule.sql` as project administrator. The script validates prerequisites and replaces only this named five-minute job. Never commit the scheduler secret to SQL or logs. Review pg_net response records and alert on failures; rotate Vault and Edge secrets together. This setup SQL was not executed against a Supabase project locally.

The handler claims bounded batches using SKIP LOCKED, distinct lease tokens and five-minute lease expiry. Retries use exponential backoff capped at one day and retain a safe error code; an expired worker cannot acknowledge another worker's lease. Attached final keys are filtered from cleanup. Expiry and completion triggers queue objects durably, including property/account cascade deletion. Finalization lease is five minutes; expiration cleanup waits another fifteen minutes, longer than bounded storage calls. Pending cleanup also waits fifteen minutes to cover a reusable still-valid signed POST. Alert on the oldest failed/due job and sustained retries; retries intentionally continue until provider configuration recovers. Done-job diagnostics and attached-upload receipts are retained seven days.

## Runtime limits and behavior

Source format is retained; metadata/profiles are stripped after applying orientation, and new encoded bytes are independently checksummed. Animated images are bounded to 16 frames and at most 40 million total decoded pixels. Dimensions are at most 12,000 each; ImageMagick pixel-cache memory is limited to 96 MiB with disk disabled. This can reject some images within the nominal 5 MiB/40 MP limits rather than exhausting the process. Re-encoded output must also be at most 5 MiB. Decoder warnings/corrupt input and unsupported encodings may fail; no fallback trusts file extensions or skips decoding. CPU and total WASM memory still require representative staging benchmarks (near-limit dimensions, noisy photos, animation, AVIF, malformed fixtures, concurrency and cold starts) inside the actual hosted Supabase tier. If these exceed the tier limits, move the same validation contract into a scoped image-processing job before launch; do not silently remove validation.

React uploads sequentially, reports invalid selections, disables image reorder/removal during a batch and informs the parent to block saving. New images are added only after validation, using server-generated CDN keys for previews and upload IDs for save. No blob URL becomes invalid when moving between wizard steps. A failed or abandoned selection consumes a reserved slot until expiry; the UI can retry after expiry or in a new draft/session. Existing image removal is applied only when the property transaction succeeds. Failed property saves retain upload IDs for retry until their 60-minute expiry. Unsaved selection cancellation aborts browser requests; no rollback of S3 POST is assumed, and expiry cleanup collects abandoned objects.
