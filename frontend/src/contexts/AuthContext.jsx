import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authService } from '../services/api';
import { usesSupabase } from '../lib/backend';
import { clearAccessToken, setAccessToken } from '../utils/axiosConfig';
import { clearFormFromLocalStorage } from '../utils/propertyFormUtils';

const AuthContext = createContext(null);
export const canAccess = (user, permission) => Boolean(user && (user.role === 'admin' ||
  (user.role === 'subadmin' && (permission ? user.permissions?.includes(permission) : user.permissions?.length))));

function clearAccountCache() {
  sessionStorage.removeItem('user');
  localStorage.removeItem('userId');
  localStorage.removeItem('user_id');
  clearFormFromLocalStorage();
}

export function AuthProvider({ children, service = authService, supabaseMode = usesSupabase }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const authOperation = useRef(0);
  const signedOut = useRef(false);
  const channel = useRef(null);
  const cancelPendingRequests = useCallback(() => { ++generation.current; }, []);
  const refresh = useCallback(async () => {
    if (signedOut.current) return null;
    const request = ++generation.current;
    try {
      const response = await service.getCurrentUser();
      if (request === generation.current) {
        setUser(response.data.user || null);
        setError('');
      }
      return response.data.user;
    } catch (failure) {
      if (request === generation.current) {
        setUser(null);
        setError(failure.response?.status === 401 ? '' : failure.message);
      }
      return null;
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    sessionStorage.removeItem('user'); // Retire the editable legacy role cache.
    let timer;
    let unsubscribe;
    const invalidate = () => {
      ++generation.current;
      setUser(null);
      setLoading(false);
      clearAccountCache();
    };
    try {
      unsubscribe = service.subscribe?.((event, session) => {
        if (!session || event === 'SIGNED_OUT') { invalidate(); return; }
        // Do not call another SDK method while its auth event lock is held.
        clearTimeout(timer);
        timer = setTimeout(() => refresh(), 0);
      });
    } catch (failure) { setError(failure.message); }
    refresh();
    const onFocus = () => refresh(); // Load live privileges after returning to tab.
    window.addEventListener('focus', onFocus);
    if (supabaseMode && typeof BroadcastChannel !== 'undefined') {
      const broadcast = new BroadcastChannel(`dealinee-signout-${process.env.REACT_APP_SUPABASE_URL || 'local'}`);
      channel.current = broadcast;
      broadcast.onmessage = event => {
        if (event.data === 'SIGNED_OUT') {
          signedOut.current = true;
          invalidate();
          service.clearLocalSession?.().catch(() => {});
        }
      };
    }
    return () => {
      cancelPendingRequests();
      clearTimeout(timer);
      unsubscribe?.();
      window.removeEventListener('focus', onFocus);
      channel.current?.close();
      channel.current = null;
    };
  }, [refresh, service, supabaseMode, cancelPendingRequests]);

  const authenticate = async (method, data) => {
    const operation = ++authOperation.current;
    signedOut.current = false;
    ++generation.current;
    clearAccountCache();
    setError('');
    const response = await service[method](data);
    if (operation !== authOperation.current) {
      if (signedOut.current) await service.clearLocalSession?.();
      throw new Error('Sign-in was cancelled. Please try again.');
    }
    ++generation.current; // Earlier profile requests cannot overwrite this login.
    if (!supabaseMode) setAccessToken(response.data.accessToken || null);
    setUser(response.data.user || null);
    setLoading(false);
    return response.data;
  };
  const logout = async () => {
    ++authOperation.current;
    signedOut.current = true;
    ++generation.current;
    setUser(null);
    setLoading(false);
    clearAccountCache();
    if (!supabaseMode) clearAccessToken();
    channel.current?.postMessage('SIGNED_OUT');
    try { await service.logout(); } finally {
      ++generation.current;
      setUser(null);
    }
  };
  return <AuthContext.Provider value={{ user, loading, error, refresh, logout,
    login: data => authenticate('login', data), register: data => authenticate('register', data),
    can: permission => canAccess(user, permission) }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth requires AuthProvider');
  return value;
}
