/**
 * Property Validation Schema
 * Comprehensive validation for all property form steps
 * Using Zod for type-safe validation
 */

import {
  BUY_CATEGORIES,
  BUY_SUBCATEGORIES,
  PROPERTY_TYPES,
  RENT_CATEGORIES,
  getSubcategoriesForType,
  isBuyProperty,
  isRentalProperty,
  isCommercialProperty,
  isNewProject,
  isRentalFlat,
  isResaleCategory,
} from '../constants/propertyConstants';

import {
  calculateResalePlotPrice, isPositivePlotNumber, isResidentialPlot, PLOT_DIMENSIONS, RESALE_PLOT_DIMENSIONS,
} from '../utils/plotDetails';
import { usesSupabase } from '../lib/backend';

export const validateResaleSubtype = ({ propertyType, category, subcategory }) => {
  if (!usesSupabase || propertyType !== PROPERTY_TYPES.BUY || category !== BUY_CATEGORIES.RESALE) {
    return undefined;
  }

  const options = getSubcategoriesForType(propertyType, category);
  if (!options.some(option => option.value === subcategory)) {
    return 'Choose a subtype for this resale property.';
  }
};

export const validateRentalSubtype = ({ propertyType, subcategory }) => {
  if (!usesSupabase || propertyType !== PROPERTY_TYPES.RENT) return undefined;

  const options = getSubcategoriesForType(propertyType, RENT_CATEGORIES.RENT);
  if (!options.some(option => option.value === subcategory)) {
    return 'Choose a subtype for this rental property.';
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  // Indian phone number format
  const phoneRegex = /^[6-9]\d{9}$/;
  const digits = String(phone ?? '').replace(/\D/g, '');
  return phoneRegex.test(digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits);
};

export const validatePincode = (pincode) => {
  // Indian pincode format
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
};

export const validatePrice = (price) => {
  const priceNum = Number(price);
  return priceNum > 0 && priceNum <= 999999999999; // Max 10 crore
};

export const validateArea = (area) => {
  const areaNum = Number(area);
  return areaNum > 0 && areaNum <= 9999999;
};

export const validateBedrooms = (bedrooms) => {
  const bedroomsNum = Number(bedrooms);
  return bedroomsNum >= 0 && bedroomsNum <= 20;
};

export const validateBathrooms = (bathrooms) => {
  const bathroomsNum = Number(bathrooms);
  return bathroomsNum >= 0 && bathroomsNum <= 20;
};

export const validateDeposit = (deposit) => {
  const depositNum = Number(deposit);
  return !isNaN(depositNum) && depositNum >= 0 && depositNum <= 999999999999;
};

export const validateMaintenance = (maintenance) => {
  const maintenanceNum = Number(maintenance);
  return !isNaN(maintenanceNum) && maintenanceNum >= 0 && maintenanceNum <= 999999999;
};

// ==================== BASIC INFO VALIDATION ====================
export const validateBasicInfo = (data) => {
  const errors = {};

  if (!data.propertyId || data.propertyId.trim().length < 1) {
    errors.propertyId = 'Property ID is required';
  }

  if (data.propertyId && data.propertyId.length > 50) {
    errors.propertyId = 'Property ID must be less than 50 characters';
  }

  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (data.title && data.title.length > 100) {
    errors.title = 'Title must be less than 100 characters';
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  if (data.description && data.description.length > 1000) {
    errors.description = 'Description must be less than 1000 characters';
  }

  if (!data.propertyType) {
    errors.propertyType = 'Property type is required';
  }

  if (!data.category) {
    errors.category = 'Category is required';
  }

  const subtypeError = validateResaleSubtype(data) || validateRentalSubtype(data);
  if (subtypeError) {
    errors.subcategory = subtypeError;
  } else if (!data.subcategory) {
    if (data.propertyType === PROPERTY_TYPES.BUY && data.category === 'NEW_PROJECT') {
      errors.subcategory = 'Subcategory is required';
    }
    // For COMMERCIAL type, check if category requires subcategory
    else if (data.propertyType === PROPERTY_TYPES.COMMERCIAL) {
      // Both BUY and LEASE categories for COMMERCIAL have subcategories
      if (data.category === 'BUY' || data.category === 'LEASE') {
        errors.subcategory = 'Subcategory is required';
      }
    }
    // For RENT type with RESIDENTIAL category
    else if (data.propertyType === PROPERTY_TYPES.RENT && data.category === 'RESIDENTIAL') {
      errors.subcategory = 'Subcategory is required';
    }
  }

  return errors;
};

// ==================== LOCATION VALIDATION ====================
export const validateLocation = (data) => {
  const errors = {};

  if (!data.city || data.city.trim().length < 2) {
    errors.city = 'City is required';
  }

  if ((!data.locality || data.locality.trim().length < 2) && (!data.address || data.address.trim().length < 2)) {
    errors.locality = 'Enter a locality or full address';
  }

  if (!data.state || data.state.trim().length < 2) {
    errors.state = 'State is required';
  }

  // Pincode is optional in the client; if provided it should be valid
  if (data.pincode && !validatePincode(data.pincode)) {
    errors.pincode = 'Please enter a valid 6-digit pincode';
  }

  return errors;
};

// ==================== CONTACT VALIDATION ====================
export const validateContact = (data) => {
  const errors = {};

  // Phone is required; name and email are optional client-side
  if (!validatePhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  return errors;
};

// ==================== PROPERTY DETAILS VALIDATION ====================
export const validatePropertyDetails = (data, propertyType, subcategory = '') => {
  const errors = {};

  // Commercial properties collect price via commercialDetails.price (see
  // validateCommercialDetails) and don't show a generic Area field at all —
  // so skip both checks here to avoid false "please enter a valid
  // price/area" errors when the correct Commercial fields were filled in.
  if (isCommercialProperty(propertyType)) {
    return errors;
  }

  // Price is REQUIRED only for BUY and NEW PROJECT properties (not rental)
  // For rental properties, price is in rentalInfo.monthlyRent, not here
  if (!isRentalProperty(propertyType)) {
    if (!data.price || !validatePrice(data.price)) {
      errors.price = 'Please enter a valid price';
    }
  }

  if (!validateArea(data.area)) {
    errors.area = 'Please enter a valid built-up area';
  }

  if (!data.areaUnit) {
    errors.areaUnit = 'Super built-up area unit is required';
  }

  // For BUY properties
  if (isBuyProperty(propertyType) && !isNewProject(subcategory) && subcategory !== BUY_SUBCATEGORIES.RESALE_PLOT) {
    if (!validateBedrooms(data.bedrooms)) {
      errors.bedrooms = 'Please enter valid number of bedrooms';
    }

    if (!validateBathrooms(data.bathrooms)) {
      errors.bathrooms = 'Please enter valid number of bathrooms';
    }

  }

  // For RENT properties
  if (isRentalProperty(propertyType)) {
    // Furnishing is optional for Details step
    if (data.furnishing === '') {
      // Optional - no error
    }

    if (isRentalFlat(subcategory) && !validateBedrooms(data.bedrooms)) {
      errors.bedrooms = 'Please enter valid number of bedrooms';
    }

    if (data.deposit && data.deposit !== '' && !validatePrice(data.deposit)) {
      errors.deposit = 'Please enter a valid deposit amount';
    }

    if (data.maintenance && data.maintenance !== '' && !validatePrice(data.maintenance)) {
      errors.maintenance = 'Please enter a valid maintenance amount';
    }
  }

  // For COMMERCIAL properties
  if (isCommercialProperty(propertyType)) {
    if (data.carpetArea && !validateArea(data.carpetArea)) {
      errors.carpetArea = 'Carpet area must be greater than 0';
    }

    if (data.builtUpArea && !validateArea(data.builtUpArea)) {
      errors.builtUpArea = 'Super built-up area must be greater than 0';
    }
  }

  return errors;
};

// ==================== IMAGES VALIDATION ====================
export const validateImages = (images) => {
  const errors = {};

  // Images are optional during step validation - users can navigate without uploading
  // But will be required at final submission (see validateCompleteForm)

  if (images && images.length > 20) {
    errors.images = 'Maximum 20 images allowed';
  }

  return errors;
};

export const validatePlotDetails = (formData) => {
  const { propertyType, subcategory } = formData.basicInfo;
  if (!isResidentialPlot(propertyType, subcategory)) return {};

  const resale = subcategory === BUY_SUBCATEGORIES.RESALE_PLOT;
  const { area, price, areaUnit } = formData.propertyDetails;
  const errors = {};
  if (!isPositivePlotNumber(area) || !validateArea(area)) errors.area = 'Enter a valid plot area.';
  if (!resale && !areaUnit) errors.areaUnit = 'Select a plot area unit.';

  const rate = formData.resaleInfo.pricePerSqft;
  if (resale && !isPositivePlotNumber(rate)) errors.pricePerSqft = 'Enter a positive price per sq ft with up to four decimal places.';
  const total = resale ? calculateResalePlotPrice(area, rate) : price;
  if ((!resale || (!errors.area && !errors.pricePerSqft)) && !validatePrice(total)) {
    errors.price = 'Enter values that give a valid positive price.';
  }

  const dimensions = resale ? RESALE_PLOT_DIMENSIONS : PLOT_DIMENSIONS;
  const info = resale ? formData.resaleInfo : formData.newProjectInfo;
  for (const [field, label] of [...dimensions, ['roadWidth', 'Facing Road Width (ft)']]) {
    const value = field === 'roadWidth' ? formData.location.roadWidth : info[field];
    if (value != null && value !== '' && !isPositivePlotNumber(value)) {
      errors[field] = `${label} must be positive with up to four decimal places.`;
    }
  }
  return errors;
};

// ==================== COMPLETE FORM VALIDATION ====================
// ==================== COMPLETE FORM VALIDATION ====================
export const validateCompleteForm = (formData) => {
  const allErrors = {};

  // Validate each section
  allErrors.basicInfo = validateBasicInfo(formData.basicInfo);
  allErrors.location = validateLocation(formData.location);
  allErrors.contact = validateContact(formData.contact);

  const { propertyType, subcategory, category } = formData.basicInfo;

  // Property details validation
  const isPlot = isResidentialPlot(propertyType, subcategory);
  allErrors.propertyDetails = isPlot ? validatePlotDetails(formData) : validatePropertyDetails(
    formData.propertyDetails,
    propertyType,
    subcategory
  );

  // Type-specific validation for complete form
  // NOTE: For the Details step, many of these are optional in UI.
  // Use the same conditional logic as step validation to avoid blocking submission
  // when fields are not applicable/not shown.
  if (isResaleCategory(category) && !isPlot) {
    allErrors.resaleInfo = validateResaleInfo(formData.resaleInfo);
  } else if (isRentalProperty(propertyType)) {
    allErrors.rentalInfo = validateRentalInfo(formData.rentalInfo);
  } else if (isCommercialProperty(propertyType)) {
    allErrors.commercialDetails = validateCommercialDetails(formData.commercialDetails);
  }

  if (subcategory === BUY_SUBCATEGORIES.NEW_PROJECT_PLOT) {
    allErrors.projectPricing = validateProjectPricing(formData.projectPricing, true);
  }
  allErrors.images = validateImages(formData.images);

  if (propertyType === PROPERTY_TYPES.COMMERCIAL) {
    if (!validateArea(formData.commercialDetails?.builtUpArea)) {
      allErrors.commercialDetails = { ...allErrors.commercialDetails, builtUpArea: 'Please enter a valid built-up area' };
    }
    const carpetArea = formData.commercialDetails?.carpetArea;
    if (carpetArea != null && carpetArea !== '' && !validateArea(carpetArea)) {
      allErrors.commercialDetails = { ...allErrors.commercialDetails, carpetArea: 'Please enter a valid carpet area' };
    }
  }

  return Object.fromEntries(
    Object.entries(allErrors).filter(([, errors]) => Object.keys(errors).length > 0)
  );
};


// ==================== STEP VALIDATION ====================
export const validateStep = (step, formData) => {
  const { basicInfo } = formData;
  const { propertyType, subcategory, category } = basicInfo;

  console.log(`[validateStep] Validating step: ${step}`);

  switch (step) {
    case 0:
    case 'basic_info':
      return validateBasicInfo(formData.basicInfo);

    case 1:
    case 'location':
      return validateLocation(formData.location);

    case 2:
    case 'contact':
      return validateContact(formData.contact);

    case 3:
    case 'details':
      if (isResidentialPlot(propertyType, subcategory)) return validatePlotDetails(formData);
      let stepErrors = {};

      // PropertyDetailsStep only validates propertyDetails and type-specific info
      // BUT NOT new project info (that's on a different step)
      if (isNewProject(subcategory)) {
        // For new projects on this step, only validate propertyDetails
        // Don't validate newProjectInfo/projectPricing - those are on ProjectDetailsStep
        stepErrors = {
          ...validatePropertyDetails(formData.propertyDetails, propertyType, subcategory),
        };
      } else if (isResaleCategory(category)) {
        // Validate resale-specific fields shown on this step
        const resaleErrors = validateResaleInfo(formData.resaleInfo);
        stepErrors = { ...stepErrors, ...resaleErrors };
        // Also validate common property details
        stepErrors = {
          ...stepErrors,
          ...validatePropertyDetails(formData.propertyDetails, propertyType, subcategory),
        };
      } else if (isRentalProperty(propertyType)) {
        // Validate rental-specific fields shown on this step
        const rentalErrors = validateRentalInfo(formData.rentalInfo);
        stepErrors = { ...stepErrors, ...rentalErrors };
        // Also validate common property details
        stepErrors = {
          ...stepErrors,
          ...validatePropertyDetails(formData.propertyDetails, propertyType, subcategory),
        };
      } else if (isCommercialProperty(propertyType)) {
        // Validate commercial-specific fields shown on this step.
        // NOTE: we intentionally do NOT also call validatePropertyDetails()
        // here — that function checks propertyDetails.price/area, but
        // Commercial properties collect price via commercialDetails.price
        // and don't show a generic Area field at all. Calling it produced
        // "Please enter a valid price/area" errors even when the correct
        // Commercial fields were filled in.
        const commercialErrors = validateCommercialDetails(formData.commercialDetails);
        stepErrors = { ...stepErrors, ...commercialErrors };
      }

      if (Object.keys(stepErrors).length > 0) {
        console.log(`[validateStep Details] Errors:`, stepErrors);
      }
      return stepErrors;

    case 4:
    case 'project_details':
      // Project details step for new projects - validate project info, pricing, and units
      let projectErrors = {};
      
      // Only add errors if there are actual validation failures
      const newProjErrors = validateNewProjectInfo(formData.newProjectInfo);
      if (Object.keys(newProjErrors).length > 0) {
        projectErrors = { ...projectErrors, ...newProjErrors };
        console.log(`[validateStep ProjectDetails] newProjectInfo errors:`, newProjErrors);
      }
      
      const pricingErrors = validateProjectPricing(formData.projectPricing, subcategory === BUY_SUBCATEGORIES.NEW_PROJECT_PLOT);
      if (Object.keys(pricingErrors).length > 0) {
        projectErrors = { ...projectErrors, ...pricingErrors };
        console.log(`[validateStep ProjectDetails] projectPricing errors:`, pricingErrors);
      }
      
      const unitErrors = subcategory === BUY_SUBCATEGORIES.NEW_PROJECT_PLOT
        ? {} : validateUnitConfiguration(formData.projectPricing.unitConfigurations);
      if (Object.keys(unitErrors).length > 0) {
        projectErrors.unitConfigurations = unitErrors;
        console.log(`[validateStep ProjectDetails] unitConfiguration errors:`, unitErrors);
      }
      
      if (Object.keys(projectErrors).length > 0) {
        console.log(`%c[validateStep ProjectDetails] FINAL ERRORS`, 'color: #ff0000; font-weight: bold;', projectErrors);
      } else {
        console.log(`%c[validateStep ProjectDetails] ✓ NO ERRORS - Should allow progression`, 'color: #00aa00; font-weight: bold;');
      }
      
      return projectErrors;

    case 5:
    case 'images':
      const imgErrors = validateImages(formData.images);
      if (Object.keys(imgErrors).length === 0) {
        console.log(`%c[validateStep Images] ✓ Images optional during navigation - you can proceed`, 'color: #00aa00; font-weight: bold;');
      } else {
        console.log(`[validateStep Images] Error:`, imgErrors);
      }
      return imgErrors;

    case 6:
    case 'review':
      // Review step - no additional validation needed
      return {};

    default:
      return {};
  }
};

// ==================== CHECK IF STEP IS COMPLETE ====================
export const isStepComplete = (step, formData) => {
  const errors = validateStep(step, formData);
  return Object.keys(errors).length === 0;
};

/**
 * Check if a specific field has an error
 * @param {string} field - Field name
 * @param {object} errors - Errors object
 * @returns {boolean}
 */
export const hasFieldError = (field, errors) => {
  return Boolean(errors && errors[field]);
};

/**
 * Get error message for a specific field
 * @param {string} field - Field name
 * @param {object} errors - Errors object
 * @returns {string}
 */
export const getFieldError = (field, errors) => {
  return errors && errors[field] ? errors[field] : '';
};

/**
 * Get error message for a nested field
 * @param {string} section - Section name
 * @param {string} field - Field name
 * @param {object} allErrors - All errors object
 * @returns {string}
 */
export const getNestedFieldError = (section, field, allErrors) => {
  return allErrors && allErrors[section] && allErrors[section][field]
    ? allErrors[section][field]
    : '';
};

/**
 * Check if section has any errors
 * @param {string} section - Section name
 * @param {object} allErrors - All errors object
 * @returns {boolean}
 */
export const hasSectionError = (section, allErrors) => {
  return Boolean(allErrors && allErrors[section] && Object.keys(allErrors[section]).length > 0);
};

/**
 * Get all errors for a section
 * @param {string} section - Section name
 * @param {object} allErrors - All errors object
 * @returns {object}
 */
export const getSectionErrors = (section, allErrors) => {
  return allErrors && allErrors[section] ? allErrors[section] : {};
};

// ==================== NEW PROJECT VALIDATION ====================
export const validateNewProjectInfo = (data) => {
  const errors = {};

  if (data.totalUnits !== '' && data.totalUnits != null && (!Number.isInteger(Number(data.totalUnits)) || Number(data.totalUnits) < 1 || Number(data.totalUnits) > 1000000000)) errors.totalUnits = 'Enter a positive whole number up to 1,000,000,000';
  if (data.totalProjectArea !== '' && data.totalProjectArea != null && !validateArea(data.totalProjectArea)) errors.totalProjectArea = 'Enter a valid total project area';

  // Make all project details optional to allow progression
  if (data.projectName && data.projectName.trim().length < 3 && data.projectName.trim().length > 0) {
    errors.projectName = 'Project name must be at least 3 characters';
  }

  if (data.builderName && data.builderName.trim().length < 3 && data.builderName.trim().length > 0) {
    errors.builderName = 'Builder name must be at least 3 characters';
  }

  // projectStatus, approval, reraNumber, possessionDate are now optional
  if (data.possessionDate) {
    const possDate = new Date(data.possessionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (possDate < today) {
      errors.possessionDate = 'Possession date cannot be in the past';
    }
  }

  return errors;
};

// ==================== PROJECT PRICING VALIDATION ====================
export const validateProjectPricing = (data, isPlot = false) => {
  const errors = {};

  // Make pricing fields optional - only validate if they are filled
  if (data.startingPrice && !validatePrice(data.startingPrice)) {
    errors.startingPrice = 'Starting price must be greater than 0';
  }

  if (data.priceRange && data.priceRange.trim().length < 3 && data.priceRange.trim().length > 0) {
    errors.priceRange = 'Price range must be at least 3 characters';
  }

  if (data.pricePerSqft && !(isPlot ? isPositivePlotNumber(data.pricePerSqft) : validatePrice(data.pricePerSqft))) {
    errors.pricePerSqft = 'Price per sq.ft must be greater than 0';
  }

  return errors;
};

// ==================== UNIT CONFIGURATION VALIDATION ====================
export const validateUnitConfiguration = (units = {}) => {
  const errors = {};
  Object.entries(units || {}).forEach(([code, unit]) => {
    if (!unit || !Object.values(unit).some(value => value !== '' && value != null)) return;
    const issues = {};
    if (!/^bhk[1-5](?:_[a-zA-Z0-9]+)?$/.test(code)) issues.bhk = 'Select 1–5 BHK';
    if (!validateArea(unit.superBuildUpArea)) issues.superBuildUpArea = 'Enter a valid built-up area';
    if (!validateArea(unit.carpetArea)) issues.carpetArea = 'Enter a valid carpet area';
    if (!validatePrice(unit.price)) issues.price = 'Enter a valid price';
    if (Number(unit.carpetArea) >= Number(unit.superBuildUpArea)) issues.carpetArea = 'Carpet area must be less than built-up area';
    if (unit.landArea !== '' && unit.landArea != null && !validateArea(unit.landArea)) issues.landArea = 'Enter a valid land area';
    ['bedrooms', 'bathrooms'].forEach(field => {
      if (unit[field] !== '' && unit[field] != null && (!Number.isInteger(Number(unit[field])) || Number(unit[field]) < 1 || Number(unit[field]) > 100)) issues[field] = 'Enter a whole number from 1 to 100';
    });
    if (Object.keys(issues).length) errors[code] = issues;
  });
  return errors;
};

// ==================== RESALE INFO VALIDATION ====================
export const validateResaleInfo = (data) => {
  const errors = {};

  // These fields are optional for the Details step - only validate if filled
  // Approval, RERA number, expected price, maintenance charges are optional

  // Ownership type and furnishing status are shown on PropertyDetailsStep
  // But they should be optional to not block next button
  // Only show error if user explicitly needs to fill them
  if (data.ownershipType && data.ownershipType === '') {
    // Don't block if empty - make truly optional
  }

  if (data.furnishingStatus && data.furnishingStatus === '') {
    // Don't block if empty - make truly optional
  }

  // Only validate prices if provided
  if (data.expectedPrice && !validatePrice(data.expectedPrice)) {
    errors.expectedPrice = 'Expected price must be greater than 0';
  }

  if (data.maintenanceCharges && !validatePrice(data.maintenanceCharges)) {
    errors.maintenanceCharges = 'Maintenance charges must be 0 or greater';
  }

  // Validate floor consistency if both provided
  if (data.floorNumber && data.totalFloors) {
    const floorNum = Number(data.floorNumber);
    const totalNum = Number(data.totalFloors);
    if (floorNum > totalNum) {
      errors.floorNumber = 'Floor number cannot be greater than total floors';
    }
  }

  return errors;
};

// ==================== COMMERCIAL DETAILS VALIDATION ====================
export const validateCommercialDetails = (data) => {
  const errors = {};

  // Validate price for commercial properties
  if (!data.price || !validatePrice(data.price)) {
    errors.price = 'Please enter a valid price';
  }

  // propertyStatus and ownershipType are optional for Details step
  // Only validate if a value is provided
  if (data.propertyStatus === '') {
    // Optional field - no error
  }

  if (data.ownershipType === '') {
    // Optional field - no error
  }

  // Validate property age if provided
  if (data.propertyAge !== '' && data.propertyAge != null) {
    const ageNum = Number(data.propertyAge);
    if (isNaN(ageNum) || ageNum < 0) {
      errors.propertyAge = 'Property age must be a valid number';
    }
  }

  // suitableFor is optional - only validate if some items are selected
  // This is handled in the UI

  // Validate ceiling height if provided
  if (data.ceilingHeight && data.ceilingHeight !== '') {
    if (!validateArea(data.ceilingHeight)) {
      errors.ceilingHeight = 'Ceiling height must be a valid number';
    }
  }

  // Validate frontage width if provided
  if (data.frontageWidth && data.frontageWidth !== '') {
    if (!validateArea(data.frontageWidth)) {
      errors.frontageWidth = 'Frontage width must be a valid number';
    }
  }

  return errors;
};

// ==================== RENTAL INFO VALIDATION ====================
// For PropertyDetailsStep - only check required fields shown on that step
export const validateRentalInfo = (data) => {
  const errors = {};

  // Monthly rent is optional during Details step
  if (data.monthlyRent && data.monthlyRent !== '') {
    if (!validatePrice(data.monthlyRent)) {
      errors.monthlyRent = 'Monthly rent must be greater than 0';
    }
  }

  // Security deposit is optional
  if (data.securityDeposit && data.securityDeposit !== '') {
    if (!validatePrice(data.securityDeposit)) {
      errors.securityDeposit = 'Security deposit must be greater than 0';
    }
  }

  // Available from date is optional for Details step
  // Can be set in Contact or other steps

  return errors;
};

// ==================== UPDATED COMPLETE FORM VALIDATION ====================
export const validateCompleteFormExpanded = (formData) => {
  const allErrors = {};

  // Basic info
  allErrors.basicInfo = validateBasicInfo(formData.basicInfo);
  allErrors.location = validateLocation(formData.location);
  allErrors.contact = validateContact(formData.contact);

  // Property type specific validation
  const { propertyType, subcategory } = formData.basicInfo;

  const isPlot = isResidentialPlot(propertyType, subcategory);
  // New project
  if (subcategory && subcategory.startsWith('NEW_PROJECT')) {
    allErrors.newProjectInfo = validateNewProjectInfo(formData.newProjectInfo);
    allErrors.projectPricing = validateProjectPricing(formData.projectPricing, subcategory === BUY_SUBCATEGORIES.NEW_PROJECT_PLOT);
    const unitErrors = subcategory === BUY_SUBCATEGORIES.NEW_PROJECT_PLOT
      ? {} : validateUnitConfiguration(formData.projectPricing.unitConfigurations);
    if (Object.keys(unitErrors).length > 0) {
      allErrors.unitConfigurations = unitErrors;
    }
  }

  // Resale
  if (!isPlot && subcategory && subcategory.startsWith('RESALE')) {
    allErrors.resaleInfo = validateResaleInfo(formData.resaleInfo);
  }

  // Rental
  if (isRentalProperty(propertyType)) {
    allErrors.rentalInfo = validateRentalInfo(formData.rentalInfo);
  }

  // Commercial
  if (isCommercialProperty(propertyType)) {
    allErrors.commercialDetails = validateCommercialDetails(formData.commercialDetails);
  }

  // Property details
  allErrors.propertyDetails = isPlot ? validatePlotDetails(formData) : validatePropertyDetails(formData.propertyDetails, propertyType, subcategory);

  // Images - Required at submission time
  if (!formData.images || formData.images.length === 0) {
    allErrors.images = { images: 'At least one image is required' };
  } else {
    const imageErrors = validateImages(formData.images);
    if (Object.keys(imageErrors).length > 0) {
      allErrors.images = imageErrors;
    }
  }

  // Filter out empty error objects
  return Object.fromEntries(
    Object.entries(allErrors).filter(([, errors]) => Object.keys(errors).length > 0)
  );
};
