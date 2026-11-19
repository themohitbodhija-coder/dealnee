const { test } = require('node:test');
const assert = require('node:assert/strict');
const Property = require('../models/Property');

test('project schema serializes new totals, room fields and repeated BHK configurations', () => {
  const unit = { superBuildUpArea: 1200, carpetArea: 900, landArea: 1500, bedrooms: 5, bathrooms: 3, price: 8000000 };
  const property = new Property({
    newProjectInfo: { totalUnits: 2400, totalProjectArea: 90000.5, totalProjectAreaUnit: 'sq_yards' },
    projectPricing: { unitConfigurations: { bhk2: unit, bhk1_first: { ...unit, bedrooms: 1 }, bhk5_first: unit, bhk5_second: { ...unit, price: 9000000 } } },
  });
  const saved = property.toJSON();
  assert.equal(saved.newProjectInfo.totalUnits, 2400);
  assert.equal(saved.newProjectInfo.totalProjectArea, 90000.5);
  assert.equal(saved.projectPricing.unitConfigurations.bhk1_first.bedrooms, 1);
  assert.equal(saved.projectPricing.unitConfigurations.bhk5_first.bathrooms, 3);
  assert.equal(saved.projectPricing.unitConfigurations.bhk5_second.price, 9000000);
  assert.equal(Object.keys(saved.projectPricing.unitConfigurations).length, 4);
});
