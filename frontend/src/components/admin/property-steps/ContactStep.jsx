import React, { useCallback, useState, useEffect } from 'react';
import { FaPhone, FaTimes } from 'react-icons/fa';
import { createFieldUpdateAction } from '../../../reducers/propertyFormReducer';

const ContactStep = ({ formData, dispatch, errors = {} }) => {
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Initialize default values on mount
  useEffect(() => {
    // Only ensure phone has a sensible placeholder/default for UX; name/email removed
    if (!formData.contact.phone) {
      dispatch(createFieldUpdateAction('contact', 'phone', '9776631999'));
    }
  }, [dispatch]);

  // Show error modal when errors change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setShowErrorModal(true);
    }
  }, [errors]);

  const handlePhoneChange = useCallback(
    (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 10) {
        value = value.slice(0, 10);
      }
      dispatch(createFieldUpdateAction('contact', 'phone', value));
    },
    [dispatch]
  );

  const formatPhoneForDisplay = (phone) => {
    if (!phone) return '';
    if (phone.length <= 5) return phone;
    if (phone.length <= 9) return `${phone.slice(0, 5)}-${phone.slice(5)}`;
    return `${phone.slice(0, 5)}-${phone.slice(5, 9)}-${phone.slice(9)}`;
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

      <div className="flex items-center gap-2 mb-6 p-4 bg-orange-50 rounded-lg">
        <FaPhone className="text-orange-600" />
        <p className="text-orange-800 text-sm">
          Provide contact details for property inquiries
        </p>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Phone Number
        </label>
        <div className="relative">
          <span className="absolute left-4 top-3 text-gray-500">+91</span>
          <input
            type="tel"
            value={formatPhoneForDisplay(formData.contact.phone)}
            onChange={handlePhoneChange}
            placeholder="98765-4321-0"
            readOnly
            aria-readonly="true"
            className={`w-full pl-12 pr-4 py-3 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        <p className="text-gray-500 text-xs mt-2">Enter 10-digit mobile number</p>
      </div>

      {/* Email (read-only preset) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
        <input
          type="email"
          value={formData.contact.email || 'dealinee0@gmail.com'}
          readOnly
          aria-readonly="true"
          className="w-full pr-4 py-3 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
        />
        <p className="text-gray-500 text-xs mt-2">Contact email is fixed for listings.</p>
      </div>
    </div>
  );
};

export default React.memo(ContactStep);
