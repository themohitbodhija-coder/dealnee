import React, { useCallback, useRef, useState, useEffect } from 'react';
import { FaImage, FaTrash, FaPlus, FaTimes, FaStar, FaRegStar } from 'react-icons/fa';
import { processMultipleImages } from '../../../utils/propertyFormUtils';
import { getImageUrl } from '../../../utils/imageUrl';
import {
  createAddImageAction,
  createRemoveImageAction,
  createSetCoverImageAction,
} from '../../../reducers/propertyFormReducer';

const ImagesStep = ({ formData, dispatch, errors = {} }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = React.useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Show error modal when errors change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setShowErrorModal(true);
    }
  }, [errors]);

  const handleFileSelect = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      setUploading(true);
      try {
        const remainingSlots = 20 - formData.images.length;
        const filesToProcess = files.slice(0, remainingSlots);

        const { results, errors } = await processMultipleImages(filesToProcess);
        
        if (errors && errors.length > 0) {
          console.warn('Some images failed to process:', errors);
        }
        
        if (results && results.length > 0) {
          dispatch(createAddImageAction(results));
        }
      } catch (error) {
        console.error('Error uploading images:', error);
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [formData.images.length, dispatch]
  );

  const handleRemoveImage = useCallback(
    (index) => {
      dispatch(createRemoveImageAction(index));
    },
    [dispatch]
  );

  const handleSetCoverImage = useCallback(
    (index) => {
      dispatch(createSetCoverImageAction(index));
    },
    [dispatch]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer.files || []);
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        const fileInputEvent = {
          target: { files: imageFiles },
        };
        handleFileSelect(fileInputEvent);
      }
    },
    [handleFileSelect]
  );

  const canAddMore = formData.images.length < 20;

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

      <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
        <FaImage className="text-blue-600" />
        <p className="text-blue-800 text-sm">
          Upload property images (up to 20 images, max 5MB each)
        </p>
      </div>

      {/* Upload Area */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
            uploading
              ? 'border-blue-300 bg-blue-50'
              : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <FaPlus className="text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-700 mb-1">
            {uploading ? 'Uploading...' : 'Drop images or click to upload'}
          </p>
          <p className="text-sm text-gray-500">
            {formData.images.length} / 20 images uploaded
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </div>
      )}

      {errors.images && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{errors.images}</p>
        </div>
      )}

      {/* Image Gallery */}
      {formData.images.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Uploaded Images ({formData.images.length}/20)
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            The first image is used as the cover photo. Hover any other image and click "Set as Cover" to change it.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.images.map((image, index) => {
              // New uploads carry a base64 "preview". Existing/edit-mode images
              // carry a "url" (often just a filename) that needs to be resolved
              // to a full backend URL via getImageUrl().
              const imageSrc = image.preview || getImageUrl(image.url || image);
              const isCover = index === 0;

              return (
                <div
                  key={index}
                  className={`relative group rounded-lg overflow-hidden ${
                    isCover ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <img
                    src={imageSrc}
                    alt={`Property ${index + 1}`}
                    className="w-full h-40 object-cover shadow-md bg-gray-100"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="160" viewBox="0 0 200 160"%3E%3Crect width="200" height="160" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" font-size="12" fill="%239ca3af" text-anchor="middle" dy=".3em"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                    }}
                  />

                  {/* Cover badge */}
                  {isCover && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow">
                      <FaStar className="text-[10px]" /> Cover
                    </span>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition transform hover:scale-110"
                    title="Remove image"
                  >
                    <FaTrash className="text-sm" />
                  </button>

                  {/* Set as cover button (only for non-cover images) */}
                  {!isCover && (
                    <button
                      onClick={() => handleSetCoverImage(index)}
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow hover:bg-white"
                      title="Set as cover image"
                    >
                      <FaRegStar className="text-yellow-500" /> Set as Cover
                    </button>
                  )}

                  <p className="text-xs text-gray-600 mt-2 truncate px-1 pb-1">{image.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {formData.images.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <FaImage className="text-4xl text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(ImagesStep);