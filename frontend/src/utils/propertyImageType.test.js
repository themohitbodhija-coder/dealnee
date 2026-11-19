import { getPropertyImageMime } from './propertyImageType';

test.each([
  ['photo.jpg', 'image/svg+xml'],
  ['photo.jpg', 'text/plain'],
  ['photo.svg', ''],
  ['photo.jpg.exe', 'application/octet-stream'],
  ['photo', ''],
])('rejects unsupported or misleading file metadata: %s (%s)', (name, type) => {
  expect(getPropertyImageMime({ name, type })).toBeNull();
});

test('handles missing files', () => {
  expect(getPropertyImageMime(null)).toBeNull();
});
