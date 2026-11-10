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
