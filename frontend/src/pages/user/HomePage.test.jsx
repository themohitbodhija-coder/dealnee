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


test('property photos keep rotating during hover and focus without pause controls', async () => {
  jest.useFakeTimers();
  propertyService.getFeatured.mockResolvedValue({ data: { properties: [{ ...listing, images: ['/one.jpg', '/two.jpg', '/three.jpg'] }] } });
  try {
    await render();
    const active = () => container.querySelector('.home-rotating-photo.is-active').getAttribute('src');
    expect(active()).toContain('/one.jpg');
    act(() => jest.advanceTimersByTime(3000));
    expect(active()).toContain('/two.jpg');
    expect(container.querySelector('.home-photo-pause')).toBeNull();
    act(() => container.querySelector('.home-property-card').dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
    act(() => jest.advanceTimersByTime(3000));
    expect(active()).toContain('/three.jpg');
    act(() => container.querySelector('.home-property-photo-link').focus());
    act(() => jest.advanceTimersByTime(3000));
    expect(active()).toContain('/one.jpg');
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
  expect(video.autoplay).toBe(true);
  expect(video.muted).toBe(true);
  expect(video.playsInline).toBe(true);
  expect(video.controls).toBe(false);
  expect(container.querySelector('.home-video-control')).toBeNull();
  expect(container.querySelector('.home-motion-control')).toBeNull();
});

function mockMediaQueries(reducedMotion = false) {
  window.matchMedia = jest.fn(query => ({
    matches: query === '(prefers-reduced-motion: reduce)' && reducedMotion,
    addEventListener: jest.fn(), removeEventListener: jest.fn(),
  }));
}

test('hero autoplays on mobile, pauses while hidden, resumes and falls back on video error', async () => {
  const previous = window.matchMedia;
  mockMediaQueries();
  try {
    await render();
    const video = container.querySelector('video');
    expect(video.autoplay).toBe(true);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    const hidden = jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(container.querySelector('.home-page').style.getPropertyValue('--home-animation-state')).toBe('paused');
    hidden.mockReturnValue(false);
    HTMLMediaElement.prototype.play.mockClear();
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    act(() => video.dispatchEvent(new Event('error')));
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('.home-hero-visual > img').getAttribute('src')).toBe('/images/hero-2.jpg');
  } finally { window.matchMedia = previous; }
});

test('reduced-motion preferences stop video playback and photo rotation', async () => {
  const previous = window.matchMedia;
  mockMediaQueries(true);
  jest.useFakeTimers();
  propertyService.getFeatured.mockResolvedValue({ data: { properties: [{ ...listing, images: ['/one.jpg', '/two.jpg'] }] } });
  try {
    await render();
    expect(container.querySelector('video').autoplay).toBe(false);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(6000));
    expect(container.querySelector('.home-rotating-photo.is-active').getAttribute('src')).toContain('/one.jpg');
  } finally { window.matchMedia = previous; jest.useRealTimers(); }
});

test('homepage enquiries share the WhatsApp number and draft while property navigation remains local', async () => {
  await render();
  const enquiries = container.querySelectorAll('a[href^="https://wa.me/"]');
  expect(enquiries.length).toBe(12);
  enquiries.forEach(link => {
    const url = new URL(link.href);
    expect(url.pathname).toBe('/919776631999');
    expect(url.searchParams.get('text')).toContain('Hi Dealinee Estate');
    expect(link.target).toBe('_blank');
  });
  expect(container.querySelector('.home-property-photo-link').getAttribute('href')).toBe('/property/listing-1');
});
