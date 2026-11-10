import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { usesSupabase } from '../../lib/backend';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  if (!usesSupabase) return <Navigate to="/login" replace />;
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await authService.requestPasswordReset(email);
      setMessage('If an account exists for this email, you will receive a password reset link.');
    } catch (_) { setError('Unable to send the link right now. Please wait and try again.'); }
    finally { setBusy(false); }
  };
  return <div className="max-w-md mx-auto my-16 p-8 bg-white rounded shadow">
    <h1 className="text-2xl font-bold mb-6">Reset your password</h1>
    {message && <p role="status" className="mb-4 text-green-700">{message}</p>}
    {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
    <form onSubmit={submit} className="space-y-4">
      <label className="block">Email<input type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className="border rounded p-3 w-full" /></label>
      <button disabled={busy} className="bg-red-600 text-white p-3 rounded w-full">{busy ? 'Sending…' : 'Send reset link'}</button>
    </form><Link to="/login" className="block mt-4 text-red-600">Back to login</Link>
  </div>;
}
