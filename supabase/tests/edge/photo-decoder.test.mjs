import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPhotoDecoder } from '../../functions/_shared/photo-decoder.mjs';
import { validateAndNormalize, sha256 } from '../../functions/_shared/photo-uploads.mjs';
// Set PHOTO_MAGICK_MODULE to the installed package's dist/index.js; explicitly
// skipped without it. This exercises real WASM, not a pretend decoder fixture.
const modulePath=process.env.PHOTO_MAGICK_MODULE;
test('real WASM decodes/re-encodes all five formats and rejects truncation',{skip:!modulePath},async()=>{
 const magick=await import(modulePath);
 const wasm=new URL('./x86/magick.wasm',modulePath);
 await magick.initializeImageMagick(await readFile(wasm));
 const decode=createPhotoDecoder(magick);
 for(const [mime,format] of Object.entries({'image/png':magick.MagickFormat.Png,'image/jpeg':magick.MagickFormat.Jpeg,'image/gif':magick.MagickFormat.Gif,'image/webp':magick.MagickFormat.WebP,'image/avif':magick.MagickFormat.Avif})){
  const bytes=magick.ImageMagick.read(magick.MagickColors.Red,32,24,img=>img.write(format,b=>new Uint8Array(b)));
  const image=await validateAndNormalize(bytes,{declared_size:bytes.length,declared_mime:mime,declared_checksum:await sha256(bytes)},decode);
  assert.equal(image.width,32,mime);assert.equal(image.height,24,mime);
  assert.throws(()=>decode(bytes.slice(0,Math.floor(bytes.length/2)),mime),undefined,mime+' truncated data');
 }
 const bomb=magick.ImageMagick.read(magick.MagickColors.Red,8000,1,img=>img.write(magick.MagickFormat.Png,b=>new Uint8Array(b)));
 // Mutate PNG IHDR to a disallowed dimension; validation/decoder must fail.
 new DataView(bomb.buffer).setUint32(16,12001);
 assert.throws(()=>decode(bomb,'image/png'));
});
