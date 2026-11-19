const extensionMimes = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
};
const supportedMimes = new Set(Object.values(extensionMimes));

export const PROPERTY_IMAGE_ACCEPT = '.jpg,.jpeg,.png,.gif,.webp,.avif,image/jpeg,image/jpg,image/pjpeg,image/png,image/gif,image/webp,image/avif';

export function getPropertyImageMime(file) {
  const type = (file?.type || '').trim().toLowerCase();
  if (type === 'image/jpg' || type === 'image/pjpeg') return 'image/jpeg';
  if (supportedMimes.has(type)) return type;
  // Some platforms omit MIME metadata or report generic binary files.
  // The upload service still verifies the actual bytes before accepting images.
  if (!type || type === 'application/octet-stream') {
    const extension = /\.([^.]+)$/.exec(file?.name || '')?.[1].toLowerCase();
    return extensionMimes[extension] || null;
  }
  return null;
}
