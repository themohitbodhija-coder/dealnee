import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PropertyDetailsStep from '../components/admin/property-steps/PropertyDetailsStep';
import {
  INITIAL_FORM_STATE,
  initializePropertyFormState,
  propertyFormReducer,
  createFieldUpdateAction,
} from '../reducers/propertyFormReducer';
import { transformFormDataForSubmission } from './propertyFormUtils';

const remainingSubtypes = ['SHOP', 'SHOWROOM', 'LAND', 'WAREHOUSE', 'INDUSTRIAL', 'COWORKING'];

describe.each(remainingSubtypes)('Commercial Buy %s', (subtype) => {
  const code = `COMMERCIAL_${subtype}_SALE`;
  const createForm = () => ({
    ...INITIAL_FORM_STATE,
    basicInfo: {
      propertyId: `QA-${subtype}`, title: `QA ${subtype}`, description: 'Temporary regression fixture',
      propertyType: 'COMMERCIAL', category: 'BUY', subcategory: code,
    },
    propertyDetails: { ...INITIAL_FORM_STATE.propertyDetails, bathrooms: 0, amenities: ['security'], areaUnit: 'sq_ft' },
    commercialDetails: {
      price: '8000000', builtUpArea: '2000', carpetArea: '1400',
      parkingAvailability: true, furnishingType: 'UNFURNISHED',
      ceilingHeight: 18, frontageWidth: 25, facing: 'EAST',
      suitableFor: ['warehouse'], floorNumber: 0, businessAdvantages: 'Near transport',
    },
  });

  test('renders the existing sale controls and produces a complete creation payload', () => {
    const form = createForm();
    const html = renderToStaticMarkup(<PropertyDetailsStep formData={form} dispatch={() => {}} />);
    expect(html).toContain('commercial-builtUpArea');
    expect(html).toContain('commercial-carpetArea');
    const payload = transformFormDataForSubmission(form, 'qa');
    expect(payload).toMatchObject({
      propertyType: 'COMMERCIAL', subcategory: code, price: 8000000, area: 2000,
      bathrooms: 0, amenities: ['security'],
      commercialDetails: { carpetArea: 1400, ceilingHeight: 18, frontageWidth: 25, parkingAvailability: true },
    });
  });

  test('reopens persisted values and preserves commercial fields during a reducer edit', () => {
    const payload = transformFormDataForSubmission(createForm(), 'qa');
    // Match API hydration: price/area and amenities are top-level on the record;
    // commercialDetails.price is not stored by Mongoose.
    const storedCommercial = { ...payload.commercialDetails };
    delete storedCommercial.price;
    const loaded = initializePropertyFormState({
      ...INITIAL_FORM_STATE,
      basicInfo: { ...createForm().basicInfo, category: 'Commercial Buy' },
      propertyDetails: { price: payload.price, area: payload.area, bathrooms: 0, areaUnit: 'sq_ft' },
      commercialDetails: storedCommercial,
      amenities: payload.amenities,
      images: [{ url: '/uploads/test-existing.png', file: null }],
    });
    expect(loaded.basicInfo).toMatchObject({ category: 'BUY', subcategory: code });
    expect(loaded.commercialDetails.price).toBe(8000000);
    let edited = propertyFormReducer(loaded, createFieldUpdateAction('commercialDetails', 'price', '8500000'));
    edited = propertyFormReducer(edited, createFieldUpdateAction('commercialDetails', 'builtUpArea', '2200'));
    edited = propertyFormReducer(edited, createFieldUpdateAction('basicInfo', 'description', 'Updated regression description'));
    edited = propertyFormReducer(edited, createFieldUpdateAction('propertyDetails', 'bathrooms', '2'));
    const updated = transformFormDataForSubmission(edited, 'qa');
    expect(updated).toMatchObject({ propertyId: payload.propertyId, subcategory: code, price: 8500000, area: 2200, bathrooms: 2 });
    for (const field of ['carpetArea', 'parkingAvailability', 'furnishingType', 'floorNumber', 'facing', 'ceilingHeight', 'frontageWidth', 'suitableFor', 'businessAdvantages']) {
      expect(updated.commercialDetails[field]).toEqual(payload.commercialDetails[field]);
    }
    expect(updated.amenities).toEqual(['security']);
    expect(edited.images).toEqual(loaded.images);
    expect(loaded.commercialDetails.price).toBe(8000000);
  });
});
