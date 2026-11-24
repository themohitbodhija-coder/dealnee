import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { formatIndianNumberWords } from './propertyFormUtils';
import { validateBasicInfo } from '../validation/propertyValidation';
import { propertyWritePayload } from './propertyWritePayload';
import PriceWordBadge from '../components/common/PriceWordBadge';
import BasicInfoStep from '../components/admin/property-steps/BasicInfoStep';

describe('formatIndianNumberWords', () => {
  test('formats numbers into Indian currency count words accurately', () => {
    // User requested example: 32 crore 89 lakh
    expect(formatIndianNumberWords(328900000)).toBe('32 Crore 89 Lakh');
    expect(formatIndianNumberWords('328900000')).toBe('32 Crore 89 Lakh');
    expect(formatIndianNumberWords('32,89,00,000')).toBe('32 Crore 89 Lakh');

    expect(formatIndianNumberWords(5000000)).toBe('50 Lakh');
    expect(formatIndianNumberWords(125000)).toBe('1 Lakh 25 Thousand');
    expect(formatIndianNumberWords(75000)).toBe('75 Thousand');
    expect(formatIndianNumberWords(1500)).toBe('1 Thousand 5 Hundred');
    expect(formatIndianNumberWords(500)).toBe('5 Hundred');
    expect(formatIndianNumberWords(45)).toBe('45');
    expect(formatIndianNumberWords(328954320)).toBe('32 Crore 89 Lakh 54 Thousand 3 Hundred 20');
  });

  test('returns empty string for zero, negative or invalid inputs', () => {
    expect(formatIndianNumberWords(0)).toBe('');
    expect(formatIndianNumberWords(-500)).toBe('');
    expect(formatIndianNumberWords('')).toBe('');
    expect(formatIndianNumberWords(null)).toBe('');
    expect(formatIndianNumberWords(undefined)).toBe('');
    expect(formatIndianNumberWords('abc')).toBe('');
  });
});

describe('New Project Apartment Title Removal', () => {
  test('validateBasicInfo does not require title for NEW_PROJECT_APARTMENT', () => {
    const apartmentData = {
      propertyId: 'DEL-NP-001',
      propertyType: 'BUY',
      category: 'NEW_PROJECT',
      subcategory: 'NEW_PROJECT_APARTMENT',
      title: '',
      description: 'A great apartment project with multiple units.',
    };

    const errors = validateBasicInfo(apartmentData);
    expect(errors.title).toBeUndefined();
    expect(errors.propertyId).toBeUndefined();
  });

  test('validateBasicInfo requires title for non-apartment subcategories', () => {
    const resaleData = {
      propertyId: 'DEL-RES-001',
      propertyType: 'BUY',
      category: 'RESALE',
      subcategory: 'RESALE_APARTMENT',
      title: '',
      description: 'A great resale apartment property description.',
    };

    const errors = validateBasicInfo(resaleData);
    expect(errors.title).toBe('Title must be at least 3 characters');
  });

  test('propertyWritePayload sets title from newProjectInfo.projectName for NEW_PROJECT_APARTMENT', () => {
    const form = {
      basicInfo: {
        propertyType: 'BUY',
        category: 'NEW_PROJECT',
        subcategory: 'NEW_PROJECT_APARTMENT',
        title: '',
        description: 'New luxury project apartment with amenities',
      },
      newProjectInfo: {
        projectName: 'Prestige Lakeside Habitat',
        builderName: 'Prestige Group',
        totalUnits: '500',
      },
      propertyDetails: {
        area: '1500',
        price: '8500000',
      },
      location: {
        address: 'Whitefield',
        city: 'Bhubaneswar',
      },
      contact: {
        phone: '9776631999',
      },
    };

    const payload = propertyWritePayload(form);
    expect(payload.title).toBe('Prestige Lakeside Habitat');
  });

  test('BasicInfoStep does not render Property Title input when NEW_PROJECT_APARTMENT is selected', () => {
    const formData = {
      basicInfo: {
        propertyType: 'BUY',
        category: 'NEW_PROJECT',
        subcategory: 'NEW_PROJECT_APARTMENT',
        propertyId: 'DEL-NP-001',
        title: '',
        description: '',
      },
    };

    const html = renderToStaticMarkup(
      <BasicInfoStep
        formData={formData}
        dispatch={jest.fn()}
        errors={{}}
      />
    );

    expect(html).not.toContain('Property Title');
    expect(html).not.toContain('Modern 3 BHK Apartment');
  });

  test('BasicInfoStep renders Property Title input when other subcategories are selected', () => {
    const formData = {
      basicInfo: {
        propertyType: 'BUY',
        category: 'RESALE',
        subcategory: 'RESALE_APARTMENT',
        propertyId: 'DEL-RES-001',
        title: '',
        description: '',
      },
    };

    const html = renderToStaticMarkup(
      <BasicInfoStep
        formData={formData}
        dispatch={jest.fn()}
        errors={{}}
      />
    );

    expect(html).toContain('Property Title');
  });
});

describe('PriceWordBadge', () => {
  test('renders Indian word count badge when price is provided', () => {
    const html = renderToStaticMarkup(<PriceWordBadge value="328900000" />);
    expect(html).toContain('32 Crore 89 Lakh');
    expect(html).toContain('₹');
  });

  test('renders nothing when value is empty or zero', () => {
    const html = renderToStaticMarkup(<PriceWordBadge value="" />);
    expect(html).toBe('');
    expect(renderToStaticMarkup(<PriceWordBadge value={0} />)).toBe('');
  });
});
