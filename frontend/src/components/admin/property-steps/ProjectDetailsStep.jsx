import React, { useCallback, useState, useEffect } from 'react';
import { FaBuilding, FaTimes } from 'react-icons/fa';
import {
  getProjectStatusOptions,
  getApprovalTypes,
} from '../../../constants/propertyConstants';
import {
  createFieldUpdateAction,
  createUnitConfigurationUpdateAction,
} from '../../../reducers/propertyFormReducer';

const ProjectDetailsStep = ({ formData, dispatch, errors = {} }) => {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const { newProjectInfo, projectPricing } = formData;
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

  // Auto-calculate Price Per Sq.Ft = Starting Price / Carpet Area
  // Uses the first unit configuration (2 BHK, then 3 BHK, then 4 BHK) that
  // has a carpet area entered.
  useEffect(() => {
    const startingPrice = parseFloat(projectPricing.startingPrice);
    const { bhk2, bhk3, bhk4 } = projectPricing.unitConfigurations;
    const referenceCarpetArea = [bhk2, bhk3, bhk4]
      .map((unit) => parseFloat(unit?.carpetArea))
      .find((area) => !isNaN(area) && area > 0);

    if (!isNaN(startingPrice) && startingPrice > 0 && referenceCarpetArea) {
      const calculatedPricePerSqft = Math.round(startingPrice / referenceCarpetArea);
      if (String(calculatedPricePerSqft) !== String(projectPricing.pricePerSqft)) {
        dispatch(createFieldUpdateAction('projectPricing', 'pricePerSqft', calculatedPricePerSqft));
      }
    }
  }, [
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

      <div className="flex items-center gap-2 p-4 bg-indigo-50 rounded-lg">
        <FaBuilding className="text-indigo-600" />
        <p className="text-indigo-800 text-sm">Add new project information</p>
      </div>

      {/* Project Basic Info */}
      <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4">Project Information</h3>

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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price Per Sq.Ft <span className="text-gray-400 font-normal">(auto-calculated)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500">₹</span>
              <input
                type="number"
                value={projectPricing.pricePerSqft}
                readOnly
                placeholder="0"
                title="Automatically calculated as Starting Price ÷ Carpet Area"
                className={`w-full pl-8 pr-4 py-3 border rounded-lg bg-gray-100 cursor-not-allowed focus:outline-none ${
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
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-6">Unit Configurations</h3>

        <div className="space-y-6">
          {['bhk2', 'bhk3', 'bhk4'].map(bhkType => {
            const bhkLabel = bhkType === 'bhk2' ? '2 BHK' : bhkType === 'bhk3' ? '3 BHK' : '4 BHK';
            const unit = projectPricing.unitConfigurations[bhkType];
            const bhkError = unitErrors[bhkType] || {};

            return (
              <div key={bhkType} className="bg-white p-4 rounded-lg border border-gray-300">
                <h4 className="font-semibold text-gray-800 mb-3">{bhkLabel}</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Super Built-up Area
                    </label>
                    <input
                      type="number"
                      value={unit.superBuildUpArea}
                      onChange={(e) => handleUnitConfigChange(bhkType, 'superBuildUpArea', e.target.value)}
                      placeholder="0"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        bhkError.superBuildUpArea ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {bhkError.superBuildUpArea && (
                      <p className="text-red-500 text-xs mt-1">{bhkError.superBuildUpArea}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Carpet Area
                    </label>
                    <input
                      type="number"
                      value={unit.carpetArea}
                      onChange={(e) => handleUnitConfigChange(bhkType, 'carpetArea', e.target.value)}
                      placeholder="0"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        bhkError.carpetArea ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {bhkError.carpetArea && (
                      <p className="text-red-500 text-xs mt-1">{bhkError.carpetArea}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500">₹</span>
                      <input
                        type="number"
                        value={unit.price}
                        onChange={(e) => handleUnitConfigChange(bhkType, 'price', e.target.value)}
                        placeholder="0"
                        className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          bhkError.price ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {bhkError.price && (
                      <p className="text-red-500 text-xs mt-1">{bhkError.price}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProjectDetailsStep);