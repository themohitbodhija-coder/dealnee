export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_JPEG_EDGE = 2560;

// Keep large architectural renders within the server decoder's memory budget.
// Canvas applies the browser's EXIF orientation and preserves the aspect ratio.
export async function preparePropertyImage(file, mimeType) {
  if (mimeType !== 'image/jpeg') return file;
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('This JPG could not be read. Choose another image.'));
      image.src = url;
    });
    const { naturalWidth: width, naturalHeight: height } = image;
    if (!width || !height) throw new Error('This JPG has invalid dimensions.');
    if (width > 12000 || height > 12000 || width * height > 40000000) {
      throw new Error('Choose a JPG up to 12000 pixels per side and 40 megapixels.');
    }
    if (Math.max(width, height) <= MAX_JPEG_EDGE) return file;
    const scale = MAX_JPEG_EDGE / Math.max(width, height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable. Please try another browser.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob || !blob.size || blob.size > MAX_IMAGE_BYTES) throw new Error('This JPG could not be prepared for upload.');
    return new File([blob], file.name, { type: 'image/jpeg', lastModified: file.lastModified });
  } finally {
    URL.revokeObjectURL(url);
  }
}
