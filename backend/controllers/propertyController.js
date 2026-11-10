const mongoose = require('mongoose');
const Property = require('../models/Property');
const Category = require('../models/Category');

const getDisplayBathrooms = (property = {}) => {
  const values = [
    Number(property.bathrooms),
    Number(property.bathroom2),
  ].filter((value) => Number.isFinite(value) && value >= 0);

  return values.length ? Math.max(...values) : 0;
};

exports.getDisplayBathrooms = getDisplayBathrooms;

// ==================== CATEGORY MAPPING ====================
/**
 * Map frontend category codes to database category names
 * Frontend sends codes like "NEW_PROJECT", "RESALE", "RESIDENTIAL"
 * Backend needs to convert them to actual database category names
 */
const CATEGORY_CODE_MAPPING = {
  // Buy Property Categories
  'NEW_PROJECT': 'New Projects',
  'RESALE': 'Resale',
  'APARTMENT': 'Apartment',
  'VILLA': 'Villa',
  'PLOT': 'Plot',
  'BUY_PROPERTY': 'Buy Property',
  
  // Rent Property Categories
  'RENT': 'Rent Property',
  'RESIDENTIAL': 'Rent Property',
  'RENTAL_PROPERTY': 'Rent Property',
  'COMMERCIAL': 'Rent Commercial', // RENT type > COMMERCIAL category
  
  // Commercial Property Type Categories
  'BUY': 'Commercial Buy',
  'LEASE': 'Commercial Lease',
};

/**
 * Convert frontend category code to MongoDB category ObjectId
 * @param {string} categoryCode - Frontend category code
 * @returns {Promise<ObjectId>} - MongoDB category ObjectId
 */
const resolveCategoryId = async (categoryCode) => {
  if (!categoryCode) {
    throw new Error('Category code is required');
  }

  // Map the frontend code to database category name
  const categoryName = CATEGORY_CODE_MAPPING[categoryCode];
  
  if (!categoryName) {
    throw new Error(`Invalid category code: ${categoryCode}`);
  }

  // Find the category in database
  const category = await Category.findOne({ name: categoryName });
  
  if (!category) {
    throw new Error(`Category not found in database: ${categoryName}. Please ensure categories are seeded.`);
  }

  return category._id;
};

// Get all properties with filters
exports.getAllProperties = async (req, res, next) => {
  try {
    for (const [key, fallback] of [['page', 1], ['limit', 12]]) {
      const value = Number(req.query[key] ?? fallback);
      if (!Number.isInteger(value) || value < 1 || (key === 'limit' && value > 100)) {
        return res.status(400).json({ message: `Invalid ${key}` });
      }
    }
    const { 
      category, 
      type,
      subtype,
      minPrice, 
      maxPrice, 
      location, 
      locality,
      bedrooms,
      bathrooms,
      minArea,
      maxArea,
      furnished,
      propertyAge,
      page = 1, 
      limit = 12 
    } = req.query;

    const normalizePropertyBathrooms = (item) => {
      const normalized = getDisplayBathrooms(item);
      item.bathrooms = normalized;
      item.bathroom2 = normalized;
      return item;
    };
    const skip = (page - 1) * limit;

    let filter = { status: 'available' };

    // Handle propertyType filtering first (independent of category)
    if (type) {
      const typeMap = {
        'buy': 'BUY',
        'rent': 'RENT',
        'commercial': 'COMMERCIAL'
      };
      
      const propertyType = typeMap[type.toLowerCase()];
      if (propertyType) {
        filter.propertyType = propertyType;
      }
    }

    // Handle category and subcategory filtering (works with or without type)
    if (category) {
      // Check if category looks like a MongoDB ObjectId
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
      
      if (isObjectId) {
        // It's already an ObjectId, use it directly
        filter.category = category;
      } else {
        // Special handling for new projects with specific categories
        if (type && type.toLowerCase() === 'buy' && subtype && subtype.toLowerCase() === 'newprojects') {
          // For new projects, map apartment/villa/plot to subcategory filter
          const newProjectSubcategoryMap = {
            'apartment': 'NEW_PROJECT_APARTMENT',
            'villa': 'NEW_PROJECT_VILLA',
            'plot': 'NEW_PROJECT_PLOT'
          };
          
          const subcategoryValue = newProjectSubcategoryMap[category.toLowerCase()];
          if (subcategoryValue) {
            // Filter by New Projects category AND the specific subcategory
            const newProjectsCategory = await Category.findOne({ name: 'New Projects' });
            if (newProjectsCategory) {
              filter.category = newProjectsCategory._id;
            }
            filter.subcategory = subcategoryValue;
          }
        } else {
          // Normal category mapping for other cases
          const categoryMap = {
            apartment: 'Apartment',
            villa: 'Villa',
            plot: 'Plot',
            resale: 'Resale',
            'new projects': 'New Projects',
            commercial: 'Commercial',
            rent: 'Rent Property',
            buy: filter.propertyType === 'COMMERCIAL' ? 'Commercial Buy' : 'Buy Property'
          };
          
          const categoryName = categoryMap[category.toLowerCase()] || category;
          const categoryDoc = await Category.findOne({ name: categoryName });
          if (categoryDoc) {
            filter.category = categoryDoc._id;
          }
        }
      }
    } else if (type && subtype) {
      // Add category filter based on type and subtype (when category param is not provided)
      const propertyType = filter.propertyType;
      
      if (propertyType === 'COMMERCIAL' && subtype) {
        let categoryName = null;
        if (subtype.toLowerCase() === 'lease') {
          categoryName = 'Commercial Lease';
        } else if (subtype.toLowerCase() === 'buy') {
          categoryName = 'Commercial Buy';
        }
        
        if (categoryName) {
          const categoryDoc = await Category.findOne({ name: categoryName });
          if (categoryDoc) {
            filter.category = categoryDoc._id;
          }
        }
      } else if (propertyType === 'BUY' && subtype) {
        // For buy properties with subtype
        let categoryName = null;
        if (subtype.toLowerCase() === 'newprojects') {
          categoryName = 'New Projects';
        } else if (subtype.toLowerCase() === 'resale') {
          categoryName = 'Resale';
        }
        
        if (categoryName) {
          const categoryDoc = await Category.findOne({ name: categoryName });
          if (categoryDoc) {
            filter.category = categoryDoc._id;
          }
        }
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    // Location filter (city or address)
    if (location) {
      filter.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.address': new RegExp(location, 'i') },
      ];
    }

    // Locality filter
    if (locality) {
      filter['location.locality'] = new RegExp(locality, 'i');
    }

    // Bedrooms filter
    if (bedrooms) {
      filter.bedrooms = parseInt(bedrooms);
    }

    // Bathrooms filter
    if (bathrooms) {
      filter.bathrooms = parseInt(bathrooms);
    }

    // Area filter
    if (minArea || maxArea) {
      filter.area = {};
      if (minArea) filter.area.$gte = parseInt(minArea);
      if (maxArea) filter.area.$lte = parseInt(maxArea);
    }

    // Furnished status filter
    if (furnished) {
      filter['resaleInfo.furnishingStatus'] = new RegExp(furnished, 'i');
    }

    // Property age filter
    if (propertyAge) {
      const ageRanges = {
        'new': { $lte: 1 },
        'recent': { $gt: 1, $lte: 5 },
        'moderate': { $gt: 5, $lte: 10 },
        'old': { $gt: 10 },
      };
      if (ageRanges[propertyAge]) {
        filter['resaleInfo.propertyAge'] = ageRanges[propertyAge];
      }
    }

    const total = await Property.countDocuments(filter);
    const properties = await Property.find(filter)
      .populate('category', 'name')
      .populate('postedBy', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const normalizedProperties = properties.map((item) => {
      const normalized = getDisplayBathrooms(item);
      item.bathrooms = normalized;
      item.bathroom2 = normalized;
      return item;
    });

    // Log rental properties for debugging
    const rentalProps = normalizedProperties.filter(p => p.propertyType === 'RENT');
    if (rentalProps.length > 0) {
      console.log('[getAllProperties] Found RENT properties:', rentalProps.map(p => ({
        id: p._id,
        propertyId: p.propertyId,
        title: p.title,
        price: p.price,
        rentalInfo: p.rentalInfo,
        monthlyRent: p.rentalInfo?.monthlyRent,
        bathrooms: p.bathrooms,
        hasRentalInfo: !!p.rentalInfo,
        rentalInfoKeys: p.rentalInfo ? Object.keys(p.rentalInfo) : [],
      })));
    }

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      properties: normalizedProperties,
    });
  } catch (error) {
    next(error);
  }
};

// Get featured properties
exports.getFeaturedProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ featured: true, status: 'available' })
      .populate('category', 'name')
      .populate('postedBy', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(6);

    const normalizedProperties = properties.map((item) => {
      const normalized = getDisplayBathrooms(item);
      item.bathrooms = normalized;
      item.bathroom2 = normalized;
      return item;
    });

    // Log any rental properties in featured list
    const rentalProperties = normalizedProperties.filter(p => p.propertyType === 'RENT');
    if (rentalProperties.length > 0) {
      console.log('[GetFeaturedProperties] Rental properties in featured list:', rentalProperties.map(p => ({
        id: p._id,
        price: p.price,
        monthlyRent: p.rentalInfo?.monthlyRent,
        bathrooms: p.bathrooms,
      })));
    }

    res.status(200).json({
      success: true,
      properties: normalizedProperties,
    });
  } catch (error) {
    next(error);
  }
};

// Get property by ID
exports.getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('category', 'name')
      .populate('postedBy', 'name email phone');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const normalizedBathrooms = getDisplayBathrooms(property);
    property.bathrooms = normalizedBathrooms;
    property.bathroom2 = normalizedBathrooms;

    // Log property details for debugging rental prices
    if (property.propertyType === 'RENT') {
      console.log('[GetPropertyById] Returning rental property:', {
        id: property._id,
        propertyId: property.propertyId,
        title: property.title,
        price: property.price,
        monthlyRent: property.rentalInfo?.monthlyRent,
        bathrooms: property.bathrooms,
        hasRentalInfo: !!property.rentalInfo,
      });
    }

    res.status(200).json({
      success: true,
      property,
    });
  } catch (error) {
    next(error);
  }
};

// Create property (Admin only)
exports.createProperty = async (req, res, next) => {
  try {
    console.log('[CreateProperty] Request received');
    console.log('[CreateProperty] Headers:', {
      contentType: req.headers['content-type'],
      authorization: req.headers.authorization ? 'Bearer ***' : 'None',
    });
    console.log('[CreateProperty] Has files:', !!req.files, 'Count:', req.files?.length || 0);
    
    let body = req.body;

    // If client sends multipart/form-data, `property` is JSON string.
    if (req.body?.property) {
      try {
        console.log('[CreateProperty] Parsing property JSON from multipart...');
        body = JSON.parse(req.body.property);
        console.log('[CreateProperty] Property JSON parsed successfully');
        // Log the full parsed body for debugging (non-sensitive fields only)
        try {
          console.log('[CreateProperty] Full parsed body:', JSON.stringify(body, null, 2));
        } catch (logErr) {
          console.log('[CreateProperty] Full parsed body (truncated):', body);
        }
      } catch (e) {
        console.error('[CreateProperty] Failed to parse property JSON:', e.message);
        return res.status(400).json({ message: 'Invalid property JSON' });
      }
    }

    // Extract all fields from body
    let {
      propertyId,
      title,
      description,
      propertyType,
      category,
      subcategory,
      price,
      area,
      areaUnit,
      bedrooms,
      bathrooms,
      location,
      contact,
      amenities = [],
      facilities = [],
      furnishingItems = [],
      outdoorFeatures = [],
  resaleInfo,
  rentalInfo,
      commercialDetails,
      newProjectInfo,
      projectPricing,
      featured = false,
      userId,
    } = body;

    console.log('[CreateProperty] Extracted propertyType:', propertyType);
    console.log('[CreateProperty] Extracted rentalInfo:', rentalInfo);
    console.log('[CreateProperty] Extracted price:', price);

    // Server-side fallback: if this is a RENT property but rentalInfo.monthlyRent
    // is missing while a generic price was provided, treat price as monthlyRent.
    if (propertyType === 'RENT') {
      if ((!rentalInfo || !rentalInfo.monthlyRent) && price && Number(price) > 0) {
        console.warn('[CreateProperty] RENT fallback: using price as monthlyRent');
        // ensure rentalInfo is an object we can use
        rentalInfo = rentalInfo || {};
        rentalInfo.monthlyRent = Number(price);
      }
    }

    // Validation of required fields
    // If client didn't provide propertyId, auto-generate a safe fallback to avoid blocking submissions.
    if (!propertyId || (typeof propertyId === 'string' && propertyId.trim() === '')) {
      propertyId = `AUTO-${Date.now()}`;
      console.warn('[CreateProperty] No propertyId provided by client - auto-generated:', propertyId);
    }

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Validation failed', errors: { title: 'Title is required' } });
    }

    if (!description || description.trim() === '') {
      return res.status(400).json({ message: 'Validation failed', errors: { description: 'Description is required' } });
    }

    if (!propertyType || propertyType.trim() === '') {
      return res.status(400).json({ message: 'Validation failed', errors: { propertyType: 'Property type is required' } });
    }

    // Price validation: 
    // - For BUY and COMMERCIAL: price should be in propertyDetails.price
    // - For RENT: price should be in rentalInfo.monthlyRent
    if (propertyType === 'RENT') {
      // For rental properties, monthly rent is required
      if (!rentalInfo || !rentalInfo.monthlyRent || Number(rentalInfo.monthlyRent) <= 0) {
        console.error('[CreateProperty] Validation Error: Invalid rental info:', { rentalInfo, monthlyRent: rentalInfo?.monthlyRent });
        return res.status(400).json({ message: 'Validation failed', errors: { monthlyRent: 'Valid monthly rent is required for rental properties' } });
      }
    } else {
      // For buy and commercial, price is required
      if (!price || Number(price) <= 0) {
        console.error('[CreateProperty] Validation Error: Invalid price for non-rental property:', { price, propertyType });
        return res.status(400).json({ message: 'Validation failed', errors: { price: 'Valid price is required' } });
      }
    }

    if (!area || Number(area) <= 0) {
      return res.status(400).json({ message: 'Validation failed', errors: { area: 'Valid area is required' } });
    }

    // Validate location
    if (!location || typeof location !== 'object') {
      return res.status(400).json({ message: 'Validation failed', errors: { location: 'Location object is required' } });
    }

    // address is optional now (users may provide only locality/city/state). If missing, we'll fallback
    // to locality when saving. City and state are still required for proper indexing/search.
    if (!location.city || (typeof location.city === 'string' && location.city.trim() === '')) {
      return res.status(400).json({ message: 'Validation failed', errors: { 'location.city': 'Location city is required' } });
    }

    if (!location.state || (typeof location.state === 'string' && location.state.trim() === '')) {
      return res.status(400).json({ message: 'Validation failed', errors: { 'location.state': 'Location state is required' } });
    }

    // pincode is optional now - only validate format if provided
    if (location.pincode && typeof location.pincode === 'string' && location.pincode.trim() === '') {
      location.pincode = null;
    }

    // Validate contact
    if (!contact || typeof contact !== 'object') {
      return res.status(400).json({ message: 'Validation failed', errors: { contact: 'Contact object is required' } });
    }

    // name and email are optional now - only phone is required
    if (contact.name && typeof contact.name === 'string' && contact.name.trim() === '') {
      contact.name = null;
    }

    if (contact.email && typeof contact.email === 'string' && contact.email.trim() === '') {
      contact.email = null;
    }

    if (!contact.phone || (typeof contact.phone === 'string' && contact.phone.trim() === '')) {
      return res.status(400).json({ message: 'Validation failed', errors: { 'contact.phone': 'Contact phone is required' } });
    }

    // Handle uploaded images
    const uploadedImages = Array.isArray(req.files)
      ? req.files.map((f) => `/uploads/${f.filename}`)
      : [];

    // Resolve category to ObjectId if provided
    let resolvedCategoryId = null;
    if (category) {
      try {
        // Check if category is already a valid ObjectId format
        if (typeof category === 'string' && /^[0-9a-fA-F]{24}$/.test(category)) {
          resolvedCategoryId = category;
        } else {
          // Try to resolve it from the mapping (it might be a code like "NEW_PROJECT", "RESALE", etc.)
          const categoryName = CATEGORY_CODE_MAPPING[category];
          if (categoryName) {
            const categoryDoc = await Category.findOne({ name: categoryName });
            if (categoryDoc) {
              resolvedCategoryId = categoryDoc._id;
            }
          }
        }
      } catch (error) {
        console.warn('[CreateProperty] Warning resolving category:', error.message);
        // Continue without category if resolution fails
      }
    }

  // Create property object with all fields
    const normalizedBathrooms = bathrooms !== undefined && bathrooms !== null && bathrooms !== '' ? Number(bathrooms) : 0;

    const propertyData = {
      propertyId: propertyId.trim(),
      title: title.trim(),
      description: description.trim(),
      propertyType,
      category: resolvedCategoryId || null,
      subcategory: subcategory || null,
      // For rental properties, use monthlyRent as price; for others use price
      price: propertyType === 'RENT' 
        ? (rentalInfo?.monthlyRent ? Number(rentalInfo.monthlyRent) : null)
        : (price ? Number(price) : null),
      area: Number(area),
      areaUnit: areaUnit || 'sq_ft',
      bedrooms: bedrooms ? Number(bedrooms) : 0,
      bathrooms: normalizedBathrooms,
      bathroom2: normalizedBathrooms,
      location: {
        // If address provided, use it; otherwise fall back to locality (if present) or null
        address: (typeof location.address === 'string' && location.address.trim() !== '')
          ? location.address.trim()
          : (location.locality && typeof location.locality === 'string' && location.locality.trim() !== '' ? location.locality.trim() : null),
        city: typeof location.city === 'string' ? location.city.trim() : location.city,
        state: typeof location.state === 'string' ? location.state.trim() : location.state,
        // pincode intentionally omitted from saved document (user requested removal)
        latitude: location.latitude ? Number(location.latitude) : null,
        longitude: location.longitude ? Number(location.longitude) : null,
        landmark: location.landmark ? (typeof location.landmark === 'string' ? location.landmark.trim() : location.landmark) : null,
        locality: location.locality ? (typeof location.locality === 'string' ? location.locality.trim() : location.locality) : null,
      },
      contact: {
        // name and email intentionally omitted from saved document
        phone: contact.phone ? (typeof contact.phone === 'string' ? contact.phone.trim() : contact.phone) : contact.phone,
      },
      images: uploadedImages,
      amenities: Array.isArray(amenities) ? amenities : [],
      facilities: Array.isArray(facilities) ? facilities : [],
      furnishingItems: Array.isArray(furnishingItems) ? furnishingItems : [],
      outdoorFeatures: Array.isArray(outdoorFeatures) ? outdoorFeatures : [],
      featured: Boolean(featured),
      postedBy: req.user?.id || userId,
    };

    // Add type-specific info if provided
    if (resaleInfo && Object.keys(resaleInfo).length > 0) {
      propertyData.resaleInfo = resaleInfo;
    }

    if (rentalInfo && Object.keys(rentalInfo).length > 0) {
      // Remove tenantPreference and noticePeriod if present (user requested removal)
      const { tenantPreference, noticePeriod, ...restRental } = rentalInfo;
      propertyData.rentalInfo = restRental;
    }

    if (commercialDetails && Object.keys(commercialDetails).length > 0) {
      propertyData.commercialDetails = commercialDetails;
    }

    if (newProjectInfo && Object.keys(newProjectInfo).length > 0) {
      propertyData.newProjectInfo = newProjectInfo;
    }

    if (projectPricing && Object.keys(projectPricing).length > 0) {
      propertyData.projectPricing = projectPricing;
    }

    // Create the property in database
    console.log('[CreateProperty] Attempting to save property to database...', {
      title: propertyData.title,
      propertyType: propertyData.propertyType,
      price: propertyData.price,
      monthlyRent: propertyData.rentalInfo?.monthlyRent,
      imageCount: propertyData.images?.length || 0,
    });
    
    const property = await Property.create(propertyData);
    
    console.log('[CreateProperty] Property saved successfully:', {
      id: property._id,
      title: property.title,
      propertyType: property.propertyType,
      price: property.price,
      monthlyRent: property.rentalInfo?.monthlyRent,
      rentalInfoExists: !!property.rentalInfo,
      imageCount: property.images?.length || 0,
    });

    // Populate user info
    await property.populate('postedBy', 'name email phone');

    res.status(201).json({
      message: 'Property created successfully',
      success: true,
      property,
    });
  } catch (error) {
    console.error('[CreateProperty] ERROR:', error.message, error);
    // If it's a Mongoose validation error, return a helpful 400 with field errors
    if (error.name === 'ValidationError' && error.errors) {
      const errors = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    // Generic error fallback
    next(error);
  }
};

// Update property (Admin only)
exports.updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log('[UpdateProperty] Request received for id:', id);
    console.log('[UpdateProperty] Content-Type:', req.headers['content-type']);
    console.log('[UpdateProperty] Has files:', !!req.files, 'Count:', req.files?.length || 0);

    // Load the existing property first — we need its current images/postedBy
    // as a fallback, and to 404 early if it doesn't exist.
    const existingProperty = await Property.findById(id);
    if (!existingProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }

    let body = req.body;

    // If client sends multipart/form-data (used whenever images may be
    // attached), the property fields arrive as a JSON string in the
    // `property` field — NOT as individual top-level body fields. This must
    // be parsed the same way createProperty does, otherwise req.body is just
    // `{ property: "<json string>" }` and none of the real fields (title,
    // price, bathrooms, etc.) ever get applied to the update.
    if (req.body?.property) {
      try {
        console.log('[UpdateProperty] Parsing property JSON from multipart...');
        body = JSON.parse(req.body.property);
      } catch (e) {
        console.error('[UpdateProperty] Failed to parse property JSON:', e.message);
        return res.status(400).json({ message: 'Invalid property JSON' });
      }
    }

    const {
      propertyId,
      title,
      description,
      propertyType,
      category,
      subcategory,
      price,
      area,
      areaUnit,
      bedrooms,
      bathrooms,
      location,
      contact,
      amenities,
      facilities,
      furnishingItems,
      outdoorFeatures,
      resaleInfo,
      rentalInfo,
      commercialDetails,
      newProjectInfo,
      projectPricing,
      featured,
      status,
    } = body;

    console.log('[UpdateProperty] Extracted bathrooms:', bathrooms, 'bedrooms:', bedrooms);

    // Server-side fallback: if this is a RENT property but rentalInfo.monthlyRent
    // is missing while a generic price was provided, treat price as monthlyRent
    // (mirrors createProperty).
    let effectiveRentalInfo = rentalInfo;
    if (propertyType === 'RENT') {
      if ((!effectiveRentalInfo || !effectiveRentalInfo.monthlyRent) && price && Number(price) > 0) {
        effectiveRentalInfo = effectiveRentalInfo || {};
        effectiveRentalInfo.monthlyRent = Number(price);
      }
    }

    // Resolve category to ObjectId, same logic as createProperty.
    let resolvedCategoryId = existingProperty.category;
    if (category) {
      try {
        if (typeof category === 'string' && /^[0-9a-fA-F]{24}$/.test(category)) {
          resolvedCategoryId = category;
        } else {
          const categoryName = CATEGORY_CODE_MAPPING[category];
          if (categoryName) {
            const categoryDoc = await Category.findOne({ name: categoryName });
            if (categoryDoc) {
              resolvedCategoryId = categoryDoc._id;
            }
          } else {
            // category might already be a plain name like "Rent Property"
            const categoryDoc = await Category.findOne({ name: category });
            if (categoryDoc) {
              resolvedCategoryId = categoryDoc._id;
            }
          }
        }
      } catch (error) {
        console.warn('[UpdateProperty] Warning resolving category:', error.message);
      }
    }

    // Images: the JSON body always sends images: [] (see frontend comment
    // "server only gets actual file uploads"), so we must NOT blindly
    // overwrite the existing images with that empty array. Keep the
    // property's current images and simply append any newly uploaded files.
    const newlyUploadedImages = Array.isArray(req.files)
      ? req.files.map((f) => `/uploads/${f.filename}`)
      : [];
    const updatedImages = [...(existingProperty.images || []), ...newlyUploadedImages];

    // Build the update document. Only fields that were actually provided
    // overwrite the existing value; everything else falls back to what's
    // already saved so a partial edit never wipes out other data.
    const normalizedBathroomCount = bathrooms !== undefined && bathrooms !== null && bathrooms !== ''
      ? Number(bathrooms)
      : existingProperty.bathrooms;

    const updateData = {
      propertyId: propertyId ? propertyId.trim() : existingProperty.propertyId,
      title: title !== undefined ? title.trim() : existingProperty.title,
      description: description !== undefined ? description.trim() : existingProperty.description,
      propertyType: propertyType || existingProperty.propertyType,
      category: resolvedCategoryId,
      subcategory: subcategory !== undefined ? subcategory : existingProperty.subcategory,
      price:
        (propertyType || existingProperty.propertyType) === 'RENT'
          ? (effectiveRentalInfo?.monthlyRent ? Number(effectiveRentalInfo.monthlyRent) : existingProperty.price)
          : (price !== undefined && price !== null ? Number(price) : existingProperty.price),
      area: area !== undefined && area !== null ? Number(area) : existingProperty.area,
      areaUnit: areaUnit || existingProperty.areaUnit,
      bedrooms: bedrooms !== undefined && bedrooms !== null ? Number(bedrooms) : existingProperty.bedrooms,
      bathrooms: normalizedBathroomCount,
      bathroom2: normalizedBathroomCount,
      images: updatedImages,
      amenities: Array.isArray(amenities) ? amenities : existingProperty.amenities,
      facilities: Array.isArray(facilities) ? facilities : existingProperty.facilities,
      furnishingItems: Array.isArray(furnishingItems) ? furnishingItems : existingProperty.furnishingItems,
      outdoorFeatures: Array.isArray(outdoorFeatures) ? outdoorFeatures : existingProperty.outdoorFeatures,
      featured: featured !== undefined ? Boolean(featured) : existingProperty.featured,
      status: status || existingProperty.status,
    };

    if (location && typeof location === 'object') {
      updateData.location = {
        address:
          (typeof location.address === 'string' && location.address.trim() !== '')
            ? location.address.trim()
            : (location.locality && typeof location.locality === 'string' && location.locality.trim() !== ''
                ? location.locality.trim()
                : existingProperty.location?.address),
        city: typeof location.city === 'string' ? location.city.trim() : (location.city || existingProperty.location?.city),
        state: typeof location.state === 'string' ? location.state.trim() : (location.state || existingProperty.location?.state),
        latitude: location.latitude !== undefined && location.latitude !== null ? Number(location.latitude) : existingProperty.location?.latitude,
        longitude: location.longitude !== undefined && location.longitude !== null ? Number(location.longitude) : existingProperty.location?.longitude,
        landmark: location.landmark !== undefined ? location.landmark : existingProperty.location?.landmark,
        locality: location.locality !== undefined ? location.locality : existingProperty.location?.locality,
      };
    }

    if (contact && typeof contact === 'object') {
      updateData.contact = {
        phone: contact.phone !== undefined ? contact.phone : existingProperty.contact?.phone,
      };
    }

    if (resaleInfo && Object.keys(resaleInfo).length > 0) {
      updateData.resaleInfo = resaleInfo;
    }

    if (effectiveRentalInfo && Object.keys(effectiveRentalInfo).length > 0) {
      const { tenantPreference, noticePeriod, ...restRental } = effectiveRentalInfo;
      updateData.rentalInfo = restRental;
    }

    if (commercialDetails && Object.keys(commercialDetails).length > 0) {
      updateData.commercialDetails = commercialDetails;
    }

    if (newProjectInfo && Object.keys(newProjectInfo).length > 0) {
      updateData.newProjectInfo = newProjectInfo;
    }

    if (projectPricing && Object.keys(projectPricing).length > 0) {
      updateData.projectPricing = projectPricing;
    }

    console.log('[UpdateProperty] Final bathrooms being saved:', updateData.bathrooms);

    const property = await Property.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name')
      .populate('postedBy', 'name email phone');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    console.log('[UpdateProperty] Saved successfully. bathrooms now:', property.bathrooms);

    res.status(200).json({
      message: 'Property updated successfully',
      property,
    });
  } catch (error) {
    console.error('[UpdateProperty] ERROR:', error.message);
    if (error.name === 'ValidationError' && error.errors) {
      const errors = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    next(error);
  }
};

// Delete property (Admin only)
exports.deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await Property.findByIdAndDelete(id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.status(200).json({
      message: 'Property deleted successfully',
      property,
    });
  } catch (error) {
    next(error);
  }
};

// Search properties
exports.searchProperties = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Please provide search query' });
    }

    const properties = await Property.find({
      $or: [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { 'location.city': new RegExp(q, 'i') },
        { 'location.address': new RegExp(q, 'i') },
      ],
      status: 'available',
    })
      .populate('category', 'name')
      .populate('postedBy', 'name email phone')
      .limit(20);

    res.status(200).json({
      success: true,
      properties,
    });
  } catch (error) {
    next(error);
  }
};

// Get next sequential property ID for a category
// The category parameter is the category code (e.g., NEW_PROJECT, RESALE, RENT, etc.)
exports.getNextSequentialId = async (req, res, next) => {
  try {
    const { category } = req.params;

    if (!category) {
      console.warn('[getNextSequentialId] Category code is required');
      return res.status(400).json({ message: 'Category code is required' });
    }

    console.log('[getNextSequentialId] Received category code:', category);

    // Map the frontend category code to database category name
    const categoryName = CATEGORY_CODE_MAPPING[category];
    
    if (!categoryName) {
      console.warn('[getNextSequentialId] Unknown category code:', category);
      // If mapping fails, still try to count by the code itself for backwards compatibility
      const count = await Property.countDocuments({ 
        $or: [
          { subcategory: category },
          { category: category }
        ]
      });
      console.log('[getNextSequentialId] Counted properties using subcategory/category fallback:', count);
      return res.status(200).json({
        success: true,
        nextNumber: count + 1,
        message: `Next sequential number for category ${category} is ${count + 1}`,
      });
    }

    // Find the category document by name
    let categoryDoc = await Category.findOne({ name: categoryName });
    
    if (!categoryDoc) {
      // If the category is missing from the DB, create a minimal placeholder so ID generation can continue.
      console.warn('[getNextSequentialId] Category not found in database, attempting to create:', categoryName);
      try {
        categoryDoc = await Category.create({
          name: categoryName,
          description: `Auto-created category for ${categoryName}`,
          icon: '🏷'
        });
        console.log('[getNextSequentialId] Auto-created category document:', { id: categoryDoc._id, name: categoryDoc.name });
      } catch (createErr) {
        console.error('[getNextSequentialId] Failed to auto-create category:', categoryName, createErr.message);
        return res.status(500).json({ 
          message: `Category "${categoryName}" not found and could not be created. Please seed categories. Category Code: ${category}`,
          nextNumber: 1,
          debug: { categoryName, categoryCode: category, mappingExists: true, categoryExists: false, createError: createErr.message }
        });
      }
    }

    console.log('[getNextSequentialId] Found category document:', {
      id: categoryDoc._id,
      name: categoryDoc.name,
      description: categoryDoc.description
    });

    // Count existing properties for this category ObjectId
    const count = await Property.countDocuments({ category: categoryDoc._id });
    
    console.log('[getNextSequentialId] Count of properties with this category:', count);
    
    // Next number is count + 1
    const nextNumber = count + 1;

    console.log('[getNextSequentialId] Success - returning nextNumber:', nextNumber);
    res.status(200).json({
      success: true,
      nextNumber,
      message: `Next sequential number for category ${category} (${categoryName}) is ${nextNumber}`,
    });
  } catch (error) {
    console.error('[getNextSequentialId] Unexpected error:', error.message);
    console.error('[getNextSequentialId] Error stack:', error.stack);
    next(error);
  }
};
