import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { propertyService } from '../../services/api';
import HeroSection from '../../components/user/HeroSection';
import { getImageUrl } from '../../utils/imageUrl';
import { getPropertyRoomStats, getPropertyLocationLabel } from '../../utils/propertyFormUtils';
import { getUnitBhk } from '../../utils/projectUnits';
import { isResidentialPlot } from '../../utils/plotDetails';
import {
  LuArrowRight as FaArrowRight, LuMapPin as FaMapMarkerAlt, LuBedDouble as FaBed,
  LuBath as FaBath, LuRuler as FaRulerCombined, LuLandmark as FaHandHoldingUsd,
  LuWallet as FaMoneyBillWave, LuGlobe2 as FaGlobeAmericas, LuArrowLeftRight as FaExchangeAlt,
  LuFileCheck2 as FaFileContract, LuTrendingUp as FaChartLine, LuHome as FaHome,
  LuBuilding2 as FaBuilding, LuTrees as FaTree, LuBriefcase as FaBriefcase,
  LuPhone as FaPhone, LuCheck as FaCheck,
} from 'react-icons/lu';
import { FaWhatsapp } from 'react-icons/fa';
import { useMediaQuery, usePageVisible } from '../../hooks/useMediaPreferences';
import './HomePage.css';
import { getWhatsAppUrl } from '../../utils/whatsapp';

const SERVICES = [
  {
    id: 1,
    icon: FaHandHoldingUsd,
    title: 'Home Buying Consultancy',
    description: 'Expert guidance to identify, evaluate and acquire the right property.'
  },
  {
    id: 2,
    icon: FaMoneyBillWave,
    title: 'Home Loan & Financial Assistance',
    description: 'Support with home loan options, financing solutions and banking coordination.'
  },
  {
    id: 3,
    icon: FaGlobeAmericas,
    title: 'NRI Property Advisory',
    description: 'Property consultation and transaction guidance for overseas Indians.'
  },
  {
    id: 4,
    icon: FaExchangeAlt,
    title: 'Property Resale & Sales Assistance',
    description: 'Professional support to sell your property with smooth transaction coordination.'
  },
  {
    id: 5,
    icon: FaFileContract,
    title: 'Legal & Documentation Support',
    description: 'Assistance with property documents, verification, agreements and compliance coordination.'
  },
  {
    id: 6,
    icon: FaHome,
    title: 'Property Management Services',
    description: 'Tenant coordination, rent collection, maintenance and regular property supervision.'
  },
  {
    id: 7,
    icon: FaChartLine,
    title: 'Real Estate Investment Advisory',
    description: 'Investment guidance focused on asset appreciation and long-term value.'
  }
];


const CATEGORIES = [
  { title: 'Apartments', detail: 'A home above the everyday', icon: FaBuilding, url: '/properties?type=buy&subtype=newprojects&category=apartment' },
  { title: 'Villas', detail: 'More room to make your own', icon: FaHome, url: '/properties?type=buy&subtype=newprojects&category=villa' },
  { title: 'Plots & land', detail: 'Build your own beginning', icon: FaTree, url: '/properties?type=buy&subtype=newprojects&category=plot' },
  { title: 'Commercial', detail: 'Space for your next ambition', icon: FaBriefcase, url: '/properties?type=commercial' },
];
const formatNumber = value => Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const formatPrice = value => {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return 'Price on request';
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${formatNumber(price / 100000)} Lakh`;
  return `₹${formatNumber(price)}`;
};

function FeaturedProperty({ property, spotlight }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState([]);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const visible = usePageVisible();
  const images = (property.images || []).map(getImageUrl).filter(url => url && !failedImages.includes(url));
  const photoIndex = images.length ? imageIndex % images.length : 0;
  useEffect(() => {
    if (images.length < 2 || reducedMotion || !visible) return undefined;
    const timer = setInterval(() => setImageIndex(index => index + 1), 3000);
    return () => clearInterval(timer);
  }, [images.length, reducedMotion, visible]);
  const rental = String(property.propertyType).toUpperCase() === 'RENT';
  const price = rental ? property.rentalInfo?.monthlyRent || property.price : property.price;
  const rooms = getPropertyRoomStats(property);
  const plot = isResidentialPlot(property.propertyType, property.subcategory);
  const bhk = [...new Set(Object.keys(property.projectPricing?.unitConfigurations || {}).map(getUnitBhk).filter(Boolean))];
  const location = typeof property.location === 'string' ? property.location : getPropertyLocationLabel({ locality: property.location?.locality, city: property.location?.city, state: property.location?.state });
  const areaUnit = ({ sq_ft: 'sq ft', sq_m: 'sq m', sq_yards: 'sq yd' })[property.areaUnit] || property.areaUnit || '';
  return (
    <article className={`home-property-card ${spotlight ? 'home-property-spotlight' : ''}`}>
      <div className="home-property-image">
        <Link to={`/property/${property._id || property.id}`} className="home-property-photo-link" aria-label={`View ${property.title}`}>
          {images.length ? images.map((image, index) => <img key={image} className={`home-rotating-photo ${index === photoIndex ? 'is-active' : ''}`} src={image} alt={index === photoIndex ? property.title : ''} aria-hidden={index !== photoIndex} loading="lazy" onError={() => setFailedImages(previous => [...previous, image])} />) : <div className="home-image-placeholder"><FaBuilding aria-hidden="true" /><span>Photos coming soon</span></div>}
        </Link>
        {images.length > 1 && <span className="home-photo-number">{photoIndex + 1} / {images.length}</span>}
        <span className="home-property-badge">{rental ? 'For rent' : 'For sale'}</span>
      </div>
      <Link to={`/property/${property._id || property.id}`} className="home-property-copy">
        <p className="home-eyebrow">{spotlight ? 'IN THE SPOTLIGHT' : 'FEATURED PROPERTY'}</p>
        <h3>{property.title}</h3>
        {location && <p className="home-property-location"><FaMapMarkerAlt aria-hidden="true" />{location}</p>}
        <p className="home-property-price">{formatPrice(price)}{rental && <small> / month</small>}</p>
        <div className="home-property-facts">
          {!plot && (bhk.length > 0 || rooms.bedrooms > 0) && <span><FaBed aria-hidden="true" />{bhk.length ? `${bhk.join(', ')} BHK` : `${rooms.bedrooms} beds`}</span>}
          {!plot && rooms.bathrooms > 0 && <span><FaBath aria-hidden="true" />{rooms.bathrooms} baths</span>}
          {Number(property.area) > 0 && <span><FaRulerCombined aria-hidden="true" />{formatNumber(property.area)} {areaUnit}{plot ? ' plot' : ''}</span>}
        </div>
        {spotlight && <p className="home-spotlight-description">{property.description || 'Explore the details and speak with our team to find out more.'}</p>}
        <span className="home-property-link">Explore property <FaArrowRight aria-hidden="true" /></span>
      </Link>
    </article>
  );
}

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const visible = usePageVisible();
  const retryFeatured = useCallback(() => setRetry(value => value + 1), []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    propertyService.getFeatured().then(response => {
      if (!active) return;
      const seen = new Set();
      setFeaturedProperties((response.data.properties || []).filter(property => {
        const id = property._id || property.id;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      }).slice(0, 6));
    }).catch(() => { if (active) { setError(true); setFeaturedProperties([]); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);

  return (
    <div className="home-page" style={{ '--home-animation-state': visible ? 'running' : 'paused' }}>
      <HeroSection />
      <section className="home-section home-featured" aria-labelledby="home-featured-title">
        <div className="home-shell">
          <div className="home-section-heading">
            <div><p className="home-eyebrow">A CLOSER LOOK</p><h2 id="home-featured-title">Your next place could be here.</h2><p>Explore our featured properties and find what feels right.</p></div>
            <Link to="/properties" className="home-text-link">View all properties <FaArrowRight aria-hidden="true" /></Link>
          </div>
          {loading ? <div className="home-property-grid" role="status" aria-label="Loading featured properties">{[1, 2, 3].map(value => <div key={value} className="home-property-skeleton"><div /><span /><span /></div>)}</div>
            : error ? <div className="home-featured-message" role="alert"><h3>We couldn’t load the featured properties.</h3><p>You can try again or browse all listings.</p><button className="home-button home-button-primary" onClick={retryFeatured}>Try again</button><Link to="/properties" className="home-text-link">Browse properties <FaArrowRight aria-hidden="true" /></Link></div>
              : featuredProperties.length ? <div className={featuredProperties.length === 1 ? 'home-property-single' : 'home-property-grid'}>{featuredProperties.map(property => <FeaturedProperty key={property._id || property.id} property={property} spotlight={featuredProperties.length === 1} />)}</div>
                : <div className="home-featured-message"><h3>Find a property that fits your plans.</h3><p>Browse our listings or tell our team what you’re looking for.</p><Link to="/properties" className="home-button home-button-primary">Browse properties <FaArrowRight aria-hidden="true" /></Link></div>}
        </div>
      </section>

      <section className="home-section home-categories" aria-labelledby="home-categories-title">
        <div className="home-shell">
          <div className="home-section-heading"><div><p className="home-eyebrow">A SPACE FOR EVERY PLAN</p><h2 id="home-categories-title">What are you looking for?</h2></div><Link to="/properties?type=rent" className="home-text-link">Looking to rent? <FaArrowRight aria-hidden="true" /></Link></div>
          <div className="home-category-grid">{CATEGORIES.map(({ title, detail, icon: Icon, url }) => <Link to={url} key={title} className="home-category"><span className="home-category-icon"><Icon aria-hidden="true" /></span><h3>{title}</h3><p>{detail}</p><FaArrowRight className="home-category-arrow" aria-hidden="true" /></Link>)}</div>
        </div>
      </section>

      <section className="home-section home-services" aria-labelledby="home-services-title">
        <div className="home-shell">
          <div className="home-section-heading"><div><p className="home-eyebrow">BEYOND THE PROPERTY SEARCH</p><h2 id="home-services-title">Expertise for every step.</h2><p>Complete real estate solutions under one roof.</p></div></div>
          <div className="home-services-grid">
            {SERVICES.map(({ id, icon: Icon, title, description }) => <article key={id} className="home-service"><div className="home-service-top"><span className="home-service-icon"><Icon aria-hidden="true" /></span><span>{String(id).padStart(2, '0')}</span></div><h3>{title}</h3><p>{description}</p><a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" aria-label={`Discuss ${title} on WhatsApp`}>Let’s talk <FaWhatsapp aria-hidden="true" /></a></article>)}
            <div className="home-service-consult"><p className="home-eyebrow">YOUR TRUSTED REAL ESTATE PARTNER</p><h3>A little guidance.<br />A lot more clarity.</h3><p>From finding the right property to managing it with confidence. Tell us your plans, and we’ll help you take the next step.</p><a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="home-button home-button-primary">Discuss your requirement <FaWhatsapp aria-hidden="true" /></a></div>
          </div>
        </div>
      </section>

      <section className="home-section home-about" aria-labelledby="home-about-title">
        <div className="home-shell home-about-grid">
          <div className="home-about-image"><img src="/images/hero-1.jpg" width="1200" height="800" alt="Bright living space with expansive windows" loading="lazy" /></div>
          <div className="home-about-copy"><p className="home-eyebrow">LOCAL KNOWLEDGE. PERSONAL GUIDANCE.</p><h2 id="home-about-title">Property decisions,<br />made with confidence.</h2><p>Buying, selling or renting is a big step. Our Bhubaneswar-based team helps you understand your options, coordinate visits and navigate the details.</p>
            <ul><li><FaCheck aria-hidden="true" /> Guidance that starts with your requirements</li><li><FaCheck aria-hidden="true" /> Support with documentation and coordination</li><li><FaCheck aria-hidden="true" /> A team you can speak to, from search to next steps</li></ul>
            <div className="home-registration"><img src="/images/orera-1.png" alt="ORERA" width="56" height="56" loading="lazy" /><div><strong>Registered with ORERA</strong><span>Registration no. ORA/0308/2025</span></div></div>
            <Link to="/about" className="home-text-link">Meet Dealinee Estate <FaArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="home-developers" aria-label="Featured developers"><div className="home-shell">
        <div className="home-developer-heading"><div><p className="home-eyebrow">EXPLORE THE NAMES BEHIND THE HOMES</p><h2>Featured developers</h2></div></div>
        <div className="home-developer-window"><div className="home-developer-track">
          {[0, 1].map(copy => <div key={copy} className="home-developer-group" aria-hidden={copy === 1 ? true : undefined}>{[1, 2, 3, 4, 5, 6].map(value => <div className="home-developer-logo" key={value}><img src={`/images/dev${value}.png`} alt={copy === 1 ? '' : `Featured developer ${value}`} width="140" height="64" loading="lazy" /></div>)}</div>)}
        </div></div>
      </div></section>

      <section className="home-section home-contact-section" aria-labelledby="home-contact-title"><div className="home-shell"><div className="home-contact-panel"><div><p className="home-eyebrow">LET’S FIND YOUR NEXT ADDRESS</p><h2 id="home-contact-title">Your plans. Our local expertise.</h2><p>Tell us what you have in mind. We’ll help you find the way forward.</p></div><div className="home-contact-actions"><a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="home-button home-button-primary"><FaWhatsapp aria-hidden="true" /> Ask on WhatsApp</a><a href="tel:+917008937155"><FaPhone aria-hidden="true" /> +91 9776 631 999</a></div></div></div></section>
      <a className="home-whatsapp-floating" href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer"><FaWhatsapp aria-hidden="true" /> Ask on WhatsApp</a>
      <div className="home-mobile-contact"><a href="tel:+919776631999"><FaPhone aria-hidden="true" /> Call our team</a><a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer"><FaWhatsapp aria-hidden="true" /> WhatsApp</a></div>
    </div>
  );
}
