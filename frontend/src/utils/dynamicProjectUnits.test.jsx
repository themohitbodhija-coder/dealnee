import React, { act, useReducer } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import ProjectDetailsStep from '../components/admin/property-steps/ProjectDetailsStep';
import PropertyDetailsStep from '../components/admin/property-steps/PropertyDetailsStep';
import { INITIAL_FORM_STATE, initializePropertyFormState, propertyFormReducer } from '../reducers/propertyFormReducer';
import { propertyWritePayload } from './propertyWritePayload';
import { validateUnitConfiguration, validateNewProjectInfo } from '../validation/propertyValidation';

const fixture = () => initializePropertyFormState({
  ...INITIAL_FORM_STATE,
  basicInfo: { propertyType: 'BUY', category: 'NEW_PROJECT', subcategory: 'NEW_PROJECT_VILLA' },
});
const unit = { superBuildUpArea: '1200', carpetArea: '900', landArea: '1500', bedrooms: '5', bathrooms: '3', price: '8000000' };

test('dynamic unit fields and project totals survive payload and edit hydration alongside legacy units', () => {
  const form = fixture();
  form.newProjectInfo = { ...form.newProjectInfo, totalUnits: '2400', totalProjectArea: '90000.5', totalProjectAreaUnit: 'sq_yards' };
  form.projectPricing.unitConfigurations = { bhk2: unit, bhk5_first: unit, bhk5_second: { ...unit, price: '9000000' }, bhk1_first: { ...unit, bedrooms: '1' } };
  const payload = propertyWritePayload(form);
  expect(payload.newProjectInfo).toMatchObject({ totalUnits: '2400', totalProjectArea: '90000.5', totalProjectAreaUnit: 'sq_yards' });
  expect(payload.projectPricing.unitConfigurations).toEqual(form.projectPricing.unitConfigurations);
  const reopened = initializePropertyFormState({ ...form, projectPricing: payload.projectPricing, newProjectInfo: payload.newProjectInfo });
  expect(reopened.projectPricing.unitConfigurations.bhk5_second.price).toBe('9000000');
  expect(validateUnitConfiguration(reopened.projectPricing.unitConfigurations)).toEqual({});
  expect(validateNewProjectInfo(reopened.newProjectInfo)).toEqual({});
  expect(validateUnitConfiguration({ bhk5_first: { ...unit, carpetArea: '1300', bathrooms: '1.5' } }).bhk5_first).toHaveProperty('bathrooms');
  expect(validateNewProjectInfo({ totalUnits: '1.5', totalProjectArea: '-1' })).toHaveProperty('totalUnits');
});

test('adds repeated configurations one by one from the 1–5 BHK dropdown and removes only the chosen unit', () => {
  const previous = global.IS_REACT_ACT_ENVIRONMENT;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const originalCrypto = global.crypto;
  let sequence = 0;
  global.crypto = { randomUUID: () => `unit${++sequence}` };
  const container = document.createElement('div');
  const root = createRoot(container);
  let current;
  function Form() {
    const [state, dispatch] = useReducer(propertyFormReducer, fixture());
    current = state;
    return <ProjectDetailsStep formData={state} dispatch={dispatch} />;
  }
  try {
    act(() => root.render(<Form />));
    const select = container.querySelector('#unit-bhk');
    expect(Array.from(select.options).map(option => option.value)).toEqual(['1', '2', '3', '4', '5']);
    act(() => { select.value = '5'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    const add = () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Add Unit');
    act(() => add().click());
    act(() => add().click());
    expect(current.projectPricing.unitConfigurations.bhk5_unit1.bedrooms).toBe('5');
    expect(current.projectPricing.unitConfigurations.bhk5_unit2.bedrooms).toBe('5');
    expect(container.querySelectorAll('input[id$="-bathrooms"]')).toHaveLength(2);
    act(() => container.querySelector('[aria-label="Remove bhk5_unit1"]').click());
    expect(current.projectPricing.unitConfigurations.bhk5_unit1).toBeUndefined();
    expect(current.projectPricing.unitConfigurations.bhk5_unit2).toBeDefined();
    expect(container.textContent).not.toContain('Super Built-up Area');
  } finally {
    act(() => root.unmount());
    global.crypto = originalCrypto;
    global.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});

test('step 4 renders villa plot area once beside the upper area inputs', () => {
  for (const subcategory of ['NEW_PROJECT_VILLA', 'RESALE_VILLA']) {
    const form = fixture();
    form.basicInfo = { ...form.basicInfo, subcategory, category: subcategory === 'RESALE_VILLA' ? 'RESALE' : 'NEW_PROJECT' };
    const html = renderToStaticMarkup(<PropertyDetailsStep formData={form} dispatch={() => {}} />);
    expect(html.match(/id="property-plot-area"/g)).toHaveLength(1);
    expect(html).not.toContain('Super Built-up Area');
  }
});
