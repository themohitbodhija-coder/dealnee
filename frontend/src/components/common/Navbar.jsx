import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaBars, FaTimes, FaPhone, FaEnvelope, FaChevronDown, FaHome, FaShoppingCart, FaStore, FaBuilding, FaKey, FaSearch, FaMapMarkerAlt, FaRupeeSign } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);
  const [isBuySubmenuOpen, setIsBuySubmenuOpen] = useState(false);
  const [isNewProjectsSubmenuOpen, setIsNewProjectsSubmenuOpen] = useState(false);
  const [isCommercialSubmenuOpen, setIsCommercialSubmenuOpen] = useState(false);
  const [isMobileBuySubmenuOpen, setIsMobileBuySubmenuOpen] = useState(false);
  const [isMobileNewProjectsSubmenuOpen, setIsMobileNewProjectsSubmenuOpen] = useState(false);
  const [isMobileCommercialSubmenuOpen, setIsMobileCommercialSubmenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location]);

  const handleLogout = async () => {
    try { await logout(); }
    catch (_) { alert('Signed out here. Other sessions could not be reached; please try again when connected.'); }
    navigate('/', { replace: true });
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('q', searchQuery);
    if (searchLocation.trim()) params.append('location', searchLocation);
    if (priceRange) {
      const [minimum, maximum] = priceRange.replace('+', '').split('-');
      params.set('minPrice', minimum);
      if (maximum) params.set('maxPrice', maximum);
    }
    
    if (searchQuery.trim() || searchLocation.trim() || priceRange) {
      window.location.href = `/properties?${params.toString()}`;
      setIsSearchOpen(false);
      setSearchQuery('');
      setSearchLocation('');
      setPriceRange('');
    }
  };

  return (
    <>
      {/* Top Bar */}
      <div className="hidden md:block bg-gradient-to-r from-black to-black text-white text-sm py-3 px-4">
        <div className="max-w-7xl mx-auto flex justify-end space-x-6">
          <a href="tel:+919776631999" className="flex items-center space-x-2 hover:text-blue-400 transition">
            <FaPhone className="text-blue-400" />
            <span>+91 9776 631 999</span>
          </a>
          <a href="tel:+919776621999" className="flex items-center space-x-2 hover:text-blue-400 transition">
            <FaPhone className="text-blue-400" />
            <span>+91 9776 621 999</span>
          </a>
          <a href="mailto:dealinee0@gmail.com" className="flex items-center space-x-2 hover:text-blue-400 transition">
            <FaEnvelope className="text-blue-400" />
            <span>dealinee0@gmail.com</span>
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-lg'
          : 'bg-white shadow-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center">
  <img
    src="/images/logo.png"
    alt="Dealinee estate Logo"
    className="h-16 w-auto block"
  />
</Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-1">
              <NavLink to="/" label="Home" />
              <NavLink to="/about" label="About Us" />
              
              {/* Properties Dropdown */}
              <div className="relative group">
                <button className="px-4 py-2 text-gray-700 hover:text-red-600 font-medium transition relative flex items-center space-x-1 group/btn">
                  Properties
                  <FaChevronDown className="text-sm group-hover/btn:rotate-180 transition duration-300" />
                  <span className="absolute bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-red-400 group-hover/btn:w-full transition-all duration-300" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute left-0 mt-0 w-56 bg-white rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border border-gray-100">
                  {/* Buy Property with submenu */}
                  <div className="relative group/buy">
                    <button className="w-full flex items-center justify-between space-x-3 px-6 py-4 hover:bg-red-50 transition border-b border-gray-100 first:rounded-t-xl">
                      <div className="flex items-center space-x-3">
                        <FaShoppingCart className="text-blue-600 text-lg" />
                        <div>
                          <p className="font-semibold text-gray-800 text-left">Buy Property</p>
                          <p className="text-xs text-gray-500 text-left">Find properties to purchase</p>
                        </div>
                      </div>
                      <FaChevronDown className="text-xs text-gray-600 group-hover/buy:rotate-180 transition duration-300" />
                    </button>

                    {/* Buy Property Submenu */}
                    <div className="absolute left-full top-0 mt-0 ml-0 w-48 bg-white rounded-lg shadow-2xl opacity-0 invisible group-hover/buy:opacity-100 group-hover/buy:visible transition-all duration-300 z-50 border border-gray-100">
                      {/* New Projects with nested submenu */}
                      <div className="relative group/newprojects">
                        <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition border-b border-gray-100 first:rounded-t-lg text-sm">
                          <div className="flex items-center space-x-2">
                            <span>✨</span>
                            <span className="font-medium text-gray-800">New Projects</span>
                          </div>
                          <FaChevronDown className="text-xs group-hover/newprojects:rotate-180 transition duration-300" />
                        </button>
                        
                        {/* New Projects nested submenu */}
                        <div className="absolute left-full top-0 mt-0 ml-0 w-40 bg-white rounded-lg shadow-2xl opacity-0 invisible group-hover/newprojects:opacity-100 group-hover/newprojects:visible transition-all duration-300 z-50 border border-gray-100">
                          <Link
                            to="/properties?type=buy&subtype=newprojects&category=apartment"
                            className="flex items-center space-x-2 px-4 py-2.5 hover:bg-blue-50 transition border-b border-gray-100 first:rounded-t-lg text-xs"
                          >
                            <span>🏢</span>
                            <span className="font-medium text-gray-800">Apartment</span>
                          </Link>
                          <Link
                            to="/properties?type=buy&subtype=newprojects&category=villa"
                            className="flex items-center space-x-2 px-4 py-2.5 hover:bg-blue-50 transition border-b border-gray-100 text-xs"
                          >
                            <span>🏡</span>
                            <span className="font-medium text-gray-800">Villa</span>
                          </Link>
                          <Link
                            to="/properties?type=buy&subtype=newprojects&category=plot"
                            className="flex items-center space-x-2 px-4 py-2.5 hover:bg-blue-50 transition rounded-b-lg text-xs"
                          >
                            <span>🌳</span>
                            <span className="font-medium text-gray-800">Plot</span>
                          </Link>
                        </div>
                      </div>
                      
                      <Link
                        to="/properties?type=buy&subtype=resale"
                        className="flex items-center space-x-2 px-4 py-3 hover:bg-blue-50 transition rounded-b-lg text-sm"
                      >
                        <span>🏠</span>
                        <span className="font-medium text-gray-800">Resale</span>
                      </Link>
                    </div>
                  </div>
                  
                  <Link
                    to="/properties?type=rent"
                    className="flex items-center space-x-3 px-6 py-4 hover:bg-red-50 transition border-b border-gray-100"
                  >
                    <FaKey className="text-green-600 text-lg" />
                    <div>
                      <p className="font-semibold text-gray-800">Rent Property</p>
                      <p className="text-xs text-gray-500">Explore rental properties</p>
                    </div>
                  </Link>
                  
                  {/* Commercial with submenu */}
                  <div className="relative group/commercial">
                    <button className="w-full flex items-center justify-between space-x-3 px-6 py-4 hover:bg-red-50 transition rounded-b-xl">
                      <div className="flex items-center space-x-3">
                        <FaBuilding className="text-orange-600 text-lg" />
                        <div>
                          <p className="font-semibold text-gray-800 text-left">Commercial</p>
                          <p className="text-xs text-gray-500 text-left">Business spaces & offices</p>
                        </div>
                      </div>
                      <FaChevronDown className="text-xs text-gray-600 group-hover/commercial:rotate-180 transition duration-300" />
                    </button>

                    {/* Commercial Submenu */}
                    <div className="absolute left-full top-0 mt-0 ml-0 w-40 bg-white rounded-lg shadow-2xl opacity-0 invisible group-hover/commercial:opacity-100 group-hover/commercial:visible transition-all duration-300 z-50 border border-gray-100">
                      <Link
                        to="/properties?type=commercial&subtype=buy"
                        className="flex items-center space-x-2 px-4 py-3 hover:bg-orange-50 transition border-b border-gray-100 first:rounded-t-lg text-sm"
                      >
                        <span>🛒</span>
                        <span className="font-medium text-gray-800">Buy</span>
                      </Link>
                      <Link
                        to="/properties?type=commercial&subtype=lease"
                        className="flex items-center space-x-2 px-4 py-3 hover:bg-orange-50 transition rounded-b-lg text-sm"
                      >
                        <span>📋</span>
                        <span className="font-medium text-gray-800">Lease</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <NavLink to="/carrier" label="Careers" />
              <NavLink to="/contact" label="Contact Us" />
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-4">
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
                    <div className="hidden sm:block">
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
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 bg-gradient-to-r from-black to-red-700 text-white rounded-lg hover:from-black hover:to-red-800 transition font-semibold shadow-lg flex items-center space-x-2"
                  >
                    <FaUser />
                    <span>Login</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden text-gray-700 hover:text-red-600 transition"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <FaTimes size={28} /> : <FaBars size={28} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="lg:hidden pb-4 space-y-2 border-t border-gray-200 pt-4 animate-fade-in">
              <MobileNavLink to="/" label="Home" onClick={() => setIsOpen(false)} />
              <MobileNavLink to="/about" label="About Us" onClick={() => setIsOpen(false)} />
              <MobileNavLink to="/carrier" label="Carrier" onClick={() => setIsOpen(false)} />
              
              {/* Mobile Properties Dropdown */}
              <div className="px-4 py-2">
                <button
                  onClick={() => setIsPropertyDropdownOpen(!isPropertyDropdownOpen)}
                  className="w-full flex items-center justify-between text-gray-700 hover:text-red-600 font-medium py-2"
                >
                  <span>Properties</span>
                  <FaChevronDown className={`transition transform ${isPropertyDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isPropertyDropdownOpen && (
                  <div className="space-y-1 mt-2 pl-4 border-l-2 border-red-600">
                    {/* Buy Property with submenu */}
                    <div>
                      <button
                        onClick={() => setIsMobileBuySubmenuOpen(!isMobileBuySubmenuOpen)}
                        className="w-full flex items-center justify-between text-gray-700 hover:text-red-600 font-medium py-2 text-sm"
                      >
                        <span>🛒 Buy Property</span>
                        <FaChevronDown className={`transition transform text-xs ${isMobileBuySubmenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isMobileBuySubmenuOpen && (
                        <div className="space-y-1 mt-1 pl-4 border-l border-blue-400">
                          {/* New Projects with nested submenu */}
                          <div>
                            <button
                              onClick={() => setIsMobileNewProjectsSubmenuOpen(!isMobileNewProjectsSubmenuOpen)}
                              className="w-full flex items-center justify-between text-gray-700 hover:text-red-600 font-medium py-2 text-sm"
                            >
                              <span>✨ New Projects</span>
                              <FaChevronDown className={`transition transform text-xs ${isMobileNewProjectsSubmenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isMobileNewProjectsSubmenuOpen && (
                              <div className="space-y-1 mt-1 pl-4 border-l border-yellow-400">
                                <MobileNavLink to="/properties?type=buy&subtype=newprojects&category=apartment" label="🏢 Apartment" onClick={() => {
                                  setIsOpen(false);
                                  setIsPropertyDropdownOpen(false);
                                  setIsMobileBuySubmenuOpen(false);
                                  setIsMobileNewProjectsSubmenuOpen(false);
                                }} />
                                <MobileNavLink to="/properties?type=buy&subtype=newprojects&category=villa" label="🏡 Villa" onClick={() => {
                                  setIsOpen(false);
                                  setIsPropertyDropdownOpen(false);
                                  setIsMobileBuySubmenuOpen(false);
                                  setIsMobileNewProjectsSubmenuOpen(false);
                                }} />
                                <MobileNavLink to="/properties?type=buy&subtype=newprojects&category=plot" label="🌳 Plot" onClick={() => {
                                  setIsOpen(false);
                                  setIsPropertyDropdownOpen(false);
                                  setIsMobileBuySubmenuOpen(false);
                                  setIsMobileNewProjectsSubmenuOpen(false);
                                }} />
                              </div>
                            )}
                          </div>
                          
                          <MobileNavLink to="/properties?type=buy&subtype=resale" label="🏠 Resale" onClick={() => {
                            setIsOpen(false);
                            setIsPropertyDropdownOpen(false);
                            setIsMobileBuySubmenuOpen(false);
                          }} />
                        </div>
                      )}
                    </div>
                    
                    <MobileNavLink to="/properties?type=rent" label="🔑 Rent Property" onClick={() => {
                      setIsOpen(false);
                      setIsPropertyDropdownOpen(false);
                    }} />
                    
                    {/* Mobile Commercial with submenu */}
                    <div>
                      <button
                        onClick={() => setIsMobileCommercialSubmenuOpen(!isMobileCommercialSubmenuOpen)}
                        className="w-full flex items-center justify-between text-gray-700 hover:text-red-600 font-medium py-2 text-sm"
                      >
                        <span>🏢 Commercial</span>
                        <FaChevronDown className={`transition transform text-xs ${isMobileCommercialSubmenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isMobileCommercialSubmenuOpen && (
                        <div className="space-y-1 mt-1 pl-4 border-l border-orange-400">
                          <MobileNavLink to="/properties?type=commercial&subtype=buy" label="🛒 Buy" onClick={() => {
                            setIsOpen(false);
                            setIsPropertyDropdownOpen(false);
                            setIsMobileCommercialSubmenuOpen(false);
                          }} />
                          <MobileNavLink to="/properties?type=commercial&subtype=lease" label="📋 Lease" onClick={() => {
                            setIsOpen(false);
                            setIsPropertyDropdownOpen(false);
                            setIsMobileCommercialSubmenuOpen(false);
                          }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <MobileNavLink to="/contact" label="Contact Us" onClick={() => setIsOpen(false)} />

              {/* Mobile Search */}
              <div className="px-4 py-2">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="w-full flex items-center space-x-2 text-gray-700 hover:text-red-600 font-medium py-2"
                >
                  <FaSearch />
                  <span>Search Properties</span>
                </button>
                {isSearchOpen && (
                  <div className="mt-3 space-y-2">
                    {/* Property Name */}
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Property name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      />
                    </div>

                    {/* Location */}
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Location..."
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      />
                    </div>

                    {/* Price Range */}
                    <div className="relative">
                      <FaRupeeSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <select
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm appearance-none cursor-pointer"
                      >
                        <option value="">All Prices</option>
                        <option value="0-500000">₹0 - ₹5L</option>
                        <option value="500000-1000000">₹5L - ₹10L</option>
                        <option value="1000000-2000000">₹10L - ₹20L</option>
                        <option value="2000000+">₹20L+</option>
                      </select>
                    </div>

                    {/* Search Button */}
                    <button
                      onClick={handleSearch}
                      className="w-full px-3 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition font-semibold flex items-center justify-center space-x-2 text-sm"
                    >
                      <FaSearch className="text-sm" />
                      <span>Search</span>
                    </button>
                  </div>
                )}
              </div>

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

        {/* Search Bar - Expanded with All Filters */}
        {isSearchOpen && (
          <div className="max-w-2xl mx-auto px-4 bg-white border-t border-gray-200 rounded-b-lg shadow-lg p-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {/* Property Name */}
              <div className="relative group">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Property name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  autoFocus
                />
              </div>

              {/* Location */}
              <div className="relative group">
                <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>

              {/* Price Range */}
              <div className="relative group">
                <FaRupeeSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm appearance-none cursor-pointer"
                >
                  <option value="">All Prices</option>
                  <option value="0-500000">₹0 - ₹5L</option>
                  <option value="500000-1000000">₹5L - ₹10L</option>
                  <option value="1000000-2000000">₹10L - ₹20L</option>
                  <option value="2000000+">₹20L+</option>
                </select>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition font-semibold flex items-center justify-center space-x-2 shadow-md hover:shadow-lg text-sm"
              >
                <FaSearch className="text-sm" />
                <span>Search</span>
              </button>
            </div>
          </div>
        )}
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
    className="px-4 py-2 text-gray-700 hover:text-red-600 font-medium transition relative group"
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
