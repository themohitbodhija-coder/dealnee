/**
 * Property Form Utilities
 * Production-ready helper functions for form management, storage, and data transformation
 */

import { FURNISHING_STATUS, PROPERTY_TYPES, getFurnishingItems } from '../constants/propertyConstants';
import { INITIAL_FORM_STATE } from '../reducers/propertyFormReducer';

// ==================== CONSTANTS ====================
const FORM_STORAGE_KEY = 'property_form_draft';
const FORM_STEP_STORAGE_KEY = 'property_form_step';
const FORM_TIMESTAMP_KEY = 'property_form_timestamp';
const FORM_VERSION_KEY = 'property_form_version';
const CURRENT_FORM_VERSION = '2.0'; // Increment when schema changes
const FORM_EXPIRY_DAYS = 7;

// ==================== LOCAL STORAGE HELPERS ====================

/**
 * Save form data to localStorage with version and timestamp
 * NOTE: File objects are stripped out as they can't be JSON serialized
 */
export const saveFormToLocalStorage = (formData) => {
  try {
    if (!formData || typeof formData !== 'object') {
      console.warn('Invalid form data for storage:', formData);
      return;
    }

    // Create a shallow copy and remove File objects from images
    // File objects can't be JSON serialized, so we exclude them
    const dataToSave = {
      ...formData,
      images: (formData.images || []).map((img) => ({
        // Keep preview and name, but exclude the File object
        preview: img.preview?.startsWith('blob:') || img.preview?.startsWith('data:') ? '' : img.preview || '',
        ...(img.uploadId ? { uploadId: img.uploadId, uploadState: img.uploadState } : {}),
        ...(img.id ? { id: img.id } : {}),
        ...(img.url ? { url: img.url } : {}),
        name: img.name,
        size: img.size,
        type: img.type,
        // NOT including: file (File object can't be serialized)
      })),
    };

    const storageData = {
      version: CURRENT_FORM_VERSION,
      data: dataToSave,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + FORM_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    };

    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(storageData));
    console.log('[FormStorage] Form saved (images stored without File objects)');
  } catch (error) {
    console.error('Error saving form to localStorage:', error);
    // Silently fail - don't disrupt user experience
  }
};

/**
 * Load form data from localStorage with validation
 */
export const loadFormFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(FORM_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const storageData = JSON.parse(stored);

    // Check version compatibility
    if (storageData.version !== CURRENT_FORM_VERSION) {
      console.warn('Form version mismatch:', storageData.version, 'vs', CURRENT_FORM_VERSION);
      return null;
    }

    // Check expiry
    const expiresAt = new Date(storageData.expiresAt);
    if (expiresAt < new Date()) {
      console.warn('Saved form has expired');
      clearFormFromLocalStorage();
      return null;
    }

    // Validate form shape
    if (!validateFormDataShape(storageData.data)) {
      console.warn('Invalid form data shape');
      return null;
    }

    return storageData.data;
  } catch (error) {
    console.error('Error loading form from localStorage:', error);
    return null;
  }
};

/**
 * Clear form data from localStorage
 */
export const clearFormFromLocalStorage = () => {
  try {
    localStorage.removeItem(FORM_STORAGE_KEY);
    localStorage.removeItem(FORM_STEP_STORAGE_KEY);
    localStorage.removeItem(FORM_TIMESTAMP_KEY);
    localStorage.removeItem(FORM_VERSION_KEY);
  } catch (error) {
    console.error('Error clearing form from localStorage:', error);
  }
};

/**
 * Clean corrupted localStorage data
 */
export const cleanCorruptedLocalStorage = () => {
  try {
    clearFormFromLocalStorage();
  } catch (error) {
    console.error('Error cleaning localStorage:', error);
  }
};

/**
 * Validate form data shape against initial state
 */
export const validateFormDataShape = (formData) => {
  if (!formData || typeof formData !== 'object') {
    return false;
  }

  try {
    // Check all required top-level keys exist
    const requiredKeys = Object.keys(INITIAL_FORM_STATE);
    const hasAllKeys = requiredKeys.every((key) => key in formData);

    if (!hasAllKeys) {
      console.warn('Form missing required keys');
      return false;
    }

    // Validate basicInfo structure
    if (!formData.basicInfo || typeof formData.basicInfo !== 'object') {
      return false;
    }

    // Validate images is an array
    if (!Array.isArray(formData.images)) {
      return false;
    }

    // If images have object URLs, they need to be strings
    if (
      formData.images.some(
        (img) =>
          !img || typeof img !== 'object' || typeof img.preview !== 'string'
      )
    ) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating form shape:', error);
    return false;
  }
};

// ==================== FORM STATE HELPERS ====================

export const getDefaultFurnishingItemsForStatus = (status) => {
  switch (status) {
    case FURNISHING_STATUS.FULLY_FURNISHED:
      return [
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
      ];
    case FURNISHING_STATUS.SEMI_FURNISHED:
      return ['ac', 'modular_kitchen', 'wardrobe', 'bed', 'sofa', 'geyser'];
    case FURNISHING_STATUS.UNFURNISHED:
    default:
      return [];
  }
};

export const getFurnishingItemDisplayLabels = (itemIds = []) => {
  const furnishingItems = getFurnishingItems();
  const itemMap = new Map(furnishingItems.map((item) => [item.id, item.label]));

  return (Array.isArray(itemIds) ? itemIds : []).map((itemId) => itemMap.get(itemId) || itemId);
};

export const getPropertyLocationLabel = (location = {}) => {
  location = location || {};
  const values = [location.address, location.locality, location.city, location.state, location.pincode]
    .filter((value) => value != null && String(value).trim() !== '')
    .map((value) => String(value).trim());
  return values.filter((value, index) => values.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index).join(', ');
};

export const getPropertyRoomStats = (property = {}) => {
  if (property.propertyType === 'BUY' && property.subcategory === 'NEW_PROJECT_PLOT') {
    return { bedrooms: 0, bathrooms: 0 };
  }
  const pickFirstNumeric = (...values) => {
    const validValues = values
      .filter((value) => value !== null && value !== undefined && value !== '')
      .map((value) => Number(value))
      .filter((numericValue) => Number.isFinite(numericValue) && numericValue >= 0);

    const positiveValue = validValues.find((numericValue) => numericValue > 0);
    if (positiveValue !== undefined) {
      return positiveValue;
    }

    return validValues.length > 0 ? validValues[0] : 0;
  };

  return {
    bedrooms: pickFirstNumeric(
      property.bedrooms,
      property.propertyDetails?.bedrooms,
      property.rentalInfo?.bedrooms,
      property.resaleInfo?.bedrooms,
      property.basicInfo?.bedrooms
    ),
    bathrooms: pickFirstNumeric(
      property.bathrooms,
      property.propertyDetails?.bathrooms,
      property.rentalInfo?.bathrooms,
      property.resaleInfo?.bathrooms,
      property.basicInfo?.bathrooms
    ),
  };
};

/**
 * Check if form has meaningful changes
 */
export const isFormDirty = (currentForm, savedForm) => {
  return JSON.stringify(currentForm) !== JSON.stringify(savedForm);
};

/**
 * Calculate form progress percentage
 */
export const getFormProgress = (formData) => {
  if (!formData) return 0;

  let completedSections = 0;
  const totalSections = 6; // basic_info, location, contact, details, images, review

  try {
    // Check basic info
    if (
      formData.basicInfo?.title?.trim() &&
      formData.basicInfo?.propertyType
    ) {
      completedSections++;
    }

    // Check location (pincode removed from required fields)
    if (
      formData.location?.address?.trim()
    ) {
      completedSections++;
    }

    // Check contact
    if (
      // Only phone is required/considered for contact completeness
      formData.contact?.phone
    ) {
      completedSections++;
    }

    // Check property details
    if (
      formData.propertyDetails?.area &&
      formData.propertyDetails?.areaUnit
    ) {
      completedSections++;
    }

    // Check images
    if (Array.isArray(formData.images) && formData.images.length > 0) {
      completedSections++;
    }

    // Review is always accessible
    if (formData.basicInfo?.title) {
      completedSections++;
    }
  } catch (error) {
    console.error('Error calculating form progress:', error);
    return 0;
  }

  return Math.round((completedSections / totalSections) * 100);
};

// ==================== IMAGE HANDLING ====================

/**
 * Process single image file
 */
export const processImageFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      reject(new Error(`Image size must be less than ${maxSizeMB}MB`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve({
          file,
          preview: reader.result,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      } catch (error) {
        reject(new Error('Failed to process image'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onabort = () => reject(new Error('File reading was aborted'));

    reader.readAsDataURL(file);
  });
};

/**
 * Process multiple image files
 */
export const processMultipleImages = async (files) => {
  if (!Array.isArray(files)) {
    return [];
  }

  const results = [];
  const errors = [];

  for (const file of files) {
    try {
      const processed = await processImageFile(file);
      results.push(processed);
    } catch (error) {
      console.error(`Error processing ${file?.name}:`, error);
      errors.push({
        name: file?.name,
        error: error.message,
      });
    }
  }

  return { results, errors };
};

/**
 * Clean up image preview URLs to prevent memory leaks
 */
export const cleanupImagePreviewUrls = (images) => {
  if (!Array.isArray(images)) {
    return;
  }

  images.forEach((img) => {
    if (img?.preview && typeof img.preview === 'string' && img.preview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(img.preview);
      } catch (error) {
        console.warn('Error revoking object URL:', error);
      }
    }
  });
};

// ==================== FORM DATA TRANSFORMATION ====================

/**
 * Transform form data into API submission format
 */
export const transformFormDataForSubmission = (formData, userId) => {
  if (!formData || typeof formData !== 'object') {
    throw new Error('Invalid form data');
  }

  const {
    basicInfo = {},
    location = {},
    contact = {},
    propertyDetails = {},
    resaleInfo = {},
    rentalInfo = {},
    commercialDetails = {},
    newProjectInfo = {},
    projectPricing = {},
  } = formData;

  try {
    const isCommercialBuy = basicInfo.propertyType === 'COMMERCIAL';
    const salePrice = isCommercialBuy ? (commercialDetails.price ?? propertyDetails.price) : propertyDetails.price;
    const saleArea = isCommercialBuy ? (commercialDetails.builtUpArea ?? propertyDetails.area) : propertyDetails.area;
    const submissionData = {
      // Basic Info
      propertyId: (basicInfo.propertyId ?? '').trim(),
      title: (basicInfo.title ?? '').trim(),
      description: (basicInfo.description ?? '').trim(),
      propertyType: basicInfo.propertyType || null,
      category: basicInfo.category || null,
      subcategory: basicInfo.subcategory || null,

      // Location
      location: {
        address: (location.address ?? '').trim() || (location.locality ?? '').trim(),
        city: (location.city ?? '').trim(),
        state: (location.state ?? '').trim(),
        // pincode intentionally omitted from submission (user requested removal)
        latitude: location.latitude || null,
        longitude: location.longitude || null,
        landmark: (location.landmark ?? '').trim() || null,
        locality: (location.locality ?? '').trim() || null,
      },

      // Contact
      contact: {
        // name and email intentionally omitted from submission
        phone: (contact.phone ?? '').replace(/\D/g, ''),
      },

      // Property Details (Common)
      price: salePrice !== '' && salePrice != null ? Number(salePrice) : null,
      area: saleArea !== '' && saleArea != null ? Number(saleArea) : null,
      areaUnit: propertyDetails.areaUnit || 'sq_ft',
      bedrooms: propertyDetails.bedrooms !== undefined && propertyDetails.bedrooms !== null && propertyDetails.bedrooms !== '' ? Number(propertyDetails.bedrooms) : null,
      bathrooms: propertyDetails.bathrooms !== undefined && propertyDetails.bathrooms !== null && propertyDetails.bathrooms !== '' ? Number(propertyDetails.bathrooms) : null,
      furnishing: propertyDetails.furnishing || rentalInfo.furnishingStatus || null,
      plotArea: propertyDetails.plotArea ? Number(propertyDetails.plotArea) : null,

    // Amenities & Facilities
      amenities: Array.isArray(propertyDetails.amenities) ? propertyDetails.amenities : [],
      outdoorFeatures: Array.isArray(propertyDetails.outdoorFeatures) ? propertyDetails.outdoorFeatures : [],
      furnishingItems: Array.isArray(propertyDetails.furnishingItems) ? propertyDetails.furnishingItems : [],
      // Remove any 'bank' facility to prevent accidental submission of bank fields
      facilities: (Array.isArray(propertyDetails.facilities) ? propertyDetails.facilities : []).filter(f => f !== 'bank'),
      // Featured Status
      featured: Boolean(propertyDetails.featured),

      // Images are uploaded separately as multipart files.
      // Here we keep images empty so server only gets actual file uploads.
      images: [],


      // userId for tracking
      userId: userId || 'unknown',
    };

    // Add Resale-specific info if applicable
    if (resaleInfo && Object.keys(resaleInfo).length > 0) {
      submissionData.resaleInfo = {
        ...resaleInfo,
        approval: resaleInfo.approval || null,
        reraNumber: (resaleInfo.reraNumber ?? '').trim() || null,
        expectedPrice: resaleInfo.expectedPrice ? Number(resaleInfo.expectedPrice) : null,
        pricePerSqft: resaleInfo.pricePerSqft ? Number(resaleInfo.pricePerSqft) : null,
        maintenanceCharges: resaleInfo.maintenanceCharges
          ? Number(resaleInfo.maintenanceCharges)
          : null,
        bookingAmount: resaleInfo.bookingAmount ? Number(resaleInfo.bookingAmount) : null,
        floorNumber: resaleInfo.floorNumber !== '' && resaleInfo.floorNumber != null ? Number(resaleInfo.floorNumber) : null,
        totalFloors: resaleInfo.totalFloors ? Number(resaleInfo.totalFloors) : null,
        propertyAge: resaleInfo.propertyAge !== '' && resaleInfo.propertyAge != null ? Number(resaleInfo.propertyAge) : null,
        ownershipType: resaleInfo.ownershipType || null,
        furnishingStatus: resaleInfo.furnishingStatus || null,
        balcony: resaleInfo.balcony || null,
        readyToMove: Boolean(resaleInfo.readyToMove),
        possessionStatus: resaleInfo.possessionStatus || null,
        availableFrom: resaleInfo.availableFrom || null,
      };
    }

    // Add Rental-specific info if applicable
    if (rentalInfo && Object.keys(rentalInfo).length > 0) {
      submissionData.rentalInfo = {
        monthlyRent: rentalInfo.monthlyRent ? Number(rentalInfo.monthlyRent) : null,
        securityDeposit: rentalInfo.securityDeposit
          ? Number(rentalInfo.securityDeposit)
          : null,
        maintenanceCharges: rentalInfo.maintenanceCharges
          ? Number(rentalInfo.maintenanceCharges)
          : null,
        bedrooms: rentalInfo.bedrooms !== undefined && rentalInfo.bedrooms !== null && rentalInfo.bedrooms !== '' ? Number(rentalInfo.bedrooms) : (submissionData.bedrooms ?? null),
        bathrooms: rentalInfo.bathrooms !== undefined && rentalInfo.bathrooms !== null && rentalInfo.bathrooms !== '' ? Number(rentalInfo.bathrooms) : (submissionData.bathrooms ?? null),
        furnishingStatus: rentalInfo.furnishingStatus || null,
        availableFrom: rentalInfo.availableFrom || null,
  // tenantPreference and noticePeriod removed per user request
      };
    } else {
      submissionData.rentalInfo = {
        bedrooms: submissionData.bedrooms ?? null,
        bathrooms: submissionData.bathrooms ?? null,
      };
    }

    if (rentalInfo?.furnishingStatus || resaleInfo?.furnishingStatus || propertyDetails?.furnishing) {
      submissionData.furnishingStatus = rentalInfo.furnishingStatus || resaleInfo.furnishingStatus || propertyDetails.furnishing || null;
    }

    // If property is RENT but user filled generic price field instead of rentalInfo.monthlyRent,
    // accept that as monthlyRent to improve UX (move price -> rentalInfo.monthlyRent)
    if (submissionData.propertyType === 'RENT') {
      // If rentalInfo not provided or monthlyRent missing, fallback to price
      const hasMonthly = submissionData.rentalInfo && submissionData.rentalInfo.monthlyRent;
      if (!hasMonthly && submissionData.price && Number(submissionData.price) > 0) {
        submissionData.rentalInfo = submissionData.rentalInfo || {};
        submissionData.rentalInfo.monthlyRent = Number(submissionData.price);
        submissionData.price = null; // clear generic price for rent
      }
    }

    // Add Commercial-specific info if applicable
    if (commercialDetails && Object.keys(commercialDetails).length > 0) {
      submissionData.commercialDetails = {
        ...(isCommercialBuy ? {
          ...commercialDetails,
          builtUpArea: saleArea !== '' && saleArea != null ? Number(saleArea) : null,
          carpetArea: commercialDetails.carpetArea !== '' && commercialDetails.carpetArea != null ? Number(commercialDetails.carpetArea) : null,
        } : {}),
        propertyStatus: commercialDetails.propertyStatus || null,
        ownershipType: commercialDetails.ownershipType || null,
        propertyAge: commercialDetails.propertyAge
          ? Number(commercialDetails.propertyAge)
          : null,
        ceilingHeight: commercialDetails.ceilingHeight
          ? Number(commercialDetails.ceilingHeight)
          : null,
        frontageWidth: commercialDetails.frontageWidth
          ? Number(commercialDetails.frontageWidth)
          : null,
        leaseDuration: (commercialDetails.leaseDuration ?? '').trim() || null,
        lockInPeriod: (commercialDetails.lockInPeriod ?? '').trim() || null,
        suitableFor: Array.isArray(commercialDetails.suitableFor)
          ? commercialDetails.suitableFor
          : [],
      };
    }

    // Add New Project info if applicable
    if (newProjectInfo && Object.keys(newProjectInfo).length > 0) {
      submissionData.newProjectInfo = {
        ...(basicInfo.propertyType === 'BUY' && basicInfo.subcategory === 'NEW_PROJECT_PLOT' ? {
          plotLength: newProjectInfo.plotLength !== '' && newProjectInfo.plotLength != null ? Number(newProjectInfo.plotLength) : null,
          plotWidth: newProjectInfo.plotWidth !== '' && newProjectInfo.plotWidth != null ? Number(newProjectInfo.plotWidth) : null,
        } : {}),
        projectName: (newProjectInfo.projectName ?? '').trim() || null,
        builderName: (newProjectInfo.builderName ?? '').trim() || null,
        projectType: newProjectInfo.projectType || null,
        projectStatus: newProjectInfo.projectStatus || null,
        approval: newProjectInfo.approval || null,
        reraNumber: (newProjectInfo.reraNumber ?? '').trim() || null,
        possessionDate: newProjectInfo.possessionDate || null,
      };
    }

    // Add Project Pricing if applicable
    if (projectPricing && Object.keys(projectPricing).length > 0) {
      submissionData.projectPricing = {
        startingPrice: projectPricing.startingPrice
          ? Number(projectPricing.startingPrice)
          : null,
        priceRange: (projectPricing.priceRange ?? '').trim() || null,
        pricePerSqft: projectPricing.pricePerSqft
          ? Number(projectPricing.pricePerSqft)
          : null,
        unitConfigurations: projectPricing.unitConfigurations || {},
      };
    }

    return submissionData;
  } catch (error) {
    console.error('Error transforming form data:', error);
    throw new Error('Failed to prepare form data for submission');
  }
};

// ==================== TIMESTAMP HELPERS ====================

/**
 * Get the last time the form was saved
 */
export const getFormLastSavedTime = () => {
  try {
    const stored = localStorage.getItem(FORM_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const data = JSON.parse(stored);
    return data.timestamp ? new Date(data.timestamp) : null;
  } catch (error) {
    console.error('Error getting form timestamp:', error);
    return null;
  }
};

// ==================== FORMATTING HELPERS ====================

/**
 * Format price in Indian rupee format
 */
export const formatPrice = (price) => {
  const num = Number(price);
  if (isNaN(num)) return '₹0';
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(1)} Cr`;
  }
  if (num >= 100000) {
    return `${(num / 100000).toFixed(1)} Lakh`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
};

/**
 * Format area with unit
 */
export const formatArea = (area, unit = 'sq_ft') => {
  const num = Number(area);
  if (isNaN(num)) return `0 ${unit}`;
  return `${num.toLocaleString('en-IN')} ${unit}`;
};

/**
 * Get property type color for UI
 */
export const getPropertyTypeColor = (propertyType) => {
  const colors = {
    [PROPERTY_TYPES.BUY]: 'bg-blue-500',
    [PROPERTY_TYPES.RENT]: 'bg-green-500',
    [PROPERTY_TYPES.COMMERCIAL]: 'bg-purple-500',
  };
  return colors[propertyType] || 'bg-gray-500';
};

/**
 * Get property type icon
 */
export const getPropertyTypeIcon = (propertyType) => {
  const icons = {
    [PROPERTY_TYPES.BUY]: '🛒',
    [PROPERTY_TYPES.RENT]: '🔑',
    [PROPERTY_TYPES.COMMERCIAL]: '🏢',
  };
  return icons[propertyType] || '🏠';
};
