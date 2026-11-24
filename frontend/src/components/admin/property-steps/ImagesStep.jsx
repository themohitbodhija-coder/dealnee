import React, { useCallback, useRef, useState, useEffect } from 'react';
import { FaImage, FaTrash, FaPlus, FaTimes, FaStar, FaRegStar } from 'react-icons/fa';
import { processMultipleImages } from '../../../utils/propertyFormUtils';
import { usesSupabase } from '../../../lib/backend';
import { uploadPropertyImage } from '../../../services/photoService';
import { getImageUrl } from '../../../utils/imageUrl';
import { getPropertyImageMime, PROPERTY_IMAGE_ACCEPT } from '../../../utils/propertyImageType';
import {
  createAddImageAction,
  createRemoveImageAction,
  createSetCoverImageAction,
} from '../../../reducers/propertyFormReducer';

const ImagesStep = ({ formData, dispatch, errors = {}, propertyId, createSessionId, onUploadingChange }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const uploadLock = useRef(false);
  const controller = useRef(null);
    const uploadingFilesRef = useRef(uploadingFiles);
    uploadingFilesRef.current = uploadingFiles;

    useEffect(() => {
      return () => {
        controller.current?.abort();
        uploadingFilesRef.current.forEach((item) => {
          if (item.preview?.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(item.preview);
            } catch (_) { }
          }
        });
      };
    }, []);

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

        if (uploadLock.current) return;
        uploadLock.current = true;
        controller.current = new AbortController();
        setUploading(true);
        setUploadError('');
        onUploadingChange?.(true);

        const remainingSlots = 20 - formData.images.length;
        const filesToProcess = files.slice(0, remainingSlots);
        if (files.length > remainingSlots) {
          setUploadError('Only the first available image slots will be uploaded.');
        }

        // Generate immediate local previews so user sees them right away
        const pendingItems = filesToProcess.map((file, idx) => ({
          id: `pending-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          preview: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
            ? URL.createObjectURL(file)
            : '',
          file,
          status: 'uploading',
        }));

        setUploadingFiles(pendingItems);

        try {
          if (usesSupabase) {
            // One decode per request; avoid concurrent large WASM allocations.
              for (const pending of pendingItems) {
                try {
                    const image = await uploadPropertyImage(pending.file, {
                      propertyId: propertyId || formData.id || formData._id || null,
                      createSessionId: (propertyId || formData.id || formData._id) ? null : (createSessionId || formData.createSessionId),
                      signal: controller.current.signal,
                    });
                    if(controller.current.signal.aborted) break;

                  // Ensure the preview URL is preserved so the card displays seamlessly
                  const finalImage = {
                    ...image,
                    preview: image.preview || pending.preview,
                  };

                  dispatch(createAddImageAction([finalImage]));
                  setUploadingFiles((prev) => prev.filter((item) => item.id !== pending.id));
                } catch (error) {
                  if (error.name === 'AbortError') break;
                  setUploadingFiles((prev) => prev.filter((item) => item.id !== pending.id));
                  if (pending.preview?.startsWith('blob:')) {
                    try {
                      URL.revokeObjectURL(pending.preview);
                    } catch (_) { }
                  }
                  setUploadError(`${pending.name}: ${error.message} Select this file again to retry.`);
                }
              }
            } else {
              const { results, errors: processingErrors } = await processMultipleImages(filesToProcess);
              if (processingErrors?.length) {
                setUploadError('Some images could not be processed. Select them again to retry.');
              }
              if (results?.length) {
                dispatch(createAddImageAction(results));
              }
              pendingItems.forEach((item) => {
                if (item.preview?.startsWith('blob:')) {
                  try {
                    URL.revokeObjectURL(item.preview);
                  } catch (_) { }
                }
              });
              setUploadingFiles([]);
            }
          } catch (error) {
            if (error.name !== 'AbortError') setUploadError(error.message);
          } finally {
            uploadLock.current = false;
            setUploading(false);
            setUploadingFiles([]);
            onUploadingChange?.(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        },
        [formData.images.length, formData.id, formData._id, formData.createSessionId, propertyId, createSessionId, dispatch, onUploadingChange]
  );

    const handleRemoveImage = useCallback(
      (index) => {
        const img = formData.images[index];
        if (img?.preview && typeof img.preview === 'string' && img.preview.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(img.preview);
          } catch (_) { }
        }
        dispatch(createRemoveImageAction(index));
      },
      [formData.images, dispatch]
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
        const imageFiles = files.filter((file) => getPropertyImageMime(file));
        if (imageFiles.length > 0) {
          const fileInputEvent = {
            target: { files: imageFiles },
          };
          handleFileSelect(fileInputEvent);
        }
      },
      [handleFileSelect]
    );

    const totalImageCount = formData.images.length + uploadingFiles.length;
    const canAddMore = totalImageCount < 20;

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
            Upload property images (up to 20 images, max 20MB each; large JPGs are automatically resized)
          </p>
        </div>

        {/* Upload Area */}
        {canAddMore && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${uploading
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              }`}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <FaPlus className="text-4xl text-gray-400 mx-auto mb-3" />
            <p className="text-lg font-semibold text-gray-700 mb-1">
              {uploading ? 'Uploading images...' : 'Drop images or click to upload'}
            </p>
            <p className="text-sm text-gray-500">
              {formData.images.length} / 20 images uploaded
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={PROPERTY_IMAGE_ACCEPT}
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </div>
        )}

        {uploadError && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-lg">{uploadError}</p>}
        {errors.images && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{errors.images}</p>
          </div>
        )}

        {/* Image Gallery */}
            {(formData.images.length > 0 || uploadingFiles.length > 0) && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Uploaded Images ({formData.images.length}/20)
                  </h3>
                  <span className="text-xs text-gray-500">
                    ★ The cover photo is displayed first on listings and search cards
                  </span>
                </div>

                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start sm:items-center gap-2">
                  <FaStar className="text-amber-500 text-sm shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    <strong>Cover Photo:</strong> The image marked with <strong>Cover Photo</strong> is your listing's primary image. To choose a different cover, click <strong>"Set as Cover"</strong> on any other image.
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => {
                    const imageSrc = image.preview || getImageUrl(image.url || image);
                    const isCover = index === 0;

                    return (
                <div
                  key={image.uploadId || image.id || index}
                  className={`relative flex flex-col rounded-lg overflow-hidden bg-white border transition shadow-sm ${
                    isCover
                      ? 'ring-2 ring-yellow-400 border-yellow-400 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Thumbnail area */}
                  <div className="relative w-full h-40 bg-gray-100 overflow-hidden group">
                    <img
                      src={imageSrc}
                      alt={image.name || `Property ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="160" viewBox="0 0 200 160"%3E%3Crect width="200" height="160" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" font-size="12" fill="%239ca3af" text-anchor="middle" dy=".3em"%3EImage preview%3C/text%3E%3C/svg%3E';
                      }}
                    />

                    {/* Cover badge on top of image */}
                    {isCover && (
                      <span className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-400 text-yellow-950 text-xs font-bold px-2 py-1 rounded shadow-md z-10">
                        <FaStar className="text-[10px]" /> Cover
                      </span>
                    )}

                    {!isCover && (
                      <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow z-10">
                        #{index + 1}
                      </span>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow transition transform hover:scale-110 z-10"
                      title="Remove image"
                      aria-label="Remove image"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>

                  {/* Info and Set Cover action row */ }
                    <div className="p-2.5 flex flex-col gap-1.5 bg-white border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-700 truncate" title={image.name || `Image ${index + 1}`}>
                        {image.name || `Image ${index + 1}`}
                      </p>

                      {isCover ? (
                        <div className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-yellow-100 text-yellow-900 text-xs font-bold rounded border border-yellow-300">
                          <FaStar className="text-yellow-600" /> Current Cover
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={() => handleSetCoverImage(index)}
                          className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-white hover:bg-yellow-50 active:bg-yellow-100 text-gray-700 hover:text-yellow-900 text-xs font-semibold rounded border border-gray-200 hover:border-yellow-300 transition shadow-sm"
                          title="Choose this as cover photo"
                        >
                          <FaRegStar className="text-yellow-500" /> Set as Cover
                        </button>
                      )}
                    </div>
                </div>
                );
            })}

                {/* Uploading pending cards */}
                {uploadingFiles.map((item) => (
                  <div
                    key={item.id}
                    className="relative flex flex-col rounded-lg overflow-hidden bg-white border border-blue-200 shadow-sm animate-pulse"
                  >
                    <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                      {item.preview ? (
                        <img
                          src={item.preview}
                          alt={item.name}
                          className="w-full h-full object-cover filter brightness-75"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <FaImage className="text-gray-300 text-3xl" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-2">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mb-1.5" />
                        <span className="text-xs font-semibold">Uploading...</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 truncate" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-[11px] text-blue-600 font-medium mt-1">Processing upload...</p>
                    </div>
                  </div>
                ))}
              </div>
        </div>
        )}

          {
            formData.images.length === 0 && uploadingFiles.length === 0 && (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <FaImage className="text-4xl text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No images uploaded yet</p>
              </div>
            )
          }
    </div>
    );
  };

  export default React.memo(ImagesStep);
