/**
 * Property ID Generator Utility
 * Generates unique property IDs based on category, subcategory, and timestamp
 */

/**
 * Get category abbreviation
 */
const getCategoryAbbr = (propertyType, category) => {
  const abbr = {
    // Buy
    'NEW_PROJECT': 'NP',
    'RESALE': 'RS',
    // Rent
    'RENT': 'REN',
    'RESIDENTIAL': 'RD',
    // Commercial (for COMMERCIAL property type)
    'BUY': 'CB',
    'LEASE': 'CL',
  };
  
  // Special handling for COMMERCIAL category based on property type
  // For RENT type: COMMERCIAL -> RC (rental commercial)
  // For COMMERCIAL property type: handled above as BUY->CB, LEASE->CL
  if (category === 'COMMERCIAL' && propertyType === 'RENT') {
    return 'RC';
  }
  
  return abbr[category] || 'XX';
};

/**
 * Get subcategory abbreviation
 */
const getSubcategoryAbbr = (subcategory) => {
  const abbr = {
    // Buy
    'NEW_PROJECT_APARTMENT': 'APT',
    'NEW_PROJECT_VILLA': 'VLA',
    'RESALE_FLAT': 'FLT',
    'RESALE_VILLA': 'VLA',
    'RESALE_PLOT': 'PLT',
    // Rent
    'RENTAL_FLAT': 'FLT',
    'RENTAL_VILLA': 'VLA',
    'RENTAL_INDIVIDUAL_FLOOR': 'FLR',
    // Commercial
    'COMMERCIAL_OFFICE_SALE': 'OFF',
    'COMMERCIAL_SHOP_SALE': 'SHP',
    'COMMERCIAL_SHOWROOM_SALE': 'SHR',
    'COMMERCIAL_LAND_SALE': 'LND',
    'COMMERCIAL_WAREHOUSE_SALE': 'WHS',
    'COMMERCIAL_INDUSTRIAL_SALE': 'IND',
    'COMMERCIAL_COWORKING_SALE': 'COW',
    'COMMERCIAL_OFFICE_LEASE': 'OFF',
    'COMMERCIAL_SHOP_LEASE': 'SHP',
    'COMMERCIAL_WAREHOUSE_LEASE': 'WHS',
  };
  return abbr[subcategory] || 'GEN';
};

/**
 * Get property type abbreviation
 */
const getPropertyTypeAbbr = (propertyType) => {
  const abbr = {
    'BUY': 'B',
    'RENT': 'R',
    'COMMERCIAL': 'C',
  };
  return abbr[propertyType] || 'P';
};

/**
 * Generate Property ID
 * Format: [PropertyType]-[Category]-[Subcategory]-[Timestamp]
 * Example: B-NP-APT-230522001
 */
export const generatePropertyId = (propertyType, category, subcategory) => {
  if (!propertyType || !category || !subcategory) {
    return '';
  }

  const typeAbbr = getPropertyTypeAbbr(propertyType);
  const catAbbr = getCategoryAbbr(propertyType, category);
  const subAbbr = getSubcategoryAbbr(subcategory);

  // Generate timestamp-based suffix (YYMMDDHHMMSS)
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
  const randomSuffix = String(Math.floor(Math.random() * 100)).padStart(2, '0');

  // Format: B-NP-APT-230522001
  return `${typeAbbr}-${catAbbr}-${subAbbr}-${timestamp.slice(-6)}${randomSuffix}`;
};

/**
 * Generate simplified Property ID (shorter format)
 * Format: [PropertyType][Category][Subcategory][Random]
 * Example: BNPAPTu71
 */
export const generateSimplePropertyId = (propertyType, category, subcategory) => {
  if (!propertyType || !category || !subcategory) {
    return '';
  }

  const typeAbbr = getPropertyTypeAbbr(propertyType);
  const catAbbr = getCategoryAbbr(propertyType, category);
  const subAbbr = getSubcategoryAbbr(subcategory);

  // Generate random suffix
  const randomChars = Math.random().toString(36).substring(2, 4).toUpperCase();
  const randomNum = String(Math.floor(Math.random() * 100)).padStart(2, '0');

  // Format: BNPAPTu71
  return `${typeAbbr}${catAbbr}${subAbbr}${randomChars}${randomNum}`.toUpperCase();
};

/**
 * Generate Property ID with Company Prefix
 * Format: [CompanyPrefix]-[PropertyType]-[Category]-[Subcategory]-[Number]
 * Example: DEL-B-NP-APT-001
 */
export const generateDetailedPropertyId = (propertyType, category, subcategory, companyPrefix = 'DEL') => {
  if (!propertyType || !category || !subcategory) {
    return '';
  }

  const typeAbbr = getPropertyTypeAbbr(propertyType);
  const catAbbr = getCategoryAbbr(propertyType, category);
  const subAbbr = getSubcategoryAbbr(subcategory);

  // Random 3-digit number
  const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

  // Format: DEL-B-NP-APT-001
  return `${companyPrefix.toUpperCase()}-${typeAbbr}-${catAbbr}-${subAbbr}-${randomNum}`;
};

/**
 * Generate Property ID in new format with sequential number
 * Format: [CompanyPrefix]-[Category]-[SequentialNumber]
 * Example: DEL-NP-001, DEL-NP-002, DEL-REN-001 (for RENT), DEL-RC-001, etc.
 */
export const generateSequentialPropertyId = (category, sequentialNumber, companyPrefix = 'DEL', propertyType = 'BUY') => {
  if (!category || sequentialNumber === null || sequentialNumber === undefined) {
    return '';
  }

  let catAbbr;
  
  // Special case: for RENT property type, always use 'REN'
  if (propertyType === 'RENT') {
    catAbbr = 'REN';
  } else {
    catAbbr = getCategoryAbbr(propertyType, category);
  }
  
  const num = String(sequentialNumber).padStart(3, '0');

  // Format: DEL-NP-001 or DEL-REN-001 (for RENT) or DEL-RC-001
  return `${companyPrefix.toUpperCase()}-${catAbbr}-${num}`;
};
