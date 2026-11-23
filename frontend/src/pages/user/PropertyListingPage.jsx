import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LuChevronRight, LuArrowLeft, LuArrowRight, LuSearch } from 'react-icons/lu';
import { propertyService } from '../../services/api';
import PropertyCard from '../../components/user/PropertyCard';
import PropertyListingFilters, { listingFilterKeys } from '../../components/user/PropertyListingFilters';
import './PropertyListingPage.css';

export default function PropertyListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => Object.fromEntries(listingFilterKeys.map(key => [key, searchParams.get(key) || ''])), [searchParams]);
  const page = Math.max(1, Math.min(1000000, Number.parseInt(searchParams.get('page'), 10) || 1));
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [retry, setRetry] = useState(0);
  const requestSequence = useRef(0);
  const results = useRef(null);

  useEffect(() => {
    const request = ++requestSequence.current;
    let active = true;
    setLoading(true);
    setError('');
    const params = { page, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')) };
    propertyService.getAll(params).then(response => {
      if (!active || request !== requestSequence.current) return;
      setProperties(response.data.properties || []);
      setTotalPages(Number(response.data.pages) || 0);
      setTotal(Number(response.data.total) || 0);
    }).catch(() => {
      if (!active || request !== requestSequence.current) return;
      setError('Unable to load properties. Please try again.');
      setProperties([]);
      setTotal(0);
      setTotalPages(0);
    }).finally(() => { if (active && request === requestSequence.current) setLoading(false); });
    return () => { active = false; };
  }, [filters, page, retry]);

  const updateFilters = patch => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => { if (value) next.set(key, value); else next.delete(key); });
    next.delete('page');
    if (next.toString() === searchParams.toString()) return;
    ++requestSequence.current;
    setSearchParams(next);
  };
  const clearFilters = () => { if (searchParams.toString()) { ++requestSequence.current; setSearchParams({}); } };
  const goToPage = nextPage => {
    const next = new URLSearchParams(searchParams);
    if (nextPage > 1) next.set('page', nextPage); else next.delete('page');
    if (next.toString() === searchParams.toString()) return;
    ++requestSequence.current;
    setSearchParams(next);
    results.current?.scrollIntoView?.({ block: 'start' });
  };
  const title = { buy: 'Properties to buy', rent: 'Properties to rent', commercial: 'Commercial properties' }[filters.type] || 'All properties';
  const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => startPage + index);

  return <div className="listing-page">
    <div className="listing-shell">
      <nav aria-label="Breadcrumb" className="listing-breadcrumb"><Link to="/">Home</Link><LuChevronRight aria-hidden="true" /><span aria-current="page">Properties</span></nav>
      <header className="listing-heading"><p>FIND YOUR NEXT ADDRESS</p><h1>{title}</h1><div>Explore the listings first. Choose a category or refine your search whenever you’re ready.</div></header>
      <PropertyListingFilters filters={filters} onChange={updateFilters} onReset={clearFilters} />
      <section className="listing-results" aria-label="Property results" aria-busy={loading} ref={results}>
        <div className="listing-results-heading"><h2>Available properties</h2><p role="status">{loading ? 'Loading properties…' : error ? '' : `${total} ${total === 1 ? 'property' : 'properties'} found`}</p></div>
        {loading ? <div className="listing-grid" aria-hidden="true">{[1, 2, 3].map(value => <div key={value} className="listing-skeleton"><div /><span /><span /></div>)}</div>
          : error ? <div className="listing-message" role="alert"><h3>{error}</h3><button onClick={() => setRetry(value => value + 1)}>Try again</button></div>
            : properties.length ? <><div className="listing-grid">{properties.map(property => <PropertyCard key={property._id || property.id} property={property} />)}</div>
              {totalPages > 1 && <nav className="listing-pagination" aria-label="Results pages"><button aria-label="Previous page" disabled={page === 1} onClick={() => goToPage(page - 1)}><LuArrowLeft aria-hidden="true" /></button>{pages.map(number => <button key={number} aria-label={`Page ${number}`} aria-current={page === number ? 'page' : undefined} onClick={() => goToPage(number)}>{number}</button>)}<button aria-label="Next page" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}><LuArrowRight aria-hidden="true" /></button></nav>}</>
              : <div className="listing-message"><LuSearch aria-hidden="true" /><h3>No properties match these filters.</h3><p>Try a different category, widen your budget, or clear your filters to explore all listings.</p><button onClick={clearFilters}>Show all properties</button></div>}
      </section>
    </div>
  </div>;
}
