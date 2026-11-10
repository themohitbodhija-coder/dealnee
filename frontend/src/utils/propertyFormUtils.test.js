import {
  getDefaultFurnishingItemsForStatus,
  getFurnishingItemDisplayLabels,
  getPropertyRoomStats,
  transformFormDataForSubmission,
} from './propertyFormUtils';
import { FURNISHING_STATUS } from '../constants/propertyConstants';
import { INITIAL_FORM_STATE, initializePropertyFormState } from '../reducers/propertyFormReducer';

describe('Commercial Buy form round trip', () => {
  it('submits commercial sale price, area, parking and furnishing to their persisted fields', () => {
    const form = {
      ...INITIAL_FORM_STATE,
      basicInfo: { propertyType: 'COMMERCIAL', category: 'BUY', subcategory: 'COMMERCIAL_OFFICE_SALE' },
      commercialDetails: { price: '9000000', builtUpArea: '1500', carpetArea: '1100', parkingAvailability: true, furnishingType: 'SEMI_FURNISHED', ceilingHeight: '12', suitableFor: ['office'] },
      propertyDetails: { ...INITIAL_FORM_STATE.propertyDetails, bathrooms: '2', amenities: ['security'] },
    };
    const payload = transformFormDataForSubmission(form, 'qa');
    expect(payload).toMatchObject({ price: 9000000, area: 1500, bathrooms: 2, amenities: ['security'] });
    expect(payload.commercialDetails).toMatchObject({ builtUpArea: 1500, carpetArea: 1100, parkingAvailability: true, furnishingType: 'SEMI_FURNISHED', ceilingHeight: 12 });
  });

  it('restores API sale data without resetting hidden commercial fields or amenities', () => {
    const form = initializePropertyFormState({
      ...INITIAL_FORM_STATE,
      basicInfo: { propertyType: 'COMMERCIAL', category: 'Commercial Buy', subcategory: 'COMMERCIAL_OFFICE_SALE' },
      propertyDetails: { price: 9000000, area: 1500, bathrooms: 2 },
      amenities: ['security'], facilities: ['park'],
      commercialDetails: { carpetArea: 1100, parkingAvailability: true, furnishingType: 'SEMI_FURNISHED', floorNumber: 0, businessAdvantages: 'Near transit' },
    });
    expect(form.basicInfo.category).toBe('BUY');
    expect(form.commercialDetails).toMatchObject({ price: 9000000, builtUpArea: 1500 });
    const payload = transformFormDataForSubmission(form, 'qa');
    expect(payload.amenities).toEqual(['security']);
    expect(payload.commercialDetails).toMatchObject({ floorNumber: 0, businessAdvantages: 'Near transit', parkingAvailability: true });
  });
});

describe('getDefaultFurnishingItemsForStatus', () => {
  it('returns all furnishing items for fully furnished properties', () => {
    const items = getDefaultFurnishingItemsForStatus(FURNISHING_STATUS.FULLY_FURNISHED);

    expect(items).toEqual(expect.arrayContaining([
      'ac',
      'modular_kitchen',
      'wardrobe',
      'sofa',
      'bed',
      'tv_unit',
      'geyser',
      'false_ceiling',
      'premium_lighting',
      'dining_area',
    ]));
    expect(items).toHaveLength(10);
  });

  it('returns a practical semi-furnished default set', () => {
    const items = getDefaultFurnishingItemsForStatus(FURNISHING_STATUS.SEMI_FURNISHED);

    expect(items).toEqual(expect.arrayContaining(['ac', 'modular_kitchen', 'wardrobe', 'bed', 'sofa', 'geyser']));
    expect(items).toHaveLength(6);
  });

  it('returns no items for unfurnished properties', () => {
    expect(getDefaultFurnishingItemsForStatus(FURNISHING_STATUS.UNFURNISHED)).toEqual([]);
    expect(getDefaultFurnishingItemsForStatus('UNKNOWN')).toEqual([]);
  });

  it('maps furnishing item ids to readable labels', () => {
    const labels = getFurnishingItemDisplayLabels(['ac', 'wardrobe', 'unknown']);

    expect(labels).toEqual(['AC', 'Wardrobe', 'unknown']);
  });

  it('includes furnishing items in the submission payload', () => {
    const payload = transformFormDataForSubmission({
      basicInfo: {},
      location: {},
      contact: {},
      propertyDetails: { furnishingItems: ['ac', 'wardrobe'] },
      images: [],
      resaleInfo: {},
      rentalInfo: {},
      commercialDetails: {},
      newProjectInfo: {},
      projectPricing: {},
    }, 'user-1');

    expect(payload.furnishingItems).toEqual(['ac', 'wardrobe']);
  });

  it('reads bedroom and bathroom counts from nested rental data when no top-level values exist', () => {
    const stats = getPropertyRoomStats({
      propertyId: 'DEL-REN-001',
      rentalInfo: { bedrooms: 2, bathrooms: 3 },
    });

    expect(stats).toEqual({ bedrooms: 2, bathrooms: 3 });
  });

  it('prefers the first positive room count over stale zero values', () => {
    const stats = getPropertyRoomStats({
      propertyId: 'DEL-REN-001',
      bedrooms: 0,
      bathrooms: 0,
      rentalInfo: { bedrooms: 6, bathrooms: 5 },
      propertyDetails: { bedrooms: 0, bathrooms: 0 },
    });

    expect(stats).toEqual({ bedrooms: 6, bathrooms: 5 });
  });

  it('preserves zero bedroom and bathroom values in submission payload', () => {
    const payload = transformFormDataForSubmission({
      basicInfo: { propertyType: 'RENT' },
      location: {},
      contact: {},
      propertyDetails: { area: 1200, areaUnit: 'sq_ft', bedrooms: 0, bathrooms: 0 },
      images: [],
      resaleInfo: {},
      rentalInfo: {},
      commercialDetails: {},
      newProjectInfo: {},
      projectPricing: {},
    }, 'user-1');

    expect(payload.bedrooms).toBe(0);
    expect(payload.bathrooms).toBe(0);
  });

  it('sends bathroom and bedroom counts into rentalInfo for admin updates', () => {
    const payload = transformFormDataForSubmission({
      basicInfo: { propertyType: 'RENT' },
      location: {},
      contact: {},
      propertyDetails: { area: 1200, areaUnit: 'sq_ft', bedrooms: 3, bathrooms: 5 },
      images: [],
      resaleInfo: {},
      rentalInfo: {},
      commercialDetails: {},
      newProjectInfo: {},
      projectPricing: {},
    }, 'user-1');

    expect(payload.bedrooms).toBe(3);
    expect(payload.bathrooms).toBe(5);
    expect(payload.rentalInfo).toMatchObject({ bedrooms: 3, bathrooms: 5 });
  });
});
