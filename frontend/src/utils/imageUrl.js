import { usesSupabase } from '../lib/backend';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const getImageUrl = value => {
  if (!value) return null;
  if (typeof value === 'object') return getImageUrl(value.url || value.objectKey || value.path || value.preview || value.image || value.src);
  if (typeof value !== 'string') return null;
  if (value.startsWith('blob:')) return value;
  if (usesSupabase) {
    const base = process.env.REACT_APP_IMAGE_BASE_URL;
    if (!base) return null;
    try {
      const origin = new URL(`${base.replace(/\/$/, '')}/`);
      if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname))) return null;
      const image = new URL(value, origin);
      if (image.origin !== origin.origin || !image.pathname.startsWith(origin.pathname)) return null;
      if (!/^properties\/[a-zA-Z0-9/-]+\.(png|jpg|jpeg|gif|webp|avif)$/.test(image.pathname.slice(origin.pathname.length))) return null;
      return image.href;
    } catch (_) { return null; }
  }
  if (/^https?:\/\//.test(value)) return value;
  const origin = API_URL.replace(/\/api\/?$/, '');
  return `${origin}/${value.replace(/^\//, '')}`;
};
export default getImageUrl;
