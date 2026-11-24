import React from 'react';
import { LuShieldCheck } from 'react-icons/lu';

export default function HeroSection() {
  const bgUrl = `${process.env.PUBLIC_URL || ''}/bgg.png`;

  return (
    <section
      className="home-hero"
      style={{ '--hero-bg-url': `url("${bgUrl}")` }}
      aria-labelledby="home-title"
    >
      <div className="home-shell">
        <div className="home-hero-copy">
          <h1 id="home-title">
            Find a place.<br />
            Make it <em>yours.</em>
          </h1>
          <p className="home-hero-description">
            Discover homes, plots and business spaces in Bhubaneswar. Get local guidance at every step.
          </p>
          <div className="home-hero-trust">
            <div className="home-hero-trust-item">
              <span className="home-hero-trust-icon">
                <LuShieldCheck aria-hidden="true" />
              </span>
              <span className="home-hero-trust-text">Certified Real Estate Advisor</span>
            </div>
            <div className="home-hero-trust-divider" aria-hidden="true" />
            <div className="home-hero-trust-item">
              <img src="/images/orera-1.png" alt="ORERA" className="home-hero-rera-img" />
              <div className="home-hero-rera-info">
                <span className="home-hero-rera-label">Registered with ORERA</span>
                <span className="home-hero-rera-no">Reg No: ORA/0308/2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
