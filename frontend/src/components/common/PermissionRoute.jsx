import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PermissionRoute({ permission, children }) {
  const { user, loading, can } = useAuth();
  if (loading) return <p role="status" className="p-8">Checking your session…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return can(permission) ? children : <Navigate to="/" replace />;
}
