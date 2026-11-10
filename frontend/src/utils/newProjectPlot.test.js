import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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
