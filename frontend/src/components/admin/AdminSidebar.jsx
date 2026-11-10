import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaBuilding, FaTags, FaUsers, FaEnvelope, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, can } = useAuth();
  const handleLogout = async () => {
    try { await logout(); }
    catch (_) { alert('Signed out here. Other sessions could not be reached; please try again when connected.'); }
    navigate('/', { replace: true });
  };
  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <span>Admin</span>
        </h1>
      </div>

      {/* User Info */}
      <div className="p-4 bg-gray-800 text-sm">
        <p className="text-gray-300">Logged in as</p>
        <p className="font-semibold text-white">{user.name}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {can() && (
          <Link
            to="/admin/dashboard"
            className={`flex items-center space-x-3 px-4 py-3 rounded transition ${
              isActive('dashboard') ? 'bg-red-600' : 'hover:bg-gray-800'
            }`}
          >
            <FaHome /> <span>Dashboard</span>
          </Link>
        )}

        {can('manage_properties') && (
          <Link
            to="/admin/properties"
            className={`flex items-center space-x-3 px-4 py-3 rounded transition ${
              isActive('properties') ? 'bg-red-600' : 'hover:bg-gray-800'
            }`}
          >
            <FaBuilding /> <span>Properties</span>
          </Link>
        )}

        {can('manage_categories') && (
          <Link
            to="/admin/categories"
            className={`flex items-center space-x-3 px-4 py-3 rounded transition ${
              isActive('categories') ? 'bg-red-600' : 'hover:bg-gray-800'
            }`}
          >
            <FaTags /> <span>Categories</span>
          </Link>
        )}

        {can('manage_users') && (
          <Link
            to="/admin/users"
            className={`flex items-center space-x-3 px-4 py-3 rounded transition ${
              isActive('users') ? 'bg-red-600' : 'hover:bg-gray-800'
            }`}
          >
            <FaUsers /> <span>Users</span>
          </Link>
        )}

        {can('view_inquiries') && (
          <Link
            to="/admin/inquiries"
            className={`flex items-center space-x-3 px-4 py-3 rounded transition ${
              isActive('inquiries') ? 'bg-red-600' : 'hover:bg-gray-800'
            }`}
          >
            <FaEnvelope /> <span>Inquiries</span>
          </Link>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded text-red-400 hover:bg-gray-800 transition"
        >
          <FaSignOutAlt /> <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
