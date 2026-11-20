import React, { useCallback, useState, useEffect } from 'react';
import { FaBuilding, FaTimes } from 'react-icons/fa';
import {
  BUY_SUBCATEGORIES,
  getProjectStatusOptions,
  getApprovalTypes,
  AREA_UNITS,
  LAND_AREA_UNITS,
} from '../../../constants/propertyConstants';
import {
  createFieldUpdateAction,
  createUnitConfigurationUpdateAction,
} from '../../../reducers/propertyFormReducer';

import { BHK_OPTIONS, getUnitBhk, getUnitBedrooms, isApartmentProject, areaInSquareFeet } from '../../../utils/projectUnits';

const ProjectDetailsStep = ({ formData, dispatch, errors = {} }) => {
  const [selectedBhk, setSelectedBhk] = useState('1');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const { newProjectInfo, projectPricing } = formData;
  const isPlot = formData.basicInfo.subcategory === BUY_SUBCATEGORIES.NEW_PROJECT_PLOT;
  const isApartment = isApartmentProject(formData.basicInfo.subcategory);
  const projectErrors = errors.newProjectInfo || {};
  const pricingErrors = errors.projectPricing || {};
  const unitErrors = errors.unitConfigurations || {};

  // Show error modal when errors change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setShowErrorModal(true);
    }
  }, [errors]);

  const handleProjectFieldChange = useCallback(
    (field, value) => {
      dispatch(createFieldUpdateAction('newProjectInfo', field, value));
    },
    [dispatch]
  );

  const handlePricingFieldChange = useCallback(
    (field, value) => {
      dispatch(createFieldUpdateAction('projectPricing', field, value));
    },
    [dispatch]
  );

  const handleUnitConfigChange = useCallback(
    (bhkType, field, value) => {
      dispatch(createUnitConfigurationUpdateAction(bhkType, field, value));
    },
    [dispatch]
  );

  // Auto-calculate Price Per Sq.Ft = Starting Price / Super Built-up Area
  // Uses the first configuration with a super built-up area entered.
  useEffect(() => {
    if (isPlot) return;
    const startingPrice = parseFloat(projectPricing.startingPrice);
    const referenceSuperBuildUpArea = Object.values(projectPricing.unitConfigurations || {})
      .map((unit) => parseFloat(unit?.superBuildUpArea))
      .find((area) => !isNaN(area) && area > 0);

    const calculatedPricePerSqft = !isNaN(startingPrice) && startingPrice > 0 && referenceSuperBuildUpArea
      ? Math.round(startingPrice / areaInSquareFeet(referenceSuperBuildUpArea, formData.propertyDetails.areaUnit)) : '';
    if (String(calculatedPricePerSqft) !== String(projectPricing.pricePerSqft)) {
      dispatch(createFieldUpdateAction('projectPricing', 'pricePerSqft', calculatedPricePerSqft));
    }
  }, [
    isPlot,
    formData.propertyDetails.areaUnit,
    projectPricing.startingPrice,
    projectPricing.unitConfigurations,
    projectPricing.pricePerSqft,
    dispatch,
  ]);

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
                          <strong>{field} - {subField}:</strong> {typeof subError === 'object' ? Object.values(subError).join('; ') : subError}
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

      <div className="flex items-center gap-2 p-4 bg-indigo-50 rounded-lg">
        <FaBuilding className="text-indigo-600" />
        <p className="text-indigo-800 text-sm">Add new project information</p>
      </div>

      {/* Project Basic Info */}
      <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4">Project Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {[['totalUnits', 'Total Units'], ['totalProjectArea', 'Total Project Area']].map(([field, label]) => (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
              <input id={field} type="number" min="1" step={field === 'totalUnits' ? '1' : 'any'} value={newProjectInfo[field] ?? ''}
                onChange={e => handleProjectFieldChange(field, e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
              {projectErrors[field] && <p className="text-red-500 text-xs mt-1">{projectErrors[field]}</p>}
            </div>
          ))}
          <div>
            <label htmlFor="totalProjectAreaUnit" className="block text-sm font-semibold text-gray-700 mb-2">Total Project Area Unit</label>
            <select id="totalProjectAreaUnit" value={newProjectInfo.totalProjectAreaUnit || 'sq_ft'} onChange={e => handleProjectFieldChange('totalProjectAreaUnit', e.target.value)} className="w-full px-4 py-3 border rounded-lg">
              {LAND_AREA_UNITS.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={newProjectInfo.projectName}
              onChange={(e) => handleProjectFieldChange('projectName', e.target.value)}
              placeholder="e.g., Prestige Towers"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                projectErrors.projectName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {projectErrors.projectName && (
              <p className="text-red-500 text-xs mt-1">{projectErrors.projectName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Builder Name
            </label>
            <input
              type="text"
              value={newProjectInfo.builderName}
              onChange={(e) => handleProjectFieldChange('builderName', e.target.value)}
              placeholder="e.g., Prestige Group"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                projectErrors.builderName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {projectErrors.builderName && (
              <p className="text-red-500 text-xs mt-1">{projectErrors.builderName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Project Status
            </label>
            <select
              value={newProjectInfo.projectStatus}
              onChange={(e) => handleProjectFieldChange('projectStatus', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                projectErrors.projectStatus ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Status</option>
              {getProjectStatusOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {projectErrors.projectStatus && (
              <p className="text-red-500 text-xs mt-1">{projectErrors.projectStatus}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Approval
            </label>
            <select
              value={newProjectInfo.approval}
              onChange={(e) => handleProjectFieldChange('approval', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                projectErrors.approval ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Approval</option>
              {getApprovalTypes().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {projectErrors.approval && (
              <p className="text-red-500 text-xs mt-1">{projectErrors.approval}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              RERA Number
            </label>
            <input
              type="text"
              value={newProjectInfo.reraNumber}
              onChange={(e) => handleProjectFieldChange('reraNumber', e.target.value)}
              placeholder="e.g., REG/BNG/2024/001"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                projectErrors.reraNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {projectErrors.reraNumber && (
              <p className="text-red-500 text-xs mt-1">{projectErrors.reraNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Possession Date
            </label>
            <input
              type="date"
              value={newProjectInfo.possessionDate}
              onChange={(e) => handleProjectFieldChange('possessionDate', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                projectErrors.possessionDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {projectErrors.possessionDate && (
              <p className="text-red-500 text-xs mt-1">{projectErrors.possessionDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Project Pricing */}
      <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">Project Pricing</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Starting Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500">₹</span>
              <input
                type="number"
                value={projectPricing.startingPrice}
                onChange={(e) => handlePricingFieldChange('startingPrice', e.target.value)}
                placeholder="0"
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  pricingErrors.startingPrice ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {pricingErrors.startingPrice && (
              <p className="text-red-500 text-xs mt-1">{pricingErrors.startingPrice}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price Range
            </label>
            <input
              type="text"
              value={projectPricing.priceRange}
              onChange={(e) => handlePricingFieldChange('priceRange', e.target.value)}
              placeholder="e.g., 50L - 70L"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                pricingErrors.priceRange ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {pricingErrors.priceRange && (
              <p className="text-red-500 text-xs mt-1">{pricingErrors.priceRange}</p>
            )}
          </div>

          <div>
            <label htmlFor="project-price-per-sq-ft" className="block text-sm font-semibold text-gray-700 mb-2">
              Price per sq ft {!isPlot && <span className="text-gray-400 font-normal">(auto-calculated)</span>}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500">₹</span>
              <input
                id="project-price-per-sq-ft"
                type="number"
                min="0"
                step="any"
                value={projectPricing.pricePerSqft}
                onChange={(event) => handlePricingFieldChange('pricePerSqft', event.target.value)}
                readOnly={!isPlot}
                placeholder="0"
                title={isPlot ? undefined : 'Automatically calculated as Starting Price ÷ Super Built-up Area'}
                className={`w-full pl-8 pr-4 py-3 border rounded-lg ${isPlot ? '' : 'bg-gray-100 cursor-not-allowed'} ${
                  pricingErrors.pricePerSqft ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {pricingErrors.pricePerSqft && (
              <p className="text-red-500 text-xs mt-1">{pricingErrors.pricePerSqft}</p>
            )}
          </div>
        </div>
      </div>

      {/* Unit Configurations */}
      {!isPlot && <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-6">Unit Configurations</h3>
        {unitErrors._form && <p role="alert" className="text-red-600 mb-4">{unitErrors._form.bhk}</p>}

        <div className="flex items-end gap-3 mb-6">
          <div>
            <label htmlFor="unit-bhk" className="block text-sm font-semibold mb-2">Select BHK</label>
            <select id="unit-bhk" value={selectedBhk} onChange={e => setSelectedBhk(e.target.value)} className="px-4 py-3 border rounded-lg">
              {BHK_OPTIONS.map(bhk => <option key={bhk} value={bhk}>{bhk} BHK</option>)}
            </select>
          </div>
          <button type="button" className="px-4 py-3 bg-blue-600 text-white rounded-lg" onClick={() => {
            const code = `bhk${selectedBhk.replace('.', 'p')}_${crypto.randomUUID().replace(/-/g, '')}`;
            handlePricingFieldChange('unitConfigurations', { ...projectPricing.unitConfigurations,
              [code]: { bedrooms: String(Math.floor(Number(selectedBhk))), bathrooms: '', landArea: '', superBuildUpArea: '', carpetArea: '', price: '' } });
          }}>Add Unit</button>
        </div>
        <p className="text-sm text-gray-600 mb-4">Add each configuration separately. You can add multiple units with the same BHK.{!isApartment && ' Areas use the area unit selected in step 4.'}</p>
        {isApartment && <div className="mb-4">
          <label htmlFor="apartment-area-unit" className="block text-sm font-semibold mb-2">Unit Area Unit</label>
          <select id="apartment-area-unit" value={formData.propertyDetails.areaUnit} onChange={e => dispatch(createFieldUpdateAction('propertyDetails', 'areaUnit', e.target.value))} className="px-4 py-3 border rounded-lg">
            {AREA_UNITS.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
          </select>
        </div>}
        <div className="space-y-6">
          {Object.entries(projectPricing.unitConfigurations || {}).filter(([, unit]) => unit && Object.values(unit).some(value => value !== '' && value != null)).map(([code, unit]) => (
            <div key={code} className="bg-white p-4 rounded-lg border border-gray-300">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">{getUnitBhk(code)} BHK</h4>
                <button type="button" className="text-red-600" aria-label={`Remove ${code}`} onClick={() => {
                  const remaining = { ...projectPricing.unitConfigurations };
                  delete remaining[code];
                  handlePricingFieldChange('unitConfigurations', remaining);
                }}>Remove Unit</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ...(!isApartment ? [['landArea', 'Land Area']] : []), ['bedrooms', 'Bedrooms'], ['bathrooms', 'Bathrooms'],
                  ['superBuildUpArea', 'Super Built-up Area'], ['carpetArea', 'Carpet Area'], ['price', 'Price (₹)'],
                ].map(([field, label]) => (
                  <div key={field}>
                    <label htmlFor={`${code}-${field}`} className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                    <input id={`${code}-${field}`} type="number" min="1" step={['bedrooms', 'bathrooms'].includes(field) ? '1' : 'any'}
                      value={unit[field] ?? (field === 'bedrooms' ? getUnitBedrooms(code) : '')}
                      onChange={e => handleUnitConfigChange(code, field, e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg ${unitErrors[code]?.[field] ? 'border-red-500' : 'border-gray-300'}`} />
                    {unitErrors[code]?.[field] && <p className="text-red-500 text-xs mt-1">{unitErrors[code][field]}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
};

export default React.memo(ProjectDetailsStep);
