import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { propertyService } from '../../services/api';
import { FaMapMarkerAlt, FaBed, FaBath, FaRuler, FaPhone, FaWhatsapp, FaArrowLeft, FaCheckCircle, FaTag, FaInfo } from 'react-icons/fa';
import './PropertyDetailsPage.css';
import { getWhatsAppUrl } from '../../utils/whatsapp';
import ImageLightbox from '../../components/user/ImageLightbox';
import { getUnitBhk, isApartmentProject } from '../../utils/projectUnits';
import { getImageUrl } from '../../utils/imageUrl';
import AmenityIcons from '../../components/icons/AmenityIcons';
import { getDisplayLabel, FACILITIES } from '../../constants/propertyConstants';
import { PREMIUM_AMENITY_LABELS } from '../../constants/premiumAmenities';
import { getFurnishingItemDisplayLabels, getPropertyRoomStats, getPropertyLocationLabel } from '../../utils/propertyFormUtils';

import {
  ELECTRIFICATION, getPlotFacingLabel, getPlotResaleInfo, getResalePlotAreaInSquareFeet, isPlotAmenity, isPlotOutdoorFeature,
  isPositivePlotNumber, isResidentialPlot, PLOT_DIMENSIONS, PLOT_FACILITIES, RESALE_PLOT_DIMENSIONS,
} from '../../utils/plotDetails';

const displayNumber = value => value == null || !Number.isFinite(Number(value)) ? 'N/A' : Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const readableLabel = value => String(getDisplayLabel(value) || '').replace(/_/g, ' ').replace(/\b\w+/g, word => word[0].toUpperCase() + word.slice(1).toLowerCase());
const compactPrice = value => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Price on request';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Lakh`;
  return `₹${displayNumber(amount)}`;
};

const PropertyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const touchStart = useRef(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setProperty(null);
    setCurrentImageIndex(0);
    setShowLightbox(false);
    const fetchProperty = async () => {
      try {
        const response = await propertyService.getById(id);
        if (active) setProperty(response.data.property);
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProperty();
    return () => { active = false; };
  }, [id]);

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
  const currentImageSrc = getImageUrl(images[currentImageIndex]);
  const rentalInfo = property.rentalInfo || {};
  const projectInfo = property.newProjectInfo || {};
  const projectPricing = property.projectPricing || {};
  const isPlot = isResidentialPlot(property.propertyType, property.subcategory);
  const isResalePlot = isPlot && property.subcategory === 'RESALE_PLOT';
  const resaleInfo = isResalePlot ? getPlotResaleInfo(property.resaleInfo) : property.resaleInfo || {};
  const facing = property.propertyDetails?.facing ?? property.resaleInfo?.facing;
  const roadWidth = isPlot ? property.propertyDetails?.roadWidth ?? property.location?.roadWidth : null;
  const hasRoadWidth = isPositivePlotNumber(roadWidth);
  const plotArea = isResalePlot ? getResalePlotAreaInSquareFeet(property) : property.area;
  const areaUnit = isResalePlot ? 'sq ft' : ({ sq_ft: 'sq ft', sq_m: 'sq m', sq_yards: 'sq yd' }[property.areaUnit] ?? property.areaUnit);
  const facilities = (property.facilities ?? []).filter(facility => isPlot || facility !== ELECTRIFICATION.id);
  const facilityDefinitions = isPlot ? PLOT_FACILITIES : FACILITIES;
  const amenities = (property.amenities ?? []).filter(amenity => !isPlot || isPlotAmenity(amenity));
  const outdoorFeatures = (property.outdoorFeatures ?? []).filter(feature => !isPlot || isPlotOutdoorFeature(feature));
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
  const hasResaleData = (isResalePlot && Boolean(facing)) || Object.values(resaleInfo).some((value) => value !== '' && value !== null && value !== undefined && value !== false);
  const showRentalDetails = isRentalProperty && (Object.keys(rentalInfo).length > 0 || Boolean(furnishingStatus));
  const showResaleDetails = (isResalePlot || (!isPlot && isResaleProperty)) && hasResaleData;
  const showProjectDetails = !isResalePlot && isNewProjectProperty && (Object.keys(projectInfo).length > 0 || Object.keys(projectPricing).length > 0);
  const furnishingItemValues = property.furnishingItems
    || property.propertyDetails?.furnishingItems
    || rentalInfo.furnishingItems
    || resaleInfo.furnishingItems
    || property.propertyDetails?.furnishingItems
    || [];
  const furnishingItemLabels = getFurnishingItemDisplayLabels(furnishingItemValues);

  const phone = property.contact?.phone || '9776631999';
  const email = property.contact?.email || 'dealinee0@gmail.com';
  const phoneHref = `tel:${String(phone).replace(/[^+\d]/g, '')}`;
  const whatsappHref = getWhatsAppUrl({ title: property.title, propertyPath: `/property/${encodeURIComponent(id)}` });
  const configurations = [...new Set(Object.keys(projectPricing.unitConfigurations || {}).map(getUnitBhk).filter(Boolean))];
  const changeImage = direction => setCurrentImageIndex(index => (index + direction + images.length) % images.length);

  return (
    <div className="property-page min-h-screen bg-gray-50">
      <div className="property-container">
        <nav aria-label="Breadcrumb" className="property-breadcrumb">
          <button onClick={() => navigate(-1)} className="property-back"><FaArrowLeft aria-hidden="true" /> Back</button>
          <Link to="/properties">Properties</Link><span aria-hidden="true">/</span><span aria-current="page">{property.title}</span>
        </nav>

        <div className="property-intro">
          <header className="property-heading">
            <div>
              <div className="property-badges">
                <span>{isRentalProperty ? 'For rent' : 'For sale'}</span>
                {projectInfo.projectStatus && <span>{readableLabel(projectInfo.projectStatus)}</span>}
              </div>
              <h1>{property.title}</h1>
              <p className="property-location"><FaMapMarkerAlt aria-hidden="true" />{getPropertyLocationLabel(property.location)}</p>
            </div>
            <div className="property-heading-price">
              <p className="property-eyebrow">{isRentalProperty ? 'Monthly rent' : showProjectDetails ? 'Starting price' : 'Price'}</p>
              <p className="property-price">{compactPrice(property.price)}{isRentalProperty && <small> / month</small>}</p>
              {Number(property.price) > 0 && <p className="property-full-price">₹{displayNumber(property.price)}</p>}
              <a className="property-primary property-heading-inquiry" href={whatsappHref} target="_blank" rel="noopener noreferrer">Ask on WhatsApp <FaWhatsapp aria-hidden="true" /></a>
            </div>
          </header>

          <section aria-label="Property photos" className={`property-gallery ${images.length < 2 ? 'property-gallery-single' : ''}`}>
            <div className="property-gallery-main" onTouchStart={event => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={event => {
              if (touchStart.current !== null && images.length > 1) {
                const distance = touchStart.current - event.changedTouches[0].clientX;
                if (Math.abs(distance) > 50) changeImage(distance > 0 ? 1 : -1);
              }
              touchStart.current = null;
            }}>
              {currentImageSrc ? <button className="property-photo-button" onClick={() => openLightbox(currentImageIndex)} aria-label={`Open photo ${currentImageIndex + 1} of ${images.length}`}>
                <img src={currentImageSrc} alt={`${property.title} — view ${currentImageIndex + 1}`} />
              </button> : <div className="property-no-photo">Photos coming soon</div>}
              {images.length > 1 && <>
                <button className="property-gallery-arrow property-gallery-prev" onClick={() => changeImage(-1)} aria-label="Previous photo">❮</button>
                <button className="property-gallery-arrow property-gallery-next" onClick={() => changeImage(1)} aria-label="Next photo">❯</button>
              </>}
              {images.length > 0 && <button className="property-photo-count" onClick={() => openLightbox(currentImageIndex)}>View all {images.length} photos <span aria-hidden="true">↗</span></button>}
              {images.length > 1 && <span className="property-photo-position" aria-live="polite">{currentImageIndex + 1} / {images.length}</span>}
            </div>
            {images.length > 1 && <div className="property-gallery-side">
              {images.slice(1, 3).map((image, index) => <button key={index} className="property-photo-button" onClick={() => openLightbox(index + 1)} aria-label={`Open photo ${index + 2} of ${images.length}`}>
                <img src={getImageUrl(image)} alt={`${property.title} — view ${index + 2}`} loading="lazy" />
              </button>)}
            </div>}
          </section>
        </div>

        <div className="property-content-grid">
          <div className="min-w-0">
            <section className="property-facts" aria-label="Key property facts">
              {!isPlot && configurations.length > 0 ? <div><FaBed aria-hidden="true" /><p><strong>{configurations.join(', ')} BHK</strong><span>Configuration</span></p></div> : !isPlot && typeof bedrooms === 'number' && bedrooms > 0 && <div><FaBed aria-hidden="true" /><p><strong>{bedrooms} Bedrooms</strong><span>Bedrooms</span></p></div>}
              {!isPlot && typeof bathrooms === 'number' && bathrooms > 0 && <div><FaBath aria-hidden="true" /><p><strong>{bathrooms} Bathrooms</strong><span>Bathrooms</span></p></div>}
              {(isPlot ? plotArea : property.area) > 0 && <div><FaRuler aria-hidden="true" /><p><strong>{displayNumber(isPlot ? plotArea : property.area)} {areaUnit}</strong><span>{isPlot ? 'Plot area' : showProjectDetails && isApartmentProject(property.subcategory) ? 'Super built-up area' : 'Built-up area'}</span></p></div>}
            </section>
            <nav className="property-section-nav" aria-label="Property sections">
              <a href="#property-overview">Overview</a>
              {showProjectDetails && <a href="#property-project">Project & units</a>}
              {amenities.length > 0 && <a href="#property-amenities">Amenities</a>}
              <a href="#property-information">Details</a>
            </nav>
            <div className="property-details-body bg-white">
              <section id="property-overview" className="property-overview">
                <h2>About this property</h2>
                <p>{property.description || 'Contact our team for more information about this property.'}</p>
              </section>
              {/* Rental information */}
              {showRentalDetails && (
                <div className="property-detail-section">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <FaTag className="text-red-600 mr-2" /> Rental Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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
                <div id="property-project" className="property-detail-section">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <FaInfo className="text-red-600 mr-2" /> Project Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {property.propertyType === 'BUY' && property.subcategory === 'NEW_PROJECT_PLOT' && (
                      <>
                        {PLOT_DIMENSIONS.map(([field, label]) => isPositivePlotNumber(projectInfo[field]) && (
                          <div key={field}>
                            <p className="text-gray-600 text-sm">{label}</p>
                            <p className="text-gray-800 font-semibold">{projectInfo[field]}</p>
                          </div>
                        ))}
                      </>
                    )}
                    {projectInfo.totalUnits && <div><p className="text-gray-600 text-sm">Total Units</p><p className="font-semibold">{projectInfo.totalUnits}</p></div>}
                    {projectInfo.totalProjectArea && <div><p className="text-gray-600 text-sm">Total Project Area</p><p className="font-semibold">{projectInfo.totalProjectArea} {projectInfo.totalProjectAreaUnit?.replace(/_/g, ' ')}</p></div>}
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
                        <p className="text-gray-800 font-semibold">{readableLabel(projectInfo.projectStatus)}</p>
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
                    {Object.entries(projectPricing.unitConfigurations || {}).map(([code, unit], index) => (
                      <div key={code} className="min-w-0 col-span-2 border rounded-lg p-4 bg-gray-50">
                        <h3 className="font-semibold mb-2">Unit {index + 1} · {getUnitBhk(code)} BHK</h3>
                        {[...(!isApartmentProject(property.subcategory) ? [['landArea', 'Land Area']] : []), ['bedrooms', 'Bedrooms'], ['bathrooms', 'Bathrooms'], ['superBuildUpArea', 'Super Built-up Area'], ['carpetArea', 'Carpet Area'], ['price', 'Price']].map(([field, label]) => unit[field] != null && unit[field] !== '' && (
                          <p key={field} className="text-sm"><span className="text-gray-600">{label}: </span>{field === 'price' ? `₹${displayNumber(unit[field])}` : `${displayNumber(unit[field])}${field.includes('Area') ? ` ${areaUnit || ''}` : ''}`}</p>
                        ))}
                      </div>
                    ))}
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
                        <p className="text-gray-800 font-semibold">₹{displayNumber(projectPricing.pricePerSqft)}</p><p className="text-xs text-gray-500 mt-1">Area basis not specified; confirm with agent.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resale Information */}
              {showResaleDetails && (
                <div className="property-detail-section">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <FaTag className="text-red-600 mr-2" /> Resale Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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
                    {isResalePlot && RESALE_PLOT_DIMENSIONS.map(([field, label]) => isPositivePlotNumber(resaleInfo[field]) && (
                      <div key={field}>
                        <p className="text-gray-600 text-sm">{label}</p>
                        <p className="text-gray-800 font-semibold">{resaleInfo[field]}</p>
                      </div>
                    ))}
                    {isResalePlot && facing && (
                      <div>
                        <p className="text-gray-600 text-sm">Facing Direction</p>
                        <p className="text-gray-800 font-semibold">{getPlotFacingLabel(facing)}</p>
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

              {/* Commercial information */}
              {property.commercialDetails && property.propertyType === 'COMMERCIAL' && (
                <div className="property-detail-section">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <FaTag className="text-red-600 mr-2" /> Commercial Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {property.propertyType === 'COMMERCIAL' && (
                      <>
                        <div><p className="text-gray-600 text-sm">Property Subtype</p><p className="text-gray-800 font-semibold">{getDisplayLabel(property.subcategory)}</p></div>
                        {['builtUpArea', 'carpetArea'].map((field) => property.commercialDetails[field] != null && (
                          <div key={field}>
                            <p className="text-gray-600 text-sm">{field === 'builtUpArea' ? 'Built-up Area' : 'Carpet Area'}</p>
                            <p className="text-gray-800 font-semibold">{displayNumber(property.commercialDetails[field])} {areaUnit || 'sq ft'}</p>
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

              {/* Property metadata */}
              <div id="property-information" className="property-detail-section">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Property Information</h2>
                {property.propertyId && <p className="text-sm text-gray-500 mb-4">Property ID: {property.propertyId}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  <div>
                    <p className="text-gray-600 text-sm">Property Type</p>
                    <p className="text-gray-800 font-semibold">{getDisplayLabel(property.propertyType)}</p>
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

              {/* Amenities */}
              {amenities.length > 0 && (
                <div id="property-amenities" className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <FaCheckCircle className="text-red-600 mr-2" /> Amenities
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-gray-700">
                        {/* amenity may be id or label; try to render icon by id first */}
                        <span>
                          <AmenityIcons id={amenity} />
                        </span>
                        <span>{PREMIUM_AMENITY_LABELS.get(amenity) ?? readableLabel(amenity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Facilities */}
              {(hasRoadWidth || facilities.length > 0) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <FaInfo className="text-red-600 mr-2" /> Facilities
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {hasRoadWidth && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <FaRuler className="text-red-600 w-5 h-5 flex-shrink-0" />
                        <span>Facing Road Width: {Number(roadWidth).toLocaleString('en-IN', { maximumFractionDigits: 4 })} ft</span>
                      </div>
                    )}
                    {facilities.map((facility, idx) => {
                      const definition = facilityDefinitions.find((item) => item.id === facility || item.label.toLowerCase() === String(facility).toLowerCase());
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
              {!isPlot && furnishingItemLabels.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Furnishing Items</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
              {outdoorFeatures.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Outdoor Features</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {outdoorFeatures.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-gray-700">
                        <span className="text-purple-600">★</span>
                        <span>{readableLabel(feature)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="property-sidebar" aria-label="Contact agent">
            <div className="property-contact-card">
              <p className="property-eyebrow">{isRentalProperty ? 'Monthly rent' : showProjectDetails ? 'Starting price' : 'Asking price'}</p>
              <p className="property-price">{compactPrice(property.price)}{isRentalProperty && <small> / month</small>}</p>
              {Number(property.price) > 0 && <p className="property-full-price">₹{displayNumber(property.price)}</p>}
              <div className="property-agent">
                <span className="property-agent-icon"><FaPhone aria-hidden="true" /></span>
                <div><h2>{property.contact?.name || 'Dealinee Estate'}</h2><p>Contact our property team</p></div>
              </div>
              <a className="property-primary" href={whatsappHref} target="_blank" rel="noopener noreferrer">Ask on WhatsApp <FaWhatsapp aria-hidden="true" /></a>
              <a href={phoneHref} className="property-secondary"><FaPhone aria-hidden="true" /> Call {phone}</a>
              <a className="property-email" href={`mailto:${email}`}>{email}</a>
            </div>
          </aside>
        </div>
      </div>

      <div className="property-mobile-contact" aria-label="Property contact actions">
        <a href={phoneHref} className="property-secondary"><FaPhone aria-hidden="true" /> Call</a>
        <a className="property-primary" href={whatsappHref} target="_blank" rel="noopener noreferrer">Ask on WhatsApp <FaWhatsapp aria-hidden="true" /></a>
      </div>


      {/* Image Lightbox */}
      {showLightbox && images.length > 0 && (
        <ImageLightbox images={images} initialIndex={lightboxIndex} onClose={() => setShowLightbox(false)} />
      )}
    </div>
  );
};

export default PropertyDetailsPage;
