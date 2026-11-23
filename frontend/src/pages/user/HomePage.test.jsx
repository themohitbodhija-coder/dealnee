import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './HomePage';
import { propertyService } from '../../services/api';

jest.mock('../../services/api', () => ({ propertyService: { getFeatured: jest.fn() } }));
let container, root, previousActEnvironment;
const listing = {
  _id: 'listing-1', title: 'DN Kings Land', propertyType: 'BUY', subcategory: 'NEW_PROJECT_APARTMENT',
  price: '56000000', area: '4070.0000', areaUnit: 'sq_ft', location: { city: 'Bhubaneswar' },
  projectPricing: { unitConfigurations: { bhk4p5: { bedrooms: 4, bathrooms: 4 } } },
};
function Results() {
  const location = useLocation();
  return <p data-testid="destination">{location.pathname}{location.search}</p>;
}
beforeEach(() => {
  previousActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  jest.clearAllMocks();
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  propertyService.getFeatured.mockResolvedValue({ data: { properties: [listing] } });
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
  global.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});
async function render() {
  await act(async () => root.render(<MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/" element={<HomePage />} /><Route path="/properties" element={<Results />} /></Routes></MemoryRouter>));
}
function change(selector, value) {
  act(() => {
    const input = container.querySelector(selector);
    const prototype = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}
function submit() {
  act(() => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  return new URL(container.querySelector('[data-testid="destination"]').textContent, 'https://example.test').searchParams;
}
test('home search passes trimmed location, property category and budget to existing listing filters', async () => {
  await render();
  change('[name="location"]', '  Bhubaneswar  ');
  change('[name="category"]', 'apartment');
  change('[name="budget"]', '5000000-10000000');
  const params = submit();
  expect(Object.fromEntries(params)).toEqual({ type: 'buy', location: 'Bhubaneswar', subtype: 'newprojects', category: 'apartment', minPrice: '5000000', maxPrice: '10000000' });
});
test('switching to rent clears purchase filters and uses monthly rental budgets', async () => {
  await render();
  change('[name="category"]', 'villa');
  change('[name="budget"]', '20000000+');
  act(() => container.querySelector('[name="transaction"][value="rent"]').click());
  expect(container.querySelector('[name="category"]')).toBeNull();
  expect(container.querySelector('[name="budget"]').value).toBe('');
  change('[name="budget"]', '50000+');
  expect(Object.fromEntries(submit())).toEqual({ type: 'rent', minPrice: '50000' });
});
test('deduplicates listings, renders a spotlight with readable facts and preserves all seven services', async () => {
  propertyService.getFeatured.mockResolvedValue({ data: { properties: [listing, listing] } });
  await render();
  expect(container.querySelectorAll('.home-property-card')).toHaveLength(1);
  const card = container.querySelector('.home-property-spotlight');
  expect(card.querySelector('a').getAttribute('href')).toBe('/property/listing-1');
  expect(card.textContent).toContain('₹5.60 Cr');
  expect(card.textContent).toContain('4.5 BHK');
  expect(card.textContent).toContain('4,070 sq ft');
  expect(container.querySelectorAll('.home-service')).toHaveLength(7);
  expect(container.textContent).toContain('Property Management Services');
  expect(container.textContent).not.toContain('100K+');
});
test('failed featured request can be retried and empty inventory has a useful browse action', async () => {
  propertyService.getFeatured.mockRejectedValueOnce(new Error('Offline'));
  await render();
  expect(container.querySelector('[role="alert"]').textContent).toContain('couldn’t load');
  propertyService.getFeatured.mockResolvedValueOnce({ data: { properties: [] } });
  await act(async () => container.querySelector('[role="alert"] button').click());
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.querySelector('.home-featured-message a').getAttribute('href')).toBe('/properties');
});


test('property photos rotate every three seconds, pause during interaction, and honor the pause control', async () => {
  jest.useFakeTimers();
  propertyService.getFeatured.mockResolvedValue({ data: { properties: [{ ...listing, images: ['/one.jpg', '/two.jpg', '/three.jpg'] }] } });
  try {
    await render();
    const active = () => container.querySelector('.home-rotating-photo.is-active').getAttribute('src');
    expect(active()).toContain('/one.jpg');
    act(() => jest.advanceTimersByTime(3000));
    expect(active()).toContain('/two.jpg');
    act(() => container.querySelector('.home-photo-pause').click());
    act(() => jest.advanceTimersByTime(6000));
    expect(active()).toContain('/two.jpg');
    act(() => container.querySelector('.home-photo-pause').click());
    act(() => jest.advanceTimersByTime(3000));
    expect(active()).toContain('/three.jpg');
    act(() => container.querySelector('.home-property-card').dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
    act(() => jest.advanceTimersByTime(3000));
    expect(active()).toContain('/three.jpg');
  } finally { jest.useRealTimers(); }
});


test('hero keeps cycling through the existing videos, including the case-sensitive third filename', async () => {
  await render();
  const video = container.querySelector('video');
  expect(video.getAttribute('src')).toBe('/images/Hero_video1.mp4');
  act(() => video.dispatchEvent(new Event('ended', { bubbles: true })));
  expect(video.getAttribute('src')).toBe('/images/Hero_video2.mp4');
  act(() => video.dispatchEvent(new Event('ended', { bubbles: true })));
  expect(video.getAttribute('src')).toBe('/images/hero_video3.mp4');
  act(() => video.dispatchEvent(new Event('ended', { bubbles: true })));
  expect(video.getAttribute('src')).toBe('/images/Hero_video1.mp4');
  act(() => container.querySelector('[aria-label="Pause hero video"]').click());
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
});
