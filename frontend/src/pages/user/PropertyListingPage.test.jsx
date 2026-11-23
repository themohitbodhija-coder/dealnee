import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import PropertyListingPage from './PropertyListingPage';
import { propertyService } from '../../services/api';

jest.mock('../../services/api', () => ({ propertyService: { getAll: jest.fn() } }));
jest.mock('../../components/user/PropertyCard', () => ({ property }) => <article data-testid="listing">{property.title}</article>);
let root, container, previous;
function Navigation() {
  const navigate = useNavigate();
  return <><button data-testid="back" onClick={() => navigate(-1)}>Back</button><output data-testid="url">{useLocation().search}</output></>;
}
beforeEach(() => {
  previous = global.IS_REACT_ACT_ENVIRONMENT;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  propertyService.getAll.mockResolvedValue({ data: { properties: [], total: 0, pages: 0 } });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); global.IS_REACT_ACT_ENVIRONMENT = previous; });
async function render(url = '/properties') {
  await act(async () => root.render(<MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Navigation /><Routes><Route path="/properties" element={<PropertyListingPage />} /></Routes></MemoryRouter>));
}
function groupButton(group, label) {
  return [...container.querySelector(`[aria-label="${group}"]`).querySelectorAll('button')].find(button => button.textContent === label);
}
async function click(button) { await act(async () => button.click()); }
function lastQuery() { return propertyService.getAll.mock.calls.at(-1)[0]; }
function fill(name, value) {
  act(() => { const input = container.querySelector(`[name="${name}"]`); const prototype = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value); input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); });
}
async function apply() { await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); }

test('loads all properties first and progressively reveals buying filters on the listing page', async () => {
  await render();
  expect(lastQuery()).toEqual({ page: 1, limit: 12 });
  expect(container.querySelector('[aria-label="Buying options"]')).toBeNull();
  await click(groupButton('Listing type', 'Buy'));
  expect(lastQuery()).toEqual({ page: 1, limit: 12, type: 'buy' });
  expect(container.querySelector('[aria-label="Residential property type"]')).toBeNull();
  await click(groupButton('Buying options', 'New projects'));
  await click(groupButton('Residential property type', 'Apartments'));
  expect(lastQuery()).toEqual({ page: 1, limit: 12, type: 'buy', subtype: 'NEW_PROJECT_APARTMENT' });
  await click(groupButton('Buying options', 'Resale'));
  expect(groupButton('Residential property type', 'All types').getAttribute('aria-pressed')).toBe('true');
  await click(groupButton('Residential property type', 'Villas'));
  expect(lastQuery().subtype).toBe('RESALE_VILLA');
});

test('rental and commercial tabs reveal their own property shapes and clear incompatible choices', async () => {
  await render('/properties?type=buy&subtype=newprojects&category=apartment&bedrooms=4&minPrice=5000000&page=4');
  expect(lastQuery()).toMatchObject({ page: 4, bedrooms: '4', minPrice: '5000000' });
  await click(groupButton('Listing type', 'Rent'));
  expect(lastQuery()).toEqual({ page: 1, limit: 12, type: 'rent' });
  expect(container.querySelector('[name="minPrice"]').value).toBe('');
  await click(groupButton('Rental property type', 'Flats'));
  expect(lastQuery().subtype).toBe('RENTAL_FLAT');
  await click(groupButton('Listing type', 'Commercial'));
  await click(groupButton('Commercial options', 'Lease'));
  await click(groupButton('Commercial space type', 'Offices'));
  expect(lastQuery()).toEqual({ page: 1, limit: 12, type: 'commercial', subtype: 'COMMERCIAL_OFFICE_LEASE' });
  expect(container.querySelector('[name="bedrooms"]')).toBeNull();
});

test('applying filters updates the URL, reset shows all, and browser Back restores the previous search', async () => {
  await render();
  fill('location', '  Bhubaneswar  ');
  fill('minPrice', '5000000');
  expect(propertyService.getAll).toHaveBeenCalledTimes(1);
  await apply();
  expect(lastQuery()).toMatchObject({ location: 'Bhubaneswar', minPrice: '5000000' });
  expect(container.querySelector('[data-testid="url"]').textContent).toContain('location=Bhubaneswar');
  await click(container.querySelector('.listing-clear'));
  expect(lastQuery()).toEqual({ page: 1, limit: 12 });
  await click(container.querySelector('[data-testid="back"]'));
  expect(container.querySelector('[name="location"]').value).toBe('Bhubaneswar');
  expect(lastQuery()).toMatchObject({ location: 'Bhubaneswar', minPrice: '5000000' });
});

test('plot selection clears room filters and pagination resets when the buying category changes', async () => {
  propertyService.getAll.mockResolvedValue({ data: { properties: [{ _id: 'x', title: 'Home' }], total: 48, pages: 4 } });
  await render('/properties?type=buy&subtype=newprojects&category=apartment&bedrooms=4&page=4');
  await click(groupButton('Residential property type', 'Plots'));
  expect(lastQuery()).toEqual({ page: 1, limit: 12, type: 'buy', subtype: 'NEW_PROJECT_PLOT' });
  await click(container.querySelector('.listing-more'));
  expect(container.querySelector('[name="bedrooms"]')).toBeNull();
  await click(container.querySelector('[aria-label="Page 2"]'));
  expect(lastQuery().page).toBe(2);
  await click(groupButton('Buying options', 'Resale'));
  expect(lastQuery().page).toBe(1);
});

test('stale responses cannot overwrite a newer selection and reselecting the active tab cannot cancel loading', async () => {
  const pending = [];
  propertyService.getAll.mockImplementation(() => new Promise(resolve => pending.push(resolve)));
  await render();
  await click(groupButton('Listing type', 'All properties'));
  expect(propertyService.getAll).toHaveBeenCalledTimes(1);
  await click(groupButton('Listing type', 'Rent'));
  await click(groupButton('Listing type', 'Commercial'));
  await act(async () => pending[2]({ data: { properties: [{ _id: 'office', title: 'Office' }], total: 1, pages: 1 } }));
  await act(async () => pending[1]({ data: { properties: [{ _id: 'rent', title: 'Rental' }], total: 1, pages: 1 } }));
  await act(async () => pending[0]({ data: { properties: [], total: 0, pages: 0 } }));
  expect(container.querySelector('[data-testid="listing"]').textContent).toBe('Office');
  expect(container.querySelector('[aria-label="Property results"]').getAttribute('aria-busy')).toBe('false');
});
