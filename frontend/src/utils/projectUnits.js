export const BHK_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
export const UNIT_CODE_PATTERN = /^bhk([1-4](?:p5)?|5)(?:_[a-zA-Z0-9]{1,64})?$/;
export const isApartmentProject = subtype => subtype === 'NEW_PROJECT_APARTMENT';
export const getUnitBhk = code => UNIT_CODE_PATTERN.exec(code)?.[1].replace('p5', '.5') || '';
export const getUnitBedrooms = code => Math.floor(Number(getUnitBhk(code))) || '';
export const populatedUnits = units => Object.entries(units || {}).filter(([, unit]) =>
  unit && Object.values(unit).some(value => value !== '' && value != null));

export function apartmentUnits(units) {
  return Object.fromEntries(populatedUnits(units).map(([code, { landArea, ...unit }]) => [code, unit])
    .filter(([, unit]) => Object.values(unit).some(value => value !== '' && value != null)));
}

// Listing cards and filters use the cheapest configuration as their representative unit.
export function apartmentSummary(form) {
  const units = populatedUnits(form.projectPricing?.unitConfigurations)
    .map(([code, unit]) => ({ ...unit, bedrooms: unit.bedrooms || getUnitBedrooms(code) }))
    .filter(unit => Number(unit.price) > 0 && Number(unit.superBuildUpArea) > 0)
    .sort((a, b) => Number(a.price) - Number(b.price));
  const unit = units[0] || {};
  return {
    price: form.projectPricing?.startingPrice || unit.price || null,
    area: unit.superBuildUpArea || null,
    bedrooms: unit.bedrooms || 0,
    bathrooms: unit.bathrooms || 0,
    plotArea: null,
  };
}

export function areaInSquareFeet(area, unit = 'sq_ft') {
  return Number(area) * ({ sq_ft: 1, sq_m: 10.7639104167, sq_yards: 9, acres: 43560 }[unit] || 1);
}
