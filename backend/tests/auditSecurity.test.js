const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { imageFileFilter, validatePropertyImages } = require('../middleware/propertyImageValidation');
const errorHandler = require('../middleware/errorHandler');
const Property = require('../models/Property');

test('upload rejects executable extension despite an image MIME type', () => {
  imageFileFilter({}, { originalname: 'unsafe.html', mimetype: 'image/png' }, (error) => assert.equal(error.status, 400));
});
test('upload rejects fake PNG content and removes only its new upload', async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'dealinee-image-test-'));
  const target = path.join(folder, 'fake.png');
  await fs.writeFile(target, 'not an image');
  let failure;
  await validatePropertyImages({ files: [{ path: target, originalname: 'fake.png', mimetype: 'image/png' }] }, {}, (error) => { failure = error; });
  assert.equal(failure.status, 400);
  await assert.rejects(fs.stat(target));
  await fs.rmdir(folder);
});
test('valid PNG signature is accepted', async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'dealinee-image-test-'));
  const target = path.join(folder, 'valid.png');
  await fs.writeFile(target, Buffer.from('89504e470d0a1a0a', 'hex'));
  let failure;
  await validatePropertyImages({ files: [{ path: target, originalname: 'valid.png', mimetype: 'image/png' }] }, {}, (error) => { failure = error; });
  assert.equal(failure, undefined);
  await fs.unlink(target); await fs.rmdir(folder);
});
test('malformed resource ID returns a safe client error', () => {
  let status, body;
  errorHandler({ name: 'CastError' }, {}, { status(value) { status = value; return this; }, json(value) { body = value; } }, () => {});
  assert.equal(status, 400); assert.equal(body.message, 'Invalid resource identifier or field value');
});
test('rental furnishing is retained by the schema', () => {
  assert.equal(new Property({ rentalInfo: { furnishingStatus: 'SEMI_FURNISHED' } }).rentalInfo.furnishingStatus, 'SEMI_FURNISHED');
});

test('oversized multipart image returns 413 instead of a server error', () => {
  let status, body;
  errorHandler({ name: 'MulterError', code: 'LIMIT_FILE_SIZE' }, {}, { status(value) { status = value; return this; }, json(value) { body = value; } }, () => {});
  assert.equal(status, 413);
  assert.equal(body.message, 'Image exceeds the 5MB limit');
});
