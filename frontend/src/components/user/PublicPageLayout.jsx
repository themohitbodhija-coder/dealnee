import React from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuChevronRight } from 'react-icons/lu';
import './PublicPages.css';

export function PageHero({ page, eyebrow, title, description, children, media }) {
  return <section className="site-hero">
    <div className="site-shell">
      <nav className="site-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><LuChevronRight aria-hidden="true" /><span aria-current="page">{page}</span></nav>
      <div className={`site-hero-grid ${media ? '' : 'site-hero-text-only'}`}>
        <div><p className="site-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="site-hero-description">{description}</p>{children && <div className="site-actions">{children}</div>}</div>
        {media}
      </div>
    </div>
  </section>;
}

export function PageCTA({ eyebrow = 'LET’S TAKE THE NEXT STEP', title, description, to = '/contact', label = 'Talk to our team' }) {
  return <section className="site-section site-cta"><div className="site-shell site-cta-inner"><div><p className="site-eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div><Link className="site-button site-button-primary" to={to}>{label}<LuArrowRight aria-hidden="true" /></Link></div></section>;
}

export function IconCard({ icon: Icon, title, children }) {
  return <article className="site-icon-card"><span className="site-icon"><Icon aria-hidden="true" /></span><h3>{title}</h3><p>{children}</p></article>;
}

export default function PublicPageLayout({ children, className = '' }) {
  return <div className={`site-page ${className}`}>{children}</div>;
}
