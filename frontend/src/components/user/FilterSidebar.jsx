import React, { useState, useEffect } from 'react';
import { FaFilter, FaTimes, FaChevronDown } from 'react-icons/fa';

const FilterSidebar = ({ onFilterChange, categories }) => {
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
  });

  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    location: true,
    features: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      category: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      bedrooms: '',
      bathrooms: '',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(val => val !== '').length;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg">
            <FaFilter className="text-white text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Filters</h2>
            {getActiveFilterCount() > 0 && (
              <span className="text-xs text-red-600 font-semibold">{getActiveFilterCount()} active</span>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <button
          onClick={() => toggleSection('category')}
          className="w-full flex items-center justify-between mb-4 hover:text-blue-600 transition"
        >
          <label className="text-gray-800 font-semibold cursor-pointer">Category</label>
          <FaChevronDown className={`transition transform ${expandedSections.category ? 'rotate-180' : ''}`} />
        </button>
        
        {expandedSections.category && (
          <select
            name="category"
            value={filters.category}
            onChange={handleChange}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 transition text-gray-700 font-medium"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Price Range Filter */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between mb-4 hover:text-blue-600 transition"
        >
          <label className="text-gray-800 font-semibold cursor-pointer">Price Range</label>
          <FaChevronDown className={`transition transform ${expandedSections.price ? 'rotate-180' : ''}`} />
        </button>

        {expandedSections.price && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Minimum Price (₹)</label>
              <input
                type="number"
                name="minPrice"
                placeholder="0"
                value={filters.minPrice}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition text-gray-700"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Maximum Price (₹)</label>
              <input
                type="number"
                name="maxPrice"
                placeholder="999999999"
                value={filters.maxPrice}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition text-gray-700"
              />
            </div>
          </div>
        )}
      </div>

      {/* Location Filter */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <button
          onClick={() => toggleSection('location')}
          className="w-full flex items-center justify-between mb-4 hover:text-blue-600 transition"
        >
          <label className="text-gray-800 font-semibold cursor-pointer">Location</label>
          <FaChevronDown className={`transition transform ${expandedSections.location ? 'rotate-180' : ''}`} />
        </button>

        {expandedSections.location && (
          <input
            type="text"
            name="location"
            placeholder="Search city or area..."
            value={filters.location}
            onChange={handleChange}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition text-gray-700"
          />
        )}
      </div>

      {/* Features Filter */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <button
          onClick={() => toggleSection('features')}
          className="w-full flex items-center justify-between mb-4 hover:text-blue-600 transition"
        >
          <label className="text-gray-800 font-semibold cursor-pointer">Features</label>
          <FaChevronDown className={`transition transform ${expandedSections.features ? 'rotate-180' : ''}`} />
        </button>

        {expandedSections.features && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Bedrooms</label>
              <select
                name="bedrooms"
                value={filters.bedrooms}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition text-gray-700"
              >
                <option value="">Any</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
                <option value="4">4+ Bedrooms</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Bathrooms</label>
              <select
                name="bathrooms"
                value={filters.bathrooms}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition text-gray-700"
              >
                <option value="">Any</option>
                <option value="1">1 Bathroom</option>
                <option value="2">2 Bathrooms</option>
                <option value="3">3+ Bathrooms</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Reset Button */}
      {getActiveFilterCount() > 0 && (
        <button
          onClick={handleReset}
          className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition font-semibold flex items-center justify-center space-x-2 shadow-lg"
        >
          <FaTimes /> <span>Clear All Filters</span>
        </button>
      )}

      {/* Quick Presets */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm font-semibold text-gray-600 mb-3">Quick Filters</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-xs font-semibold">
            ₹0-50L
          </button>
          <button className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-xs font-semibold">
            ₹50L-1Cr
          </button>
          <button className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-xs font-semibold">
            2+ BHK
          </button>
          <button className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-xs font-semibold">
            Featured Only
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
