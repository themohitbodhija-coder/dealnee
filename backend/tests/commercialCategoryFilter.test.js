const { test } = require('node:test');
const assert = require('node:assert/strict');
const Category = require('../models/Category');
const Property = require('../models/Property');
const { getAllProperties } = require('../controllers/propertyController');

test('Commercial category=buy resolves Commercial Buy rather than residential Buy Property', async () => {
  const originals = [Category.findOne, Property.countDocuments, Property.find];
  let resolvedName;
  Category.findOne = async ({ name }) => { resolvedName = name; return { _id: 'qa-category' }; };
  Property.countDocuments = async () => 0;
  const chain = { populate() { return this; }, sort() { return this; }, skip() { return this; }, limit: async () => [] };
  Property.find = () => chain;
  try {
    await getAllProperties({ query: { type: 'commercial', subtype: 'buy', category: 'buy' } }, { status() { return this; }, json() {} }, (error) => { throw error; });
    assert.equal(resolvedName, 'Commercial Buy');
  } finally {
    [Category.findOne, Property.countDocuments, Property.find] = originals;
  }
});

test('listing subtype filters match exact resale, rental and commercial shapes and keyword search stays literal', async t => {
  const chain = { populate() { return this; }, sort() { return this; }, skip() { return this; }, limit: async () => [] };
  let captured;
  t.mock.method(Property, 'countDocuments', async filter => { captured = filter; return 0; });
  t.mock.method(Property, 'find', () => chain);
  for (const [type, subtype] of [['buy', 'RESALE_FLAT'], ['buy', 'NEW_PROJECT_VILLA'], ['rent', 'RENTAL_FLAT'], ['commercial', 'COMMERCIAL_OFFICE_LEASE']]) {
    await getAllProperties({ query: { type, subtype, q: 'A+B', location: 'Bhubaneswar' } }, { status() { return this; }, json() {} }, error => { throw error; });
    assert.equal(captured.subcategory, subtype);
    assert.equal(captured.propertyType, type.toUpperCase());
    assert.equal(captured.$and[0].$or[0].title.test('A+B'), true);
    assert.equal(captured.$and[0].$or[0].title.test('AAAB'), false);
    assert.equal(captured.$or[0]['location.city'].test('Bhubaneswar'), true);
  }
});
