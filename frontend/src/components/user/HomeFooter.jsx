import React from 'react';
import { Link } from 'react-router-dom';

export default function HomeFooter() {
  return <footer className="home-footer">
    <div className="home-shell">
      <div className="home-footer-grid">
        <div className="home-footer-brand"><Link to="/" aria-label="Dealinee Estate home"><img src="/images/logo.png" alt="Dealinee Estate" width="92" height="64" loading="lazy" /></Link><p>Your local partner for homes, business spaces and real estate guidance.</p></div>
        <nav aria-label="Explore Dealinee"><h2>Explore</h2><Link to="/properties">Browse properties</Link><Link to="/about">About Dealinee</Link><Link to="/carrier">Careers</Link><Link to="/contact">Contact us</Link><Link to="/login">Login</Link></nav>
        <nav aria-label="Property categories"><h2>Find your space</h2><Link to="/properties?type=buy">Buy a property</Link><Link to="/properties?type=rent">Rent a property</Link><Link to="/properties?type=commercial">Commercial spaces</Link></nav>
        <div className="home-footer-contact"><h2>Let’s connect</h2><address><a href="tel:+919776621999">+91 9776 621 999</a><a href="mailto:dealinee0@gmail.com">dealinee0@gmail.com</a><p>Flat GD, ISCON Residency, Patia,<br />Bhubaneswar, Odisha 751024</p></address></div>
      </div>
      <div className="home-footer-bottom"><p>© {new Date().getFullYear()} Dealinee Estate. All rights reserved.</p><div><Link to="/privacy-policy">Privacy policy</Link><Link to="/terms-and-conditions">Terms & conditions</Link></div></div>
    </div>
  </footer>;
}
