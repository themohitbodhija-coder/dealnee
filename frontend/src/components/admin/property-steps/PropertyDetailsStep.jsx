import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaInfo, FaTimes } from 'react-icons/fa';
import {
  AMENITIES,
  BUY_SUBCATEGORIES,
  FACILITIES,
  FURNISHING_STATUS,
  AREA_UNITS,
  getDisplayLabel,
  isBuyProperty,
  isRentalProperty,
  isCommercialProperty,
  isResaleVilla,
  isCommercialLease,
  isResaleCategory,
  getFurnishingItems,
  getOutdoorFeatures,
  getBusinessSuitableFor,
  getApprovalTypes,
  getOwnershipTypes,
  getFacingDirections,
} from '../../../constants/propertyConstants';
import { PREMIUM_AMENITY_GROUPS } from '../../../constants/premiumAmenities';
import {
  createFieldUpdateAction,
  createAmenityUpdateAction,
  createFacilityUpdateAction,
  createFurnishingItemUpdateAction,
  createOutdoorFeatureUpdateAction,
  createSuitableForUpdateAction,
} from '../../../reducers/propertyFormReducer';

import AmenityIcons from '../../../components/icons/AmenityIcons';
import { getDefaultFurnishingItemsForStatus } from '../../../utils/propertyFormUtils';

import {
  calculateResalePlotPrice, ELECTRIFICATION, isPlotAmenity, PLOT_DIMENSIONS, RESALE_PLOT_DIMENSIONS,
} from '../../../utils/plotDetails';

const PlotNumberInput = ({ field, label, value, onChange, error, readOnly = false, required = false }) => (
  <div>
    <label htmlFor={field} className="block text-sm font-semibold text-gray-700 mb-2">
      {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
    </label>
    <input
      id={field}
      type="number"
      min="0"
      step="any"
      value={value ?? ''}
      onChange={onChange}
      readOnly={readOnly}
      required={required}
      aria-invalid={Boolean(error)}
      className={`w-full px-4 py-3 border rounded-lg ${readOnly ? 'bg-gray-100' : 'focus:ring-2 focus:ring-purple-500'} ${error ? 'border-red-500' : 'border-gray-300'}`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const AmenityOptions = ({ options, selected, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {options.map(({ id, label }) => (
      <label key={id} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selected.has(id)}
          onChange={(event) => onChange(id, event.target.checked)}
          className="w-4 h-4 text-purple-600 rounded flex-shrink-0"
        />
        <AmenityIcons id={id} className="text-purple-600 w-4 h-4 flex-shrink-0" />
        <span className="text-sm text-gray-700">{label}</span>
      </label>
    ))}
  </div>
);

const PropertyDetailsStep = ({ formData, dispatch, errors = {} }) => {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const { propertyType, subcategory, category } = formData.basicInfo;
  const { propertyDetails, resaleInfo, rentalInfo, commercialDetails } = formData;
  const selectedAmenities = new Set(propertyDetails.amenities ?? []);
  const normalizedCategory = (category || '').toString().trim().toUpperCase().replace(/[-\s]+/g, '_');
  const normalizedSubcategory = (subcategory || '').toString().trim().toUpperCase().replace(/[-\s]+/g, '_');
  const isNewProjectSelection = normalizedSubcategory.includes('NEW_PROJECT') || normalizedCategory.includes('NEW_PROJECT');
  const isResaleSelection = normalizedCategory.includes('RESALE') || normalizedSubcategory.includes('RESALE');
  const isNewProjectPlot = propertyType === 'BUY' && subcategory === 'NEW_PROJECT_PLOT';
  const isResalePlot = propertyType === 'BUY' && subcategory === 'RESALE_PLOT';
  const isPlot = isNewProjectPlot || isResalePlot;
  const plotDimensions = isResalePlot ? RESALE_PLOT_DIMENSIONS : PLOT_DIMENSIONS;
  const dimensionsSection = isResalePlot ? 'resaleInfo' : 'newProjectInfo';
  const shouldShowCommonFields = isBuyProperty(propertyType) || isRentalProperty(propertyType) || isNewProjectSelection;
  const shouldShowResaleFields = isResaleSelection && !isNewProjectSelection;
  const isCommercialBuy = isCommercialProperty(propertyType);
  const activeFurnishingStatus = rentalInfo.furnishingStatus || resaleInfo.furnishingStatus || '';
  const shouldShowFurnishingItems = !isPlot && Boolean(activeFurnishingStatus && activeFurnishingStatus !== FURNISHING_STATUS.UNFURNISHED);
  const previousFurnishingStatusRef = useRef(activeFurnishingStatus);

  // Show error modal when errors change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setShowErrorModal(true);
    }
  }, [errors]);

  // Auto-calculate security deposit as 2x monthly rent
  useEffect(() => {
    if (isRentalProperty(propertyType) && rentalInfo.monthlyRent) {
      const monthlyRent = parseFloat(rentalInfo.monthlyRent) || 0;
      const calculatedDeposit = monthlyRent * 2;
      
      // Only update if the calculated value is different from current value
      if (rentalInfo.securityDeposit === '' || rentalInfo.securityDeposit == null) {
        dispatch(createFieldUpdateAction('rentalInfo', 'securityDeposit', calculatedDeposit.toString()));
      }
    }
  }, [rentalInfo.monthlyRent, propertyType, rentalInfo.securityDeposit, dispatch]);

  useEffect(() => {
    const currentStatus = rentalInfo.furnishingStatus || resaleInfo.furnishingStatus || '';
    const previousStatus = previousFurnishingStatusRef.current;

    if (currentStatus === previousStatus) {
      return;
    }

    previousFurnishingStatusRef.current = currentStatus;
    dispatch(createFieldUpdateAction('propertyDetails', 'furnishingItems', getDefaultFurnishingItemsForStatus(currentStatus)));
  }, [dispatch, rentalInfo.furnishingStatus, resaleInfo.furnishingStatus]);

  const handleFieldChange = useCallback(
    (section, field, value) => {
      dispatch(createFieldUpdateAction(section, field, value));
    },
    [dispatch]
  );

  const handleAmenityChange = useCallback(
    (amenityId, checked) => {
      dispatch(createAmenityUpdateAction(amenityId, checked));
    },
    [dispatch]
  );

  const handleFacilityChange = useCallback(
    (facilityId, checked) => {
      dispatch(createFacilityUpdateAction(facilityId, checked));
    },
    [dispatch]
  );

  const handleFurnishingItemChange = useCallback(
    (itemId, checked) => {
      dispatch(createFurnishingItemUpdateAction(itemId, checked));
    },
    [dispatch]
  );

  const handleOutdoorFeatureChange = useCallback(
    (featureId, checked) => {
      dispatch(createOutdoorFeatureUpdateAction(featureId, checked));
    },
    [dispatch]
  );

  const handleSuitableForChange = useCallback(
    (categoryId, checked) => {
      dispatch(createSuitableForUpdateAction(categoryId, checked));
    },
    [dispatch]
  );

  return (
    <div className="space-y-8">
      {/* Error Modal */}
      {showErrorModal && Object.keys(errors).length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <FaTimes className="text-red-600" />
                Validation Errors
              </h2>
              <button
                onClick={() => setShowErrorModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 max-h-96 overflow-y-auto">
              <p className="text-gray-700 text-sm mb-3 font-semibold">Please fix the following errors:</p>
              <ul className="space-y-2">
                {Object.entries(errors).map(([field, error]) => {
                  if (typeof error === 'object' && error !== null) {
                    return Object.entries(error).map(([subField, subError]) => (
                      <li key={`${field}.${subField}`} className="text-red-600 text-sm flex gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>
                          <strong>{field} - {subField}:</strong> {subError}
                        </span>
                      </li>
                    ));
                  }
                  return (
                    <li key={field} className="text-red-600 text-sm flex gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>
                        <strong>{field}:</strong> {typeof error === 'string' ? error : JSON.stringify(error)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Got it, let me fix this
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-4 bg-purple-50 rounded-lg">
        <FaInfo className="text-purple-600" />
        <p className="text-purple-800 text-sm">Add property details</p>
      </div>

      {/* ========== COMMON FIELDS - PRICE, AREA, BEDROOMS, BATHROOMS ========== */}
      {isPlot && (
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 space-y-4">
          <h3 className="text-lg font-semibold text-purple-900">Plot Details</h3>
          <PlotNumberInput field="area" label={isResalePlot ? 'Plot Area (sq ft)' : 'Plot Area'} required
            value={propertyDetails.area} error={errors.area}
            onChange={(event) => handleFieldChange('propertyDetails', 'area', event.target.value)} />
          {isResalePlot ? (
            <>
              <PlotNumberInput field="pricePerSqft" label="Price per sq ft (₹)" required
                value={resaleInfo.pricePerSqft} error={errors.pricePerSqft}
                onChange={(event) => handleFieldChange('resaleInfo', 'pricePerSqft', event.target.value)} />
              <PlotNumberInput field="price" label="Total Price (₹)"
                value={calculateResalePlotPrice(propertyDetails.area, resaleInfo.pricePerSqft)}
                error={errors.price} readOnly />
            </>
          ) : (
            <>
              <div>
                <label htmlFor="plot-area-unit" className="block text-sm font-semibold text-gray-700 mb-2">Plot Area Unit</label>
                <select id="plot-area-unit" value={propertyDetails.areaUnit}
                  onChange={(event) => handleFieldChange('propertyDetails', 'areaUnit', event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  {AREA_UNITS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
                {errors.areaUnit && <p className="text-red-500 text-xs mt-1">{errors.areaUnit}</p>}
              </div>
              <PlotNumberInput field="price" label="Price (₹)" required value={propertyDetails.price} error={errors.price}
                onChange={(event) => handleFieldChange('propertyDetails', 'price', event.target.value)} />
            </>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plotDimensions.map(([field, label]) => (
              <PlotNumberInput key={field} field={field} label={label}
                value={formData[dimensionsSection][field]} error={errors[field]}
                onChange={(event) => handleFieldChange(dimensionsSection, field, event.target.value)} />
            ))}
          </div>
        </div>
      )}
      {shouldShowCommonFields && !isPlot && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200 mb-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">📋 Basic Property Details</h3>

          {/* Price - Only for buy and new project properties, not rental */}
          {!isRentalProperty(propertyType) && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">₹</span>
                <input
                  type="number"
                  value={propertyDetails.price}
                  onChange={(e) => handleFieldChange('propertyDetails', 'price', e.target.value)}
                  placeholder="0"
                  className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Built-up Area
            </label>
            <input
              type="number"
              value={propertyDetails.area}
              onChange={(e) => handleFieldChange('propertyDetails', 'area', e.target.value)}
              placeholder="0"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.area ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area}</p>}
          </div>

          {(isResaleVilla(subcategory) || subcategory === BUY_SUBCATEGORIES.NEW_PROJECT_VILLA) && (
            <div className="mb-4">
              <label htmlFor="property-plot-area" className="block text-sm font-semibold text-gray-700 mb-2">Plot Area</label>
              <input id="property-plot-area" type="number" min="1" step="any" value={propertyDetails.plotArea ?? ''}
                onChange={e => handleFieldChange('propertyDetails', 'plotArea', e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
              {errors.plotArea && <p className="text-red-500 text-xs mt-1">{errors.plotArea}</p>}
            </div>
          )}
          {/* Area Unit */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Built-up Area Unit</label>
            <select
              value={propertyDetails.areaUnit}
              onChange={(e) => handleFieldChange('propertyDetails', 'areaUnit', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.areaUnit ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {AREA_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
            {errors.areaUnit && <p className="text-red-500 text-xs mt-1">{errors.areaUnit}</p>}
          </div>

          {/* Bedrooms & Bathrooms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bedrooms
                </label>
                <input
                  type="number"
                  min="0"
                  value={propertyDetails.bedrooms}
                  onChange={(e) => handleFieldChange('propertyDetails', 'bedrooms', e.target.value)}
                  placeholder="0"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.bedrooms ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.bedrooms && <p className="text-red-500 text-xs mt-1">{errors.bedrooms}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bathrooms
                </label>
                <input
                  type="number"
                  min="0"
                  value={propertyDetails.bathrooms}
                  onChange={(e) => handleFieldChange('propertyDetails', 'bathrooms', e.target.value)}
                  placeholder="0"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.bathrooms ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.bathrooms && <p className="text-red-500 text-xs mt-1">{errors.bathrooms}</p>}
              </div>
          </div>
        </div>
      )}

      {/* ========== RESALE SPECIFIC FIELDS ========== */}
      {shouldShowResaleFields && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Resale Property Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Approval</label>
              <select
                value={resaleInfo.approval}
                onChange={(e) => handleFieldChange('resaleInfo', 'approval', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Approval</option>
                {getApprovalTypes().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">RERA Number</label>
              <input
                type="text"
                value={resaleInfo.reraNumber}
                onChange={(e) => handleFieldChange('resaleInfo', 'reraNumber', e.target.value)}
                placeholder="RERA number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ownership Type</label>
              <select
                value={resaleInfo.ownershipType}
                onChange={(e) => handleFieldChange('resaleInfo', 'ownershipType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Ownership</option>
                {getOwnershipTypes().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {!isResalePlot && <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Furnishing Status</label>
              <select
                value={resaleInfo.furnishingStatus}
                onChange={(e) => handleFieldChange('resaleInfo', 'furnishingStatus', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Furnishing</option>
                {Object.entries(FURNISHING_STATUS).map(([key, value]) => (
                  <option key={key} value={value}>{getDisplayLabel(value)}</option>
                ))}
              </select>
            </div>}
          </div>

          {!isResalePlot && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Floor Number</label>
                <input
                  type="number"
                  value={resaleInfo.floorNumber}
                  onChange={(e) => handleFieldChange('resaleInfo', 'floorNumber', e.target.value)}
                  placeholder="Floor"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total Floors</label>
                <input
                  type="number"
                  value={resaleInfo.totalFloors}
                  onChange={(e) => handleFieldChange('resaleInfo', 'totalFloors', e.target.value)}
                  placeholder="Total"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Property Age (years)</label>
                <input
                  type="number"
                  value={resaleInfo.propertyAge}
                  onChange={(e) => handleFieldChange('resaleInfo', 'propertyAge', e.target.value)}
                  placeholder="Age"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* New project fields moved to ProjectDetailsStep to avoid duplication */}

      {/* ========== RENTAL SPECIFIC FIELDS ========== */}
      {isRentalProperty(propertyType) && (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Rental Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Rent</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">₹</span>
                <input
                  type="number"
                  value={rentalInfo.monthlyRent}
                  onChange={(e) => handleFieldChange('rentalInfo', 'monthlyRent', e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Security Deposit</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">₹</span>
                <input
                  type="number"
                  value={rentalInfo.securityDeposit}
                  onChange={(e) => handleFieldChange('rentalInfo', 'securityDeposit', e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Maintenance Charges</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">₹</span>
                <input
                  type="number"
                  value={rentalInfo.maintenanceCharges}
                  onChange={(e) => handleFieldChange('rentalInfo', 'maintenanceCharges', e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Furnishing Status</label>
              <select
                value={rentalInfo.furnishingStatus || ''}
                onChange={(e) => handleFieldChange('rentalInfo', 'furnishingStatus', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Furnishing</option>
                {Object.values(FURNISHING_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {getDisplayLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Available From <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={rentalInfo.availableFrom}
                onChange={(e) => handleFieldChange('rentalInfo', 'availableFrom', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========== COMMERCIAL SPECIFIC FIELDS ========== */}
      {isCommercialProperty(propertyType) && (
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-4">Commercial Property Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Property Status</label>
              <select
                value={commercialDetails.propertyStatus ?? ''}
                onChange={(e) => handleFieldChange('commercialDetails', 'propertyStatus', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select Status</option>
                <option value="READY_TO_MOVE">Ready to Move</option>
                <option value="UNDER_CONSTRUCTION">Under Construction</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ownership Type</label>
              <select
                value={commercialDetails.ownershipType ?? ''}
                onChange={(e) => handleFieldChange('commercialDetails', 'ownershipType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select Ownership</option>
                {getOwnershipTypes().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">₹</span>
                <input
                  type="number"
                  value={commercialDetails.price ?? ''}
                  onChange={(e) => handleFieldChange('commercialDetails', 'price', e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ceiling Height (ft)</label>
              <input
                type="number"
                value={commercialDetails.ceilingHeight ?? ''}
                onChange={(e) => handleFieldChange('commercialDetails', 'ceilingHeight', e.target.value)}
                placeholder="Height"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Frontage Width (ft)</label>
              <input
                type="number"
                value={commercialDetails.frontageWidth ?? ''}
                onChange={(e) => handleFieldChange('commercialDetails', 'frontageWidth', e.target.value)}
                placeholder="Width"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {isCommercialBuy && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {[
                ['builtUpArea', 'Built-up Area'],
                ['carpetArea', 'Carpet Area'],
              ].map(([field, label]) => (
                <div key={field}>
                  <label htmlFor={`commercial-${field}`} className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <input id={`commercial-${field}`} type="number" min="0" value={commercialDetails[field] ?? ''}
                    onChange={(e) => handleFieldChange('commercialDetails', field, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              ))}
              <div>
                <label htmlFor="commercial-area-unit" className="block text-sm font-semibold text-gray-700 mb-2">Built-up Area Unit</label>
                <select id="commercial-area-unit" value={propertyDetails.areaUnit || 'sq_ft'}
                  onChange={(e) => handleFieldChange('propertyDetails', 'areaUnit', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="sq_ft">Sq. Ft</option><option value="sq_m">Sq. M</option><option value="acres">Acres</option>
                </select>
              </div>
              <div>
                <label htmlFor="commercial-bathrooms" className="block text-sm font-semibold text-gray-700 mb-2">Bathrooms</label>
                <input id="commercial-bathrooms" type="number" min="0" value={propertyDetails.bathrooms ?? ''}
                  onChange={(e) => handleFieldChange('propertyDetails', 'bathrooms', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label htmlFor="commercial-furnishing" className="block text-sm font-semibold text-gray-700 mb-2">Furnishing</label>
                <select id="commercial-furnishing" value={commercialDetails.furnishingType ?? ''}
                  onChange={(e) => handleFieldChange('commercialDetails', 'furnishingType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">Select Furnishing</option>
                  {commercialDetails.furnishingType && !Object.values(FURNISHING_STATUS).includes(commercialDetails.furnishingType) && (
                    <option value={commercialDetails.furnishingType}>{commercialDetails.furnishingType}</option>
                  )}
                  {Object.values(FURNISHING_STATUS).map((status) => <option key={status} value={status}>{getDisplayLabel(status)}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={Boolean(commercialDetails.parkingAvailability)}
                  onChange={(e) => handleFieldChange('commercialDetails', 'parkingAvailability', e.target.checked)} />
                Parking Available
              </label>
            </div>
          )}

          {isCommercialLease(subcategory) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lease Duration</label>
                <input
                  type="text"
                  value={commercialDetails.leaseDuration}
                  onChange={(e) => handleFieldChange('commercialDetails', 'leaseDuration', e.target.value)}
                  placeholder="e.g., 3 years"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lock-in Period (months)</label>
                <input
                  type="text"
                  value={commercialDetails.lockInPeriod}
                  onChange={(e) => handleFieldChange('commercialDetails', 'lockInPeriod', e.target.value)}
                  placeholder="e.g., 6 months"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          )}

          {/* Suitable For */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Suitable For</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {getBusinessSuitableFor().map(category => (
                <label key={category.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(commercialDetails.suitableFor || []).includes(category.value)}
                    onChange={(e) => handleSuitableForChange(category.value, e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{category.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Facing Direction */}
      {(isResalePlot || isResaleCategory(category) || isCommercialProperty(propertyType)) && (
        <div>
          <label htmlFor="facing-direction" className="block text-sm font-semibold text-gray-700 mb-2">Facing Direction</label>
          <select id="facing-direction"
            value={isCommercialBuy ? (commercialDetails.facing ?? '') : propertyDetails.facing}
            onChange={(e) => handleFieldChange(isCommercialBuy ? 'commercialDetails' : 'propertyDetails', 'facing', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select Direction</option>
            {getFacingDirections().map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Furnishing Items for Resale/Rental */}
      {shouldShowFurnishingItems && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <div className="flex flex-col gap-1 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Furnishing Facilities</h3>
            <p className="text-sm text-gray-600">
              {activeFurnishingStatus === FURNISHING_STATUS.FULLY_FURNISHED
                ? 'All listed facilities are included with this furnished property.'
                : 'These facilities are commonly included with this semi-furnished property.'}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {getFurnishingItems().map(item => (
              <label key={item.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(propertyDetails.furnishingItems || []).includes(item.id)}
                  onChange={(e) => handleFurnishingItemChange(item.id, e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Outdoor Features for Resale Villa */}
      {isResaleVilla(subcategory) && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Outdoor Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {getOutdoorFeatures().map(feature => (
              <label key={feature.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(propertyDetails.outdoorFeatures || []).includes(feature.id)}
                  onChange={(e) => handleOutdoorFeatureChange(feature.id, e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{feature.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Amenities</h3>
        <AmenityOptions options={isPlot ? AMENITIES.filter(({ id }) => isPlotAmenity(id)) : AMENITIES} selected={selectedAmenities} onChange={handleAmenityChange} />
        <div className="mt-4 space-y-2">
          {PREMIUM_AMENITY_GROUPS.map(({ label, amenities: groupAmenities }) => {
            const amenities = isPlot ? groupAmenities.filter(({ id }) => isPlotAmenity(id)) : groupAmenities;
            if (!amenities.length) return null;
            const selectedCount = amenities.filter(({ id }) => selectedAmenities.has(id)).length;
            return (
              <details key={label} className="rounded-lg border border-gray-200 p-3">
                <summary className="cursor-pointer font-semibold text-gray-700">
                  {label}
                  {selectedCount > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-600">{selectedCount} selected</span>
                  )}
                </summary>
                <div className="mt-3">
                  <AmenityOptions options={amenities} selected={selectedAmenities} onChange={handleAmenityChange} />
                </div>
              </details>
            );
          })}
        </div>
      </div>
      {isPlot && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Plot Facilities</h3>
          <PlotNumberInput field="roadWidth" label="Facing Road Width (ft)"
            value={formData.location.roadWidth} error={errors.roadWidth}
            onChange={(event) => handleFieldChange('location', 'roadWidth', event.target.value)} />
          <label className="flex items-center gap-2">
            <input type="checkbox"
              checked={(propertyDetails.facilities || []).includes(ELECTRIFICATION.id)}
              onChange={(event) => handleFacilityChange(ELECTRIFICATION.id, event.target.checked)}
              className="w-4 h-4 rounded text-purple-600" />
            {ELECTRIFICATION.label}
          </label>
        </div>
      )}
      {/* Facilities */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Nearby Facilities</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {FACILITIES.map((facility) => (
            <label key={facility.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(propertyDetails.facilities || []).includes(facility.id)}
                onChange={(e) => handleFacilityChange(facility.id, e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <AmenityIcons id={facility.id} className="text-purple-600 w-4 h-4 flex-shrink-0" />
              <span className="text-sm text-gray-700">{facility.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Featured Property Option */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-300">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={propertyDetails.featured}
            onChange={(e) => handleFieldChange('propertyDetails', 'featured', e.target.checked)}
            className="w-5 h-5 text-yellow-600 rounded"
          />
          <div>
            <p className="text-sm font-semibold text-gray-800">Mark as Featured Property</p>
            <p className="text-xs text-gray-600">Featured properties will be displayed on the home page below the hero section</p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default React.memo(PropertyDetailsStep);
