import React, { useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usesSupabase } from '../../lib/backend';

export default function AuthCallbackPage() {
  const { user, loading, error } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    // getSession in AuthProvider awaits SDK initialization/PKCE exchange. Do not
    // exchange the same single-use code a second time in this route.
    if (!loading && user) navigate('/', { replace: true });
    else if (!loading) window.history.replaceState({}, '', '/auth/callback');
  }, [loading, user, navigate]);
  if (!usesSupabase) return <Navigate to="/login" replace />;
  if (loading) return <p role="status" className="p-8">Confirming your account…</p>;
  return <div className="p-8 text-center"><p role="alert">{error || 'This link is invalid or has expired. Please log in or request a new link.'}</p>
    <Link to="/login" className="text-red-600">Go to login</Link></div>;
}
