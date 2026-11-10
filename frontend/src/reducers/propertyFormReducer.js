/**
 * Property Form Reducer
 * Centralized state management for the property form using useReducer
 * Supports all form mutations in a clean, scalable, and predictable way
 */

export const INITIAL_FORM_STATE = {
  basicInfo: {
    title: '',
    description: '',
    propertyType: '',
    category: '',
    subcategory: '',
    propertyId: '',
    companyName: 'DEL',
  },
  location: {
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    landmark: '',
    locality: '',
    roadWidth: '',
    mainRoadConnectivity: '',
    nearbyMetroRailwayAirport: '',
    googleMapLocation: '',
  },
  contact: {
    name: '',
    email: 'dealinee0@gmail.com',
    phone: '9776631999',
  },
  // ========== NEW PROJECT FIELDS ==========
  newProjectInfo: {
    plotLength: '',
    plotWidth: '',
    projectName: '',
    builderName: '',
    projectType: '', // Apartment, Villa
    projectStatus: '', // NEW_LAUNCH, UNDER_CONSTRUCTION, READY_TO_MOVE
    approval: '', // BDA, BMC
    reraNumber: '',
    possessionDate: '',
  },
  // ========== PROJECT PRICING & UNITS ==========
  projectPricing: {
    startingPrice: '',
    priceRange: '',
    pricePerSqft: '',
    unitConfigurations: {
      bhk2: {
        superBuildUpArea: '',
        carpetArea: '',
        landArea: '',
        price: '',
      },
      bhk3: {
        superBuildUpArea: '',
        carpetArea: '',
        landArea: '',
        price: '',
      },
      bhk4: {
        superBuildUpArea: '',
        carpetArea: '',
        landArea: '',
        price: '',
      },
    },
  },
  // ========== FLOOR PLANS ==========
  floorPlans: {
    bhk2FloorPlan: null,
    bhk3FloorPlan: null,
    masterPlan: null,
    siteLayout: null,
  },
  // ========== RESALE FIELDS ==========
  resaleInfo: {
    approval: '',
    reraNumber: '',
    expectedPrice: '',
    pricePerSqft: '',
    maintenanceCharges: '',
    bookingAmount: '',
    floorNumber: '',
    totalFloors: '',
    propertyAge: '',
    ownershipType: '',
    furnishingStatus: '',
    balcony: '',
    readyToMove: false,
    possessionStatus: '',
    availableFrom: '',
  },
  // ========== PROPERTY DETAILS ==========
  propertyDetails: {
    price: '',
    area: '',
    areaUnit: 'sq_ft',
    bedrooms: '',
    bathrooms: '',
    furnishing: '',
  // tenantPreference removed per user request
    deposit: '',
    maintenance: '',
    carpetArea: '',
    builtUpArea: '',
    featured: false,
    plotArea: '',
    builtUpAreaVilla: '',
    floorsAvailable: '',
    servantRoom: '',
    studyRoom: '',
    facing: '',
    parkingCapacity: '',
    ceilingHeight: '',
    frontageWidth: '',
    furnishingItems: [], // AC, Kitchen, Wardrobe, etc.
    amenities: [],
    facilities: [],
    outdoorFeatures: [], // Private Garden, Terrace, etc.
  },
  // ========== COMMERCIAL FIELDS ==========
  commercialDetails: {
    price: '',
    propertyStatus: '', // Ready to Move, Under Construction
    ownershipType: '',
    propertyAge: '',
    floorNumber: '',
    totalFloors: '',
    facing: '',
    furnishingType: '', // Furnished, Semi-Furnished, Bare Shell
    suitableFor: [], // Corporate Office, Retail Shop, etc.
    propertyDocumentsClear: false,
    loanApproved: false,
    occupancyCertificate: false,
    tradeLicense: false,
    commercialApproval: false,
    businessAdvantages: '',
    footfallDetails: '',
    investmentOpportunity: '',
    rentalIncomePotential: '',
    primeLocationBenefits: '',
    leaseDuration: '',
    lockInPeriod: '',
    rentEscalation: '',
    brokerageCharges: '',
    taxAndRegistration: '',
    washroom: false,
    pantryAvailability: false,
    parkingAvailability: false,
    marketArea: '',
    commercialZone: '',
    nearbyTransport: '',
    parkingSpaceAround: '',
  },
  // ========== RENTAL FIELDS ==========
  rentalInfo: {
    monthlyRent: '',
    securityDeposit: '',
    maintenanceCharges: '',
    furnishingStatus: '',
    availableFrom: '',
    preferredTenant: '', // Family, Bachelor, Working Professional, Student
    separateEntrance: false,
    waterSupply: false,
    petFriendly: false,
  },
  projectDetails: {
    projectName: '',
    developer: '',
    launchDate: '',
    completionDate: '',
    possessionDate: '',
    rera: '',
    totalTowers: '',
    totalFlats: '',
  },
  images: [],
  metadata: {
    createdAt: null,
    updatedAt: null,
    currentStep: 0,
  },
};

// ==================== ACTION TYPES ====================
// API records and older drafts may omit nested New Project pricing fields.
// Hydrate the form shape without replacing any saved pricing or BHK values.
export const initializePropertyFormState = (state) => {
  const pricing = state.projectPricing || {};
  const units = pricing.unitConfigurations || {};
  const defaultPricing = INITIAL_FORM_STATE.projectPricing;
  // API amenities are top-level; checkboxes and submission use propertyDetails.
  const propertyDetails = {
    ...state.propertyDetails,
    amenities: state.propertyDetails?.amenities ?? state.amenities ?? [],
    facilities: state.propertyDetails?.facilities ?? state.facilities ?? [],
    furnishingItems: state.propertyDetails?.furnishingItems ?? state.furnishingItems ?? [],
    outdoorFeatures: state.propertyDetails?.outdoorFeatures ?? state.outdoorFeatures ?? [],
    featured: state.propertyDetails?.featured ?? state.featured ?? false,
  };
  const isCommercialBuy = state.basicInfo?.propertyType === 'COMMERCIAL';

  return {
    ...state,
    propertyDetails,
    ...(state.basicInfo?.propertyType === 'RENT' ? {
      basicInfo: { ...state.basicInfo, category: state.basicInfo.category === 'Rent Property' ? 'RENT' : state.basicInfo.category },
    } : {}),
    ...(state.basicInfo?.propertyType === 'BUY' ? {
      basicInfo: {
        ...state.basicInfo,
        category: ({ 'New Projects': 'NEW_PROJECT', Resale: 'RESALE' })[state.basicInfo.category] || state.basicInfo.category,
      },
    } : {}),
    ...(isCommercialBuy ? {
      basicInfo: { ...state.basicInfo, category: ['LEASE', 'Commercial Lease'].includes(state.basicInfo.category) || state.basicInfo.subcategory?.endsWith('_LEASE') ? 'LEASE' : 'BUY' },
      propertyDetails: {
        ...propertyDetails,
        facilities: state.propertyDetails?.facilities ?? state.facilities ?? [],
        furnishingItems: state.propertyDetails?.furnishingItems ?? state.furnishingItems ?? [],
        featured: state.propertyDetails?.featured ?? state.featured ?? false,
      },
      commercialDetails: {
        ...state.commercialDetails,
        price: state.commercialDetails?.price ?? state.propertyDetails?.price ?? '',
        builtUpArea: state.commercialDetails?.builtUpArea ?? state.propertyDetails?.area ?? '',
      },
    } : {}),
    newProjectInfo: { ...INITIAL_FORM_STATE.newProjectInfo, ...state.newProjectInfo },
    projectPricing: {
      ...defaultPricing,
      ...pricing,
      unitConfigurations: {
        ...units,
        ...Object.fromEntries(Object.entries(defaultPricing.unitConfigurations).map(([key, defaults]) => [
          key, { ...defaults, ...units[key] },
        ])),
      },
    },
  };
};

export const FORM_ACTIONS = {
  UPDATE_FIELD: 'UPDATE_FIELD',
  UPDATE_NESTED_FIELD: 'UPDATE_NESTED_FIELD',
  UPDATE_AMENITY: 'UPDATE_AMENITY',
  UPDATE_FACILITY: 'UPDATE_FACILITY',
  UPDATE_FURNISHING_ITEM: 'UPDATE_FURNISHING_ITEM',
  UPDATE_OUTDOOR_FEATURE: 'UPDATE_OUTDOOR_FEATURE',
  UPDATE_SUITABLE_FOR: 'UPDATE_SUITABLE_FOR',
  UPDATE_UNIT_CONFIGURATION: 'UPDATE_UNIT_CONFIGURATION',
  UPDATE_FLOOR_PLAN: 'UPDATE_FLOOR_PLAN',
  ADD_IMAGE: 'ADD_IMAGE',
  REMOVE_IMAGE: 'REMOVE_IMAGE',
  SET_COVER_IMAGE: 'SET_COVER_IMAGE',
  RESET_FORM: 'RESET_FORM',
  LOAD_FORM: 'LOAD_FORM',
  SET_PROPERTY_TYPE: 'SET_PROPERTY_TYPE',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  UPDATE_METADATA: 'UPDATE_METADATA',
};

// ==================== REDUCER ====================
export const propertyFormReducer = (state, action) => {
  switch (action.type) {
    // Update a top-level field in a section
    case FORM_ACTIONS.UPDATE_FIELD: {
      const { section, field, value } = action.payload;
      return {
        ...state,
        [section]: {
          ...state[section],
          [field]: value,
        },
        metadata: {
          ...state.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Update a nested field (for future expansion)
    case FORM_ACTIONS.UPDATE_NESTED_FIELD: {
      const { section, nested, field, value } = action.payload;
      return {
        ...state,
        [section]: {
          ...state[section],
          [nested]: {
            ...(state[section][nested] || {}),
            [field]: value,
          },
        },
        metadata: {
          ...state.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Add or remove amenity
    case FORM_ACTIONS.UPDATE_AMENITY: {
      const { amenity, checked } = action.payload;
      const amenities = Array.isArray(state.propertyDetails.amenities) ? state.propertyDetails.amenities : [];
      return {
        ...state,
        propertyDetails: {
          ...state.propertyDetails,
          amenities: checked
            ? [...amenities, amenity]
            : amenities.filter((a) => a !== amenity),
        },
        metadata: {
          ...state.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Add or remove facility
    case FORM_ACTIONS.UPDATE_FACILITY: {
      const { facility, checked } = action.payload;
      const facilities = Array.isArray(state.propertyDetails.facilities) ? state.propertyDetails.facilities : [];
      return {
        ...state,
        propertyDetails: {
          ...state.propertyDetails,
          facilities: checked
            ? [...facilities, facility]
            : facilities.filter((f) => f !== facility),
        },
        metadata: {
          ...state.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Add or remove furnishing item
    case FORM_ACTIONS.UPDATE_FURNISHING_ITEM: {
      const { item, checked } = action.payload;
      const furnishingItems = Array.isArray(state.propertyDetails.furnishingItems) ? state.propertyDetails.furnishingItems : [];
      return {
        ...state,
        propertyDetails: {
          ...state.propertyDetails,
          furnishingItems: checked
            ? [...furnishingItems, item]
            : furnishingItems.filter((f) => f !== item),
        },
        metadata: {
          ...state.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Add or remove outdoor feature
    case FORM_ACTIONS.UPDATE_OUTDOOR_FEATURE: {
      const { feature, checked } = action.payload;
      const outdoorFeatures = Array.isArray(state.propertyDetails.outdoorFeatures) ? state.propertyDetails.outdoorFeatures : [];
      return {
        ...state,
        propertyDetails: {
          ...state.propertyDetails,
          outdoorFeatures: checked
            ? [...outdoorFeatures, feature]
            : outdoorFeatures.filter((f) => f !== feature),
        },
        metadata: {
          ...state.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Add or remove business suitable for category
    case FORM_ACTIONS.UPDATE_SUITABLE_FOR: {
      const { category, checked } = action.payload;
      const suitableFor = Array.isArray(state.commercialDetails.suitableFor) ? state.commercialDetails.suitableFor : [];
      return {
        ...state,
        commercialDetails: {
          ...state.commercialDetails,
          suitableFor: checked
            ? [...suitableFor, category]
            : suitableFor.filter((s) => s !== category),
        },
        metadata: {
          ...state.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Update unit configuration (bhk2, bhk3, bhk4)
    case FORM_ACTIONS.UPDATE_UNIT_CONFIGURATION: {
      const { bhkType, field, value } = action.payload;
      return {
        ...state,
        projectPricing: {
          ...state.projectPricing,
          unitConfigurations: {
            ...state.projectPricing.unitConfigurations,
            [bhkType]: {
              ...state.projectPricing.unitConfigurations[bhkType],
              [field]: value,
            },
          },
        },
        metadata: {
          ...state.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Update floor plan image
    case FORM_ACTIONS.UPDATE_FLOOR_PLAN: {
      const { planType, imageData } = action.payload;
      return {
        ...state,
        floorPlans: {
          ...state.floorPlans,
          [planType]: imageData,
        },
        metadata: {
          ...state.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Add images
    case FORM_ACTIONS.ADD_IMAGE: {
      const { images } = action.payload;
      const updatedImages = [...state.images, ...images];

      return {
        ...state,
        images: updatedImages,
        metadata: {
          ...state.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Remove image by index
    case FORM_ACTIONS.REMOVE_IMAGE: {
      const { index } = action.payload;
      return {
        ...state,
        images: state.images.filter((_, i) => i !== index),
        metadata: {
          ...state.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Set an image as the cover photo by moving it to index 0.
    // PropertyCard (and the backend, since images are submitted in
    // array order) always treat images[0] as the cover photo, so
    // reordering the array is the only change needed.
    case FORM_ACTIONS.SET_COVER_IMAGE: {
      const { index } = action.payload;
      if (
        typeof index !== 'number' ||
        index <= 0 ||
        index >= state.images.length
      ) {
        // Already the cover image, or an invalid index — nothing to do
        return state;
      }

      const images = [...state.images];
      const [selected] = images.splice(index, 1);
      images.unshift(selected);

      return {
        ...state,
        images,
        metadata: {
          ...state.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Reset form to initial state
    case FORM_ACTIONS.RESET_FORM: {
      return INITIAL_FORM_STATE;
    }

    // Load entire form from storage or other source
    case FORM_ACTIONS.LOAD_FORM: {
      return {
        ...action.payload,
        metadata: {
          ...(action.payload.metadata || {}),
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Set property type and reset dependent fields
    case FORM_ACTIONS.SET_PROPERTY_TYPE: {
      const { propertyType } = action.payload;
      return {
        ...state,
        basicInfo: {
          ...state.basicInfo,
          propertyType,
          category: '',
          subcategory: '',
        },
        metadata: {
          ...state.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Update current step
    case FORM_ACTIONS.SET_CURRENT_STEP: {
      const { step } = action.payload;
      return {
        ...state,
        metadata: {
          ...state.metadata,
          currentStep: step,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Update metadata
    case FORM_ACTIONS.UPDATE_METADATA: {
      const metadata = action.payload;
      return {
        ...state,
        metadata: {
          ...state.metadata,
          ...metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    default:
      return state;
  }
};

// ==================== ACTION CREATORS ====================
/**
 * Create action to update a field in a section
 * @param {string} section - Section name (basicInfo, location, etc.)
 * @param {string} field - Field name within section
 * @param {any} value - New value
 */
export const createFieldUpdateAction = (section, field, value) => ({
  type: FORM_ACTIONS.UPDATE_FIELD,
  payload: { section, field, value },
});

/**
 * Create action to update a nested field
 * @param {string} section - Section name
 * @param {string} nested - Nested object name
 * @param {string} field - Field name within nested object
 * @param {any} value - New value
 */
export const createNestedFieldUpdateAction = (section, nested, field, value) => ({
  type: FORM_ACTIONS.UPDATE_NESTED_FIELD,
  payload: { section, nested, field, value },
});

/**
 * Create action to add/remove amenity
 */
export const createAmenityUpdateAction = (amenity, checked) => ({
  type: FORM_ACTIONS.UPDATE_AMENITY,
  payload: { amenity, checked },
});

/**
 * Create action to add/remove facility
 */
export const createFacilityUpdateAction = (facility, checked) => ({
  type: FORM_ACTIONS.UPDATE_FACILITY,
  payload: { facility, checked },
});

/**
 * Create action to add images
 */
export const createAddImageAction = (images) => ({
  type: FORM_ACTIONS.ADD_IMAGE,
  payload: { images },
});

/**
 * Create action to remove image
 */
export const createRemoveImageAction = (index) => ({
  type: FORM_ACTIONS.REMOVE_IMAGE,
  payload: { index },
});

/**
 * Create action to set an image as the cover photo (moves it to index 0)
 * @param {number} index - Current index of the image to make the cover
 */
export const createSetCoverImageAction = (index) => ({
  type: FORM_ACTIONS.SET_COVER_IMAGE,
  payload: { index },
});

/**
 * Create action to reset form
 */
export const createResetFormAction = () => ({
  type: FORM_ACTIONS.RESET_FORM,
});

/**
 * Create action to load form
 */
export const createLoadFormAction = (formData) => ({
  type: FORM_ACTIONS.LOAD_FORM,
  payload: formData,
});

/**
 * Create action to set property type
 */
export const createSetPropertyTypeAction = (propertyType) => ({
  type: FORM_ACTIONS.SET_PROPERTY_TYPE,
  payload: { propertyType },
});

/**
 * Create action to set current step
 */
export const createSetCurrentStepAction = (step) => ({
  type: FORM_ACTIONS.SET_CURRENT_STEP,
  payload: { step },
});

/**
 * Create action to update metadata
 */
export const createUpdateMetadataAction = (metadata) => ({
  type: FORM_ACTIONS.UPDATE_METADATA,
  payload: metadata,
});

/**
 * Create action to add/remove furnishing item
 * @param {string} item - Item ID
 * @param {boolean} checked - Whether to add or remove
 */
export const createFurnishingItemUpdateAction = (item, checked) => ({
  type: FORM_ACTIONS.UPDATE_FURNISHING_ITEM,
  payload: { item, checked },
});

/**
 * Create action to add/remove outdoor feature
 * @param {string} feature - Feature ID
 * @param {boolean} checked - Whether to add or remove
 */
export const createOutdoorFeatureUpdateAction = (feature, checked) => ({
  type: FORM_ACTIONS.UPDATE_OUTDOOR_FEATURE,
  payload: { feature, checked },
});

/**
 * Create action to add/remove business suitable-for category
 * @param {string} category - Category ID
 * @param {boolean} checked - Whether to add or remove
 */
export const createSuitableForUpdateAction = (category, checked) => ({
  type: FORM_ACTIONS.UPDATE_SUITABLE_FOR,
  payload: { category, checked },
});

/**
 * Create action to update unit configuration (2BHK, 3BHK, 4BHK)
 * @param {string} bhkType - Type (bhk2, bhk3, bhk4)
 * @param {string} field - Field name (superBuildUpArea, carpetArea, price, etc.)
 * @param {any} value - New value
 */
export const createUnitConfigurationUpdateAction = (bhkType, field, value) => ({
  type: FORM_ACTIONS.UPDATE_UNIT_CONFIGURATION,
  payload: { bhkType, field, value },
});

/**
 * Create action to update floor plan image
 * @param {string} planType - Plan type (bhk2FloorPlan, bhk3FloorPlan, masterPlan, siteLayout)
 * @param {object} imageData - Image data object
 */
export const createFloorPlanUpdateAction = (planType, imageData) => ({
  type: FORM_ACTIONS.UPDATE_FLOOR_PLAN,
  payload: { planType, imageData },
});
