import React, { useCallback, useEffect, useState } from 'react';
import { FaInfoCircle, FaTimes } from 'react-icons/fa';
import {
  PROPERTY_TYPES,
  getCategoriesForType,
  getSubcategoriesForType,
  getDisplayLabel,
} from '../../../constants/propertyConstants';
import { createFieldUpdateAction } from '../../../reducers/propertyFormReducer';
import { generateSequentialPropertyId } from '../../../utils/propertyIdGenerator';
import { propertyService } from '../../../services/api';

const BasicInfoStep = ({ formData, dispatch, errors = {}, isEditMode = false }) => {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [idGenerationError, setIdGenerationError] = useState(null);
  const [isGeneratingId, setIsGeneratingId] = useState(false);

  // Show error modal when errors change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setShowErrorModal(true);
    }
  }, [errors]);

  const handleTitleChange = useCallback(
    (e) => {
      dispatch(createFieldUpdateAction('basicInfo', 'title', e.target.value));
    },
    [dispatch]
  );

  const handleDescriptionChange = useCallback(
    (e) => {
      dispatch(createFieldUpdateAction('basicInfo', 'description', e.target.value));
    },
    [dispatch]
  );

  const handlePropertyIdChange = useCallback(
    (e) => {
      dispatch(createFieldUpdateAction('basicInfo', 'propertyId', e.target.value));
    },
    [dispatch]
  );

  const handlePropertyTypeChange = useCallback(
    (e) => {
      const propertyType = e.target.value;
      dispatch(createFieldUpdateAction('basicInfo', 'propertyType', propertyType));
      dispatch(createFieldUpdateAction('basicInfo', 'category', ''));
      dispatch(createFieldUpdateAction('basicInfo', 'subcategory', ''));
    },
    [dispatch]
  );

  const handleCategoryChange = useCallback(
    (e) => {
      dispatch(createFieldUpdateAction('basicInfo', 'category', e.target.value));
      dispatch(createFieldUpdateAction('basicInfo', 'subcategory', ''));
    },
    [dispatch]
  );

  const handleSubcategoryChange = useCallback(
    (e) => {
      dispatch(createFieldUpdateAction('basicInfo', 'subcategory', e.target.value));
    },
    [dispatch]
  );

  // Function to generate property ID
  const generateIdForCategory = useCallback(
    async (propertyType, category) => {
      if (!propertyType || !category) {
        console.log('[BasicInfoStep] Skipping ID generation - missing propertyType or category');
        setIdGenerationError(null);
        return;
      }

      const prefix = 'DEL';
      const categoryForId = propertyType === PROPERTY_TYPES.RENT ? 'RENT' : category;

      console.log('[BasicInfoStep] Generating ID with propertyType:', propertyType, 'category:', category, 'categoryForId:', categoryForId);
      
      setIsGeneratingId(true);
      setIdGenerationError(null);

      try {
        const response = await propertyService.getNextSequentialId(categoryForId);
        console.log('[BasicInfoStep] API Response:', response);

        if (response.data && response.data.nextNumber !== undefined) {
          const nextNum = response.data.nextNumber;
          const propertyId = generateSequentialPropertyId(categoryForId, nextNum, prefix, propertyType);
          console.log('[BasicInfoStep] Generated Property ID:', propertyId);
          dispatch(createFieldUpdateAction('basicInfo', 'propertyId', propertyId));
          setIdGenerationError(null);
        } else {
          console.warn('[BasicInfoStep] Unexpected API response:', response);
          setIdGenerationError('Invalid API response. Please try again.');
        }
      } catch (error) {
        console.error('[BasicInfoStep] Error generating ID:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to generate Property ID. Please check if the category is properly configured.';
        setIdGenerationError(errorMsg);
        
        // Still allow user to continue by manually entering ID
        console.warn('[BasicInfoStep] User can enter Property ID manually');
      } finally {
        setIsGeneratingId(false);
      }
    },
    [dispatch]
  );

  // Trigger ID generation when category changes — but NEVER while editing an
  // existing property. Regenerating the ID here would silently swap the
  // property's real ID (e.g. DEL-REN-001) for a brand new one (DEL-REN-002)
  // on every edit, which made edits appear to "not save" (they were really
  // being applied to/creating a different record).
  useEffect(() => {
    if (isEditMode) {
      return;
    }
    const { category, propertyType } = formData.basicInfo;
    if (category && propertyType) {
      generateIdForCategory(propertyType, category);
    }
  }, [formData.basicInfo.category, formData.basicInfo.propertyType, generateIdForCategory, isEditMode]);

  const categories = getCategoriesForType(formData.basicInfo.propertyType);
  const subcategories = getSubcategoriesForType(
    formData.basicInfo.propertyType,
    formData.basicInfo.category
  );

  return (
    <div className="space-y-6">
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
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field} className="text-red-600 text-sm flex gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>
                      <strong>{field}:</strong> {typeof error === 'string' ? error : JSON.stringify(error)}
                    </span>
                  </li>
                ))}
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

      <div className="flex items-center gap-2 mb-6 p-4 bg-blue-50 rounded-lg">
        <FaInfoCircle className="text-blue-600" />
        <p className="text-blue-800 text-sm">
          Start by entering basic information about your property
        </p>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Property Type
        </label>
        <select
          value={formData.basicInfo.propertyType}
          onChange={handlePropertyTypeChange}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.propertyType ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select Property Type</option>
          <option value="BUY">Buy</option>
          <option value="RENT">Rent</option>
          <option value="COMMERCIAL">Commercial</option>
        </select>
        {errors.propertyType && (
          <p className="text-red-500 text-xs mt-1">{errors.propertyType}</p>
        )}
      </div>

      {/* Category */}
      {formData.basicInfo.propertyType && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category
          </label>
          <select
            value={formData.basicInfo.category}
            onChange={handleCategoryChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-xs mt-1">{errors.category}</p>
          )}
        </div>
      )}

      {/* Subcategory */}
      {formData.basicInfo.category && subcategories && subcategories.length > 0 && formData.basicInfo.propertyType !== PROPERTY_TYPES.RENT && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Subcategory
          </label>
          <select
            value={formData.basicInfo.subcategory}
            onChange={handleSubcategoryChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.subcategory ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Subcategory</option>
            {subcategories.map((sub) => (
              <option key={sub.value} value={sub.value}>
                {sub.label}
              </option>
            ))}
          </select>
          {errors.subcategory && (
            <p className="text-red-500 text-xs mt-1">{errors.subcategory}</p>
          )}
        </div>
      )}

      {/* Property ID */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Property ID
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.basicInfo.propertyId}
            onChange={handlePropertyIdChange}
            placeholder="e.g., DEL-NP-001"
            disabled={isGeneratingId}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.propertyId ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {isGeneratingId && (
            <span className="absolute right-4 top-3 text-gray-500 text-sm">
              Generating...
            </span>
          )}
        </div>
        
        {/* ID Generation Error */}
        {idGenerationError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-xs">
              <strong>ID Generation Error:</strong> {idGenerationError}
            </p>
            <p className="text-red-600 text-xs mt-1">
              You can manually enter the Property ID in format: DEL-[Category]-[Number] (e.g., DEL-REN-001)
            </p>
          </div>
        )}
        
        {formData.basicInfo.propertyId && !idGenerationError && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <span>✓</span> Format: [DEL]-[Category]-[Sequential Number]
          </p>
        )}
        {errors.propertyId && <p className="text-red-500 text-xs mt-1">{errors.propertyId}</p>}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Property Title
        </label>
        <input
          type="text"
          value={formData.basicInfo.title}
          onChange={handleTitleChange}
          placeholder="e.g., Modern 3 BHK Apartment in Downtown"
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.basicInfo.description}
          onChange={handleDescriptionChange}
          placeholder="Describe your property in detail..."
          rows="5"
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
        )}
      </div>
    </div>
  );
};

export default React.memo(BasicInfoStep);