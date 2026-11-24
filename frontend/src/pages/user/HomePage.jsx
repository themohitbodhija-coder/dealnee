import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { propertyService } from '../../services/api';
import HeroSection from '../../components/user/HeroSection';
import CountUpNumber from '../../components/user/CountUpNumber';
import { getImageUrl } from '../../utils/imageUrl';
import {
  LuArrowRight as FaArrowRight, LuMapPin as FaMapMarkerAlt,
  LuLandmark as FaHandHoldingUsd, LuWallet as FaMoneyBillWave,
  LuGlobe2 as FaGlobeAmericas, LuArrowLeftRight as FaExchangeAlt,
  LuFileCheck2 as FaFileContract, LuTrendingUp as FaChartLine,
  LuHome as FaHome, LuBuilding2 as FaBuilding, LuTrees as FaTree,
  LuBriefcase as FaBriefcase, LuPhone as FaPhone, LuCheck as FaCheck,
} from 'react-icons/lu';
import { FaWhatsapp } from 'react-icons/fa';
import { usePageVisible } from '../../hooks/useMediaPreferences';
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

const SHOWCASE_PROJECTS = [
  {
    id: 'project-dn-pallaciya',
    title: 'DN Pallaciya',
    area: 'Sundarpur',
    price: 'From ₹1.60 Cr*',
    image: '/images/projects/dn-pallaciya.jpg',
    url: '/properties?search=DN+Pallaciya'
  },
  {
    id: 'project-one-world',
    title: 'One World',
    area: 'Patia',
    price: 'From ₹1.85 Cr*',
    image: '/images/projects/one-world.jpg',
    url: '/properties?search=One+World'
  },
  {
    id: 'project-urban-majestic',
    title: 'Urban Majestic',
    area: 'Raghunathpur',
    price: 'From ₹2.25 Cr*',
    image: '/images/projects/urban-majestic.jpg',
    url: '/properties?search=Urban+Majestic'
  },
  {
    id: 'project-adpl-galaxy-3',
    title: 'ADPL Galaxy 3',
    area: 'Kalinga Nagar',
    price: 'From ₹82 Lakh*',
    image: '/images/projects/adpl-galaxy-3.jpg',
    url: '/properties?search=ADPL+Galaxy+3'
  }
];

const formatNumber = value => Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const formatPrice = value => {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return 'Price on request';
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${formatNumber(price / 100000)} Lakh`;
  return `₹${formatNumber(price)}`;
};

function FeaturedProjectCard({ project }) {
  const [imageFailed, setImageFailed] = useState(false);
  const targetUrl = project.url || `/property/${project.id || project._id}`;
  const displayImage = imageFailed ? '/images/hero-1.jpg' : (project.image || '/images/hero-1.jpg');

  return (
    <article className="home-project-card">
      <Link to={targetUrl} className="home-project-link" aria-label={`View ${project.title}`}>
        <div className="home-project-image-box">
          <img
            src={displayImage}
            alt={project.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
          <div className="home-project-overlay">
            <h3 className="home-project-name">{project.title}</h3>
          </div>
        </div>
        <div className="home-project-footer">
          <span className="home-project-area">
            <FaMapMarkerAlt aria-hidden="true" />
            <span>{project.area}</span>
          </span>
          <span className="home-project-price">{project.price}</span>
        </div>
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
      }).slice(0, 8));
    }).catch(() => {
      if (active) {
        setError(true);
        setFeaturedProperties([]);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [retry]);

  const projectsToDisplay = featuredProperties.length > 0
    ? featuredProperties.map(property => {
        const rental = String(property.propertyType).toUpperCase() === 'RENT';
        const rawPrice = rental ? property.rentalInfo?.monthlyRent || property.price : property.price;
        const formatted = formatPrice(rawPrice);
        const images = (property.images || []).map(getImageUrl).filter(Boolean);
        const area = typeof property.location === 'string'
          ? property.location
          : property.location?.locality || property.location?.city || 'Bhubaneswar';
        return {
          id: property._id || property.id,
          title: property.title,
          area: area,
          price: `From ${formatted}*`,
          image: images[0] || '/images/hero-1.jpg',
          url: `/property/${property._id || property.id}`
        };
      })
    : SHOWCASE_PROJECTS;

  return (
    <div className="home-page" style={{ '--home-animation-state': visible ? 'running' : 'paused' }}>
      <HeroSection />

      <section className="home-section home-featured" aria-labelledby="home-featured-title">
        <div className="home-shell">
          <div className="home-featured-layout">
            <div className="home-featured-intro">
              <span className="home-featured-accent-bar" aria-hidden="true" />
              <h2 id="home-featured-title">Our Featured<br />Projects</h2>
              <p>Handpicked residential projects from our trusted developer partners.</p>
              <Link to="/properties" className="home-explore-projects-btn">
                Explore All Projects <FaArrowRight aria-hidden="true" />
              </Link>
            </div>

            <div className="home-projects-container">
              {loading && !featuredProperties.length ? (
                <div className="home-projects-grid" role="status" aria-label="Loading featured projects">
                  {[1, 2, 3, 4].map(value => (
                    <div key={value} className="home-project-card home-project-skeleton">
                      <div className="home-project-image-box" />
                      <div className="home-project-footer" />
                    </div>
                  ))}
                </div>
              ) : error && !featuredProperties.length ? (
                <div className="home-featured-message" role="alert">
                  <h3>We couldn’t load the latest properties.</h3>
                  <p>Displaying featured showcase projects. You can retry or browse all listings.</p>
                  <button className="home-button home-button-primary" onClick={retryFeatured}>Try again</button>
                  <Link to="/properties" className="home-text-link">Browse properties <FaArrowRight aria-hidden="true" /></Link>
                </div>
              ) : (
                <div className="home-projects-grid">
                  {projectsToDisplay.map(project => (
                    <FeaturedProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-categories" aria-labelledby="home-categories-title">
        <div className="home-shell">
          <div className="home-section-heading"><div><p className="home-eyebrow">A SPACE FOR EVERY PLAN</p><h2 id="home-categories-title">What are you looking for?</h2></div><Link to="/properties?type=rent" className="home-text-link">Looking to rent? <FaArrowRight aria-hidden="true" /></Link></div>
          <div className="home-category-grid">{CATEGORIES.map(({ title, detail, icon: Icon, url }) => <Link to={url} key={title} className="home-category"><span className="home-category-icon"><Icon aria-hidden="true" /></span><h3>{title}</h3><p>{detail}</p><FaArrowRight className="home-category-arrow" aria-hidden="true" /></Link>)}</div>
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

      <section className="home-stats-section" aria-label="Dealinee at a glance">
        <div className="home-shell">
          <div className="home-stats-grid">
            {[
              [6, 'Years of experience', 'Hands-on knowledge of real estate'],
              [20, 'Team members', 'People dedicated to your next step'],
              [1000, 'Happy customers', 'Relationships built through service']
            ].map(([number, title, text]) => (
              <div key={title} className="home-stat-card">
                <CountUpNumber value={number} />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
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

      <section className="home-developers" aria-label="Featured developers"><div className="home-shell">
        <div className="home-developer-heading"><div><p className="home-eyebrow">EXPLORE THE NAMES BEHIND THE HOMES</p><h2>Featured developers</h2></div></div>
        <div className="home-developer-window"><div className="home-developer-track">
          {[0, 1].map(copy => <div key={copy} className="home-developer-group" aria-hidden={copy === 1 ? true : undefined}>{[1, 2, 3, 4, 5, 6].map(value => <div className="home-developer-logo" key={value}><img src={`/images/dev${value}.png`} alt={copy === 1 ? '' : `Featured developer ${value}`} width="140" height="64" loading="lazy" /></div>)}</div>)}
        </div></div>
      </div></section>

      <section className="home-section home-founder" aria-labelledby="home-founder-title">
        <div className="home-shell home-founder-grid">
          <div className="home-founder-image-wrap">
            <img
              src="/images/founder.jpg"
              alt="Chandan Kumar Sahoo - Founder"
              width="600"
              height="500"
              loading="lazy"
            />
            <span className="home-founder-badge">Founder & Strategic Lead</span>
          </div>
          <div className="home-founder-copy">
            <p className="home-eyebrow">LEADERSHIP & VISION</p>
            <h2 id="home-founder-title">Chandan Kumar Sahoo</h2>
            <p className="home-founder-role">Founder, Dealinee Estate</p>
            <blockquote className="home-founder-quote">
              “Experience that shapes every next step.”
            </blockquote>
            <p className="home-founder-bio">
              With over six years of hands-on experience in the property industry, Chandan founded Dealinee Estate to bring trust, transparency, and personal customer-first guidance to every real estate decision in Bhubaneswar.
            </p>
            <div className="home-founder-actions">
              <Link to="/about" className="home-text-link">
                Learn more about our team <FaArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-contact-section" aria-labelledby="home-contact-title"><div className="home-shell"><div className="home-contact-panel"><div><p className="home-eyebrow">LET’S FIND YOUR NEXT ADDRESS</p><h2 id="home-contact-title">Your plans. Our local expertise.</h2><p>Tell us what you have in mind. We’ll help you find the way forward.</p></div><div className="home-contact-actions"><a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="home-button home-button-primary"><FaWhatsapp aria-hidden="true" /> Ask on WhatsApp</a><a href="tel:+917008937155"><FaPhone aria-hidden="true" /> +91 9776 631 999</a></div></div></div></section>
      <a className="home-whatsapp-floating" href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer"><FaWhatsapp aria-hidden="true" /> Ask on WhatsApp</a>
      <div className="home-mobile-contact"><a href="tel:+919776631999"><FaPhone aria-hidden="true" /> Call our team</a><a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer"><FaWhatsapp aria-hidden="true" /> WhatsApp</a></div>
    </div>
  );
}
