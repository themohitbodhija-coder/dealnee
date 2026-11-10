import React, { useState, useMemo } from 'react';
import { FaCheckCircle, FaChevronDown, FaChevronUp, FaEdit } from 'react-icons/fa';
import { getDisplayLabel, PROPERTY_TYPES } from '../../../constants/propertyConstants';
import { formatPrice, formatArea } from '../../../utils/propertyFormUtils';

const ReviewStep = ({ formData, onEdit }) => {
  const commercialBuy = formData.basicInfo.propertyType === 'COMMERCIAL';
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    location: true,
    contact: true,
    propertyDetails: true,
    images: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const SectionHeader = ({ section, title, isExpanded }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 transition rounded-lg"
    >
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <FaCheckCircle className="text-green-500" />
        {title}
      </h3>
      {isExpanded ? (
        <FaChevronUp className="text-gray-600" />
      ) : (
        <FaChevronDown className="text-gray-600" />
      )}
    </button>
  );

  const DetailRow = ({ label, value, editSection }) => {
    const renderValue = () => {
      // If value is a React element, render as-is
      if (React.isValidElement(value)) return value;
      // Treat null/undefined/empty-string as missing
      if (value === null || value === undefined) return <span className="text-gray-500">N/A</span>;
      if (typeof value === 'string' && value.trim() === '') return <span className="text-gray-500">N/A</span>;
      return <span className="text-gray-900 font-semibold">{value}</span>;
    };

    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
        <span className="text-gray-600 font-medium">{label}</span>
        <div className="flex items-center gap-3">
          {renderValue()}
          {editSection && (
            <button
              onClick={() => onEdit(editSection)}
              className="text-blue-600 hover:text-blue-800 transition"
              title="Edit"
            >
              <FaEdit className="text-sm" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-800 font-semibold">
          ✓ Review your property details before submitting
        </p>
      </div>

      {/* Basic Info Section */}
      <div className="border rounded-lg overflow-hidden">
        <SectionHeader
          section="basicInfo"
          title="Basic Information"
          isExpanded={expandedSections.basicInfo}
        />
        {expandedSections.basicInfo && (
          <div className="p-4 space-y-3">
            <DetailRow
              label="Title"
              value={formData.basicInfo.title}
              editSection="basic_info"
            />
            <DetailRow
              label="Description"
              value={
                formData.basicInfo.description
                  ? (
                    <div className="text-right max-w-xs text-gray-900">
                      {formData.basicInfo.description.substring(0, 50)}{formData.basicInfo.description.length > 50 ? '...' : ''}
                    </div>
                  )
                  : ''
              }
              editSection="basic_info"
            />
            <DetailRow
              label="Property Type"
              value={getDisplayLabel(formData.basicInfo.propertyType, PROPERTY_TYPES)}
              editSection="basic_info"
            />
            <DetailRow
              label="Category"
              value={getDisplayLabel(formData.basicInfo.category, {})}
              editSection="basic_info"
            />
            {formData.basicInfo.subcategory && (
              <DetailRow
                label="Subcategory"
                value={getDisplayLabel(formData.basicInfo.subcategory, {})}
                editSection="basic_info"
              />
            )}
          </div>
        )}
      </div>

      {/* Location Section */}
      <div className="border rounded-lg overflow-hidden">
        <SectionHeader
          section="location"
          title="Location"
          isExpanded={expandedSections.location}
        />
        {expandedSections.location && (
          <div className="p-4 space-y-3">
            <DetailRow label="Address" value={formData.location.address || formData.location.locality} editSection="location" />
            <DetailRow label="City" value={formData.location.city} editSection="location" />
            <DetailRow label="State" value={formData.location.state} editSection="location" />
            {/* Pincode removed from review per user request */}
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="border rounded-lg overflow-hidden">
        <SectionHeader
          section="contact"
          title="Contact Details"
          isExpanded={expandedSections.contact}
        />
        {expandedSections.contact && (
          <div className="p-4 space-y-3">
            {/* Name and Email intentionally omitted from review per user request */}
            <DetailRow
              label="Phone"
              value={formData.contact.phone ? `+91 ${formData.contact.phone}` : ''}
              editSection="contact"
            />
          </div>
        )}
      </div>

      {/* Property Details Section */}
      <div className="border rounded-lg overflow-hidden">
        <SectionHeader
          section="propertyDetails"
          title="Property Details"
          isExpanded={expandedSections.propertyDetails}
        />
        {expandedSections.propertyDetails && (
          <div className="p-4 space-y-3">
            <DetailRow
              label="Super Built-up Area"
              value={formatArea(commercialBuy ? formData.commercialDetails.builtUpArea : formData.propertyDetails.area, formData.propertyDetails.areaUnit)}
              editSection="details"
            />

            {formData.basicInfo.propertyType === PROPERTY_TYPES.BUY && formData.basicInfo.subcategory !== 'NEW_PROJECT_PLOT' && (
              <>
                <DetailRow
                  label="Bedrooms"
                  value={formData.propertyDetails.bedrooms}
                  editSection="details"
                />
                <DetailRow
                  label="Bathrooms"
                  value={formData.propertyDetails.bathrooms}
                  editSection="details"
                />
              </>
            )}

            {formData.basicInfo.propertyType === 'BUY' && formData.basicInfo.subcategory === 'NEW_PROJECT_PLOT' && (
              <>
                <DetailRow label="Length (ft)" value={formData.newProjectInfo.plotLength ?? ''} editSection="details" />
                <DetailRow label="Width (ft)" value={formData.newProjectInfo.plotWidth ?? ''} editSection="details" />
              </>
            )}

                {formData.basicInfo.propertyType === PROPERTY_TYPES.RENT && (
              <>
                <DetailRow
                  label="Furnishing"
                  value={getDisplayLabel(formData.rentalInfo?.furnishingStatus || formData.propertyDetails.furnishing, {})}
                  editSection="details"
                />
                {formData.propertyDetails.deposit && (
                  <DetailRow
                    label="Deposit"
                    value={formatPrice(formData.propertyDetails.deposit)}
                    editSection="details"
                  />
                )}
                {formData.propertyDetails.maintenance && (
                  <DetailRow
                    label="Maintenance/Month"
                    value={formatPrice(formData.propertyDetails.maintenance)}
                    editSection="details"
                  />
                )}
              </>
            )}

            {formData.basicInfo.propertyType === PROPERTY_TYPES.COMMERCIAL && (
              <>
                <DetailRow
                  label="Carpet Area"
                  value={formatArea(commercialBuy ? formData.commercialDetails.carpetArea : formData.propertyDetails.carpetArea, formData.propertyDetails.areaUnit)}
                  editSection="details"
                />
                <DetailRow
                  label="Super Built-up Area"
                  value={formatArea(commercialBuy ? formData.commercialDetails.builtUpArea : formData.propertyDetails.builtUpArea, formData.propertyDetails.areaUnit)}
                  editSection="details"
                />
              </>
            )}

            {commercialBuy && (
              <>
                <DetailRow label="Sale Price" value={formatPrice(formData.commercialDetails.price)} editSection="details" />
                <DetailRow label="Bathrooms" value={formData.propertyDetails.bathrooms} editSection="details" />
                <DetailRow label="Parking" value={formData.commercialDetails.parkingAvailability ? 'Available' : 'Not available'} editSection="details" />
                <DetailRow label="Furnishing" value={getDisplayLabel(formData.commercialDetails.furnishingType)} editSection="details" />
              </>
            )}

            {(formData.propertyDetails.amenities?.length ?? 0) > 0 && (
              <DetailRow
                label="Amenities"
                value={
                  <div className="text-right">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {formData.propertyDetails.amenities?.length ?? 0} selected
                    </span>
                  </div>
                }
                editSection="details"
              />
            )}

            {(formData.propertyDetails.facilities?.length ?? 0) > 0 && (
              <DetailRow
                label="Facilities"
                value={
                  <div className="text-right">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {formData.propertyDetails.facilities?.length ?? 0} selected
                    </span>
                  </div>
                }
                editSection="details"
              />
            )}

            <DetailRow
              label="Featured Property"
              value={
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    formData.propertyDetails.featured
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {formData.propertyDetails.featured ? '✓ Featured' : 'Not Featured'}
                  </span>
                </div>
              }
              editSection="details"
            />
          </div>
        )}
      </div>

      {/* Images Section */}
      <div className="border rounded-lg overflow-hidden">
        <SectionHeader
          section="images"
          title="Images"
          isExpanded={expandedSections.images}
        />
        {expandedSections.images && (
          <div className="p-4">
            {(formData.images?.length ?? 0) > 0 ? (
              <>
                <p className="text-gray-600 font-semibold mb-4">
                  {formData.images?.length ?? 0} images uploaded
                </p>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {(formData.images ?? []).map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.preview}
                        alt={`Property ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg shadow-md"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition flex items-center justify-center">
                        <span className="text-white font-bold opacity-0 group-hover:opacity-100 transition">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => onEdit('images')}
                  className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-semibold transition"
                >
                  ← Edit images
                </button>
              </>
            ) : (
              <p className="text-gray-500">No images uploaded</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ReviewStep);
