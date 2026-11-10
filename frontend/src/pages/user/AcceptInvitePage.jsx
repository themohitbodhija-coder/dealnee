import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { useAuth, canAccess } from '../../contexts/AuthContext';
import { usesSupabase } from '../../lib/backend';
import { clearFormFromLocalStorage } from '../../utils/propertyFormUtils';

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token_hash'));
  const [stage,setStage] = useState('verify');
  const [password,setPassword] = useState('');
  const [confirm,setConfirm] = useState('');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  if (!usesSupabase) return <Navigate to="/login" replace />;
  const verify = async () => {
    setBusy(true); setError('');
    window.history.replaceState({},'','/accept-invite');
    clearFormFromLocalStorage();
    try { await authService.verifyInvitation(token); setStage('password'); }
    catch (_) { setError('This invitation is invalid or has expired. Ask your admin for help.'); }
    finally { setBusy(false); }
  };
  const activate = async () => {
    await authService.activateInvitation();
    const user = await refresh();
    if (!user) throw new Error('Unable to load your account. Please log in again.');
    navigate(canAccess(user) ? '/admin/dashboard' : '/', { replace:true });
  };
  const submit = async event => {
    event.preventDefault(); setError('');
    if (stage === 'password' && (password.length<8 || password!==confirm)) { setError('Use at least 8 characters and enter the same password twice.'); return; }
    setBusy(true);
    try {
      if (stage === 'password') { await authService.updatePassword(password); setPassword(''); setConfirm(''); setStage('activate'); }
      await activate();
    } catch (failure) { setError(failure.message || 'Your invitation is still being prepared. Please try again.'); }
    finally { setBusy(false); }
  };
  return <div className="max-w-md mx-auto my-16 p-8 rounded shadow">
    <h1 className="text-2xl font-bold mb-6">Welcome to Dealinee</h1>
    {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
    {stage === 'verify' ? <><p className="mb-4">Confirm your invitation to choose your password.</p>
      <button disabled={busy || !token} onClick={verify} className="bg-red-600 text-white rounded p-3">{busy ? 'Checking…' : 'Continue invitation'}</button></> :
      <form onSubmit={submit} className="space-y-4">
        {stage === 'password' && <><label className="block">Choose a password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="border p-3 rounded w-full" /></label>
          <label className="block">Confirm password<input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} className="border p-3 rounded w-full" /></label></>}
        <button disabled={busy} className="bg-red-600 text-white rounded p-3 w-full">{busy ? 'Working…' : stage === 'activate' ? 'Finish account setup' : 'Set password and continue'}</button>
      </form>}
    <Link to="/login" className="block mt-4 text-red-600">Go to login</Link>
  </div>;
}
