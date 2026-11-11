import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PermissionRoute from './components/common/PermissionRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import AdminSidebar from './components/admin/AdminSidebar';
import HomePage from './pages/user/HomePage';
import PropertyListingPage from './pages/user/PropertyListingPage';
import PropertyDetailsPage from './pages/user/PropertyDetailsPage';
import AboutPage from './pages/user/AboutPage';
import ContactPage from './pages/user/ContactPage';
import PrivacyPolicyPage from './pages/user/PrivacyPolicyPage';
import TermsAndConditionsPage from './pages/user/TermsAndConditionsPage';
import LoginPage from './pages/user/LoginPage';
import RegisterPage from './pages/user/RegisterPage';
import CarrierPage from './pages/user/CarrierPage';
import ForgotPasswordPage from './pages/user/ForgotPasswordPage';
import ResetPasswordPage from './pages/user/ResetPasswordPage';
import AuthCallbackPage from './pages/user/AuthCallbackPage';
import AcceptInvitePage from './pages/user/AcceptInvitePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ManagePropertiesPage from './pages/admin/ManagePropertiesPage';
import ManageCategoriesPage from './pages/admin/ManageCategoriesPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageInquiriesPage from './pages/admin/ManageInquiriesPage';

function PublicLayout() {
  return <><Navbar /><main className="flex-1"><Outlet /></main><Footer /></>;
}
function AdminLayout() {
  return <PermissionRoute><div className="flex flex-1"><AdminSidebar />
    <div className="flex-1 ml-64"><Outlet /></div></div></PermissionRoute>;
}
export default function App() {
  return <AuthProvider><Router><div className="flex min-h-screen flex-col"><Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/properties" element={<PropertyListingPage />} />
      <Route path="/property/:id" element={<PropertyDetailsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/carrier" element={<CarrierPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
    </Route>
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboardPage />} />
      <Route path="properties" element={<PermissionRoute permission="manage_properties"><ManagePropertiesPage /></PermissionRoute>} />
      <Route path="categories" element={<PermissionRoute permission="manage_categories"><ManageCategoriesPage /></PermissionRoute>} />
      <Route path="users" element={<PermissionRoute permission="manage_users"><ManageUsersPage /></PermissionRoute>} />
      <Route path="inquiries" element={<PermissionRoute permission="view_inquiries"><ManageInquiriesPage /></PermissionRoute>} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></div></Router></AuthProvider>;
}
