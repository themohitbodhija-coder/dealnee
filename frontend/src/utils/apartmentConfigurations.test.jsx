import React, { act, useReducer } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import ProjectDetailsStep from '../components/admin/property-steps/ProjectDetailsStep';
import PropertyDetailsStep from '../components/admin/property-steps/PropertyDetailsStep';
import ReviewStep from '../components/admin/property-steps/ReviewStep';
import { INITIAL_FORM_STATE, initializePropertyFormState, propertyFormReducer } from '../reducers/propertyFormReducer';
import { propertyWritePayload } from './propertyWritePayload';
import { transformFormDataForSubmission } from './propertyFormUtils';
import { getUnitBhk, getUnitBedrooms, areaInSquareFeet, UNIT_CODE_PATTERN } from './projectUnits';
import { validateStep, validateCompleteFormExpanded, validateUnitConfiguration } from '../validation/propertyValidation';

const unit = { price: '6000000', superBuildUpArea: '1000', carpetArea: '800', bedrooms: '2', bathrooms: '2', landArea: '1500' };
const fixture = (subtype = 'NEW_PROJECT_APARTMENT') => initializePropertyFormState({
  ...INITIAL_FORM_STATE,
  basicInfo: { ...INITIAL_FORM_STATE.basicInfo, propertyType: 'BUY', category: 'NEW_PROJECT', subcategory: subtype },
  newProjectInfo: { projectName: 'Test project', builderName: 'Test builder', totalProjectArea: '5.5', totalProjectAreaUnit: 'acres' },
  projectPricing: { unitConfigurations: { bhk2p5_first: unit } },
});

test.each([
  ['NEW_PROJECT_APARTMENT', 'sq_ft', '4070', 1376],
  ['NEW_PROJECT_VILLA', 'sq_ft', '4070', 1376],
  ['NEW_PROJECT_APARTMENT', 'sq_m', '100', 5203],
  ['NEW_PROJECT_APARTMENT', 'sq_yards', '100', 6222],
  ['NEW_PROJECT_APARTMENT', 'sq_ft', '', ''],
  ['NEW_PROJECT_APARTMENT', 'sq_ft', '0', ''],
])('calculates project price per sq ft from super built-up area: %s %s %s', (subtype, areaUnit, area, expected) => {
  const previousAct = global.IS_REACT_ACT_ENVIRONMENT;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.createElement('div'));
  const dispatch = jest.fn();
  const form = fixture(subtype);
  form.propertyDetails.areaUnit = areaUnit;
  form.projectPricing = {
    startingPrice: '5600000', pricePerSqft: '26415',
    unitConfigurations: { bhk4p5_first: { ...unit, superBuildUpArea: area, carpetArea: '2120' } },
  };
  try {
    act(() => root.render(<ProjectDetailsStep formData={form} dispatch={dispatch} />));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      payload: { section: 'projectPricing', field: 'pricePerSqft', value: expected },
    }));
    dispatch.mockClear();
    form.basicInfo.subcategory = 'NEW_PROJECT_PLOT';
    act(() => root.render(<ProjectDetailsStep formData={form} dispatch={dispatch} />));
    expect(dispatch).not.toHaveBeenCalled();
  } finally {
    act(() => root.unmount());
    global.IS_REACT_ACT_ENVIRONMENT = previousAct;
  }
});

test.each(['1.5', '2.5', '3.5', '4.5'])('adds and preserves %s BHK with a whole-number bedroom count', bhk => {
  const previousAct = global.IS_REACT_ACT_ENVIRONMENT;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const previousCrypto = global.crypto;
  Object.defineProperty(global, 'crypto', { configurable: true, value: { randomUUID: () => 'testunit' } });
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
    act(() => { select.value = bhk; select.dispatchEvent(new Event('change', { bubbles: true })); });
    act(() => [...container.querySelectorAll('button')].find(button => button.textContent === 'Add Unit').click());
    const code = `bhk${bhk.replace('.', 'p')}_testunit`;
    expect(current.projectPricing.unitConfigurations[code].bedrooms).toBe(String(Math.floor(Number(bhk))));
    expect(container.querySelector(`#${code}-bedrooms`).value).toBe(String(Math.floor(Number(bhk))));
    expect(container.textContent).toContain(`${bhk} BHK`);
    expect(container.querySelectorAll('input[id$="-landArea"]')).toHaveLength(0);
    const form = { ...current, projectPricing: { ...current.projectPricing, unitConfigurations: { [code]: { ...unit, bedrooms: String(Math.floor(Number(bhk))) } } } };
    const payload = propertyWritePayload(form);
    expect(payload.projectPricing.unitConfigurations[code]).not.toHaveProperty('landArea');
    const reopened = initializePropertyFormState({ ...form, projectPricing: payload.projectPricing });
    expect(validateUnitConfiguration(reopened.projectPricing.unitConfigurations, true)).toEqual({});
    expect(getUnitBhk(code)).toBe(bhk);
    expect(getUnitBedrooms(code)).toBe(Math.floor(Number(bhk)));
  } finally {
    act(() => root.unmount());
    Object.defineProperty(global, 'crypto', { configurable: true, value: previousCrypto });
    global.IS_REACT_ACT_ENVIRONMENT = previousAct;
  }
});

test('apartment summary is derived from units for both backends, clearing obsolete land fields', () => {
  const form = fixture();
  form.propertyDetails = { ...form.propertyDetails, price: '999', area: '999', bedrooms: '9', plotArea: '777' };
  form.projectPricing.unitConfigurations.bhk3_expensive = { ...unit, price: '9000000', superBuildUpArea: '1500', bedrooms: '3' };
  expect(validateStep('details', form)).toEqual({});
  expect(validateStep('project_details', form)).toEqual({});
  const payload = propertyWritePayload(form);
  expect(payload).toMatchObject({ price: '6000000', area: '1000', bedrooms: '2', bathrooms: '2', plotArea: null });
  expect(payload.newProjectInfo).toMatchObject({ totalProjectArea: '5.5', totalProjectAreaUnit: 'acres' });
  expect(transformFormDataForSubmission(form, 'qa')).toMatchObject({ price: 6000000, area: 1000, plotArea: null });
  expect(payload.projectPricing.unitConfigurations.bhk2p5_first).not.toHaveProperty('landArea');
  form.projectPricing.startingPrice = '5500000';
  expect(propertyWritePayload(form).price).toBe('5500000');
  expect(areaInSquareFeet(100, 'sq_m')).toBeCloseTo(1076.391, 3);
});

test('apartment form and review omit land area; villa fields and resale/rental basic details remain', () => {
  const apartment = fixture();
  const projectHtml = renderToStaticMarkup(<ProjectDetailsStep formData={apartment} dispatch={() => {}} />);
  expect(projectHtml).toContain('Unit Area Unit');
  expect(projectHtml).toContain('value="acres"');
  expect(projectHtml).not.toContain('Land Area');
  const review = renderToStaticMarkup(<ReviewStep formData={apartment} onEdit={() => {}} />);
  expect(review).toContain('2.5 BHK');
  expect(review).not.toContain('Land Area');
  const villa = fixture('NEW_PROJECT_VILLA');
  expect(renderToStaticMarkup(<ProjectDetailsStep formData={villa} dispatch={() => {}} />)).toContain('Land Area');
  for (const subtype of ['NEW_PROJECT_VILLA', 'RESALE_FLAT', 'RENTAL_FLAT']) {
    const form = fixture(subtype);
    if (subtype === 'RENTAL_FLAT') form.basicInfo.propertyType = 'RENT';
    expect(renderToStaticMarkup(<PropertyDetailsStep formData={form} dispatch={() => {}} />)).toContain('Basic Property Details');
  }
  expect(renderToStaticMarkup(<PropertyDetailsStep formData={fixture('NEW_PROJECT_PLOT')} dispatch={() => {}} />)).toContain('value="acres"');
});

test('missing apartment units cannot pass submission after duplicate details are hidden', () => {
  const form = fixture();
  form.projectPricing.unitConfigurations = {};
  expect(validateStep('project_details', form)).toHaveProperty('unitConfigurations._form');
  expect(validateCompleteFormExpanded(form)).toHaveProperty('unitConfigurations._form');
  expect(validateUnitConfiguration({ bhk2p5_bad: { ...unit, bedrooms: '2.5' } }, true)).toHaveProperty('bhk2p5_bad.bedrooms');
  for (const code of ['bhk0p5_bad', 'bhk5p5_bad', 'bhk6_bad', 'bhk2.5_bad']) expect(UNIT_CODE_PATTERN.test(code)).toBe(false);
});
