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
    expect(container.textContent).toContain('Plot Area: 1200 sq ft');
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
