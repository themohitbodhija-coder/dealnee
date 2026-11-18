const facingDirections = new Set(['NORTH', 'SOUTH', 'EAST', 'WEST', 'NORTHEAST', 'NORTHWEST', 'SOUTHEAST', 'SOUTHWEST']);
const buildingAmenities = new Set([
  'balcony', 'modular_kitchen', 'air_conditioning', 'elevator', 'lift', 'washroom', 'pantry', 'central_ac',
  'double_height_luxury_lobby', 'residents_lounge', 'sky_lounge', 'rooftop_cafe', 'sky_gym',
  'rooftop_sky_garden', 'smart_home_automation', 'video_door_phone', 'high_speed_elevators', 'guest_suites',
]);

function positiveNumber(value, field, errors, required = false) {
  if (!required && (value == null || value === '')) return null;
  const text = String(value ?? '').trim();
  if (/^\d{1,10}(?:\.\d{1,4})?$/.test(text) && Number(text) > 0) return Number(text);
  errors[field] = 'Enter a positive number with up to four decimal places.';
  return null;
}

function calculatePrice(area, rate) {
  const scaled = value => BigInt(value.toFixed(4).replace('.', ''));
  return Number((scaled(area) * scaled(rate) + 500000n) / 1000000n) / 100;
}

function preparePlotWrite(body, target, existingProperty) {
  const existing = existingProperty?.toObject ? existingProperty.toObject() : existingProperty;
  const resale = target.subcategory === 'RESALE_PLOT';
  const newProject = target.subcategory === 'NEW_PROJECT_PLOT';
  const plot = target.propertyType === 'BUY' && (resale || newProject);
  if (!plot) {
    if (Array.isArray(target.facilities)) target.facilities = target.facilities.filter(id => id !== 'electrification');
    return {};
  }

  const errors = {};
  const roadWidth = body.location?.roadWidth !== undefined ? body.location.roadWidth : existing?.location?.roadWidth;
  if (target.location || roadWidth != null) {
    target.location = {
      ...existing?.location,
      ...target.location,
      roadWidth: positiveNumber(roadWidth, 'propertyDetails.roadWidth', errors),
    };
  }
  target.bedrooms = 0;
  target.bathrooms = 0;
  target.bathroom2 = 0;
  target.furnishingItems = [];
  target.rentalInfo = {};
  target.commercialDetails = {};
  target.amenities = (target.amenities ?? []).filter(id => !buildingAmenities.has(id));
  target.outdoorFeatures = (target.outdoorFeatures ?? []).filter(id => id !== 'terrace');

  if (resale) {
    const { approval, reraNumber, ownershipType, facing, plotLength, plotWidth, frontageWidth, pricePerSqft } = {
      ...existing?.resaleInfo, ...body.resaleInfo,
    };
    target.resaleInfo = { approval, reraNumber, ownershipType };
    for (const [field, value] of Object.entries({ plotLength, plotWidth, frontageWidth })) {
      target.resaleInfo[field] = positiveNumber(value, `resaleInfo.${field}`, errors);
    }
    if (facing != null && facing !== '' && !facingDirections.has(facing)) {
      errors['propertyDetails.facing'] = 'Select a valid facing direction.';
    }
    target.resaleInfo.facing = facing || null;
    target.newProjectInfo = {};
    target.projectPricing = {};

    const pricingChanged = !existing || existing.subcategory !== target.subcategory ||
      ['price', 'area', 'areaUnit'].some(field => body[field] !== undefined) ||
      body.resaleInfo?.pricePerSqft !== undefined;
    if (pricingChanged) {
      const area = positiveNumber(target.area, 'propertyDetails.area', errors, true);
      const rate = positiveNumber(pricePerSqft, 'resaleInfo.pricePerSqft', errors, true);
      if (target.areaUnit !== 'sq_ft') errors['propertyDetails.area'] = 'Enter the plot area in square feet.';
      if (area !== null && rate !== null) {
        const price = calculatePrice(area, rate);
        if (price <= 0 || price > 999999999999) errors['propertyDetails.price'] = 'Enter values that give a valid positive price.';
        target.price = price;
      }
      target.resaleInfo.pricePerSqft = rate;
    } else {
      target.resaleInfo.pricePerSqft = pricePerSqft;
    }
  } else {
    if (!existing || body.area !== undefined || existing.subcategory !== target.subcategory) {
      target.area = positiveNumber(target.area, 'propertyDetails.area', errors, true);
    }
    const info = { ...existing?.newProjectInfo, ...body.newProjectInfo };
    const pricing = { ...existing?.projectPricing, ...body.projectPricing };
    target.resaleInfo = {};
    target.newProjectInfo = {
      ...info,
      plotLength: positiveNumber(info.plotLength, 'propertyDetails.plotLength', errors),
      plotWidth: positiveNumber(info.plotWidth, 'propertyDetails.plotWidth', errors),
    };
    target.projectPricing = {
      ...pricing,
      pricePerSqft: positiveNumber(pricing.pricePerSqft, 'projectPricing.pricePerSqft', errors),
      unitConfigurations: {},
    };
  }
  return errors;
}

module.exports = { preparePlotWrite };
