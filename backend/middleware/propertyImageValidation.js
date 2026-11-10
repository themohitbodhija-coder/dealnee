const fs = require('fs/promises');
const path = require('path');

const formats = {
  '.png': ['image/png', (b) => b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))],
  '.jpg': ['image/jpeg', (b) => b[0] === 255 && b[1] === 216 && b[2] === 255],
  '.jpeg': ['image/jpeg', (b) => b[0] === 255 && b[1] === 216 && b[2] === 255],
  '.gif': ['image/gif', (b) => /^GIF8[79]a/.test(b.toString('ascii', 0, 6))],
  '.webp': ['image/webp', (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'],
  '.avif': ['image/avif', (b) => b.toString('ascii', 4, 8) === 'ftyp' && ['avif', 'avis'].includes(b.toString('ascii', 8, 12))],
};
const acceptedFormat = (file) => {
  const format = formats[path.extname(file.originalname).toLowerCase()];
  return format && format[0] === file.mimetype ? format : null;
};
const imageFileFilter = (req, file, cb) => {
  if (acceptedFormat(file)) return cb(null, true);
  const error = new Error('Upload a PNG, JPEG, GIF, WebP or AVIF image');
  error.status = 400;
  cb(error);
};
const validatePropertyImages = async (req, res, next) => {
  const files = req.files || [];
  try {
    for (const file of files) {
      const format = acceptedFormat(file);
      const bytes = await fs.readFile(file.path);
      if (!format || !format[1](bytes)) {
        const error = new Error('Uploaded image content does not match its file type');
        error.status = 400;
        throw error;
      }
    }
    next();
  } catch (error) {
    await Promise.allSettled(files.map((file) => fs.unlink(file.path)));
    next(error);
  }
};
module.exports = { imageFileFilter, validatePropertyImages, acceptedFormat };
