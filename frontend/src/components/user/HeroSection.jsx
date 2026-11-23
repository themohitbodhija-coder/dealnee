import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuArrowRight as FaArrowRight, LuMapPin as FaMapMarkerAlt, LuSearch as FaSearch, LuSlidersHorizontal as FaSlidersH } from 'react-icons/lu';
import { FaWhatsapp } from 'react-icons/fa';
import { getWhatsAppUrl } from '../../utils/whatsapp';
import { useMediaQuery, usePageVisible } from '../../hooks/useMediaPreferences';

const HERO_VIDEOS = ['/images/Hero_video1.mp4', '/images/Hero_video2.mp4', '/images/hero_video3.mp4'];

const PURCHASE_BUDGETS = [
  ['0-5000000', 'Up to ₹50 Lakh'], ['5000000-10000000', '₹50 Lakh – ₹1 Cr'],
  ['10000000-20000000', '₹1 Cr – ₹2 Cr'], ['20000000+', '₹2 Cr and above'],
];
const RENTAL_BUDGETS = [
  ['0-15000', 'Up to ₹15,000 / month'], ['15000-30000', '₹15,000 – ₹30,000 / month'],
  ['30000-50000', '₹30,000 – ₹50,000 / month'], ['50000+', '₹50,000+ / month'],
];

export default function HeroSection() {
  const navigate = useNavigate();
  const video = useRef(null);
  const [videoIndex, setVideoIndex] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const visible = usePageVisible();
  const videoPlaying = visible && !reducedMotion;
  useEffect(() => {
    if (!video.current) return;
    if (videoPlaying) video.current.play()?.catch(() => {});
    else video.current.pause();
  }, [videoPlaying, videoIndex]);
  const [type, setType] = useState('buy');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [moreFilters, setMoreFilters] = useState(false);
  const search = event => {
    event.preventDefault();
    const params = new URLSearchParams({ type });
    if (location.trim()) params.set('location', location.trim());
    if (category && type === 'buy') {
      params.set('subtype', 'newprojects');
      params.set('category', category);
    }
    if (budget) {
      const [min, max] = budget.replace('+', '').split('-');
      params.set('minPrice', min);
      if (max) params.set('maxPrice', max);
    }
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-shell">
        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-eyebrow"><span /> YOUR NEXT CHAPTER STARTS HERE</p>
            <h1 id="home-title">Find a place.<br />Make it <em>yours.</em></h1>
            <p className="home-hero-description">Discover homes, plots and business spaces in Bhubaneswar. Get local guidance at every step.</p>
            <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="home-text-link"><FaWhatsapp aria-hidden="true" /> Ask on WhatsApp</a>
          </div>
          <div className="home-hero-visual">
            {videoFailed ? <img src="/images/hero-2.jpg" alt="Contemporary residences with spacious balconies" width="1200" height="800" /> : <video ref={video} src={HERO_VIDEOS[videoIndex]} poster="/images/hero-2.jpg" autoPlay={videoPlaying} muted playsInline preload="metadata" aria-label="Property and interior inspiration" onEnded={() => setVideoIndex(index => (index + 1) % HERO_VIDEOS.length)} onError={() => setVideoFailed(true)} />}
            <div className="home-visual-caption"><span>SPACE FOR WHAT MATTERS</span><p>A new address.<br />A fresh beginning.</p></div>
            <span className="home-image-label">Residential · Commercial · Land</span>
          </div>
        </div>

        <form className="home-search" onSubmit={search} aria-label="Find a property">
          <fieldset className="home-search-tabs"><legend className="sr-only">Looking to</legend>
            {['buy', 'rent', 'commercial'].map(value => <label key={value} className={type === value ? 'is-selected' : ''}>
              <input type="radio" name="transaction" value={value} checked={type === value} onChange={() => { setType(value); setBudget(''); setCategory(''); }} />
              <span>{value === 'buy' ? 'Buy' : value === 'rent' ? 'Rent' : 'Commercial'}</span>
            </label>)}
          </fieldset>
          <div className="home-search-fields">
            <label className="home-location-field"><span>Location</span><div><FaMapMarkerAlt aria-hidden="true" /><input name="location" value={location} onChange={event => setLocation(event.target.value)} placeholder="Enter a city or address" maxLength={160} /></div></label>
            <button type="button" className="home-filter-toggle" aria-expanded={moreFilters} aria-controls="home-extra-filters" onClick={() => setMoreFilters(value => !value)}><FaSlidersH aria-hidden="true" /> Filters</button>
            <div id="home-extra-filters" className={`home-extra-filters ${moreFilters ? 'is-expanded' : ''}`}>
              {type === 'buy' && <label><span>Property type</span><select name="category" value={category} onChange={event => setCategory(event.target.value)}>
                <option value="">All properties</option><option value="apartment">New apartments</option><option value="villa">New villas</option><option value="plot">New project plots</option>
              </select></label>}
              <label><span>{type === 'rent' ? 'Monthly budget' : 'Budget'}</span><select name="budget" value={budget} onChange={event => setBudget(event.target.value)}>
                <option value="">Any budget</option>{(type === 'rent' ? RENTAL_BUDGETS : PURCHASE_BUDGETS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select></label>
            </div>
            <button className="home-button home-button-primary home-search-submit" type="submit"><FaSearch aria-hidden="true" /><span>Search properties</span></button>
          </div>
        </form>
        <div className="home-hero-note"><span>Based in Bhubaneswar</span><span>ORERA registration: ORA/0308/2025</span><Link to="/about">Get to know Dealinee <FaArrowRight aria-hidden="true" /></Link></div>
      </div>
    </section>
  );
}
