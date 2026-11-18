/* eslint-env es2020 */
import { BUY_SUBCATEGORIES, FACILITIES, FACING_DIRECTION_DISPLAY, PROPERTY_TYPES } from '../constants/propertyConstants';

export const isResidentialPlot = (propertyType, subcategory) =>
  propertyType === PROPERTY_TYPES.BUY &&
  (subcategory === BUY_SUBCATEGORIES.NEW_PROJECT_PLOT || subcategory === BUY_SUBCATEGORIES.RESALE_PLOT);

export const PLOT_DIMENSIONS = [
  ['plotLength', 'Length (ft)'],
  ['plotWidth', 'Width (ft)'],
];

export const RESALE_PLOT_DIMENSIONS = [...PLOT_DIMENSIONS, ['frontageWidth', 'Frontage (ft)']];
export const ELECTRIFICATION = { id: 'electrification', label: 'Electrification' };
export const PLOT_FACILITIES = [...FACILITIES, ELECTRIFICATION];

const buildingAmenities = new Set([
  'balcony', 'modular_kitchen', 'air_conditioning', 'elevator', 'lift', 'washroom', 'pantry', 'central_ac',
  'double_height_luxury_lobby', 'residents_lounge', 'sky_lounge', 'rooftop_cafe', 'sky_gym',
  'rooftop_sky_garden', 'smart_home_automation', 'video_door_phone', 'high_speed_elevators', 'guest_suites',
]);

export const isPlotAmenity = id => !buildingAmenities.has(id);
export const isPlotOutdoorFeature = id => id !== 'terrace';
export const isPositivePlotNumber = value =>
  /^\d{1,10}(?:\.\d{1,4})?$/.test(String(value ?? '').trim()) && Number(value) > 0;

export function calculateResalePlotPrice(area, rate) {
  if (!isPositivePlotNumber(area) || !isPositivePlotNumber(rate)) return '';

  // Multiply fixed-point values so half-paise amounts round consistently with PostgreSQL.
  const scaled = value => {
    const [whole, fraction = ''] = String(value).trim().split('.');
    return BigInt(whole + fraction.padEnd(4, '0'));
  };
  const cents = (scaled(area) * scaled(rate) + BigInt(500000)) / BigInt(1000000);
  const digits = cents.toString().padStart(3, '0');
  return digits.slice(0, -2) + '.' + digits.slice(-2);
}

export const getPlotFacingLabel = direction => FACING_DIRECTION_DISPLAY[direction] ?? direction;

const squareFeetPerUnit = { sq_ft: 1, sq_m: 10.7639104167, sq_yards: 9, acres: 43560 };

export function getResalePlotAreaInSquareFeet(property) {
  const factor = squareFeetPerUnit[property.areaUnit] ?? 1;
  if (!Number.isFinite(Number(property.area)) || Number(property.area) <= 0) return '';
  return Number((Number(property.area) * factor).toFixed(4));
}

export function getPlotResaleInfo(info = {}) {
  const { approval, reraNumber, ownershipType, pricePerSqft, plotLength, plotWidth, frontageWidth } = info;
  return { approval, reraNumber, ownershipType, pricePerSqft, plotLength, plotWidth, frontageWidth };
}
