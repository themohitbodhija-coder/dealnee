const originalMode = process.env.REACT_APP_BACKEND;
const originalBase = process.env.REACT_APP_IMAGE_BASE_URL;
const originalProject = process.env.REACT_APP_SUPABASE_URL;
beforeEach(() => { jest.resetModules(); process.env.REACT_APP_BACKEND = 'supabase'; process.env.REACT_APP_IMAGE_BASE_URL = 'https://images.example.test'; });
afterEach(() => {
  if (originalMode === undefined) delete process.env.REACT_APP_BACKEND; else process.env.REACT_APP_BACKEND = originalMode;
  if (originalBase === undefined) delete process.env.REACT_APP_IMAGE_BASE_URL; else process.env.REACT_APP_IMAGE_BASE_URL = originalBase;
  if (originalProject === undefined) delete process.env.REACT_APP_SUPABASE_URL; else process.env.REACT_APP_SUPABASE_URL = originalProject;
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
test('missing CDN configuration routes catalog image keys through the Supabase signer', () => {
  delete process.env.REACT_APP_IMAGE_BASE_URL;
  process.env.REACT_APP_SUPABASE_URL = 'https://project.supabase.co';
  const { getImageUrl } = require('./imageUrl');
  expect(getImageUrl({ objectKey: 'properties/listing/photo.jpg' })).toBe('https://project.supabase.co/functions/v1/photo-image?key=properties%2Flisting%2Fphoto.jpg');
  for (const key of ['pending/photo.jpg', 'properties/a/../photo.jpg', 'https://other.example/properties/photo.jpg']) {
    expect(getImageUrl(key)).toBeNull();
  }
});
test('missing CDN and Supabase URLs never fall back to the old API host', () => {
  delete process.env.REACT_APP_IMAGE_BASE_URL;
  delete process.env.REACT_APP_SUPABASE_URL;
  expect(require('./imageUrl').getImageUrl('properties/image.jpg')).toBeNull();
});
