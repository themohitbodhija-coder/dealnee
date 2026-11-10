import React, { useCallback, useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import { createFieldUpdateAction } from '../../../reducers/propertyFormReducer';

// State to Cities mapping
const citiesByState = {
  'Andhra Pradesh': ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Nagaon', 'Jorhat'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'],
  'Chhattisgarh': ['Raipur', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Korba'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  'Haryana': ['Faridabad', 'Gurgaon', 'Hisar', 'Rohtak', 'Panipat'],
  'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Kangra', 'Kullu'],
  'Jharkhand': ['Ranchi', 'Dhanbad', 'Giridih', 'Bokaro', 'Jamshedpur'],
  'Karnataka': ['Bangalore', 'Mangalore', 'Mysore', 'Belgaum', 'Hubli', 'Davangere', 'Tumkur'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Kottayam', 'Thrissur'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Aurangabad', 'Nashik', 'Kolhapur'],
  'Manipur': ['Imphal', 'Senapati', 'Thoubal', 'Bishnupur'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur', 'Balasore'],
  'Punjab': ['Chandigarh', 'Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruppur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Ambassa'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Noida', 'Ghaziabad'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Nainital', 'Almora', 'Pithoragarh'],
  'West Bengal': ['Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Darjeeling'],
  'Andaman and Nicobar Islands': [],
  'Chandigarh': [],
  'Dadra and Nagar Haveli and Daman and Diu': [],
  'Lakshadweep': [],
  'Puducherry': [],
  'Jammu and Kashmir': [],
  'Ladakh': [],
  'Delhi': ['Delhi', 'New Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
  'Union Territory of Dadra & Nagar Haveli': [],
  'Union Territory of Daman & Diu': [],
};

// Localities by city mapping
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
  'Cuttack': ['Badambadi', 'Cantonment', 'Buxi Bazar', 'Markat Nagar', 'Tarapur'],
  'Rourkela': ['Rourkela City', 'Rourkela Industrial Township', 'Panposh'],
  'Sambalpur': ['Dhankauda', 'Nala Sahi', 'Khetrajpur', 'Budharaja'],
  'Balasore': ['Balasore Town', 'Nilakantha Nagar', 'College Road'],
  'Mumbai': ['Andheri', 'Bandra', 'Worli', 'Powai', 'Borivali', 'Dadar', 'Navi Mumbai', 'Thane', 'Koramangala'],
  'Pune': ['Hinjewadi', 'Baner', 'Kalyani Nagar', 'Viman Nagar', 'Magarpatta', 'Wakad', 'Kharadi', 'Koregaon Park', 'Kondhwa'],
  'Bangalore': ['Whitefield', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Marathahalli', 'Sarjapur Road', 'Electronic City', 'Banaswadi', 'Yeshwantpur'],
  'Delhi': ['Noida', 'Greater Noida', 'Gurgaon', 'Dwarka', 'South Delhi', 'East Delhi', 'West Delhi', 'North Delhi'],
  'New Delhi': ['Connaught Place', 'Central Delhi', 'New Delhi District'],
  'Noida': ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5']
};

const LocationStep = ({ formData, dispatch, errors = {} }) => {
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Show error modal when errors change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setShowErrorModal(true);
    }
  }, [errors]);

  // ================================
  // STATE
  // ================================
  const handleStateChange = useCallback(
    (e) => {
      const state = e.target.value;
      dispatch(createFieldUpdateAction('location', 'state', state));
      // Reset city and locality when state changes
      dispatch(createFieldUpdateAction('location', 'city', ''));
      dispatch(createFieldUpdateAction('location', 'locality', ''));
    },
    [dispatch]
  );

  // ================================
  // CITY
  // ================================
  const handleCityChange = useCallback(
    (e) => {
      const city = e.target.value;
      dispatch(createFieldUpdateAction('location', 'city', city));
      // Reset locality when city changes
      dispatch(createFieldUpdateAction('location', 'locality', ''));
    },
    [dispatch]
  );

  // ================================
  // LOCALITY
  // ================================
  const handleLocalityChange = useCallback(
    (e) => {
      dispatch(createFieldUpdateAction('location', 'locality', e.target.value));
    },
    [dispatch]
  );

  // ================================
  // ADDRESS
  // ================================
  const handleAddressChange = useCallback(
    (e) => {
      dispatch(createFieldUpdateAction('location', 'address', e.target.value));
    },
    [dispatch]
  );

  // Get cities for the selected state
  const getCityOptions = () => {
    return formData?.location?.state ? (citiesByState[formData.location.state] || []) : [];
  };

  // Get localities for the selected city
  const getLocalityOptions = () => {
    return formData?.location?.city ? (localitiesByCity[formData.location.city] || []) : [];
  };

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

      {/* Header */}
      <div className="flex items-center gap-2 mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <FaMapMarkerAlt className="text-green-600 text-lg" />

        <p className="text-green-800 text-sm font-medium">
          Enter the location details of your property
        </p>
      </div>

      {/* ================================
          STATE (Required - First)
      ================================= */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          State <span className="text-red-600">*</span>
        </label>

        <select
          value={formData?.location?.state || ''}
          onChange={handleStateChange}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition bg-white text-gray-700 ${
            errors.state ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select State</option>
          {formData.location?.state && !Object.keys(citiesByState).includes(formData.location.state) && (
            <option value={formData.location.state}>{formData.location.state}</option>
          )}
          {Object.keys(citiesByState).map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>

        {errors.state && (
          <p className="text-red-500 text-xs mt-1">
            {errors.state}
          </p>
        )}
      </div>

      {/* ================================
          CITY (Required - Depends on State)
      ================================= */}
      {formData?.location?.state && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            City <span className="text-red-600">*</span>
          </label>

          <select
            value={formData?.location?.city || ''}
            onChange={handleCityChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition bg-white text-gray-700 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select City</option>
            {formData.location?.city && !getCityOptions().includes(formData.location.city) && (
              <option value={formData.location.city}>{formData.location.city}</option>
            )}
            {getCityOptions().map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {errors.city && (
            <p className="text-red-500 text-xs mt-1">
              {errors.city}
            </p>
          )}
        </div>
      )}

      {/* ================================
          LOCALITY / AREA (Required - Depends on City)
      ================================= */}
      {formData?.location?.city && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Locality / Area <span className="text-gray-400 font-normal">(or enter a full address)</span>
          </label>

          <select
            value={formData?.location?.locality || ''}
            onChange={handleLocalityChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition bg-white text-gray-700 ${
              errors.locality ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Locality / Area</option>
            {formData.location?.locality && !getLocalityOptions().includes(formData.location.locality) && (
              <option value={formData.location.locality}>{formData.location.locality}</option>
            )}
            {getLocalityOptions().map((locality) => (
              <option key={locality} value={locality}>
                {locality}
              </option>
            ))}
          </select>

          {errors.locality && (
            <p className="text-red-500 text-xs mt-1">
              {errors.locality}
            </p>
          )}
        </div>
      )}

      {/* ================================
          ADDRESS (Full street address / building name)
      ================================= */}
      {formData?.location?.city && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Address <span className="text-gray-400 font-normal">(House/Plot No., Street, Building name)</span>
          </label>

          <textarea
            value={formData?.location?.address || ''}
            onChange={handleAddressChange}
            rows={2}
            placeholder="e.g. Plot No. 123, Near XYZ Mall"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition bg-white text-gray-700 ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
          />

          <p className="text-gray-400 text-xs mt-1">
            Optional — if left blank, the selected Locality/Area will be used as the address.
          </p>

          {errors.address && (
            <p className="text-red-500 text-xs mt-1">
              {errors.address}
            </p>
          )}
        </div>
      )}

    </div>
  );
};

export default React.memo(LocationStep);
