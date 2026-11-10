/**
 * Property Constants
 * Centralized configuration for all property-related enums and mappings
 * Used across the entire application for consistency
 */

const normalizeValue = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().toUpperCase().replace(/[-\s]+/g, '_');
};

// ==================== PROPERTY TYPES ====================
export const PROPERTY_TYPES = {
  BUY: 'BUY',
  RENT: 'RENT',
  COMMERCIAL: 'COMMERCIAL',
};

export const PROPERTY_TYPES_DISPLAY = {
  BUY: 'Buy',
  RENT: 'Rent',
  COMMERCIAL: 'Commercial',
};

// ==================== BUY CATEGORIES ====================
export const BUY_CATEGORIES = {
  NEW_PROJECT: 'NEW_PROJECT',
  RESALE: 'RESALE',
};

export const BUY_CATEGORIES_DISPLAY = {
  NEW_PROJECT: 'New Project',
  RESALE: 'Resale',
};

// ==================== BUY SUBCATEGORIES ====================
export const BUY_SUBCATEGORIES = {
  // New Project
  NEW_PROJECT_APARTMENT: 'NEW_PROJECT_APARTMENT',
  NEW_PROJECT_VILLA: 'NEW_PROJECT_VILLA',
  NEW_PROJECT_PLOT: 'NEW_PROJECT_PLOT',
  // Resale
  RESALE_FLAT: 'RESALE_FLAT',
  RESALE_VILLA: 'RESALE_VILLA',
  RESALE_PLOT: 'RESALE_PLOT',
};

export const BUY_SUBCATEGORIES_DISPLAY = {
  NEW_PROJECT_APARTMENT: 'New Project - Apartment',
  NEW_PROJECT_VILLA: 'New Project - Villa',
  NEW_PROJECT_PLOT: 'New Project - Plot',
  RESALE_FLAT: 'Resale - Flat',
  RESALE_VILLA: 'Resale - Villa',
  RESALE_PLOT: 'Resale - Plot',
};

// ==================== RENT CATEGORIES ====================
export const RENT_CATEGORIES = {
  RENT: 'RENT',
};

export const RENT_CATEGORIES_DISPLAY = {
  RENT: 'Rent',
};

// ==================== RENT SUBCATEGORIES ====================
export const RENT_SUBCATEGORIES = {
  // Rent
  RENTAL_FLAT: 'RENTAL_FLAT',
  RENTAL_VILLA: 'RENTAL_VILLA',
  RENTAL_INDIVIDUAL_FLOOR: 'RENTAL_INDIVIDUAL_FLOOR',
};

export const RENT_SUBCATEGORIES_DISPLAY = {
  RENTAL_FLAT: 'Flat',
  RENTAL_VILLA: 'Villa/Duplex',
  RENTAL_INDIVIDUAL_FLOOR: 'Individual Floor',
};

// ==================== COMMERCIAL CATEGORIES ====================
export const COMMERCIAL_CATEGORIES = {
  BUY: 'BUY',
  LEASE: 'LEASE',
};

export const COMMERCIAL_CATEGORIES_DISPLAY = {
  BUY: 'Buy',
  LEASE: 'Lease',
};

// ==================== COMMERCIAL SUBCATEGORIES ====================
export const COMMERCIAL_SUBCATEGORIES = {
  // Sale
  COMMERCIAL_OFFICE_SALE: 'COMMERCIAL_OFFICE_SALE',
  COMMERCIAL_SHOP_SALE: 'COMMERCIAL_SHOP_SALE',
  COMMERCIAL_SHOWROOM_SALE: 'COMMERCIAL_SHOWROOM_SALE',
  COMMERCIAL_LAND_SALE: 'COMMERCIAL_LAND_SALE',
  COMMERCIAL_WAREHOUSE_SALE: 'COMMERCIAL_WAREHOUSE_SALE',
  COMMERCIAL_INDUSTRIAL_SALE: 'COMMERCIAL_INDUSTRIAL_SALE',
  COMMERCIAL_COWORKING_SALE: 'COMMERCIAL_COWORKING_SALE',
  // Lease/Rent
  COMMERCIAL_OFFICE_LEASE: 'COMMERCIAL_OFFICE_LEASE',
  COMMERCIAL_SHOP_LEASE: 'COMMERCIAL_SHOP_LEASE',
  COMMERCIAL_WAREHOUSE_LEASE: 'COMMERCIAL_WAREHOUSE_LEASE',
};

export const COMMERCIAL_SUBCATEGORIES_DISPLAY = {
  COMMERCIAL_OFFICE_SALE: 'Office - Sale',
  COMMERCIAL_SHOP_SALE: 'Shop - Sale',
  COMMERCIAL_SHOWROOM_SALE: 'Showroom - Sale',
  COMMERCIAL_LAND_SALE: 'Land - Sale',
  COMMERCIAL_WAREHOUSE_SALE: 'Warehouse - Sale',
  COMMERCIAL_INDUSTRIAL_SALE: 'Industrial - Sale',
  COMMERCIAL_COWORKING_SALE: 'Co-working - Sale',
  COMMERCIAL_OFFICE_LEASE: 'Office - Lease',
  COMMERCIAL_SHOP_LEASE: 'Shop - Lease',
  COMMERCIAL_WAREHOUSE_LEASE: 'Warehouse - Lease',
};

// ==================== AMENITIES ====================
export const AMENITIES = [
  { id: 'gym', label: 'Gym' },
  { id: 'swimming_pool', label: 'Swimming Pool' },
  { id: 'parking', label: 'Parking' },
  { id: 'security', label: '24/7 Security' },
  { id: 'garden', label: 'Garden' },
  { id: 'balcony', label: 'Balcony' },
  { id: 'modular_kitchen', label: 'Modular Kitchen' },
  { id: 'air_conditioning', label: 'Air Conditioning' },
  { id: 'water_supply', label: 'Water Supply' },
  { id: 'elevator', label: 'Elevator' },
  { id: 'sewage', label: 'Sewage System' },
  { id: 'gated_community', label: 'Gated Community' },
  { id: 'community_hall', label: 'Community Hall' },
  { id: 'power_backup', label: 'Power Backup' },
];

// ==================== FACILITIES ====================
export const FACILITIES = [
  { id: 'school', label: 'School Nearby' },
  { id: 'hospital', label: 'Hospital Nearby' },
  { id: 'market', label: 'Market Nearby' },
  { id: 'public_transport', label: 'Public Transport' },
  { id: 'park', label: 'Park' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'mall', label: 'Shopping Mall' },
  { id: 'atm', label: 'ATM' },
];

// ==================== TENANT PREFERENCES (for Rent) ====================
export const TENANT_PREFERENCES = {
  FAMILY: 'FAMILY',
  BACHELOR: 'BACHELOR',
  COMPANY: 'COMPANY',
  ANY: 'ANY',
};

export const TENANT_PREFERENCES_DISPLAY = {
  FAMILY: 'Family',
  BACHELOR: 'Bachelor',
  COMPANY: 'Company',
  ANY: 'Any',
};

// ==================== AREA UNITS ====================
export const AREA_UNITS = [
  { value: 'sq_ft', label: 'Sq. Ft' },
  { value: 'sq_m', label: 'Sq. M' },
  { value: 'sq_yards', label: 'Sq. Yards' },
];

// ==================== FURNISHING ====================
export const FURNISHING_STATUS = {
  UNFURNISHED: 'UNFURNISHED',
  SEMI_FURNISHED: 'SEMI_FURNISHED',
  FULLY_FURNISHED: 'FULLY_FURNISHED',
};

export const FURNISHING_STATUS_DISPLAY = {
  UNFURNISHED: 'Unfurnished',
  SEMI_FURNISHED: 'Semi-Furnished',
  FULLY_FURNISHED: 'Fully Furnished',
};

// ==================== PROJECT STATUS ====================
export const PROJECT_STATUS = {
  NEW_LAUNCH: 'NEW_LAUNCH',
  UNDER_CONSTRUCTION: 'UNDER_CONSTRUCTION',
  READY_TO_MOVE: 'READY_TO_MOVE',
};

export const PROJECT_STATUS_DISPLAY = {
  NEW_LAUNCH: 'New Launch',
  UNDER_CONSTRUCTION: 'Under Construction',
  READY_TO_MOVE: 'Ready to Move',
};

// ==================== APPROVAL TYPES ====================
export const APPROVAL_TYPES = {
  BDA: 'BDA',
  BMC: 'BMC',
  NONE: 'NONE',
};

export const APPROVAL_TYPES_DISPLAY = {
  BDA: 'BDA',
  BMC: 'BMC',
  NONE: 'None',
};

// ==================== OWNERSHIP TYPES ====================
export const OWNERSHIP_TYPES = {
  FREEHOLD: 'FREEHOLD',
  LEASEHOLD: 'LEASEHOLD',
  COOPERATIVE: 'COOPERATIVE',
};

export const OWNERSHIP_TYPES_DISPLAY = {
  FREEHOLD: 'Freehold',
  LEASEHOLD: 'Leasehold',
  COOPERATIVE: 'Cooperative',
};

// ==================== FURNISHING ITEMS ====================
export const FURNISHING_ITEMS = [
  { id: 'ac', label: 'AC' },
  { id: 'modular_kitchen', label: 'Modular Kitchen' },
  { id: 'wardrobe', label: 'Wardrobe' },
  { id: 'sofa', label: 'Sofa' },
  { id: 'bed', label: 'Bed' },
  { id: 'tv_unit', label: 'TV Unit' },
  { id: 'geyser', label: 'Geyser' },
  { id: 'false_ceiling', label: 'False Ceiling' },
  { id: 'premium_lighting', label: 'Premium Lighting' },
  { id: 'dining_area', label: 'Dining Area' },
];

// ==================== OUTDOOR FEATURES ====================
export const OUTDOOR_FEATURES = [
  { id: 'private_garden', label: 'Private Garden' },
  { id: 'terrace', label: 'Terrace' },
  { id: 'lawn_area', label: 'Lawn Area' },
  { id: 'cctv', label: 'CCTV' },
  { id: 'boundary_wall', label: 'Boundary Wall' },
  { id: 'security_cabin', label: 'Security Cabin' },
];

// ==================== COMMERCIAL AMENITIES ====================
export const COMMERCIAL_AMENITIES = [
  { id: 'lift', label: 'Lift' },
  { id: 'dg_power', label: 'DG Power Backup' },
  { id: 'water_supply', label: '24x7 Water Supply' },
  { id: 'cctv_security', label: 'CCTV Security' },
  { id: 'fire_fighting', label: 'Fire Fighting System' },
  { id: 'visitor_parking', label: 'Visitor Parking' },
  { id: 'internet', label: 'Internet Connectivity' },
  { id: 'reserved_parking', label: 'Reserved Parking' },
  { id: 'washroom', label: 'Washroom' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'central_ac', label: 'Central AC' },
];

// ==================== BUSINESS SUITABLE FOR ====================
export const BUSINESS_SUITABLE_FOR = {
  CORPORATE_OFFICE: 'CORPORATE_OFFICE',
  RETAIL_SHOP: 'RETAIL_SHOP',
  RESTAURANT: 'RESTAURANT',
  CAFE: 'CAFE',
  CLINIC: 'CLINIC',
  COACHING_CENTER: 'COACHING_CENTER',
  SALON: 'SALON',
  WAREHOUSE: 'WAREHOUSE',
  STARTUP_OFFICE: 'STARTUP_OFFICE',
  SHOWROOM: 'SHOWROOM',
  CLOUD_KITCHEN: 'CLOUD_KITCHEN',
  GYM: 'GYM',
  TRAINING_CENTER: 'TRAINING_CENTER',
};

export const BUSINESS_SUITABLE_FOR_DISPLAY = {
  CORPORATE_OFFICE: 'Corporate Office',
  RETAIL_SHOP: 'Retail Shop',
  RESTAURANT: 'Restaurant',
  CAFE: 'Cafe',
  CLINIC: 'Clinic',
  COACHING_CENTER: 'Coaching Center',
  SALON: 'Salon',
  WAREHOUSE: 'Warehouse',
  STARTUP_OFFICE: 'Startup Office',
  SHOWROOM: 'Showroom',
  CLOUD_KITCHEN: 'Cloud Kitchen',
  GYM: 'Gym',
  TRAINING_CENTER: 'Training Center',
};

// ==================== FACING DIRECTION ====================
export const FACING_DIRECTION = {
  NORTH: 'NORTH',
  SOUTH: 'SOUTH',
  EAST: 'EAST',
  WEST: 'WEST',
  NORTHEAST: 'NORTHEAST',
  NORTHWEST: 'NORTHWEST',
  SOUTHEAST: 'SOUTHEAST',
  SOUTHWEST: 'SOUTHWEST',
};

export const FACING_DIRECTION_DISPLAY = {
  NORTH: 'North',
  SOUTH: 'South',
  EAST: 'East',
  WEST: 'West',
  NORTHEAST: 'North-East',
  NORTHWEST: 'North-West',
  SOUTHEAST: 'South-East',
  SOUTHWEST: 'South-West',
};

// ==================== FORM STEPS ====================
export const FORM_STEPS = {
  BASIC_INFO: 'basic_info',
  LOCATION: 'location',
  CONTACT: 'contact',
  DETAILS: 'details',
  IMAGES: 'images',
  REVIEW: 'review',
};

export const FORM_STEP_LABELS = {
  basic_info: 'Basic Information',
  location: 'Location',
  contact: 'Contact Details',
  details: 'Property Details',
  images: 'Images',
  review: 'Review & Submit',
};

// ==================== DYNAMIC CATEGORY MAPPING ====================
/**
 * Get categories for a specific property type
 */
export const getCategoriesForType = (propertyType) => {
  switch (propertyType) {
    case PROPERTY_TYPES.BUY:
      return Object.keys(BUY_CATEGORIES).map((key) => ({
        value: BUY_CATEGORIES[key],
        label: BUY_CATEGORIES_DISPLAY[BUY_CATEGORIES[key]],
      }));
    case PROPERTY_TYPES.RENT:
      return Object.keys(RENT_CATEGORIES).map((key) => ({
        value: RENT_CATEGORIES[key],
        label: RENT_CATEGORIES_DISPLAY[RENT_CATEGORIES[key]],
      }));
    case PROPERTY_TYPES.COMMERCIAL:
      return Object.keys(COMMERCIAL_CATEGORIES).map((key) => ({
        value: COMMERCIAL_CATEGORIES[key],
        label: COMMERCIAL_CATEGORIES_DISPLAY[COMMERCIAL_CATEGORIES[key]],
      }));
    default:
      return [];
  }
};

/**
 * Get subcategories for a specific property type and category
 */
export const getSubcategoriesForType = (propertyType, category) => {
  switch (propertyType) {
    case PROPERTY_TYPES.BUY:
      // Filter subcategories based on category
      if (category === BUY_CATEGORIES.NEW_PROJECT) {
        return [
          { value: BUY_SUBCATEGORIES.NEW_PROJECT_APARTMENT, label: BUY_SUBCATEGORIES_DISPLAY.NEW_PROJECT_APARTMENT },
          { value: BUY_SUBCATEGORIES.NEW_PROJECT_VILLA, label: BUY_SUBCATEGORIES_DISPLAY.NEW_PROJECT_VILLA },
          { value: BUY_SUBCATEGORIES.NEW_PROJECT_PLOT, label: BUY_SUBCATEGORIES_DISPLAY.NEW_PROJECT_PLOT },
        ];
      } else if (category === BUY_CATEGORIES.RESALE) {
        // RESALE has no subcategories
        return [];
      }
      return [];

    case PROPERTY_TYPES.RENT:
      // RENT category has subcategories
      if (category === RENT_CATEGORIES.RENT) {
        return [
          { value: RENT_SUBCATEGORIES.RENTAL_FLAT, label: RENT_SUBCATEGORIES_DISPLAY.RENTAL_FLAT },
          { value: RENT_SUBCATEGORIES.RENTAL_VILLA, label: RENT_SUBCATEGORIES_DISPLAY.RENTAL_VILLA },
          { value: RENT_SUBCATEGORIES.RENTAL_INDIVIDUAL_FLOOR, label: RENT_SUBCATEGORIES_DISPLAY.RENTAL_INDIVIDUAL_FLOOR },
        ];
      }
      return [];

    case PROPERTY_TYPES.COMMERCIAL:
      // Filter subcategories based on category
      if (category === COMMERCIAL_CATEGORIES.BUY) {
        return [
          { value: COMMERCIAL_SUBCATEGORIES.COMMERCIAL_OFFICE_SALE, label: COMMERCIAL_SUBCATEGORIES_DISPLAY.COMMERCIAL_OFFICE_SALE },
          { value: COMMERCIAL_SUBCATEGORIES.COMMERCIAL_SHOP_SALE, label: COMMERCIAL_SUBCATEGORIES_DISPLAY.COMMERCIAL_SHOP_SALE },
          { value: COMMERCIAL_SUBCATEGORIES.COMMERCIAL_SHOWROOM_SALE, label: COMMERCIAL_SUBCATEGORIES_DISPLAY.COMMERCIAL_SHOWROOM_SALE },
          { value: COMMERCIAL_SUBCATEGORIES.COMMERCIAL_LAND_SALE, label: COMMERCIAL_SUBCATEGORIES_DISPLAY.COMMERCIAL_LAND_SALE },
          { value: COMMERCIAL_SUBCATEGORIES.COMMERCIAL_WAREHOUSE_SALE, label: COMMERCIAL_SUBCATEGORIES_DISPLAY.COMMERCIAL_WAREHOUSE_SALE },
          { value: COMMERCIAL_SUBCATEGORIES.COMMERCIAL_INDUSTRIAL_SALE, label: COMMERCIAL_SUBCATEGORIES_DISPLAY.COMMERCIAL_INDUSTRIAL_SALE },
          { value: COMMERCIAL_SUBCATEGORIES.COMMERCIAL_COWORKING_SALE, label: COMMERCIAL_SUBCATEGORIES_DISPLAY.COMMERCIAL_COWORKING_SALE },
        ];
      } else if (category === COMMERCIAL_CATEGORIES.LEASE) {
        return [
          { value: COMMERCIAL_SUBCATEGORIES.COMMERCIAL_OFFICE_LEASE, label: COMMERCIAL_SUBCATEGORIES_DISPLAY.COMMERCIAL_OFFICE_LEASE },
          { value: COMMERCIAL_SUBCATEGORIES.COMMERCIAL_SHOP_LEASE, label: COMMERCIAL_SUBCATEGORIES_DISPLAY.COMMERCIAL_SHOP_LEASE },
          { value: COMMERCIAL_SUBCATEGORIES.COMMERCIAL_WAREHOUSE_LEASE, label: COMMERCIAL_SUBCATEGORIES_DISPLAY.COMMERCIAL_WAREHOUSE_LEASE },
        ];
      }
      return [];

    default:
      return [];
  }
};

/**
 * Get display label for any enum value
 */
export const getDisplayLabel = (value) => {
  // Backend sometimes returns category/subcategory as a populated object
  // like { _id, name } instead of a plain string key. Rendering that object
  // directly in JSX crashes React ("Objects are not valid as a React
  // child"), so unwrap it to a safe string first.
  if (value && typeof value === 'object') {
    return value.name || value.label || value._id || '';
  }

  const labels = {
    // Property types
    ...PROPERTY_TYPES_DISPLAY,
    // Buy
    ...BUY_CATEGORIES_DISPLAY,
    ...BUY_SUBCATEGORIES_DISPLAY,
    // Rent
    ...RENT_CATEGORIES_DISPLAY,
    ...RENT_SUBCATEGORIES_DISPLAY,
    // Commercial
    ...COMMERCIAL_CATEGORIES_DISPLAY,
    ...COMMERCIAL_SUBCATEGORIES_DISPLAY,
    // Furnishing
    ...FURNISHING_STATUS_DISPLAY,
    // Tenant
    ...TENANT_PREFERENCES_DISPLAY,
  };
  return labels[value] || value;
};

/**
 * Check if property type requires subcategory
 */
export const requiresSubcategory = (propertyType) => {
  return normalizeValue(propertyType) !== PROPERTY_TYPES.RENT;
};

/**
 * Check if category is rental
 */
export const isRentalProperty = (propertyType) => {
  return normalizeValue(propertyType) === PROPERTY_TYPES.RENT;
};

/**
 * Check if category is commercial
 */
export const isCommercialProperty = (propertyType) => {
  return normalizeValue(propertyType) === PROPERTY_TYPES.COMMERCIAL;
};

/**
 * Check if category is buy
 */
export const isBuyProperty = (propertyType) => {
  return normalizeValue(propertyType) === PROPERTY_TYPES.BUY;
};

// ==================== SPECIFIC PROPERTY TYPE PREDICATES ====================

/**
 * Check if it's a new project
 */
export const isNewProject = (subcategory) => {
  const normalized = normalizeValue(subcategory);
  return Boolean(normalized && normalized.includes('NEW_PROJECT'));
};

/**
 * Check if it's a resale property (by subcategory - deprecated, use isResaleCategory instead)
 * NOTE: RESALE has no subcategories, so this will return false for resale properties
 */
export const isResale = (subcategory) => {
  const normalized = normalizeValue(subcategory);
  return Boolean(normalized && normalized.includes('RESALE'));
};

/**
 * Check if it's a resale flat (by subcategory - deprecated, use isResaleCategory instead)
 * NOTE: RESALE has no subcategories, so this will return false for resale properties
 */
export const isResaleFlat = (subcategory) => {
  return subcategory === BUY_SUBCATEGORIES.RESALE_FLAT;
};

/**
 * Check if it's a resale villa (by subcategory - deprecated, use isResaleCategory instead)
 * NOTE: RESALE has no subcategories, so this will return false for resale properties
 */
export const isResaleVilla = (subcategory) => {
  return subcategory === BUY_SUBCATEGORIES.RESALE_VILLA;
};

/**
 * Check if it's a rental flat
 */
export const isRentalFlat = (subcategory) => {
  return subcategory === RENT_SUBCATEGORIES.RENTAL_FLAT;
};

/**
 * Check if it's a rental villa/duplex
 */
export const isRentalVilla = (subcategory) => {
  return subcategory === RENT_SUBCATEGORIES.RENTAL_VILLA;
};

/**
 * Check if it's a rental individual floor
 */
export const isRentalIndividualFloor = (subcategory) => {
  return subcategory === RENT_SUBCATEGORIES.RENTAL_INDIVIDUAL_FLOOR;
};

/**
 * Check if it's commercial sale
 */
export const isCommercialSale = (subcategory) => {
  return subcategory && subcategory.includes('SALE');
};

/**
 * Check if it's commercial lease/rent
 */
export const isCommercialLease = (subcategory) => {
  return subcategory && subcategory.includes('LEASE');
};

// ==================== CATEGORY-BASED PREDICATES ====================
/**
 * Check if category is resale (by category value)
 */
export const isResaleCategory = (category) => {
  const normalized = normalizeValue(category);
  return normalized === BUY_CATEGORIES.RESALE || normalized.includes('RESALE');
};

/**
 * Check if category is new project (by category value)
 */
export const isNewProjectCategory = (category) => {
  const normalized = normalizeValue(category);
  return normalized === BUY_CATEGORIES.NEW_PROJECT || normalized.includes('NEW_PROJECT');
};

/**
 * Check if category is residential (by category value)
 */
export const isResidentialCategory = (category) => {
  return category === RENT_CATEGORIES.RENT;
};

/**
 * Check if category is commercial buy (by category value)
 */
export const isCommercialBuyCategory = (category) => {
  return category === COMMERCIAL_CATEGORIES.BUY;
};

/**
 * Check if category is commercial lease (by category value)
 */
export const isCommercialLeaseCategory = (category) => {
  return category === COMMERCIAL_CATEGORIES.LEASE;
};

/**
 * Check if property needs specific resale-type fields (flat vs villa)
 * Since RESALE has no subcategories, both flat and villa properties fall under the same category
 * This function returns true for ANY resale property to show resale-specific fields
 */
export const hasResaleSpecificFields = (category, subcategory) => {
  // For resale category (which has no subcategories), show generic resale fields
  if (isResaleCategory(category)) {
    return true;
  }
  // Keep subcategory checks for backward compatibility
  return isResaleFlat(subcategory) || isResaleVilla(subcategory);
};

/**
 * Check if property should show floor details (flats)
 * Since RESALE flat and villa are now under one category with no subcategories,
 * this function will show floor details for all resale properties
 */
export const shouldShowFloorDetails = (category, subcategory) => {
  // Show for resale category or legacy resale flat subcategory
  if (isResaleCategory(category)) {
    return true;
  }
  return isResaleFlat(subcategory);
};

/**
 * Check if property should show villa-specific fields
 * Since RESALE flat and villa are now under one category with no subcategories,
 * this is deprecated and will always return false
 */
export const shouldShowVillaFields = (category, subcategory) => {
  // With new structure, villa-specific fields are not shown separately
  return isResaleVilla(subcategory);
};

/**
 * Get all arrays for dynamic rendering based on property type
 */
export const getAmenitiesForType = (subcategory) => {
  if (isCommercialSale(subcategory) || isCommercialLease(subcategory)) {
    return COMMERCIAL_AMENITIES;
  }
  return AMENITIES;
};

/**
 * Get furnishing items list
 */
export const getFurnishingItems = () => {
  return FURNISHING_ITEMS;
};

/**
 * Get outdoor features list
 */
export const getOutdoorFeatures = () => {
  return OUTDOOR_FEATURES;
};

/**
 * Get business suitable for options
 */
export const getBusinessSuitableFor = () => {
  return Object.entries(BUSINESS_SUITABLE_FOR).map(([key, value]) => ({
    value: value,
    label: BUSINESS_SUITABLE_FOR_DISPLAY[value],
  }));
};

/**
 * Get project status options
 */
export const getProjectStatusOptions = () => {
  return Object.entries(PROJECT_STATUS).map(([key, value]) => ({
    value: value,
    label: PROJECT_STATUS_DISPLAY[value],
  }));
};

/**
 * Get approval types
 */
export const getApprovalTypes = () => {
  return Object.entries(APPROVAL_TYPES).map(([key, value]) => ({
    value: value,
    label: APPROVAL_TYPES_DISPLAY[value],
  }));
};

/**
 * Get ownership types
 */
export const getOwnershipTypes = () => {
  return Object.entries(OWNERSHIP_TYPES).map(([key, value]) => ({
    value: value,
    label: OWNERSHIP_TYPES_DISPLAY[value],
  }));
};

/**
 * Get facing directions
 */
export const getFacingDirections = () => {
  return Object.entries(FACING_DIRECTION).map(([key, value]) => ({
    value: value,
    label: FACING_DIRECTION_DISPLAY[value],
  }));
};