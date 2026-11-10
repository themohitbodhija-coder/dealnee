import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LocationStep from '../components/admin/property-steps/LocationStep';
import { INITIAL_FORM_STATE } from '../reducers/propertyFormReducer';
import { getPropertyLocationLabel, transformFormDataForSubmission } from './propertyFormUtils';
import { validatePhone, validateLocation, validateCommercialDetails } from '../validation/propertyValidation';

test('accepts an Indian mobile number with its country prefix', () => {
  expect(validatePhone('+91 9876543210')).toBe(true);
});
test('accepts a full plot address without requiring a predefined locality', () => {
  expect(validateLocation({ address: 'Plot 21, QA Road', city: 'Bhubaneswar', state: 'Odisha', locality: '' })).toEqual({});
});
test('does not reject omitted optional commercial property age', () => {
  expect(validateCommercialDetails({ price: 9000000, builtUpArea: 1500 })).toEqual({});
});
test('keeps saved city and locality available when absent from preset dropdowns', () => {
  const html = renderToStaticMarkup(<LocationStep formData={{ ...INITIAL_FORM_STATE, location: { state: 'Odisha', city: 'QA Existing City', locality: 'QA Existing Locality', address: 'Plot 21' } }} dispatch={() => {}} />);
  expect(html).toContain('value="QA Existing City"');
  expect(html).toContain('value="QA Existing Locality"');
});

test('retains an explicit Plot address and uses locality only when address is blank', () => {
  const form = { ...INITIAL_FORM_STATE, location: { address: 'Plot 21, QA Road', locality: 'Patia', city: 'Bhubaneswar', state: 'Odisha' } };
  expect(transformFormDataForSubmission(form, 'qa').location.address).toBe('Plot 21, QA Road');
  expect(getPropertyLocationLabel(form.location)).toBe('Plot 21, QA Road, Patia, Bhubaneswar, Odisha');
  expect(getPropertyLocationLabel({ ...form.location, address: '' })).toBe('Patia, Bhubaneswar, Odisha');
  expect(transformFormDataForSubmission({ ...form, location: { ...form.location, address: '' } }, 'qa').location.address).toBe('Patia');
});
