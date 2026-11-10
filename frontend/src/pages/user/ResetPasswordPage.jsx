import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { usesSupabase } from '../../lib/backend';
import { useAuth } from '../../contexts/AuthContext';

export default function ResetPasswordPage() {
  const { user, loading, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  if (!usesSupabase) return <Navigate to="/login" replace />;
  if (loading) return <p role="status" className="p-8">Checking your reset link…</p>;
  const submit = async event => {
    event.preventDefault(); setError('');
    if (password.length < 8 || password !== confirm) { setError('Use at least 8 characters and enter the same password twice.'); return; }
    setBusy(true);
    try {
      await authService.updatePassword(password);
      setPassword(''); setConfirm(''); setDone(true);
      try { await logout(); } catch (_) { /* Local sign-out still clears this page's session. */ }
    } catch (failure) { setError(failure.message || 'Unable to update password. Request a new link.'); }
    finally { setBusy(false); }
  };
  return <div className="max-w-md mx-auto my-16 p-8 rounded shadow">
    <h1 className="text-2xl font-bold mb-6">Choose a new password</h1>
    {done ? <p role="status">Password updated. <Link to="/login" className="text-red-600">Log in</Link></p> : !user ?
      <p role="alert">Your reset link is invalid or has expired. <Link to="/forgot-password" className="text-red-600">Request another link</Link></p> :
      <form onSubmit={submit} className="space-y-4">
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <label className="block">New password<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="border rounded p-3 w-full" /></label>
        <label className="block">Confirm password<input type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={e => setConfirm(e.target.value)} className="border rounded p-3 w-full" /></label>
        <button disabled={busy} className="bg-red-600 text-white p-3 rounded w-full">{busy ? 'Updating…' : 'Update password'}</button>
      </form>}
  </div>;
}
