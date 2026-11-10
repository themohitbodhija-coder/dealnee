import { INITIAL_FORM_STATE, initializePropertyFormState } from '../reducers/propertyFormReducer';
import { transformFormDataForSubmission } from './propertyFormUtils';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import PropertyDetailsStep from '../components/admin/property-steps/PropertyDetailsStep';

test('saved rental category populates the existing Rent option on edit', () => {
  const state = initializePropertyFormState({ ...INITIAL_FORM_STATE, basicInfo: { propertyType: 'RENT', category: 'Rent Property' } });
  expect(state.basicInfo.category).toBe('RENT');
});

test('opening Rental Details does not overwrite saved deposit or furnishing selections', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  const dispatch = jest.fn();
  const form = { ...INITIAL_FORM_STATE, basicInfo: { propertyType: 'RENT', category: 'RENT', subcategory: 'RENTAL_FLAT' }, propertyDetails: { ...INITIAL_FORM_STATE.propertyDetails, furnishingItems: ['ac'] }, rentalInfo: { monthlyRent: 20000, securityDeposit: 12345, furnishingStatus: 'SEMI_FURNISHED' } };
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  act(() => root.render(<PropertyDetailsStep formData={form} dispatch={dispatch} />));
  try { expect(dispatch).not.toHaveBeenCalled(); } finally { act(() => root.unmount()); }
});

test('editing a residential listing preserves facilities, furnishing, outdoor features and featured state', () => {
  const state = initializePropertyFormState({ ...INITIAL_FORM_STATE,
    basicInfo: { propertyType: 'BUY', category: 'New Projects', subcategory: 'NEW_PROJECT_VILLA' },
    propertyDetails: { price: 5000000, area: 1200 },
    facilities: ['school'], furnishingItems: ['ac'], outdoorFeatures: ['terrace'], featured: true,
  });
  expect(state.propertyDetails).toMatchObject({ facilities: ['school'], furnishingItems: ['ac'], outdoorFeatures: ['terrace'], featured: true });
  expect(transformFormDataForSubmission(state, 'qa')).toMatchObject({ facilities: ['school'], furnishingItems: ['ac'], featured: true });
});

test('commercial lease submits and restores price, area, furnishing and parking', () => {
  const state = { ...INITIAL_FORM_STATE, basicInfo: { propertyType: 'COMMERCIAL', category: 'LEASE', subcategory: 'COMMERCIAL_SHOP_LEASE' }, commercialDetails: { price: 50000, builtUpArea: 1000, carpetArea: 800, furnishingType: 'UNFURNISHED', parkingAvailability: true } };
  const payload = transformFormDataForSubmission(state, 'qa');
  expect(payload).toMatchObject({ price: 50000, area: 1000, commercialDetails: { carpetArea: 800, furnishingType: 'UNFURNISHED', parkingAvailability: true } });
  const restored = initializePropertyFormState({ ...state, basicInfo: { ...state.basicInfo, category: 'Commercial Lease' }, propertyDetails: { price: 50000, area: 1000 }, commercialDetails: { carpetArea: 800 } });
  expect(restored.basicInfo.category).toBe('LEASE');
  expect(restored.commercialDetails.price).toBe(50000);
});
