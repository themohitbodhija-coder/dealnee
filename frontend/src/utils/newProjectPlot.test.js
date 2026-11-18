import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProjectDetailsStep from '../components/admin/property-steps/ProjectDetailsStep';
import { propertyWritePayload } from './propertyWritePayload';
import { calculateResalePlotPrice, getResalePlotAreaInSquareFeet } from './plotDetails';
import { validatePlotDetails, validateStep } from '../validation/propertyValidation';
import PropertyDetailsStep from '../components/admin/property-steps/PropertyDetailsStep';
import { INITIAL_FORM_STATE, initializePropertyFormState } from '../reducers/propertyFormReducer';
import { transformFormDataForSubmission, getPropertyRoomStats } from './propertyFormUtils';

test('New Project Plot replaces room inputs with length and width and retains dimensions on edit', () => {
  const form = initializePropertyFormState({
    ...INITIAL_FORM_STATE,
    basicInfo: { propertyType: 'BUY', category: 'NEW_PROJECT', subcategory: 'NEW_PROJECT_PLOT' },
    newProjectInfo: { plotLength: '40.5', plotWidth: '30' },
  });
  const html = renderToStaticMarkup(<PropertyDetailsStep formData={form} dispatch={() => {}} />);
  expect(html).toContain('Length (ft)');
  expect(html).toContain('Width (ft)');
  expect(html).not.toContain('Bedrooms');
  expect(html).not.toContain('Bathrooms');
  const payload = transformFormDataForSubmission(form, 'qa');
  expect(payload.newProjectInfo).toMatchObject({ plotLength: 40.5, plotWidth: 30 });
  const reopened = initializePropertyFormState({ ...form, newProjectInfo: payload.newProjectInfo });
  expect(reopened.newProjectInfo).toMatchObject({ plotLength: 40.5, plotWidth: 30 });
  expect(getPropertyRoomStats({ propertyType: 'BUY', subcategory: 'NEW_PROJECT_PLOT', bedrooms: 3, bathrooms: 2 })).toEqual({ bedrooms: 0, bathrooms: 0 });
});

test('New Project Apartment retains room inputs', () => {
  const form = { ...INITIAL_FORM_STATE, basicInfo: { propertyType: 'BUY', category: 'NEW_PROJECT', subcategory: 'NEW_PROJECT_APARTMENT' } };
  const html = renderToStaticMarkup(<PropertyDetailsStep formData={form} dispatch={() => {}} />);
  expect(html).toContain('Bedrooms');
  expect(html).toContain('Bathrooms');
  expect(html).not.toContain('Length (ft)');
});

test('New Project Plot has editable pricing without BHKs and leaves road width optional', () => {
  const form = initializePropertyFormState({
    ...INITIAL_FORM_STATE,
    basicInfo: { propertyType: 'BUY', category: 'NEW_PROJECT', subcategory: 'NEW_PROJECT_PLOT' },
    propertyDetails: { area: '1200', areaUnit: 'sq_ft', price: '3000000', facilities: ['electrification'] },
    projectPricing: { pricePerSqft: '2500', unitConfigurations: { bhk2: { price: '3000000' } } },
  });
  const html = renderToStaticMarkup(<ProjectDetailsStep formData={form} dispatch={() => {}} />);
  expect(html).not.toContain('Unit Configurations');
  expect(html).not.toContain('readOnly');
  expect(validateStep('project_details', form)).toEqual({});
  expect(propertyWritePayload(form)).toMatchObject({
    facilities: ['electrification'], commonInfo: {}, projectPricing: { pricePerSqft: '2500' },
  });
  expect(propertyWritePayload(form).projectPricing).not.toHaveProperty('unitConfigurations');
  expect(transformFormDataForSubmission(form, 'qa').projectPricing.unitConfigurations).toEqual({});
});

test('resale plot calculates the price and removes inherited housing fields from both save formats', () => {
  const form = initializePropertyFormState({
    ...INITIAL_FORM_STATE,
    basicInfo: { propertyType: 'BUY', category: 'RESALE', subcategory: 'RESALE_PLOT' },
    location: { roadWidth: '42.5' },
    propertyDetails: {
      area: '1200', areaUnit: 'sq_m', price: '1', bedrooms: 3, bathrooms: 2, facing: 'NORTH',
      amenities: ['water_supply', 'modular_kitchen'], facilities: ['electrification'],
      furnishingItems: ['ac'], carpetArea: '500',
    },
    resaleInfo: { pricePerSqft: '2500', frontageWidth: '24', floorNumber: 9, furnishingStatus: 'FULLY_FURNISHED' },
  });
  const html = renderToStaticMarkup(<PropertyDetailsStep formData={form} dispatch={() => {}} />);
  expect(html).toContain('Plot Area (sq ft)');
  expect(html).toContain('value="3000000.00"');
  expect(html).toContain('Facing Road Width (ft)');
  expect(html).not.toMatch(/Bedrooms|Floor Number|Furnishing Status|Modular Kitchen/);
  expect(validatePlotDetails(form)).toEqual({});
  expect(propertyWritePayload(form)).toMatchObject({
    price: '3000000.00', areaUnit: 'sq_ft', bedrooms: 0, furnishingItems: [], amenities: ['water_supply'],
    commonInfo: { roadWidth: '42.5', facing: 'NORTH' },
    resaleInfo: { pricePerSqft: '2500', frontageWidth: '24' },
  });
  expect(propertyWritePayload(form).resaleInfo).not.toHaveProperty('floorNumber');
  expect(propertyWritePayload(form).commonInfo).not.toHaveProperty('carpetArea');
  expect(transformFormDataForSubmission(form, 'qa')).toMatchObject({
    price: 3000000, bedrooms: 0, bathrooms: 0, location: { roadWidth: 42.5 },
    resaleInfo: { facing: 'NORTH', frontageWidth: '24' },
  });
  expect(validatePlotDetails({
    ...form, location: { roadWidth: '0' }, resaleInfo: { pricePerSqft: '' },
  })).toHaveProperty('pricePerSqft');
  expect(validatePlotDetails({ ...form, location: { roadWidth: '0' } })).toHaveProperty('roadWidth');
  expect(calculateResalePlotPrice('1', '1.005')).toBe('1.01');
  expect(calculateResalePlotPrice('1000', '2500')).toBe('2500000.00');
  expect(calculateResalePlotPrice('1200', '2000')).toBe('2400000.00');
  expect(getResalePlotAreaInSquareFeet({ area: 100, areaUnit: 'sq_m' })).toBe(1076.391);
});
