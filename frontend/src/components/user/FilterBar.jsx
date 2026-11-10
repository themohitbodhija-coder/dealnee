import React, { useState, useEffect } from 'react';
import { FaFilter, FaTimes, FaSearch, FaChevronDown } from 'react-icons/fa';

const FilterBar = ({ onFilterChange, categories, propertyType, propertySubtype, propertyCategory }) => {
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    state: '',
    location: '',
    locality: '',
    bedrooms: '',
    bathrooms: '',
    minArea: '',
    maxArea: '',
    furnished: '',
    propertyAge: '',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [expandedSection, setExpandedSection] = useState('basic');

  // State to Cities mapping
  const citiesByState = {
    'Andhra Pradesh': ['Vijayawada', 'Visakhapatnam', 'Guntur', 'Tirupati'],
    'Arunachal Pradesh': ['Itanagar'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur'],
    'Chhattisgarh': ['Raipur', 'Bilaspur', 'Durg'],
    'Goa': ['Panaji', 'Margao'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    'Haryana': ['Gurgaon', 'Faridabad', 'Panipat'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad'],
    'Karnataka': ['Bangalore', 'Mangalore', 'Mysore', 'Hubli', 'Belgaum'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Aurangabad'],
    'Manipur': ['Imphal'],
    'Meghalaya': ['Shillong'],
    'Mizoram': ['Aizawl'],
    'Nagaland': ['Kohima', 'Dimapur'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur', 'Balasore', 'Puri', 'Berhampur', 'Baripada', 'Bhadrak', 'Koraput', 'Jeypore', 'Sundargarh', 'Balangir', 'Phulbani', 'Paralakhemundi', 'Keonjhar', 'Nabarangpur', 'Sambalpur', 'Bolangir', 'Jharsuguda', 'Deogarh', 'Dhenkanal', 'Jagatsinghpur', 'Kendrapara', 'Malkangiri', 'Mayurbhanj', 'Nayagarh', 'Nuapada', 'Rayagada', 'Sonepur', 'Subarnapur', 'Sundargarh'],
    'Punjab': ['Chandigarh', 'Amritsar', 'Ludhiana', 'Jalandhar'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
    'Sikkim': ['Gangtok'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad'],
    'Tripura': ['Agartala'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Noida', 'Ghaziabad'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Nainital'],
    'West Bengal': ['Kolkata', 'Siliguri', 'Asansol', 'Durgapur'],
    // Union Territories
    'Andaman and Nicobar Islands': [],
    'Chandigarh': [],
    'Dadra and Nagar Haveli and Daman and Diu': [],
    'Lakshadweep': [],
    'Puducherry': [],
    'Jammu and Kashmir': ['Srinagar', 'Jammu'],
    'Ladakh': ['Leh', 'Kargil'],
    'Delhi': ['Delhi', 'New Delhi', 'South Delhi', 'East Delhi', 'West Delhi']
  };

  // Popular localities based on property type
  const localitiesByCity = {
    'Bhubaneswar': [
    'Patia',
    'Chandrasekharpur',
    'Infocity',
    'Sailashree Vihar',
    'Niladri Vihar',
    'Rail Vihar',
    'Nalco Nagar',
    'Damana',
    'Raghunathpur',
    'Sikharchandi',
    'Kalarahanga',
    'Nandankanan',
    'Barang',
    'KIIT Area',
    'Prasanti Vihar',
    'Gajapati Nagar',
    'Vani Vihar',
    'IRC Village',
    'Jaydev Vihar',
    'Salia Sahi',
    'Nayapalli',
    'Saheed Nagar',
    'Satya Nagar',
    'Ashok Nagar',
    'Bapuji Nagar',
    'Forest Park',
    'Kharvela Nagar',
    'Keshari Nagar',
    'Bhouma Nagar',
    'Bhoi Nagar',
    'Acharya Vihar',
    'Unit-I',
    'Unit-II',
    'Unit-III',
    'Unit-IV',
    'Unit-V',
    'Unit-VI',
    'Unit-VII',
    'Unit-VIII',
    'Unit-IX',
    'Master Canteen',
    'Ganga Nagar',
    'Madhusudan Nagar',
    'Ekamra Vihar',
    'Old Town',
    'Lingaraj Nagar',
    'Gouri Nagar',
    'Kapileswar',
    'Kapilaprasad',
    'Bhimatangi',
    'Samantarapur',
    'BJB Nagar',
    'Rajarani Colony',
    'Pandab Nagar',
    'Brahmeswar Haat',
    'Sundarpada',
    'Tankapani Road',
    'Chintamaniswar',
    'Badagada',
    'Jharpada',
    'Laxmisagar',
    'Khandagiri',
    'Jagamara',
    'Baramunda',
    'Dumduma',
    'Pokhariput',
    'Palaspalli',
    'Patrapada',
    'Kalinga Nagar',
    'Ghatikia',
    'Jagmohan Nagar',
    'Sijua',
    'Shankarpur',
    'Gopabandhu Nagar',
    'Delta Colony',
    'CRPF Square Area',
    'Soubhagya Nagar',
    'Rasulgarh',
    'Mancheswar',
    'VSS Nagar',
    'Palasuni',
    'Hanspal',
    'Prachi Vihar',
    'Canal Road',
    'Pahala',
    'Kuakhai Area',
    'Tomando',
    'Tamando',
    'Mendhasal',
    'Phulnakhara',
    'Balianta',
    'Balipatna',
    'Andharua',
    'Gothapatna',
    'Madanpur',
    'Jatani Road Area',
    'Khordha Road Area',
    'Lingipur',
    'Dhauli',
    'Pipili Road Corridor'
    ],
    'Cuttack': [
    'Badambadi',
    'Buxi Bazar',
    'Choudhury Bazar',
    'College Square',
    'Mangalabag',
    'CDA Sector 1',
    'CDA Sector 2',
    'CDA Sector 3',
    'CDA Sector 4',
    'CDA Sector 5',
    'CDA Sector 6',
    'CDA Sector 7',
    'CDA Sector 8',
    'CDA Sector 9',
    'CDA Sector 10',
    'Bidanasi',
    'Jobra',
    'Tulsipur',
    'Ranihat',
    'Buxibazar',
    'Naya Sarak',
    'Dargha Bazar',
    'Madhupatna',
    'Khan Nagar',
    'Mahanadi Vihar',
    'Markat Nagar',
    'Nimpur',
    'Nuabazar',
    'Oriya Bazar',
    'Potapokhari',
    'Sutahat',
    'Telenga Bazar',
    'Kanika Chhak',
    'Gopalpur',
    'Kathagada Sahi',
    'Chauliaganj',
    'Jagatpur',
    'Chhatra Bazar',
    'Balisahi',
    'Mundali',
    'Niali Road',
    'Barang Road',
    'Bajrakabati Road',
    'Deulasahi',
    'Police Colony',
    'Nuapatna Road',
    'Mahatab Road',
    'Rajabagicha',
    'Bidanasi New Colony',
    'Sector 11 CDA'
],
     'Rourkela': ['Rourkela City', 'Rourkela Industrial Township', 'Panposh'],
     'Sambalpur': ['Dhankauda', 'Nala Sahi', 'Khetrajpur', 'Budharaja'],
     'Balasore': ['Balasore Town', 'Nilakantha Nagar', 'College Road'],
     'Puri': [
    'Baliapanda',
    'Chakratirtha Road',
    'Swargadwar',
    'Sea Beach Road',
    'Grand Road (Bada Danda)',
    'VIP Road',
    'Station Road',
    'Dolamandap Sahi',
    'Harachandi Sahi',
    'Mochi Sahi',
    'Markandeswar Sahi',
    'Lokanath Road',
    'Gundicha Temple Area',
    'Narendra Tank Area',
    'Jagannath Ballav',
    'Matitota',
    'Sipasarubali',
    'New Marine Drive Road',
    'Penthakata',
    'Badasankha',
    'Balisahi',
    'Mangalaghat',
    'Kumbharapada',
    'Chudanga Sahi',
    'Hospital Square',
    'Atharanala',
    'Batagaon',
    'Talabania',
    'Gopalpur',
    'Mangalaghat',
    'Brahmagiri Road',
    'Malatipatpur',
    'Nua Sahi',
    'Baseli Sahi',
    'Harekrushnapur',
    'Penthakata',
    'Mochisahi',
    'Jagannath Temple Area',
    'Lokanath Temple Area',
    'Penthakata Fishing Village',
    'Baliapanda Housing Board Colony'
],
    'Pune': [
      'Hinjewadi',
      'Baner',
      'Kalyani Nagar',
      'Viman Nagar',
      'Magarpatta',
      'Wakad',
      'Kharadi',
      'Koregaon Park',
      'Kondhwa'
    ],
    'Bangalore': [
      'Whitefield',
      'Indiranagar',
      'Koramangala',
      'HSR Layout',
      'Marathahalli',
      'Sarjapur Road',
      'Electronic City',
      'Banaswadi',
      'Yeshwantpur'
    ],
    'Delhi': [
      'Noida',
      'Greater Noida',
      'Gurgaon',
      'Dwarka',
      'South Delhi',
      'East Delhi',
      'West Delhi',
      'North Delhi'
    ],
    'Mumbai': [
      'Andheri',
      'Bandra',
      'Worli',
      'Powai',
      'Borivali',
      'Dadar',
      'Navi Mumbai',
      'Thane'
    ]
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedFilters = { ...filters, [name]: value };
    
    // Reset dependent fields when parent changes
    if (name === 'state') {
      updatedFilters.location = '';
      updatedFilters.locality = '';
    } else if (name === 'location') {
      updatedFilters.locality = '';
    }
    
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      minPrice: '',
      maxPrice: '',
      state: '',
      location: '',
      locality: '',
      bedrooms: '',
      bathrooms: '',
      minArea: '',
      maxArea: '',
      furnished: '',
      propertyAge: '',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(val => val !== '').length;
  };

  // Get active category name from categories list
  const getActiveCategoryName = () => {
    if (!propertyCategory || !categories) return null;
    const category = categories.find(cat => cat._id === propertyCategory);
    return category ? category.name : null;
  };

  const getLocalityOptions = () => {
    return filters.location ? (localitiesByCity[filters.location] || []) : [];
  };

  const getCityOptions = () => {
    return filters.state ? (citiesByState[filters.state] || []) : [];
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
      {/* Filter Header */}
      <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md">
            <FaFilter className="text-white text-lg" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Advanced Filters</h3>
            <div className="flex items-center space-x-2 mt-1">
              {getActiveCategoryName() && (
                <span className="text-xs text-green-700 font-semibold bg-green-100 px-2.5 py-1 rounded-full inline-block">
                  Category: {getActiveCategoryName()}
                </span>
              )}
              {getActiveFilterCount() > 0 && (
                <span className="text-xs text-red-600 font-semibold bg-red-50 px-2.5 py-1 rounded-full inline-block">
                  {getActiveFilterCount()} active {getActiveFilterCount() === 1 ? 'filter' : 'filters'}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden px-4 py-2 bg-red-600 text-white rounded-lg font-semibold flex items-center space-x-2 hover:bg-red-700 transition"
          >
            <FaFilter className="text-sm" />
            <span>{showFilters ? 'Hide' : 'Show'}</span>
          </button>
          {getActiveFilterCount() > 0 && (
            <button
              onClick={handleReset}
              className="hidden md:flex px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition items-center space-x-1"
            >
              <FaTimes className="text-sm" />
              <span className="text-sm">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block p-5 space-y-6`}>
        
        {/* Basic Filters Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'basic' ? null : 'basic')}
            className="w-full p-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between font-semibold text-gray-800 transition"
          >
            <span className="flex items-center space-x-2">
              <span>💰 Price & Location</span>
            </span>
            <FaChevronDown className={`transition transform ${expandedSection === 'basic' ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSection === 'basic' && (
            <div className="p-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Min Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Price</label>
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleChange}
                  placeholder="₹ Min"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Price</label>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleChange}
                  placeholder="₹ Max"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                <select
                  name="state"
                  value={filters.state}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition bg-white text-gray-700"
                >
                  <option value="">Select State</option>
                  {Object.keys(citiesByState).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              {/* City/Location */}
              {filters.state && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <select
                    name="location"
                    value={filters.location}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition bg-white text-gray-700"
                  >
                    <option value="">Select City</option>
                    {getCityOptions().map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Locality */}
              {filters.location && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Locality / Area</label>
                  <select
                    name="locality"
                    value={filters.locality}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition bg-white text-gray-700"
                  >
                    <option value="">All Localities</option>
                    {getLocalityOptions().map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Property Details Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'details' ? null : 'details')}
            className="w-full p-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between font-semibold text-gray-800 transition"
          >
            <span className="flex items-center space-x-2">
              <span>🏠 Property Details</span>
            </span>
            <FaChevronDown className={`transition transform ${expandedSection === 'details' ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSection === 'details' && (
            <div className="p-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bedrooms</label>
                <select
                  name="bedrooms"
                  value={filters.bedrooms}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4 BHK</option>
                  <option value="5">5+ BHK</option>
                </select>
              </div>

              {/* Bathrooms */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bathrooms</label>
                <select
                  name="bathrooms"
                  value={filters.bathrooms}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4+</option>
                </select>
              </div>

              {/* Furnished Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Furnishing</label>
                <select
                  name="furnished"
                  value={filters.furnished}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="furnished">Furnished</option>
                  <option value="semi-furnished">Semi-Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>

              {/* Property Age */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Property Age</label>
                <select
                  name="propertyAge"
                  value={filters.propertyAge}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="new">New (0-1 years)</option>
                  <option value="recent">Recent (1-5 years)</option>
                  <option value="moderate">Moderate (5-10 years)</option>
                  <option value="old">Old (10+ years)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Area Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'area' ? null : 'area')}
            className="w-full p-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between font-semibold text-gray-800 transition"
          >
            <span className="flex items-center space-x-2">
              <span>📐 Super Built-up Area</span>
            </span>
            <FaChevronDown className={`transition transform ${expandedSection === 'area' ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSection === 'area' && (
            <div className="p-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Min Area */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Super Built-up Area (sq.ft)</label>
                <input
                  type="number"
                  name="minArea"
                  value={filters.minArea}
                  onChange={handleChange}
                  placeholder="Min area"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>

              {/* Max Area */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Super Built-up Area (sq.ft)</label>
                <input
                  type="number"
                  name="maxArea"
                  value={filters.maxArea}
                  onChange={handleChange}
                  placeholder="Max area"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>
            </div>
          )}
        </div>

        {/* Reset Button */}
        <div className="flex justify-center md:justify-end">
          <button
            onClick={handleReset}
            disabled={getActiveFilterCount() === 0}
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
          >
            <FaTimes className="text-sm" />
            <span>Clear All Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
