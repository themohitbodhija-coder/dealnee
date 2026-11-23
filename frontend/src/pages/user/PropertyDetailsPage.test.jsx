import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PropertyDetailsPage from './PropertyDetailsPage';
import { propertyService } from '../../services/api';

jest.mock('../../services/api', () => ({ propertyService: { getById: jest.fn() } }));

test.each(['NEW_PROJECT_APARTMENT', 'NEW_PROJECT_VILLA'])('shows half BHK and project acreage with subtype-specific land fields for %s', async subcategory => {
  const previous = global.IS_REACT_ACT_ENVIRONMENT;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  propertyService.getById.mockResolvedValue({ data: { property: {
    _id: 'project', title: 'Test project', propertyType: 'BUY', subcategory, price: '6000000', area: '1000', areaUnit: 'sq_ft',
    newProjectInfo: { projectName: 'Test project', totalProjectArea: '5.5', totalProjectAreaUnit: 'acres' },
    projectPricing: { unitConfigurations: { bhk2p5_first: { bedrooms: 2, bathrooms: 2, superBuildUpArea: '1000', carpetArea: '800', price: '6000000', landArea: '1500' } } },
  } } });
  try {
    await act(async () => root.render(
      <MemoryRouter initialEntries={['/property/project']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes><Route path="/property/:id" element={<PropertyDetailsPage />} /></Routes>
      </MemoryRouter>
    ));
    expect(container.textContent).toContain('Unit 1 · 2.5 BHK');
    expect(container.textContent).toContain('5.5 acres');
    expect(container.textContent.includes('Land Area:')).toBe(subcategory === 'NEW_PROJECT_VILLA');
  } finally {
    act(() => root.unmount());
    global.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});

test.each([
  ['Supabase', { propertyDetails: { roadWidth: '42.5', facing: 'NORTH' } }, '42.5 ft'],
  ['Express', { location: { roadWidth: 26 } }, '26 ft'],
  ['blank width', {}, null],
])('displays the listing road width and independent electrification for %s', async (_, details, width) => {
  const previousActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  propertyService.getById.mockResolvedValue({ data: { property: {
    _id: 'plot', title: 'Resale plot', propertyType: 'BUY', subcategory: 'RESALE_PLOT', area: 1200,
    areaUnit: 'sq_ft', price: 3000000, facilities: ['electrification'], bedrooms: 3, bathrooms: 2,
    resaleInfo: { pricePerSqft: 2500, frontageWidth: 25, floorNumber: 3, furnishingStatus: 'FURNISHED' },
    furnishingItems: ['ac'], ...details,
  } } });
  try {
    await act(async () => root.render(
      <MemoryRouter initialEntries={['/property/plot']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes><Route path="/property/:id" element={<PropertyDetailsPage />} /></Routes>
      </MemoryRouter>
    ));
    expect(container.querySelector('[aria-label="Key property facts"]').textContent).toContain('1,200 sq ftPlot area');
    expect(container.textContent).toContain('₹30,00,000');
    expect(container.textContent).toContain('Frontage (ft)');
    expect(container.textContent).toContain('Electrification');
    expect(container.textContent).not.toMatch(/Floor Number|Furnishing|Bedrooms|Bathrooms/);
    if (width) expect(container.textContent).toContain(`Facing Road Width: ${width}`);
    else expect(container.textContent).not.toContain('Facing Road Width');
  } finally {
    await act(async () => root.unmount());
    global.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  }
});

test('formats project facts, changes gallery images without opening the lightbox, and links enquiries to WhatsApp', async () => {
  const previous = global.IS_REACT_ACT_ENVIRONMENT;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const originalShow = HTMLDialogElement.prototype.showModal;
  const originalClose = HTMLDialogElement.prototype.close;
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
  const container = document.createElement('div');
  const root = createRoot(container);
  propertyService.getById.mockResolvedValue({ data: { property: {
    title: 'DN Kings Land', propertyType: 'BUY', subcategory: 'NEW_PROJECT_APARTMENT',
    price: 56000000, area: '4070.0000', areaUnit: 'sq_ft', images: ['/one.jpg', '/two.jpg', '/three.jpg'],
    amenities: ['swimming_pool'], newProjectInfo: { projectStatus: 'UNDER_CONSTRUCTION' },
    projectPricing: { unitConfigurations: { bhk4p5: { bedrooms: 4, bathrooms: 4, superBuildUpArea: '4070.0000', carpetArea: '2120.0000' } } },
    contact: { phone: '+91 99999 99999' },
  } } });
  try {
    await act(async () => root.render(
      <MemoryRouter initialEntries={['/property/project']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes><Route path="/property/:id" element={<PropertyDetailsPage />} /></Routes>
      </MemoryRouter>
    ));
    const facts = container.querySelector('[aria-label="Key property facts"]');
    expect(facts.textContent).toContain('4.5 BHK');
    expect(facts.textContent).toContain('4,070 sq ftSuper built-up area');
    expect(container.textContent).toContain('₹5.60 Cr');
    expect(container.textContent).toContain('Under Construction');
    expect(container.textContent).not.toMatch(/4070\.0000|UNDER_CONSTRUCTION|swimming_pool/);
    expect(container.querySelector('.property-mobile-contact a').getAttribute('href')).toBe('tel:+919999999999');
    act(() => container.querySelector('[aria-label="Next photo"]').click());
    expect(container.querySelector('.property-gallery-main img').getAttribute('src')).toContain('/two.jpg');
    expect(container.querySelector('.property-photo-position').textContent).toBe('2 / 3');
    expect(container.querySelector('.property-page > .fixed')).toBeNull();
    const enquiries = container.querySelectorAll('a[href^="https://wa.me/"]');
    expect(enquiries).toHaveLength(3);
    enquiries.forEach(link => {
      const url = new URL(link.href);
      expect(url.pathname).toBe('/919776631999');
      expect(url.searchParams.get('text')).toBe(`Hi Dealinee Estate, I would like to enquire about DN Kings Land.\n${window.location.origin}/property/project`);
      expect(link.target).toBe('_blank');
    });
    expect(container.querySelector('dialog')).toBeNull();
    expect(container.querySelector('form[aria-label="Inquiry form"]')).toBeNull();
  } finally {
    act(() => root.unmount());
    HTMLDialogElement.prototype.showModal = originalShow;
    HTMLDialogElement.prototype.close = originalClose;
    global.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});
