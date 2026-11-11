import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt, FaArrowRight, FaHeart } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-300">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-rfrom-gray-900 via-gray-800 to-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-white mb-2">Stay Updated</h3>
          <p className="text-red-100 mb-6">Get the latest properties and offers directly to your inbox</p>
          <div className="flex flex-col md:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg focus:outline-none text-gray-800"
            />
            <button className="px-6 py-3 bg-white text-red-600 rounded-lg font-bold hover:bg-gray-100 transition flex items-center justify-center space-x-2">
              <span>Subscribe</span>
              <FaArrowRight />
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">DE</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Dealinee estate</h3>
                <p className="text-xs text-gray-500">Premium Properties</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              India's leading online real estate platform connecting buyers, sellers, and renters with premium properties.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FaPhone className="text-red-400" />
                <span className="text-sm">+91 9776 621 999</span>
              </div>
              <div className="flex items-center space-x-3">
                <FaEnvelope className="text-red-400" />
                <span className="text-sm">dealinee0@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <FaMapMarkerAlt className="text-red-400" />
                <span className="text-sm">Flat GD, ISCON Residency, Patia, Bhubaneswar, 751024</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 flex items-center space-x-2">
              <span className="w-1 h-6 bg-gradient-to-b from-red-600 to-red-400 rounded" />
              <span>Quick Links</span>
            </h4>
            <ul className="space-y-3">
              <FooterLink to="/" label="Home" />
              <FooterLink to="/properties" label="Browse Properties" />
              <FooterLink to="/about" label="About Us" />
              <FooterLink to="/contact" label="Contact" />
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 flex items-center space-x-2">
              <span className="w-1 h-6 bg-gradient-to-b from-red-600 to-red-400 rounded" />
              <span>Categories</span>
            </h4>
            <ul className="space-y-3">
              <li><Link to="/properties?type=buy" className="text-gray-400 hover:text-red-400 transition text-sm">Buy Property</Link></li>
              <li><Link to="/properties?type=rent" className="text-gray-400 hover:text-red-400 transition text-sm">Rent Property</Link></li>
              <li><Link to="/properties?type=commercial" className="text-gray-400 hover:text-red-400 transition text-sm">Commercial</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 flex items-center space-x-2">
              <span className="w-1 h-6 bg-gradient-to-b from-red-600 to-red-400 rounded" />
              <span>Resources</span>
            </h4>
            <ul className="space-y-3">
              <li><span className="text-gray-400 hover:text-red-400 transition text-sm">Blog</span></li>
              <li><span className="text-gray-400 hover:text-red-400 transition text-sm">Guides</span></li>
              <li><span className="text-gray-400 hover:text-red-400 transition text-sm">FAQ</span></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-red-400 transition text-sm">Support</Link></li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 flex items-center space-x-2">
              <span className="w-1 h-6 bg-gradient-to-b from-red-600 to-red-400 rounded" />
              <span>Follow Us</span>
            </h4>
            <div className="flex space-x-4">
              <SocialLink icon={<FaFacebook />} href="#" />
              <SocialLink icon={<FaTwitter />} href="#" />
              <SocialLink icon={<FaInstagram />} href="#" />
              <SocialLink icon={<FaLinkedin />} href="#" />
            </div>
            <div className="mt-6 p-4 bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600">
              <p className="text-sm text-gray-300">
                <strong>Award Winning</strong><br />
                Best Real Estate Platform 2024
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-700 mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div className="mb-4 md:mb-0">
            <p className="flex items-center space-x-1">
              <span>&copy; {currentYear} Dealinee estate. All rights reserved.</span>
              <FaHeart className="text-red-500" size={12} />
              <span>Made with care in India</span>
            </p>
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy-policy" className="hover:text-red-400 transition">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="hover:text-red-400 transition">Terms & Conditions</Link>
            <span className="hover:text-red-400 transition">Cookie Policy</span>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 p-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition z-40"
      >
        ↑
      </button>
    </footer>
  );
};

const FooterLink = ({ to, label }) => (
  <li>
    <Link to={to} className="text-gray-400 hover:text-red-400 transition text-sm flex items-center space-x-2 group">
      <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-red-400 transition" />
      <span>{label}</span>
    </Link>
  </li>
);

const SocialLink = ({ icon, href }) => (
  <a
    href={href}
    className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gradient-to-r hover:from-red-600 hover:to-red-700 text-gray-400 hover:text-white flex items-center justify-center transition transform hover:scale-110"
  >
    {icon}
  </a>
);

export default Footer;
