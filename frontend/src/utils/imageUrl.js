import { usesSupabase } from '../lib/backend';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const propertyImageKey = /^properties\/[a-zA-Z0-9/-]+\.(png|jpg|jpeg|gif|webp|avif)$/;
const isImageOrigin = url => url.protocol === 'https:' || (
  url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)
);

export const getImageUrl = value => {
  if (!value) return null;
  if (typeof value === 'object') return getImageUrl(value.url || value.objectKey || value.path || value.preview || value.image || value.src);
  if (typeof value !== 'string') return null;
  if (value.startsWith('blob:')) return value;
  if (usesSupabase) {
    const base = process.env.REACT_APP_IMAGE_BASE_URL;
    try {
      if (!base) {
        const project = process.env.REACT_APP_SUPABASE_URL;
        if (!project || !propertyImageKey.test(value)) return null;
        const image = new URL('/functions/v1/photo-image', project);
        if (!isImageOrigin(image)) return null;
        image.searchParams.set('key', value);
        return image.href;
      }
      const origin = new URL(`${base.replace(/\/$/, '')}/`);
      if (!isImageOrigin(origin)) return null;
      const image = new URL(value, origin);
      if (image.origin !== origin.origin || !image.pathname.startsWith(origin.pathname)) return null;
      if (!propertyImageKey.test(image.pathname.slice(origin.pathname.length))) return null;
      return image.href;
    } catch (_) { return null; }
  }
  if (/^https?:\/\//.test(value)) return value;
  const origin = API_URL.replace(/\/api\/?$/, '');
  return `${origin}/${value.replace(/^\//, '')}`;
};
export default getImageUrl;
