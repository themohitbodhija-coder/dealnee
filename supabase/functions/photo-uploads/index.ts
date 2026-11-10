import { ImageMagick, initializeImageMagick, MagickFormat, ResourceLimits } from 'npm:@imagemagick/magick-wasm@0.0.46';
import { createPhotoDecoder } from '../_shared/photo-decoder.mjs';
import { createPhotoUploadsHandler } from '../_shared/photo-uploads.mjs';
import { service, storage, required, createUserClient } from '../_shared/photo-runtime.ts';
const wasmBytes=await Deno.readFile(new URL('./vendor/magick.wasm',import.meta.url));
await initializeImageMagick(wasmBytes);
const decode=createPhotoDecoder({ImageMagick,MagickFormat,ResourceLimits});
Deno.serve(createPhotoUploadsHandler({service,storage,decode,createUserClient,
  allowedOrigins:required('APP_ALLOWED_ORIGINS').split(',').map(s=>s.trim()).filter(Boolean)}));
