import React from 'react';
import { Link } from 'react-router-dom';
import { FaBed, FaBath, FaRuler, FaHeart, FaRegHeart, FaCamera, FaArrowRight } from 'react-icons/fa';
import { getImageUrl } from '../../utils/imageUrl';
import { getPropertyRoomStats, getPropertyLocationLabel } from '../../utils/propertyFormUtils';

const PropertyCard = ({ property, onWishlistToggle, isWishlisted }) => {
  const [imageError, setImageError] = React.useState(false);
  const currentImageIndex = 0;

  // Get property type from subcategory or category
  const getPropertyType = () => {
    if (property.subcategory) {
      // Extract property type from subcategory codes like RESALE_VILLA, RENTAL_FLAT, etc.
      const subcatMap = {
        'NEW_PROJECT_APARTMENT': 'Apartment',
        'NEW_PROJECT_VILLA': 'Villa',
        'NEW_PROJECT_PLOT': 'Plot',
        'RESALE_FLAT': 'Flat',
        'RESALE_VILLA': 'Villa',
        'RESALE_PLOT': 'Plot',
        'RENTAL_FLAT': 'Flat',
        'RENTAL_VILLA': 'Villa',
        'RENTAL_INDIVIDUAL_FLOOR': 'Floor',
        'COMMERCIAL_OFFICE_SALE': 'Office',
        'COMMERCIAL_SHOP_SALE': 'Shop',
        'COMMERCIAL_SHOWROOM_SALE': 'Showroom',
        'COMMERCIAL_LAND_SALE': 'Land',
        'COMMERCIAL_WAREHOUSE_SALE': 'Warehouse',
        'COMMERCIAL_INDUSTRIAL_SALE': 'Industrial',
        'COMMERCIAL_COWORKING_SALE': 'Co-working',
        'COMMERCIAL_OFFICE_LEASE': 'Office',
        'COMMERCIAL_SHOP_LEASE': 'Shop',
        'COMMERCIAL_WAREHOUSE_LEASE': 'Warehouse',
      };
      return subcatMap[property.subcategory] || property.subcategory;
    }
    
    // Fallback to category name
    return property.category?.name?.split(' ')[0] || 'Property';
  };
  
  const propertyType = getPropertyType();
  const roomStats = getPropertyRoomStats(property);
  const bedrooms = roomStats.bedrooms;
  const bathrooms = roomStats.bathrooms;
  const bhkCount = bedrooms || 'Studio';
  
  // Format price for display
  // For rental properties, use monthlyRent if price is 0 or null
  const getDisplayPrice = () => {
    // Start with price field
    let displayPrice = property.price;
    
    console.log('[PropertyCard] Price evaluation:', {
      propertyId: property.propertyId,
      propertyType: property.propertyType,
      price: displayPrice,
      rentalInfo: property.rentalInfo,
      monthlyRent: property.rentalInfo?.monthlyRent,
    });
    
    // For rental properties, prioritize monthlyRent
    if (property.propertyType === 'RENT' || property.propertyType === 'RENTAL') {
      // If price is not set or is 0, use monthlyRent
      if ((!displayPrice || displayPrice === 0) && property.rentalInfo?.monthlyRent) {
        displayPrice = property.rentalInfo.monthlyRent;
        console.log('[PropertyCard] Using monthlyRent for rental:', {
          propertyId: property.propertyId,
          monthlyRent: property.rentalInfo.monthlyRent,
          displayPrice,
        });
      }
      // If both are unset, try fallback
      if (!displayPrice && !property.rentalInfo?.monthlyRent) {
        console.error('[PropertyCard] ERROR - Rental property has NO price or monthlyRent:', {
          id: property._id,
          propertyId: property.propertyId,
          price: property.price,
          rentalInfo: property.rentalInfo,
          monthlyRent: property.rentalInfo?.monthlyRent,
        });
      }
    }
    
    console.log('[PropertyCard] Final displayPrice:', displayPrice);
    return displayPrice;
  };
  
  const formatPrice = (price) => {
    console.log('[PropertyCard] formatPrice called with:', { price, type: typeof price });
    
    if (price === null || price === undefined) {
      console.log('[PropertyCard] Price is null/undefined, returning N/A');
      return '₹N/A';
    }
    
    const num = parseInt(price);
    console.log('[PropertyCard] Parsed number:', { num, isNaN: isNaN(num) });
    
    if (isNaN(num) || num === 0) {
      console.log('[PropertyCard] Number is NaN or 0, returning N/A');
      return '₹N/A';
    }
    
    if (num >= 10000000) {
      // Crores
      return `₹${(num / 10000000).toFixed(1)} Cr`;
    } else if (num >= 100000) {
      // Lacs
      return `₹${(num / 100000).toFixed(1)} Lac`;
    } else if (num >= 1000) {
      // Thousands
      return `₹${(num / 1000).toFixed(1)}K`;
    }
    return `₹${num}`;
  };

  const getCardImage = () => {
    const firstImage = property.images?.[currentImageIndex] || property.images?.[0];

    if (!firstImage) {
      return 'https://via.placeholder.com/400x250?text=No+Image';
    }

    if (typeof firstImage === 'string') {
      return getImageUrl(firstImage) || 'https://via.placeholder.com/400x250?text=No+Image';
    }

    return (
      getImageUrl(firstImage) ||
      getImageUrl(firstImage?.url) ||
      getImageUrl(firstImage?.path) ||
      getImageUrl(firstImage?.preview) ||
      getImageUrl(firstImage?.image) ||
      getImageUrl(firstImage?.src) ||
      'https://via.placeholder.com/400x250?text=No+Image'
    );
  };

  return (
    <div className="group h-full">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col border border-gray-200 w-full" style={{ height: '420px' }}>
        
        {/* Image Container - Fixed Height */}
        <div className="relative w-full bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden flex-shrink-0" style={{ height: '180px' }}>
          <img
            src={imageError ? 'https://via.placeholder.com/400x250?text=No+Image' : getCardImage()}
            alt={property.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Image Counter Badge */}
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold flex items-center space-x-1 backdrop-blur">
            <FaCamera className="text-xs" />
            <span>{property.images?.length || 1}</span>
          </div>

          {/* Featured Badge */}
          {property.featured && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-black to-black text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
              ⭐ Featured
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={() => onWishlistToggle?.(property._id)}
            className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition transform hover:scale-110 z-10"
          >
            {isWishlisted ? (
              <FaHeart className="text-red-500 text-sm" />
            ) : (
              <FaRegHeart className="text-gray-600 text-sm" />
            )}
          </button>
        </div>

        {/* Content - Fixed Height Container */}
        <div className="p-3 flex-1 flex flex-col justify-between overflow-hidden" style={{ height: '240px' }}>
          
          {/* BHK Type and Count */}
          <div className="mb-1">
            <h3 className="text-sm font-bold text-gray-800 line-clamp-1">
              {property.propertyType === 'BUY' && property.subcategory === 'NEW_PROJECT_PLOT' ? propertyType : property.propertyType === 'COMMERCIAL'
                ? `${property.title || propertyType} · ${propertyType}`
                : `${bhkCount} ${propertyType}`}
            </h3>
          </div>

          {/* Price - Large and Prominent */}
          <div className="mb-1">
            <p className="text-lg font-bold text-red-600 line-clamp-1">{formatPrice(getDisplayPrice())}</p>
          </div>

          {/* Area */}
<p className="text-xs text-gray-600 mb-1 flex items-center space-x-1 line-clamp-1">
  <FaRuler className="text-gray-400 flex-shrink-0" />
  <span className="line-clamp-1">
    Super Built-up Area: {property.area} {property.areaUnit}
  </span>
</p>

{/* Property ID */}
<p className="text-xs font-semibold text-red-600 mb-1">
  Property ID: {property.propertyId || "N/A"}
</p>

{/* Location */}
<p className="text-xs font-medium text-gray-700 mb-1 line-clamp-1">
  {getPropertyLocationLabel(property.location)}
</p>

{/* Status */}
<p className="text-xs text-gray-500 mb-1 line-clamp-1">
  Ready to Move
</p>

{/* Features Row */}
<div className="flex gap-2 mb-2 pb-2 border-b border-gray-200 text-xs text-gray-600">
  {typeof bedrooms === 'number' && !Number.isNaN(bedrooms) && bedrooms > 0 && (
    <div className="flex items-center space-x-0.5 hover:text-red-600 transition">
      <FaBed className="text-xs" />
      <span>{bedrooms}</span>
    </div>
  )}

  {typeof bathrooms === 'number' && !Number.isNaN(bathrooms) && bathrooms > 0 && (
    <div className="flex items-center space-x-0.5 hover:text-red-600 transition">
      <FaBath className="text-xs" />
      <span>{bathrooms}</span>
    </div>
  )}
</div>

          {/* View More Button */}
          <Link
            to={`/property/${property._id}`}
            className="w-full px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded text-xs hover:from-red-700 hover:to-red-800 transition font-semibold shadow-sm hover:shadow-md flex items-center justify-center space-x-1"
          >
            <span>View More</span>
            <FaArrowRight className="text-xs" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
