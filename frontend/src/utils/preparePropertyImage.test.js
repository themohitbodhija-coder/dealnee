import { MAX_IMAGE_BYTES, preparePropertyImage } from './preparePropertyImage';

const originalImage = global.Image;
const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
const originalContext = HTMLCanvasElement.prototype.getContext;
const originalToBlob = HTMLCanvasElement.prototype.toBlob;
let dimensions;
let drawImage;
beforeEach(() => {
  dimensions = [7203, 4802];
  global.Image = class {
    get naturalWidth() { return dimensions[0]; }
    get naturalHeight() { return dimensions[1]; }
    set src(value) { Promise.resolve().then(() => this.onload()); }
  };
  URL.createObjectURL = jest.fn(() => 'blob:test');
  URL.revokeObjectURL = jest.fn();
  drawImage = jest.fn();
  HTMLCanvasElement.prototype.getContext = () => ({ drawImage });
  HTMLCanvasElement.prototype.toBlob = function(callback) { callback(new Blob(['normalized JPG'], { type: 'image/jpeg' })); };
});
afterEach(() => {
  global.Image = originalImage;
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
  HTMLCanvasElement.prototype.getContext = originalContext;
  HTMLCanvasElement.prototype.toBlob = originalToBlob;
});

test('resizes high resolution JPGs with aspect ratio, filename and canonical MIME preserved', async () => {
  const file = new File(['original'], 'd_1.jpg', { type: 'image/jpeg', lastModified: 123 });
  const result = await preparePropertyImage(file, 'image/jpeg');
  expect(result).not.toBe(file);
  expect(result.name).toBe('d_1.jpg');
  expect(result.type).toBe('image/jpeg');
  expect(result.lastModified).toBe(123);
  expect(drawImage.mock.calls[0].slice(1)).toEqual([0, 0, 2560, 1707]);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  expect(MAX_IMAGE_BYTES).toBe(20971520);
});

test('keeps small JPGs and other formats unchanged', async () => {
  dimensions = [1200, 800];
  const file = new File(['original'], 'photo.jpg');
  expect(await preparePropertyImage(file, 'image/jpeg')).toBe(file);
  expect(await preparePropertyImage(file, 'image/gif')).toBe(file);
  expect(drawImage).not.toHaveBeenCalled();
});

test('releases object URLs and reports encoding failures', async () => {
  HTMLCanvasElement.prototype.toBlob = callback => callback(null);
  await expect(preparePropertyImage(new File(['original'], 'photo.jpg'), 'image/jpeg')).rejects.toThrow('prepared');
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
});

test('rejects excessive source dimensions before drawing pixels into the canvas', async () => {
  dimensions = [12000, 12000];
  await expect(preparePropertyImage(new File(['original'], 'photo.jpg'), 'image/jpeg')).rejects.toThrow('40 megapixels');
  expect(drawImage).not.toHaveBeenCalled();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
});
