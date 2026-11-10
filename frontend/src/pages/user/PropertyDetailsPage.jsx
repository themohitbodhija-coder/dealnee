import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyService, inquiryService } from '../../services/api';
import { FaMapMarkerAlt, FaBed, FaBath, FaRuler, FaPhone, FaEnvelope, FaArrowLeft, FaCheckCircle, FaTag, FaInfo } from 'react-icons/fa';
import ImageLightbox from '../../components/user/ImageLightbox';
import { getImageUrl } from '../../utils/imageUrl';
import AmenityIcons from '../../components/icons/AmenityIcons';
import { getDisplayLabel, FACILITIES } from '../../constants/propertyConstants';
import { getFurnishingItemDisplayLabels, getPropertyRoomStats, getPropertyLocationLabel } from '../../utils/propertyFormUtils';

const displayNumber = value => value == null || !Number.isFinite(Number(value)) ? 'N/A' : Number(value).toLocaleString();

const PropertyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await propertyService.getById(id);
      setProperty(response.data.property);
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await inquiryService.create({
        ...formData,
        property: id,
      });
      alert('Inquiry sent successfully!');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setShowContactForm(false);
    } catch (error) {
      alert('Error sending inquiry. Please try again.');
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Property not found</p>
      </div>
    );
  }

  const images = property.images || [];
  const currentImageSrc = getImageUrl(images[currentImageIndex]) || 'https://via.placeholder.com/600x400';
  const rentalInfo = property.rentalInfo || {};
  const projectInfo = property.newProjectInfo || {};
  const projectPricing = property.projectPricing || {};
  const resaleInfo = property.resaleInfo || {};
  const roomStats = getPropertyRoomStats(property);
  const bedrooms = roomStats.bedrooms;
  const bathrooms = roomStats.bathrooms;
  const furnishingStatus =
    rentalInfo.furnishingStatus ||
    property.propertyDetails?.furnishing ||
    property.furnishingStatus ||
    property.furnishing ||
    '';
  const normalizedPropertyType = (property.propertyType || '').toString().trim().toUpperCase();
  const normalizedCategory = (property.category || property.basicInfo?.category || '').toString().trim().toUpperCase().replace(/[-\s]+/g, '_');
  const normalizedSubcategory = (property.subcategory || property.basicInfo?.subcategory || '').toString().trim().toUpperCase().replace(/[-\s]+/g, '_');
  const isRentalProperty = normalizedPropertyType === 'RENT';
  const isNewProjectProperty = normalizedSubcategory.includes('NEW_PROJECT') || normalizedCategory.includes('NEW_PROJECT') || Boolean(projectInfo && Object.values(projectInfo).some((value) => value !== '' && value !== null && value !== undefined));
  const isResaleProperty = normalizedSubcategory.includes('RESALE') || normalizedCategory.includes('RESALE');
  const hasResaleData = Object.values(resaleInfo).some((value) => value !== '' && value !== null && value !== undefined && value !== false);
  const showRentalDetails = isRentalProperty && (Object.keys(rentalInfo).length > 0 || Boolean(furnishingStatus));
  const showResaleDetails = isResaleProperty && hasResaleData;
  const showProjectDetails = isNewProjectProperty && (Object.keys(projectInfo).length > 0 || Object.keys(projectPricing).length > 0);
  const furnishingItemValues = property.furnishingItems
    || property.propertyDetails?.furnishingItems
    || rentalInfo.furnishingItems
    || resaleInfo.furnishingItems
    || property.propertyDetails?.furnishingItems
    || [];
  const furnishingItemLabels = getFurnishingItemDisplayLabels(furnishingItemValues);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-red-600 hover:text-red-800 mb-6"
        >
          <FaArrowLeft /> <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div
                className="relative h-96 bg-gray-200 cursor-pointer group"
                onClick={() => openLightbox(currentImageIndex)}
              >
                <img
                  src={currentImageSrc}
                  alt="Property"
                  className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30">
                  <div className="text-white text-center">
                    <p className="text-xl font-semibold">Click to view fullscreen</p>
                    <p className="text-sm mt-2">Zoom • Pan • Download</p>
                  </div>
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded hover:bg-opacity-70"
                    >
                      ❮
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded hover:bg-opacity-70"
                    >
                      ❯
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex space-x-2 p-4 bg-white overflow-x-auto">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative cursor-pointer rounded overflow-hidden group flex-shrink-0"
                      onClick={() => {
                        setCurrentImageIndex(idx);
                        openLightbox(idx);
                      }}
                    >
                      <img
                        src={getImageUrl(img) || 'https://via.placeholder.com/100x100?text=No+Image'}
                        alt={`Thumbnail ${idx}`}
                        className={`h-20 w-20 object-cover rounded group-hover:opacity-75 transition-opacity ${
                          idx === currentImageIndex ? 'border-2 border-red-600' : 'opacity-50 hover:opacity-100'
                        }`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40 rounded">
                        <span className="text-white text-xs font-semibold">View</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{property.title}</h1>

              {/* Property ID */}
              {property.propertyId && (
                <p className="text-sm font-semibold text-gray-500 mb-4">
                  Property ID: <span className="text-red-600">{property.propertyId}</span>
                </p>
              )}

              {/* Location */}
              <div className="flex items-center text-gray-600 mb-6">
                <FaMapMarkerAlt className="text-red-500 mr-2" />
                <span className="text-lg">
                  {getPropertyLocationLabel(property.location)}
                </span>
              </div>

              {/* Price */}
              <div className="text-4xl font-bold text-red-600 mb-6">₹{displayNumber(property.price)}</div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 mb-8 pb-8 border-b">
                {typeof bedrooms === 'number' && !Number.isNaN(bedrooms) && bedrooms > 0 && (
                  <div className="text-center">
                    <FaBed className="text-3xl text-red-600 mx-auto mb-2" />
                    <p className="text-gray-600">{bedrooms} Bedrooms</p>
                  </div>
                )}
                {typeof bathrooms === 'number' && !Number.isNaN(bathrooms) && bathrooms > 0 && (
                  <div className="text-center">
                    <FaBath className="text-3xl text-red-600 mx-auto mb-2" />
                    <p className="text-gray-600">{bathrooms} Bathrooms</p>
                  </div>
                )}
                {property.area > 0 && (
                  <div className="text-center">
                    <FaRuler className="text-3xl text-red-600 mx-auto mb-2" />
                    <p className="text-gray-600">
                      Super Built-up Area: {property.area} {property.areaUnit}
                    </p>
                  </div>
                )}
              </div>

              {/* Rental Information - MOVED TO TOP */}
              {showRentalDetails && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <FaTag className="text-red-600 mr-2" /> Rental Details
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {rentalInfo.monthlyRent && (
                      <div>
                        <p className="text-gray-600 text-sm">Monthly Rent</p>
                        <p className="text-gray-800 font-semibold">₹{displayNumber(rentalInfo.monthlyRent)}</p>
                      </div>
                    )}
                    {rentalInfo.securityDeposit && (
                      <div>
                        <p className="text-gray-600 text-sm">Security Deposit</p>
                        <p className="text-gray-800 font-semibold">₹{displayNumber(rentalInfo.securityDeposit)}</p>
                      </div>
                    )}
                    {rentalInfo.maintenanceCharges && (
                      <div>
                        <p className="text-gray-600 text-sm">Maintenance Charges</p>
                        <p className="text-gray-800 font-semibold">₹{displayNumber(rentalInfo.maintenanceCharges)}</p>
                      </div>
                    )}
                    {furnishingStatus && (
                      <div>
                        <p className="text-gray-600 text-sm">Furnishing Status</p>
                        <p className="text-gray-800 font-semibold">
                          {getDisplayLabel(furnishingStatus)}
                        </p>
                      </div>
                    )}
                    {rentalInfo.preferredTenant && (
                      <div>
                        <p className="text-gray-600 text-sm">Preferred Tenant</p>
                        <p className="text-gray-800 font-semibold">{rentalInfo.preferredTenant}</p>
                      </div>
                    )}
                    {rentalInfo.separateEntrance !== undefined && (
                      <div>
                        <p className="text-gray-600 text-sm">Separate Entrance</p>
                        <p className="text-gray-800 font-semibold">{rentalInfo.separateEntrance ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                    {rentalInfo.waterSupply !== undefined && (
                      <div>
                        <p className="text-gray-600 text-sm">Water Supply</p>
                        <p className="text-gray-800 font-semibold">{rentalInfo.waterSupply ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                    {rentalInfo.petFriendly !== undefined && (
                      <div>
                        <p className="text-gray-600 text-sm">Pet Friendly</p>
                        <p className="text-gray-800 font-semibold">{rentalInfo.petFriendly ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                    {rentalInfo.availableFrom && (
                      <div>
                        <p className="text-gray-600 text-sm">Available From</p>
                        <p className="text-gray-800 font-semibold">{new Date(rentalInfo.availableFrom).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* New Project Information */}
              {showProjectDetails && (
                <div className="bg-indigo-50 rounded-lg p-6 mb-8 border border-indigo-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <FaInfo className="text-indigo-600 mr-2" /> Project Details
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {property.propertyType === 'BUY' && property.subcategory === 'NEW_PROJECT_PLOT' && (
                      <>
                        {['plotLength', 'plotWidth'].map((field) => projectInfo[field] != null && (
                          <div key={field}>
                            <p className="text-gray-600 text-sm">{field === 'plotLength' ? 'Length' : 'Width'} (ft)</p>
                            <p className="text-gray-800 font-semibold">{projectInfo[field]}</p>
                          </div>
                        ))}
                      </>
                    )}
                    {projectInfo.projectName && (
                      <div>
                        <p className="text-gray-600 text-sm">Project Name</p>
                        <p className="text-gray-800 font-semibold">{projectInfo.projectName}</p>
                      </div>
                    )}
                    {projectInfo.builderName && (
                      <div>
                        <p className="text-gray-600 text-sm">Builder Name</p>
                        <p className="text-gray-800 font-semibold">{projectInfo.builderName}</p>
                      </div>
                    )}
                    {projectInfo.projectStatus && (
                      <div>
                        <p className="text-gray-600 text-sm">Project Status</p>
                        <p className="text-gray-800 font-semibold">{getDisplayLabel(projectInfo.projectStatus)}</p>
                      </div>
                    )}
                    {projectInfo.approval && (
                      <div>
                        <p className="text-gray-600 text-sm">Approval</p>
                        <p className="text-gray-800 font-semibold">{projectInfo.approval}</p>
                      </div>
                    )}
                    {projectInfo.reraNumber && (
                      <div>
                        <p className="text-gray-600 text-sm">RERA Number</p>
                        <p className="text-gray-800 font-semibold">{projectInfo.reraNumber}</p>
                      </div>
                    )}
                    {projectInfo.possessionDate && (
                      <div>
                        <p className="text-gray-600 text-sm">Possession Date</p>
                        <p className="text-gray-800 font-semibold">{new Date(projectInfo.possessionDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {projectPricing.startingPrice && (
                      <div>
                        <p className="text-gray-600 text-sm">Starting Price</p>
                        <p className="text-gray-800 font-semibold">₹{displayNumber(projectPricing.startingPrice)}</p>
                      </div>
                    )}
                    {projectPricing.priceRange && (
                      <div>
                        <p className="text-gray-600 text-sm">Price Range</p>
                        <p className="text-gray-800 font-semibold">{projectPricing.priceRange}</p>
                      </div>
                    )}
                    {projectPricing.pricePerSqft && (
                      <div>
                        <p className="text-gray-600 text-sm">Price Per Sq.Ft</p>
                        <p className="text-gray-800 font-semibold">₹{displayNumber(projectPricing.pricePerSqft)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resale Information */}
              {showResaleDetails && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <FaTag className="text-red-600 mr-2" /> Resale Details
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {resaleInfo.approval && (
                      <div>
                        <p className="text-gray-600 text-sm">Approval</p>
                        <p className="text-gray-800 font-semibold">{resaleInfo.approval}</p>
                      </div>
                    )}
                    {resaleInfo.reraNumber && (
                      <div>
                        <p className="text-gray-600 text-sm">RERA Number</p>
                        <p className="text-gray-800 font-semibold">{resaleInfo.reraNumber}</p>
                      </div>
                    )}
                    {resaleInfo.pricePerSqft && (
                      <div>
                        <p className="text-gray-600 text-sm">Price Per Sq.Ft</p>
                        <p className="text-gray-800 font-semibold">₹{displayNumber(resaleInfo.pricePerSqft)}</p>
                      </div>
                    )}
                    {resaleInfo.maintenanceCharges && (
                      <div>
                        <p className="text-gray-600 text-sm">Maintenance Charges</p>
                        <p className="text-gray-800 font-semibold">₹{displayNumber(resaleInfo.maintenanceCharges)}</p>
                      </div>
                    )}
                    {resaleInfo.floorNumber !== undefined && (
                      <div>
                        <p className="text-gray-600 text-sm">Floor Number</p>
                        <p className="text-gray-800 font-semibold">{resaleInfo.floorNumber}</p>
                      </div>
                    )}
                    {resaleInfo.totalFloors && (
                      <div>
                        <p className="text-gray-600 text-sm">Total Floors</p>
                        <p className="text-gray-800 font-semibold">{resaleInfo.totalFloors}</p>
                      </div>
                    )}
                    {resaleInfo.propertyAge && (
                      <div>
                        <p className="text-gray-600 text-sm">Property Age (Years)</p>
                        <p className="text-gray-800 font-semibold">{resaleInfo.propertyAge}</p>
                      </div>
                    )}
                    {resaleInfo.ownershipType && (
                      <div>
                        <p className="text-gray-600 text-sm">Ownership Type</p>
                        <p className="text-gray-800 font-semibold">{resaleInfo.ownershipType}</p>
                      </div>
                    )}
                    {resaleInfo.furnishingStatus && (
                      <div>
                        <p className="text-gray-600 text-sm">Furnishing Status</p>
                        <p className="text-gray-800 font-semibold">{resaleInfo.furnishingStatus}</p>
                      </div>
                    )}
                    {resaleInfo.balcony && (
                      <div>
                        <p className="text-gray-600 text-sm">Balcony</p>
                        <p className="text-gray-800 font-semibold">{resaleInfo.balcony}</p>
                      </div>
                    )}
                    {resaleInfo.readyToMove !== undefined && (
                      <div>
                        <p className="text-gray-600 text-sm">Ready To Move</p>
                        <p className="text-gray-800 font-semibold">{resaleInfo.readyToMove ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                    {resaleInfo.possessionStatus && (
                      <div>
                        <p className="text-gray-600 text-sm">Possession Status</p>
                        <p className="text-gray-800 font-semibold">{resaleInfo.possessionStatus}</p>
                      </div>
                    )}
                    {resaleInfo.availableFrom && (
                      <div>
                        <p className="text-gray-600 text-sm">Available From</p>
                        <p className="text-gray-800 font-semibold">{new Date(resaleInfo.availableFrom).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Commercial Information - MOVED TO TOP */}
              {property.commercialDetails && property.propertyType === 'COMMERCIAL' && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <FaTag className="text-red-600 mr-2" /> Commercial Details
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {property.propertyType === 'COMMERCIAL' && (
                      <>
                        <div><p className="text-gray-600 text-sm">Property Subtype</p><p className="text-gray-800 font-semibold">{getDisplayLabel(property.subcategory)}</p></div>
                        {['builtUpArea', 'carpetArea'].map((field) => property.commercialDetails[field] != null && (
                          <div key={field}>
                            <p className="text-gray-600 text-sm">{field === 'builtUpArea' ? 'Super Built-up Area' : 'Carpet Area'}</p>
                            <p className="text-gray-800 font-semibold">{property.commercialDetails[field]} {property.areaUnit || 'sq_ft'}</p>
                          </div>
                        ))}
                        {property.commercialDetails.parkingAvailability != null && (
                          <div><p className="text-gray-600 text-sm">Parking</p><p className="text-gray-800 font-semibold">{property.commercialDetails.parkingAvailability ? 'Available' : 'Not available'}</p></div>
                        )}
                      </>
                    )}
                    {property.commercialDetails.propertyStatus && (
                      <div>
                        <p className="text-gray-600 text-sm">Property Status</p>
                        <p className="text-gray-800 font-semibold">{property.commercialDetails.propertyStatus}</p>
                      </div>
                    )}
                    {property.commercialDetails.ownershipType && (
                      <div>
                        <p className="text-gray-600 text-sm">Ownership Type</p>
                        <p className="text-gray-800 font-semibold">{property.commercialDetails.ownershipType}</p>
                      </div>
                    )}
                    {property.commercialDetails.propertyAge && (
                      <div>
                        <p className="text-gray-600 text-sm">Property Age (Years)</p>
                        <p className="text-gray-800 font-semibold">{property.commercialDetails.propertyAge}</p>
                      </div>
                    )}
                    {property.commercialDetails.floorNumber !== undefined && (
                      <div>
                        <p className="text-gray-600 text-sm">Floor Number</p>
                        <p className="text-gray-800 font-semibold">{property.commercialDetails.floorNumber}</p>
                      </div>
                    )}
                    {property.commercialDetails.totalFloors && (
                      <div>
                        <p className="text-gray-600 text-sm">Total Floors</p>
                        <p className="text-gray-800 font-semibold">{property.commercialDetails.totalFloors}</p>
                      </div>
                    )}
                    {property.commercialDetails.facing && (
                      <div>
                        <p className="text-gray-600 text-sm">Facing</p>
                        <p className="text-gray-800 font-semibold">{property.commercialDetails.facing}</p>
                      </div>
                    )}
                    {property.commercialDetails.furnishingType && (
                      <div>
                        <p className="text-gray-600 text-sm">Furnishing Type</p>
                        <p className="text-gray-800 font-semibold">{property.commercialDetails.furnishingType}</p>
                      </div>
                    )}
                    {property.commercialDetails.leaseDuration && (
                      <div>
                        <p className="text-gray-600 text-sm">Lease Duration</p>
                        <p className="text-gray-800 font-semibold">{property.commercialDetails.leaseDuration}</p>
                      </div>
                    )}
                    {property.commercialDetails.lockInPeriod && (
                      <div>
                        <p className="text-gray-600 text-sm">Lock-in Period</p>
                        <p className="text-gray-800 font-semibold">{property.commercialDetails.lockInPeriod}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Property Metadata - MOVED TO TOP */}
              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Property Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-gray-600 text-sm">Property Type</p>
                    <p className="text-gray-800 font-semibold">{property.propertyType}</p>
                  </div>
                  {property.status && (
                    <div>
                      <p className="text-gray-600 text-sm">Status</p>
                      <p className="text-gray-800 font-semibold capitalize">
                        <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${
                          property.status === 'available' ? 'bg-green-600' :
                          property.status === 'sold' ? 'bg-red-600' :
                          'bg-orange-600'
                        }`}>
                          {property.status}
                        </span>
                      </p>
                    </div>
                  )}
                  {property.featured && (
                    <div>
                      <p className="text-gray-600 text-sm">Featured</p>
                      <p className="text-yellow-600 font-semibold">⭐ Yes</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Description</h2>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <FaCheckCircle className="text-red-600 mr-2" /> Amenities
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-gray-700">
                        {/* amenity may be id or label; try to render icon by id first */}
                        <span>
                          <AmenityIcons id={amenity} />
                        </span>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Facilities */}
              {property.facilities && property.facilities.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <FaInfo className="text-red-600 mr-2" /> Facilities
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.facilities.map((facility, idx) => {
                      const definition = FACILITIES.find((item) => item.id === facility || item.label.toLowerCase() === String(facility).toLowerCase());
                      return (
                      <div key={idx} className="flex items-center space-x-2 text-gray-700">
                        <AmenityIcons id={definition?.id || facility} className="text-red-600 w-5 h-5 flex-shrink-0" />
                        <span>{definition?.label || facility}</span>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Furnishing Items */}
              {furnishingItemLabels.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Furnishing Items</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {furnishingItemLabels.map((item, idx) => (
                      <div key={`${item}-${idx}`} className="flex items-center space-x-2 text-gray-700">
                        <span className="text-blue-600">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outdoor Features */}
              {property.outdoorFeatures && property.outdoorFeatures.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Outdoor Features</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.outdoorFeatures.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-gray-700">
                        <span className="text-purple-600">★</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Contact Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Contact Agent</h3>

              <div className="mb-6 pb-6 border-b">
                <p className="text-gray-700 font-semibold mb-2">{property.contact?.name}</p>
                <div className="flex items-center space-x-2 text-gray-600 mb-2">
                  <FaPhone className="text-red-600" />
                  <span>{property.contact?.phone || '9776631999'}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <FaEnvelope className="text-red-600" />
                  <span>{property.contact?.email || 'dealinee0@gmail.com'}</span>
                </div>
              </div>

              <button
                onClick={() => setShowContactForm(!showContactForm)}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold mb-4"
              >
                {showContactForm ? 'Cancel' : 'Send Inquiry'}
              </button>

              {/* Contact Form */}
              {showContactForm && (
                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Your Phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  />
                  <textarea
                    name="message"
                    placeholder="Your Message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  ></textarea>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold disabled:bg-gray-400"
                  >
                    {submitting ? 'Sending...' : 'Submit Inquiry'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {showLightbox && images.length > 0 && (
        <ImageLightbox images={images} initialIndex={lightboxIndex} onClose={() => setShowLightbox(false)} />
      )}
    </div>
  );
};

export default PropertyDetailsPage;
