const { test } = require('node:test');
const assert = require('node:assert/strict');
const Property = require('../models/Property');

test('Commercial sale schema retains areas and existing commercial form fields', () => {
  const data = {
    builtUpArea: 1500, carpetArea: 1100, ceilingHeight: 12, frontageWidth: 20,
    parkingAvailability: false, furnishingType: 'SEMI_FURNISHED',
    floorNumber: 0, businessAdvantages: 'Near transit',
  };
  const property = new Property({ commercialDetails: data });
  for (const [key, value] of Object.entries(data)) {
    assert.equal(property.toObject().commercialDetails[key], value, key);
  }
});
