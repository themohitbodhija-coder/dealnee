import React from 'react';
import { formatIndianNumberWords } from '../../utils/propertyFormUtils';

/**
 * PriceWordBadge displays live Indian numbering count in words as user types a price
 * e.g., 328900000 -> "32 Crore 89 Lakh"
 */
export const PriceWordBadge = ({ value, className = '', showRupee = true }) => {
  const words = formatIndianNumberWords(value);
  if (!words) return null;

  return (
    <div
      data-testid="price-word-badge"
      className={`text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md mt-1.5 inline-flex items-center gap-1 shadow-sm ${className}`}
    >
      {showRupee && <span className="text-emerald-600 font-bold">₹</span>}
      <span>{words}</span>
    </div>
  );
};

export default PriceWordBadge;
