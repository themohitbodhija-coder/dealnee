import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { LuPhone, LuMail, LuChevronDown, LuUser } from 'react-icons/lu';
import './Navbar.css';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contactMenu = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    if (contactMenu.current) contactMenu.current.open = false;
  }, [location]);
  useEffect(() => {
    const closeContact = event => {
      if (contactMenu.current && !contactMenu.current.contains(event.target)) contactMenu.current.open = false;
    };
    document.addEventListener('pointerdown', closeContact);
    return () => document.removeEventListener('pointerdown', closeContact);
  }, []);

  const handleLogout = async () => {
    try { await logout(); }
    catch (_) { alert('Signed out here. Other sessions could not be reached; please try again when connected.'); }
    navigate('/', { replace: true });
  };


  return (
    <>
      <nav aria-label="Main navigation" className={`dealinee-header sticky top-0 z-50 ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="dealinee-header-shell">
          <div className="dealinee-header-row">
            {/* Logo */}
            <Link to="/" className="dealinee-header-logo" aria-label="Dealinee Estate home">
  <img
    src="/images/logo.png"
    alt="Dealinee estate Logo"
    className="h-14 w-auto block"
  />
</Link>

            {/* Desktop Menu */}
            <div className="dealinee-desktop-links hidden lg:flex items-center">
              <NavLink to="/" label="Home" />
              <NavLink to="/about" label="About Us" />
              
              <NavLink to="/properties" label="Properties" />
              <NavLink to="/carrier" label="Careers" />
              <NavLink to="/contact" label="Contact Us" />
            </div>

            <div className="dealinee-header-actions">
              <div className="dealinee-header-contact">
                <a className="dealinee-office-phone" href="tel:+919776621999" aria-label="Call office at +91 9776 621 999"><span className="dealinee-contact-icon"><LuPhone aria-hidden="true" /></span><span><small>Office</small>+91 9776 621 999</span></a>
              <details ref={contactMenu} className="dealinee-contact-menu" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary').focus(); } }}>
                <summary aria-label="More contact details" onClick={() => setIsOpen(false)}><LuChevronDown className="dealinee-contact-chevron" aria-hidden="true" /></summary>
                <div className="dealinee-contact-panel">
                  <p>Let’s talk property</p>
                  <a href="tel:+919776631999"><LuPhone aria-hidden="true" /><span>+91 9776 631 999<small>Property enquiries</small></span></a>
                  <a href="tel:+919776621999"><LuPhone aria-hidden="true" /><span>+91 9776 621 999<small>Our office</small></span></a>
                  <a href="mailto:dealinee0@gmail.com"><LuMail aria-hidden="true" /><span>dealinee0@gmail.com</span></a>
                  {!user && <Link to="/login" className="dealinee-contact-login"><LuUser aria-hidden="true" /><span>Account login</span></Link>}
                </div>
              </details>
              </div>
              <div className="hidden lg:flex items-center space-x-3">
              {user ? (
                <div className="dealinee-account flex items-center space-x-3">
                  {user.role === 'admin' && (
                    <button
                      onClick={() => navigate('/admin/dashboard')}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition font-semibold shadow-lg"
                    >
                      Admin Panel
                    </button>
                  )}
                  <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <FaUser className="text-white" />
                    </div>
                    <div className="dealinee-account-name hidden xl:block">
                      <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-600 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition font-semibold shadow-lg flex items-center space-x-2"
                  >
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </button>
                </div>
              ) : null}
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden text-gray-700 hover:text-red-600 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              onClick={() => { setIsOpen(!isOpen); if (contactMenu.current) contactMenu.current.open = false; }}
            >
              {isOpen ? <FaTimes size={28} /> : <FaBars size={28} />}
            </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div id="mobile-navigation" className="lg:hidden pb-4 space-y-2 border-t border-gray-200 pt-4 animate-fade-in max-h-[calc(100dvh-80px)] overflow-y-auto">
              <MobileNavLink to="/properties" label="Properties" onClick={() => setIsOpen(false)} />
              <MobileNavLink to="/" label="Home" onClick={() => setIsOpen(false)} />
              <MobileNavLink to="/about" label="About Us" onClick={() => setIsOpen(false)} />
              <MobileNavLink to="/carrier" label="Careers" onClick={() => setIsOpen(false)} />
              
              <MobileNavLink to="/contact" label="Contact Us" onClick={() => setIsOpen(false)} />

              {user ? (
                <>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        navigate('/admin/dashboard');
                        setIsOpen(false);
                      }}
                      className="w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition font-medium text-left"
                    >
                      📊 Admin Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold mt-4 flex items-center justify-center space-x-2"
                  >
                    <FaSignOutAlt /> <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2 mt-4">
                  <Link
                    to="/login"
                    className="block px-4 py-3 bg-red-600 text-white rounded-lg text-center font-semibold hover:bg-red-700 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

      </nav>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

const NavLink = ({ to, label }) => (
  <Link
    to={to}
    className="dealinee-nav-link px-3 py-2 text-gray-700 hover:text-red-600 font-medium transition relative group"
  >
    {label}
    <span className="absolute bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-red-400 group-hover:w-full transition-all duration-300" />
  </Link>
);

const MobileNavLink = ({ to, label, onClick }) => (
  <Link
    to={to}
    className="block px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition font-medium"
    onClick={onClick}
  >
    {label}
  </Link>
);

export default Navbar;
