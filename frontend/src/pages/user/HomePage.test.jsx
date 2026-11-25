import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import HomePage from './HomePage';
import { propertyService } from '../../services/api';

jest.mock('../../services/api', () => ({ propertyService: { getFeatured: jest.fn() } }));
let container, root, previousActEnvironment;

const listing = {
  _id: 'listing-1',
  title: 'DN Kings Land',
  propertyType: 'BUY',
  subcategory: 'NEW_PROJECT_APARTMENT',
  price: '56000000',
  area: '4070.0000',
  areaUnit: 'sq_ft',
  location: { locality: 'Patia', city: 'Bhubaneswar' },
  images: ['/images/projects/dn-pallaciya.jpg'],
};

beforeEach(() => {
  previousActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  jest.clearAllMocks();
  propertyService.getFeatured.mockResolvedValue({ data: { properties: [listing] } });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
  global.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});

async function render() {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/properties" element={<p data-testid="properties-page">Properties</p>} />
        </Routes>
      </MemoryRouter>
    );
  });
}

test('renders hero with minimalist text, trust credentials, and no search form or tabs', async () => {
  await render();
  const hero = container.querySelector('.home-hero');
  expect(hero).not.toBeNull();
  expect(hero.textContent).toContain('Find a place.');
  expect(hero.textContent).toContain('Make it yours.');
  expect(hero.textContent).toContain('Discover homes, plots and business spaces in Bhubaneswar.');
  expect(hero.textContent).toContain('Certified Real Estate Advisor');
  expect(hero.textContent).toContain('ORA/0308/2025');
  expect(container.querySelector('form')).toBeNull();
  expect(container.querySelector('[name="location"]')).toBeNull();
  expect(container.querySelector('[name="transaction"]')).toBeNull();
});

test('renders our featured projects section with photo, name, area, and price', async () => {
  await render();
  const featuredHeading = container.querySelector('#home-featured-title');
  expect(featuredHeading.textContent).toContain('Our Featured');
  expect(featuredHeading.textContent).toContain('Projects');

  const exploreBtn = container.querySelector('.home-explore-projects-btn');
  expect(exploreBtn.getAttribute('href')).toBe('/properties');

  const cards = container.querySelectorAll('.home-project-card');
  expect(cards.length).toBeGreaterThan(0);

  const firstCard = cards[0];
  expect(firstCard.querySelector('.home-project-name').textContent).toBe('DN Kings Land');
  expect(firstCard.querySelector('.home-project-area').textContent).toBe('Patia, Bhubaneswar');
  expect(firstCard.querySelector('.home-project-price').textContent).toContain('₹5.60 Cr');
  expect(firstCard.querySelector('img')).not.toBeNull();
  expect(firstCard.querySelector('a').getAttribute('href')).toBe('/property/listing-1');
});

test('formats featured project location with locality and city without duplicates', async () => {
  propertyService.getFeatured.mockResolvedValue({
    data: {
      properties: [
        listing,
        { ...listing, _id: 'listing-2', location: { locality: '', city: 'Bhubaneswar' } },
        { ...listing, _id: 'listing-3', location: { locality: 'Bhubaneswar', city: 'bhubaneswar' } },
      ],
    },
  });
  await render();
  const areas = Array.from(container.querySelectorAll('.home-project-area')).map(el => el.textContent);
  expect(areas).toEqual(['Patia, Bhubaneswar', 'Bhubaneswar', 'Bhubaneswar']);
});

test('renders company stats section with count up numbers just above services', async () => {
  await render();
  const statsSection = container.querySelector('.home-stats-section');
  expect(statsSection).not.toBeNull();
  expect(statsSection.textContent).toContain('Years of experience');
  expect(statsSection.textContent).toContain('Hands-on knowledge of real estate');
  expect(statsSection.textContent).toContain('Team members');
  expect(statsSection.textContent).toContain('People dedicated to your next step');
  expect(statsSection.textContent).toContain('Happy customers');
  expect(statsSection.textContent).toContain('Relationships built through service');
});

test('deduplicates listings and preserves all seven services', async () => {
  propertyService.getFeatured.mockResolvedValue({ data: { properties: [listing, listing] } });
  await render();
  expect(container.querySelectorAll('.home-project-card')).toHaveLength(1);
  expect(container.querySelectorAll('.home-service')).toHaveLength(7);
  expect(container.textContent).toContain('Property Management Services');
});

test('renders founder section below featured developers', async () => {
  await render();
  const founderSection = container.querySelector('.home-founder');
  expect(founderSection).not.toBeNull();
  expect(founderSection.textContent).toContain('Chandan Kumar Sahoo');
  expect(founderSection.textContent).toContain('Founder');
  expect(founderSection.textContent).toContain('Experience that shapes every next step.');
  expect(founderSection.querySelector('img').getAttribute('src')).toBe('/images/founder.jpg');
});

test('falls back gracefully to showcase projects on error and allows retry', async () => {
  propertyService.getFeatured.mockRejectedValueOnce(new Error('Offline'));
  await render();
  expect(container.querySelector('[role="alert"]').textContent).toContain('couldn’t load');
  expect(container.querySelector('.home-featured-message button')).not.toBeNull();

  propertyService.getFeatured.mockResolvedValueOnce({ data: { properties: [] } });
  await act(async () => container.querySelector('[role="alert"] button').click());
  expect(container.querySelector('[role="alert"]')).toBeNull();
  // Empty inventory displays showcase projects from reference mockup
  expect(container.textContent).toContain('DN Pallaciya');
  expect(container.textContent).toContain('One World');
  expect(container.textContent).toContain('Urban Majestic');
  expect(container.textContent).toContain('ADPL Galaxy 3');
});
