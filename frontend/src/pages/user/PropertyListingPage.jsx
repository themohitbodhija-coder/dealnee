import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { propertyService, categoryService } from '../../services/api';
import PropertyCard from '../../components/user/PropertyCard';
import FilterBar from '../../components/user/FilterBar';

const PropertyListingPage = () => {
  const [searchParams] = useSearchParams();
  const propertyType = searchParams.get('type');
  const propertySubtype = searchParams.get('subtype');
  const propertyCategory = searchParams.get('category');
  const querySequence = useRef(0);
  const cancelPendingQuery = useCallback(() => { ++querySequence.current; }, []);
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  // Initialize category and subtype from URL if present - these should NOT be overridable by filters
  const urlCategory = searchParams.get('category') || '';
  const urlType = searchParams.get('type') || '';
  const urlSubtype = searchParams.get('subtype') || '';
  
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    location: searchParams.get('location') || '',
    locality: searchParams.get('locality') || '',
    type: urlType,  // Set from URL and will be preserved
    subtype: urlSubtype,  // Set from URL and will be preserved
    category: urlCategory,  // Set from URL and will be preserved
    bedrooms: searchParams.get('bedrooms') || '',
    bathrooms: searchParams.get('bathrooms') || '',
    minArea: searchParams.get('minArea') || '',
    maxArea: searchParams.get('maxArea') || '',
    furnished: searchParams.get('furnished') || '',
    propertyAge: searchParams.get('propertyAge') || '',
  });

  useEffect(() => {
    const keys = ['q','type','subtype','category','minPrice','maxPrice','location','locality','bedrooms','bathrooms','minArea','maxArea','furnished','propertyAge'];
    setFilters(Object.fromEntries(keys.map(key => [key, searchParams.get(key) || ''])));
    setPage(1);
  }, [searchParams]);

  const fetchProperties = useCallback(async () => {
    const request = ++querySequence.current;
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 9,
        ...(filters.q && { q: filters.q }),
        ...(filters.type && { type: filters.type }),
        ...(filters.subtype && { subtype: filters.subtype }),
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.location && { location: filters.location }),
        ...(filters.locality && { locality: filters.locality }),
        ...(filters.bedrooms && { bedrooms: filters.bedrooms }),
        ...(filters.bathrooms && { bathrooms: filters.bathrooms }),
        ...(filters.minArea && { minArea: filters.minArea }),
        ...(filters.maxArea && { maxArea: filters.maxArea }),
        ...(filters.furnished && { furnished: filters.furnished }),
        ...(filters.propertyAge && { propertyAge: filters.propertyAge }),
      };
      const response = await propertyService.getAll(params);
      if (request !== querySequence.current) return;
      setProperties(response.data.properties);
      setTotalPages(response.data.pages);
    } catch (error) {
      if (request !== querySequence.current) return;
      setError('Unable to load properties. Please try again.');
      setProperties([]);
      setTotalPages(0);
    } finally {
      if (request === querySequence.current) setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchProperties();
    return cancelPendingQuery;
  }, [fetchProperties, cancelPendingQuery]);
  useEffect(() => {
    let active = true;
    categoryService.getAll().then(response => { if (active) setCategories(response.data.categories); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const handleFilterChange = (newFilters) => {
    // Preserve the type, subtype and category from URL - don't allow them to be changed by filters
    const preservedFilters = {
      ...newFilters,
      q: filters.q,
      type: urlType || newFilters.type,  // Keep URL type if present
      subtype: urlSubtype || newFilters.subtype,  // Keep URL subtype if present
      category: urlCategory || newFilters.category // Keep URL category if present
    };
    setFilters(preservedFilters);
    setPage(1);
  };

  const getPropertyTypeTitle = () => {
    // Buy with subtype and category
    if (propertyType === 'buy' && propertySubtype === 'newprojects') {
      const categoryMap = {
        apartment: '🏢 New Project Apartments',
        villa: '🏡 New Project Villas',
        plot: '🌳 Plots in New Projects',
      };
      return categoryMap[propertyCategory] || '✨ New Projects for Buy';
    }
    if (propertyType === 'buy' && propertySubtype === 'resale') {
      return '🏠 Resale Properties';
    }
    
    // Commercial with subtype
    if (propertyType === 'commercial' && propertySubtype === 'buy') {
      return '🛒 Commercial Properties for Buy';
    }
    if (propertyType === 'commercial' && propertySubtype === 'lease') {
      return '📋 Commercial Properties for Lease';
    }

    const typeMap = {
      buy: '🛒 Properties for Buy',
      rent: '🔑 Properties for Rent',
      commercial: '🏢 Commercial Properties',
      lease: '🏠 Lease Properties',
    };
    return typeMap[propertyType] || 'All Properties';
  };

  const getPropertyTypeDescription = () => {
    // Buy with subtype and category
    if (propertyType === 'buy' && propertySubtype === 'newprojects') {
      const categoryDescMap = {
        apartment: 'Explore new residential apartment projects',
        villa: 'Discover premium villa projects with modern amenities',
        plot: 'Find plot opportunities in newly developed projects',
      };
      return categoryDescMap[propertyCategory] || 'Browse new projects designed for modern living';
    }
    if (propertyType === 'buy' && propertySubtype === 'resale') {
      return 'Browse verified resale properties ready for immediate possession';
    }

    // Commercial with subtype
    if (propertyType === 'commercial' && propertySubtype === 'buy') {
      return 'Explore commercial spaces available for purchase';
    }
    if (propertyType === 'commercial' && propertySubtype === 'lease') {
      return 'Find commercial properties available for lease';
    }

    const descMap = {
      buy: 'Browse and purchase your dream property from our extensive collection',
      rent: 'Find the perfect rental property that suits your lifestyle',
      commercial: 'Explore commercial spaces and office options for your business',
      lease: 'Find long-term lease options for residential and commercial use',
    };
    return descMap[propertyType] || 'Explore our premium property collection';
  };

  return (
    <>
    {error && <p role="alert" className="p-4 text-center text-red-700">{error}</p>}
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">{getPropertyTypeTitle()}</h1>
          <p className="text-gray-600 text-lg">{getPropertyTypeDescription()}</p>
          {properties.length > 0 && <p className="text-sm text-gray-500 mt-2">Showing {properties.length} properties</p>}
        </div>

        {/* Filter Bar - Top */}
        <FilterBar onFilterChange={handleFilterChange} categories={categories} propertyType={propertyType} propertySubtype={propertySubtype} propertyCategory={urlCategory} />

        {/* Properties Grid - Full Width with Smaller Cards */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : error ? null : properties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                {properties.map((property) => (
                  <PropertyCard key={property._id} property={property} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      className={`px-4 py-2 rounded ${
                        page === num
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No properties found</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default PropertyListingPage;
