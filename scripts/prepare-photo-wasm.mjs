import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root=new URL('../',import.meta.url);
const source=new URL('supabase/functions/node_modules/@imagemagick/magick-wasm/dist/x86/magick.wasm',root);
const destination=new URL('supabase/functions/photo-uploads/vendor/magick.wasm',root);
try {
  const bytes=await readFile(source);
  const digest=createHash('sha256').update(bytes).digest('hex');
  if(digest!=='9d4d47d8cce4317c8dd2c05a57d896d71d99af454ac5d2ab51b43058cee417ae')throw new Error('Pinned magick-wasm@0.0.46 WASM checksum mismatch.');
  await mkdir(new URL('./',destination),{recursive:true});
  await writeFile(destination,bytes);
  console.log('Prepared pinned photo decoder WASM (SHA-256 verified).');
}catch(error){console.error('Photo WASM preparation failed. Run the documented frozen Deno cache command first.',error.message);process.exitCode=1;}
