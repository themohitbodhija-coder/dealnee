import { createPhotoCleanupHandler } from '../_shared/photo-uploads.mjs';
import { service, storage, required } from '../_shared/photo-runtime.ts';
Deno.serve(createPhotoCleanupHandler({service,storage,schedulerSecret:required('PHOTO_SCHEDULER_SECRET')}));
