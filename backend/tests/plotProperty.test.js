const { test } = require('node:test');
const assert = require('node:assert/strict');
const Property = require('../models/Property');
const { createProperty, getPropertyById, updateProperty } = require('../controllers/propertyController');

test('Express plot create, update and read retain each road width and calculate resale pricing', async t => {
  const collection = new Map();
  const populate = property => {
    const query = { populate: () => query, then: resolve => Promise.resolve(resolve(property)) };
    return query;
  };
  t.mock.method(Property, 'create', async data => {
    const property = new Property(data);
    assert.equal(property.validateSync(), undefined);
    property.populate = async () => property;
    collection.set(String(property._id), property);
    return property;
  });
  t.mock.method(Property, 'findById', async id => collection.get(id));
  t.mock.method(Property, 'findByIdAndUpdate', (id, data) => {
    const old = collection.get(id);
    if (data.$inc) return populate(old);
    const property = new Property({ ...old.toObject(), ...data });
    assert.equal(property.validateSync(), undefined);
    collection.set(id, property);
    return populate(property);
  });
  const send = async (handler, body, id) => {
    const res = { status(code) { this.code = code; return this; }, json(data) { this.data = data; } };
    await handler({ body, params: { id }, headers: {}, user: { id: '65b000000000000000000001' } }, res, error => { throw error; });
    return res;
  };
  const base = {
    propertyId: 'PLOT-01', title: 'Sample plot', description: 'A plot near the market', propertyType: 'BUY',
    area: 1200, areaUnit: 'sq_ft', location: { address: 'Main Road', city: 'Bhubaneswar', state: 'Odisha' },
    contact: { phone: '9876543210' },
  };
  const resale = await send(createProperty, {
    ...base, subcategory: 'RESALE_PLOT', price: 1, bedrooms: 3,
    location: { ...base.location, roadWidth: 26.5 }, facilities: ['electrification'],
    resaleInfo: { pricePerSqft: 2500, plotLength: 40, plotWidth: 30, frontageWidth: 28, facing: 'NORTH', floorNumber: 9 },
  });
  assert.equal(resale.code, 201);
  const resaleId = String(resale.data.property._id);
  assert.equal(resale.data.property.price, 3000000);
  assert.equal(resale.data.property.resaleInfo.floorNumber, undefined);
  assert.equal(resale.data.property.resaleInfo.frontageWidth, 28);

  const project = await send(createProperty, {
    ...base, propertyId: 'PLOT-02', subcategory: 'NEW_PROJECT_PLOT', price: 3000000, areaUnit: 'sq_yards',
    location: { ...base.location, roadWidth: 42 },
    projectPricing: { pricePerSqft: 2500, unitConfigurations: { bhk2: { price: 3100000 } } },
  });
  assert.equal(project.code, 201);
  assert.equal(project.data.property.areaUnit, 'sq_yards');
  assert.deepEqual(project.data.property.toJSON().projectPricing.unitConfigurations, {});
  assert.equal((await send(getPropertyById, {}, String(project.data.property._id))).data.property.location.roadWidth, 42);
  assert.equal((await send(getPropertyById, {}, resaleId)).data.property.location.roadWidth, 26.5);
  assert.equal((await send(updateProperty, { area: -1 }, String(project.data.property._id))).code, 400);

  const update = await send(updateProperty, { location: { roadWidth: null }, resaleInfo: { pricePerSqft: 2000 } }, resaleId);
  assert.equal(update.code, 200);
  assert.equal(update.data.property.price, 2400000);
  assert.equal(update.data.property.location.roadWidth, null);
  assert.deepEqual(Array.from(update.data.property.facilities), ['electrification']);
  assert.equal((await send(updateProperty, { location: { roadWidth: -1 } }, resaleId)).code, 400);
});
