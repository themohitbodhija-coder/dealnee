import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhotoImageHandler } from '../../functions/_shared/photo-image.mjs';

const photoKey = 'properties/listing/photo.jpg';
const request = (key, method = 'GET') => new Request(
  `https://example.test/photo-image?${new URLSearchParams({ key })}`,
  { method },
);

test('redirects only a publicly attached photo to a signed S3 URL', async () => {
  const signedUrl = 'https://photos.s3.amazonaws.com/properties/listing/photo.jpg?signature=example';
  const handler = createPhotoImageHandler({
    findPublicImage: async key => key === photoKey ? { object_key: key } : null,
    signGet: async key => {
      assert.equal(key, photoKey);
      return signedUrl;
    },
  });
  const result = await handler(request(photoKey));
  assert.equal(result.status, 302);
  assert.equal(result.headers.get('Location'), signedUrl);
  const missing = await handler(request('properties/listing/other.jpg'));
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('Location'), null);
  assert.equal((await handler(request('pending/draft.jpg'))).status, 404);
  assert.equal((await handler(request('properties/listing/../hidden.jpg'))).status, 404);
  assert.equal((await handler(request(photoKey, 'POST'))).status, 405);
});

test('does not redirect when the catalog lookup fails', async () => {
  const handler = createPhotoImageHandler({
    findPublicImage: async () => { throw Error('catalog unavailable'); },
    signGet: async () => assert.fail('must not sign when the catalog lookup fails'),
  });
  const result = await handler(request(photoKey));
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('Location'), null);
});
