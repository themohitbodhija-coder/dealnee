const originalMode = process.env.REACT_APP_BACKEND;
const originalBase = process.env.REACT_APP_IMAGE_BASE_URL;
beforeEach(() => { jest.resetModules(); process.env.REACT_APP_BACKEND = 'supabase'; process.env.REACT_APP_IMAGE_BASE_URL = 'https://images.example.test'; });
afterEach(() => {
  if (originalMode === undefined) delete process.env.REACT_APP_BACKEND; else process.env.REACT_APP_BACKEND = originalMode;
  if (originalBase === undefined) delete process.env.REACT_APP_IMAGE_BASE_URL; else process.env.REACT_APP_IMAGE_BASE_URL = originalBase;
});
test('object keys resolve only to the configured image origin', () => {
  const { getImageUrl } = require('./imageUrl');
  expect(getImageUrl('properties/listing/image.jpg')).toBe('https://images.example.test/properties/listing/image.jpg');
  expect(getImageUrl({ objectKey: 'properties/listing/image.webp' })).toBe('https://images.example.test/properties/listing/image.webp');
  expect(getImageUrl('https://other.example/properties/image.jpg')).toBeNull();
});
test('pending uploads, legacy uploads, executable images and traversal do not resolve', () => {
  const { getImageUrl } = require('./imageUrl');
  for (const key of ['pending/image.jpg','/uploads/image.jpg','properties/image.svg','properties/../secret.jpg','javascript:alert(1)']) expect(getImageUrl(key)).toBeNull();
});
test('missing image configuration never falls back to the old API host', () => {
  delete process.env.REACT_APP_IMAGE_BASE_URL;
  expect(require('./imageUrl').getImageUrl('properties/image.jpg')).toBeNull();
});
