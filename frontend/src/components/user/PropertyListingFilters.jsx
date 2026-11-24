import React, { useEffect, useState } from 'react';
import { LuSearch, LuSlidersHorizontal, LuX } from 'react-icons/lu';
import PriceWordBadge from '../common/PriceWordBadge';

export const listingFilterKeys = ['q', 'type', 'subtype', 'category', 'location', 'locality', 'minPrice', 'maxPrice', 'bedrooms', 'bathrooms', 'minArea', 'maxArea', 'furnished', 'propertyAge'];
const transactions = [['', 'All properties'], ['buy', 'Buy'], ['rent', 'Rent'], ['commercial', 'Commercial']];
const homes = [['apartment', 'Apartments'], ['villa', 'Villas'], ['plot', 'Plots']];
const rentals = [['RENTAL_FLAT', 'Flats'], ['RENTAL_VILLA', 'Villas / duplexes'], ['RENTAL_INDIVIDUAL_FLOOR', 'Individual floors']];
const saleSpaces = [['OFFICE', 'Offices'], ['SHOP', 'Shops'], ['SHOWROOM', 'Showrooms'], ['LAND', 'Land'], ['WAREHOUSE', 'Warehouses'], ['INDUSTRIAL', 'Industrial'], ['COWORKING', 'Co-working']];
const leaseSpaces = saleSpaces.filter(([code]) => ['OFFICE', 'SHOP', 'WAREHOUSE'].includes(code));
const detailKeys = ['q', 'location', 'locality', 'minPrice', 'maxPrice', 'bedrooms', 'bathrooms', 'minArea', 'maxArea', 'furnished', 'propertyAge'];

export function getListingGroup(type, subtype = '') {
  if (type === 'buy') {
    if (subtype.toUpperCase().startsWith('RESALE_') || subtype === 'resale') return 'resale';
    if (subtype.toUpperCase().startsWith('NEW_PROJECT_') || ['newprojects', 'new_project'].includes(subtype)) return 'newprojects';
  }
  if (type === 'commercial') {
    if (subtype.toUpperCase().endsWith('_SALE') || subtype === 'buy') return 'buy';
    if (subtype.toUpperCase().endsWith('_LEASE') || subtype === 'lease') return 'lease';
  }
  return '';
}

function Choices({ label, options, value, onChange, className = '' }) {
  return <div className={`listing-choice-group ${className}`} role="group" aria-label={label}>
    {options.map(([code, text]) => <button key={code} type="button" aria-pressed={value === code} onClick={() => onChange(code)}>{text}</button>)}
  </div>;
}

export default function PropertyListingFilters({ filters, onChange, onReset }) {
  const [draft, setDraft] = useState(filters);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setDraft(filters), [filters]);
  const type = filters.type;
  const group = getListingGroup(type, filters.subtype);
  const plot = filters.category === 'plot' || filters.subtype?.toUpperCase().endsWith('_PLOT');
  const showRooms = type !== 'commercial' && !plot;
  const active = listingFilterKeys.filter(key => filters[key]).length;
  const changeDraft = event => setDraft(previous => ({ ...previous, [event.target.name]: event.target.value }));
  const changeTransaction = value => onChange({ type: value, subtype: '', category: '', minPrice: '', maxPrice: '', bedrooms: '', bathrooms: '', furnished: '', propertyAge: '', minArea: '', maxArea: '' });
  const changeGroup = value => onChange({ subtype: value, category: '', bedrooms: '', bathrooms: '', furnished: '' });
  const chooseHome = value => {
    const resetRooms = value === 'plot' ? { bedrooms: '', bathrooms: '', furnished: '' } : {};
    if (group === 'resale') onChange({ subtype: value ? `RESALE_${value === 'apartment' ? 'FLAT' : value.toUpperCase()}` : 'resale', category: '', ...resetRooms });
    else onChange({ subtype: value ? `NEW_PROJECT_${value.toUpperCase()}` : 'newprojects', category: '', ...resetRooms });
  };
  const selectedHome = filters.category || (filters.subtype?.endsWith('_FLAT') ? 'apartment' : filters.subtype?.endsWith('_VILLA') ? 'villa' : filters.subtype?.endsWith('_PLOT') ? 'plot' : filters.subtype?.endsWith('_APARTMENT') ? 'apartment' : '');
  const submit = event => {
    event.preventDefault();
    onChange(Object.fromEntries(detailKeys.map(key => [key, (draft[key] || '').trim()])));
  };
  return <section className="listing-filter-panel" aria-label="Property filters">
    <div className="listing-filter-top">
      <Choices label="Listing type" className="listing-transaction-tabs" options={transactions} value={type} onChange={changeTransaction} />
      {active > 0 && <button type="button" className="listing-clear" onClick={onReset}><LuX aria-hidden="true" /> Clear all</button>}
    </div>
    {type === 'buy' && <div className="listing-filter-step"><span>Buying options</span><Choices label="Buying options" options={[[ '', 'All buying options' ], ['newprojects', 'New projects'], ['resale', 'Resale']]} value={group} onChange={changeGroup} /></div>}
    {type === 'buy' && group && <div className="listing-filter-step"><span>Property type</span><Choices label="Residential property type" options={[[ '', 'All types' ], ...homes]} value={selectedHome} onChange={chooseHome} /></div>}
    {type === 'rent' && <div className="listing-filter-step"><span>Property type</span><Choices label="Rental property type" options={[[ '', 'All rentals' ], ...rentals]} value={filters.subtype || ''} onChange={value => onChange({ subtype: value, category: '' })} /></div>}
    {type === 'commercial' && <div className="listing-filter-step"><span>Commercial options</span><Choices label="Commercial options" options={[[ '', 'All commercial' ], ['buy', 'Buy'], ['lease', 'Lease']]} value={group} onChange={changeGroup} /></div>}
    {type === 'commercial' && group && <div className="listing-filter-step"><span>Space type</span><Choices label="Commercial space type" options={[[group, 'All spaces'], ...(group === 'buy' ? saleSpaces : leaseSpaces).map(([code, label]) => [`COMMERCIAL_${code}_${group === 'buy' ? 'SALE' : 'LEASE'}`, label])]} value={filters.subtype || group} onChange={value => onChange({ subtype: value, category: '' })} /></div>}
    <form onSubmit={submit} aria-label="Refine property search">
      <div className="listing-search-fields">
        <label><span>Search</span><input name="q" value={draft.q || ''} onChange={changeDraft} placeholder="Property name or keyword" maxLength={160} /></label>
        <label><span>Location</span><input name="location" value={draft.location || ''} onChange={changeDraft} placeholder="City or address" maxLength={160} /></label>
        <label>
          <span>{type === 'rent' ? 'Min. monthly rent' : 'Min. price (₹)'}</span>
          <input type="number" name="minPrice" min="0" max={draft.maxPrice || undefined} value={draft.minPrice || ''} onChange={changeDraft} placeholder="No minimum" />
          <PriceWordBadge value={draft.minPrice} />
        </label>
        <label>
          <span>{type === 'rent' ? 'Max. monthly rent' : 'Max. price (₹)'}</span>
          <input type="number" name="maxPrice" min={draft.minPrice || '0'} value={draft.maxPrice || ''} onChange={changeDraft} placeholder="No maximum" />
          <PriceWordBadge value={draft.maxPrice} />
        </label>
      </div>
      <div className="listing-filter-actions"><button type="button" className="listing-more" aria-controls="listing-additional-filters" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}><LuSlidersHorizontal aria-hidden="true" /> More filters</button><button type="submit" className="listing-apply"><LuSearch aria-hidden="true" /> Apply filters</button></div>
      <div id="listing-additional-filters" className="listing-more-fields" hidden={!expanded}>
        <label><span>Locality</span><input name="locality" value={draft.locality || ''} onChange={changeDraft} placeholder="Neighbourhood or area" maxLength={160} /></label>
        {showRooms && <><label><span>Bedrooms</span><select name="bedrooms" value={draft.bedrooms || ''} onChange={changeDraft}><option value="">Any</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}</select></label><label><span>Bathrooms</span><select name="bathrooms" value={draft.bathrooms || ''} onChange={changeDraft}><option value="">Any</option>{[1, 2, 3, 4].map(value => <option key={value} value={value}>{value}</option>)}</select></label><label><span>Furnishing</span><select name="furnished" value={draft.furnished || ''} onChange={changeDraft}><option value="">Any</option><option value="furnished">Furnished</option><option value="semi-furnished">Semi-furnished</option><option value="unfurnished">Unfurnished</option></select></label></>}
        <label><span>Property age</span><select name="propertyAge" value={draft.propertyAge || ''} onChange={changeDraft}><option value="">Any</option><option value="new">0–1 years</option><option value="recent">1–5 years</option><option value="moderate">5–10 years</option><option value="old">10+ years</option></select></label>
        <label><span>Minimum listed area</span><input name="minArea" type="number" min="0" max={draft.maxArea || undefined} value={draft.minArea || ''} onChange={changeDraft} placeholder="No minimum" /></label>
        <label><span>Maximum listed area</span><input name="maxArea" type="number" min={draft.minArea || '0'} value={draft.maxArea || ''} onChange={changeDraft} placeholder="No maximum" /></label>
      </div>
    </form>
  </section>;
}
