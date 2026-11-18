import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import AddPropertyPage from './AddPropertyPage';
import { propertyService } from '../../services/api';
import { INITIAL_FORM_STATE } from '../../reducers/propertyFormReducer';
import { saveFormToLocalStorage } from '../../utils/propertyFormUtils';

jest.mock('../../services/api', () => ({ propertyService: { create: jest.fn(), update: jest.fn() } }));
jest.mock('../../lib/backend', () => ({ usesSupabase: true }));
jest.mock('../../services/photoService', () => ({
  ...jest.requireActual('../../services/photoService'),
  createPhotoSession: () => '77000000-0000-4000-8000-000000000001',
}));
jest.mock('./property-steps/LocationStep', () => () => null);
jest.mock('./property-steps/ContactStep', () => () => null);
jest.mock('./property-steps/PropertyDetailsStep', () => () => null);
jest.mock('./property-steps/ProjectDetailsStep', () => () => null);
jest.mock('./property-steps/ImagesStep', () => {
  const { createAddImageAction } = jest.requireActual('../../reducers/propertyFormReducer');
  return ({ dispatch }) => (
    <button onClick={() => dispatch(createAddImageAction([{
      uploadId: '76000000-0000-4000-8000-000000000001',
      uploadState: 'validated',
      name: 'photo.jpg',
    }]))}>Add test photo</button>
  );
});
jest.mock('./property-steps/ReviewStep', () => () => null);

test('shows server validation beside Submit in Strict Mode and links to the affected step', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const originalScroll = HTMLElement.prototype.scrollIntoView;
  HTMLElement.prototype.scrollIntoView = jest.fn();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  propertyService.update.mockRejectedValue({ response: { status: 400, data: {
    message: 'Review the details below before saving.',
    fieldErrors: { 'location.address': 'Enter the full street address.', 'contact.phone': 'Enter a valid contact number.' },
  } } });
  const click = async label => {
    const button = [...container.querySelectorAll('button')].find(item => item.textContent.trim() === label);
    expect(button).toBeDefined();
    await act(async () => button.click());
  };
  try {
    await act(async () => root.render(
      <React.StrictMode>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AddPropertyPage editingProperty={{ _id: 'property-id', version: 1, title: 'Sample property', propertyType: 'BUY', category: 'RESALE' }} />
        </MemoryRouter>
      </React.StrictMode>
    ));
    expect([...container.querySelector('#property-subcategory').options].map(option => option.value)).toEqual([
      '', 'RESALE_FLAT', 'RESALE_VILLA', 'RESALE_PLOT',
    ]);
    for (let step = 0; step < 5; step += 1) await click('Next →');
    await click('Submit Property');
    expect(propertyService.update).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]').textContent).toContain('Choose a subtype for this resale property.');
    await click('Edit Basic Info');
    const subtype = container.querySelector('#property-subcategory');
    await act(async () => {
      subtype.value = 'RESALE_FLAT';
      subtype.dispatchEvent(new Event('change', { bubbles: true }));
    });
    for (let step = 0; step < 5; step += 1) await click('Next →');
    await click('Submit Property');
    expect(propertyService.update).toHaveBeenCalledTimes(1);
    expect(propertyService.update).toHaveBeenCalledWith('property-id', expect.objectContaining({
      property: expect.objectContaining({ category: 'RESALE', subcategory: 'RESALE_FLAT' }),
    }));
    const alerts = container.querySelectorAll('[role="alert"]');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].textContent).toContain('Enter the full street address.');
    expect(alerts[0].textContent).toContain('Enter a valid contact number.');
    expect(document.activeElement).toBe(alerts[0]);
    await click('Edit Location');
    expect(container.querySelector('h2').textContent).toBe('Location');
  } finally {
    act(() => root.unmount());
    container.remove();
    HTMLElement.prototype.scrollIntoView = originalScroll;
  }
});

describe('Supabase rental subtypes', () => {
  const subtypeError = 'Choose a subtype for this rental property.';
  let container;
  let root;
  let originalScroll;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    global.IS_REACT_ACT_ENVIRONMENT = true;
    originalScroll = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = jest.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    HTMLElement.prototype.scrollIntoView = originalScroll;
    localStorage.clear();
  });

  const render = editingProperty => act(async () => root.render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AddPropertyPage editingProperty={editingProperty} />
    </MemoryRouter>
  ));

  const click = async label => {
    const button = [...container.querySelectorAll('button')].find(item => item.textContent.trim() === label);
    expect(button).toBeDefined();
    await act(async () => button.click());
  };

  const select = (input, value) => act(async () => {
    input.value = value;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  const subtypeInput = () => container.querySelector('#property-subcategory');

  test('selecting Rent exposes all rental subtypes and requires a selection before Next', async () => {
    await render();
    await select(container.querySelector('select'), 'RENT');
    await select(container.querySelectorAll('select')[1], 'RENT');
    expect([...subtypeInput().options].map(option => [option.value, option.textContent])).toEqual([
      ['', 'Select Subcategory'],
      ['RENTAL_FLAT', 'Flat'],
      ['RENTAL_VILLA', 'Villa/Duplex'],
      ['RENTAL_INDIVIDUAL_FLOOR', 'Individual Floor'],
    ]);
    expect(subtypeInput().value).toBe('');
    await click('Next →');
    expect(subtypeInput().getAttribute('aria-invalid')).toBe('true');
    expect(container.querySelector('#property-subcategory-error').textContent).toBe(subtypeError);
    expect(propertyService.create).not.toHaveBeenCalled();

    await select(subtypeInput(), 'RENTAL_FLAT');
    await click('Next →');
    expect(container.querySelector('h2').textContent).toBe('Location');
  });

  test.each([
    ['', 'RENTAL_FLAT'],
    ['RESALE_VILLA', 'RENTAL_VILLA'],
    ['', 'RENTAL_INDIVIDUAL_FLOOR'],
  ])('submits a restored draft with subtype %j after choosing %s', async (savedSubtype, selectedSubtype) => {
    const title = 'Rental draft';
    const address = 'Example street';
    const createSessionId = '77000000-0000-4000-8000-000000000001';
    saveFormToLocalStorage({
      ...INITIAL_FORM_STATE,
      createSessionId,
      basicInfo: {
        ...INITIAL_FORM_STATE.basicInfo,
        title,
        description: 'Description from the draft',
        propertyType: 'RENT',
        category: 'RENT',
        subcategory: savedSubtype,
      },
      location: { ...INITIAL_FORM_STATE.location, address, city: 'Bhubaneswar', state: 'Odisha' },
      propertyDetails: { ...INITIAL_FORM_STATE.propertyDetails, area: '1200', bedrooms: '2' },
      rentalInfo: { ...INITIAL_FORM_STATE.rentalInfo, monthlyRent: '18000', securityDeposit: '36000' },
    });
    propertyService.create.mockRejectedValue({ response: { status: 503, data: { message: 'Test response' } } });
    await render();
    await click('Next →');
    expect(container.querySelector('#property-subcategory-error').textContent).toBe(subtypeError);
    expect(propertyService.create).not.toHaveBeenCalled();

    await select(subtypeInput(), selectedSubtype);
    for (let step = 0; step < 4; step += 1) await click('Next →');
    await click('Add test photo');
    await click('Next →');
    await click('Submit Property');
    expect(propertyService.create).toHaveBeenCalledTimes(1);
    expect(propertyService.create).toHaveBeenCalledWith(expect.objectContaining({
      createSessionId,
      property: expect.objectContaining({
        title,
        propertyType: 'RENT',
        category: 'RENT',
        subcategory: selectedSubtype,
        price: '18000',
        location: expect.objectContaining({ address }),
        rentalInfo: expect.objectContaining({ securityDeposit: '36000' }),
      }),
    }));
  });

  test('requires a valid subtype when editing a rental listing', async () => {
    propertyService.update.mockRejectedValue({ response: { status: 503, data: { message: 'Test response' } } });
    await render({
      _id: 'rental-id', version: 1, title: 'Rental property',
      propertyType: 'RENT', category: 'RENT', subcategory: 'RESALE_FLAT',
    });
    await click('Next →');
    expect(container.querySelector('#property-subcategory-error').textContent).toBe(subtypeError);
    expect(propertyService.update).not.toHaveBeenCalled();

    await select(subtypeInput(), 'RENTAL_VILLA');
    for (let step = 0; step < 5; step += 1) await click('Next →');
    await click('Submit Property');
    expect(propertyService.update).toHaveBeenCalledWith('rental-id', expect.objectContaining({
      property: expect.objectContaining({ category: 'RENT', subcategory: 'RENTAL_VILLA' }),
    }));
  });
});
