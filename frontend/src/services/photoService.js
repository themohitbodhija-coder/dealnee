import { getSupabase } from '../lib/supabase';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const supported = ['image/jpeg','image/png','image/gif','image/webp','image/avif'];
export const createPhotoSession = () => crypto.randomUUID();
export function imageReferences(images) {
  if (!Array.isArray(images) || images.length > 20) throw new Error('Choose up to 20 validated images.');
  const seen = new Set();
  return images.map(image => {
    const key = image.uploadId ? 'uploadId' : 'imageId';
    const id = image.uploadId || image.id || image._id;
    if (!uuid.test(id || '') || (image.uploadState && image.uploadState !== 'validated') || seen.has(`${key}:${id}`)) throw new Error('An image has not finished uploading. Remove it and try again.');
    seen.add(`${key}:${id}`);
    return { [key]: id };
  });
}
export async function uploadPropertyImage(file, { propertyId = null, createSessionId = null, signal, requestId = createPhotoSession() } = {}) {
  if (!supported.includes(file?.type) || !file.size || file.size > 5242880) throw new Error('Choose a JPEG, PNG, GIF, WebP or AVIF image under 5 MB.');
  if ((!propertyId === !createSessionId) || (propertyId && !uuid.test(propertyId)) || (createSessionId && !uuid.test(createSessionId))) throw new Error('The listing upload session is unavailable. Reload the form.');
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  const checksum = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
  const invoke = async body => {
    if (signal?.aborted) throw new DOMException('Upload cancelled','AbortError');
    const { data, error } = await getSupabase().functions.invoke('photo-uploads', { body, signal });
    if (error) {
      let message = 'Image upload failed. Please try again.';
      try { message = (await error.context.json()).error || message; } catch (_) { /* Network failure. */ }
      throw new Error(message);
    }
    return data;
  };
  const reservation = await invoke({ action:'reserve', requestId, propertyId, createSessionId, mimeType:file.type, byteSize:file.size, checksum });
  const form = new FormData();
  for (const [key,value] of Object.entries(reservation.post.fields)) form.append(key,value);
  form.append('file',file);
  const result = await fetch(reservation.post.url, { method:'POST',body:form,signal,credentials:'omit' });
  if (!result.ok) throw new Error('The image could not be uploaded. Please select it again.');
  const final = await invoke({ action:'finalize', uploadId:reservation.uploadId });
  if (!['validated','attached'].includes(final?.state)) throw new Error('Image validation did not complete.');
  return { uploadId:reservation.uploadId, uploadState:'validated', url:final.objectKey, name:file.name, expiresAt:reservation.expiresAt };
}
