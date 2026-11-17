import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import AddPropertyPage from './AddPropertyPage';
import { propertyService } from '../../services/api';

jest.mock('../../services/api', () => ({ propertyService: { update: jest.fn() } }));
jest.mock('../../lib/backend', () => ({ usesSupabase: true }));
jest.mock('./property-steps/LocationStep', () => () => null);
jest.mock('./property-steps/ContactStep', () => () => null);
jest.mock('./property-steps/PropertyDetailsStep', () => () => null);
jest.mock('./property-steps/ProjectDetailsStep', () => () => null);
jest.mock('./property-steps/ImagesStep', () => () => null);
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
