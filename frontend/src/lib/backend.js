export const backendMode = process.env.REACT_APP_BACKEND || 'express';
if (!['express', 'supabase'].includes(backendMode)) {
  throw new Error('REACT_APP_BACKEND must be express or supabase');
}
export const usesSupabase = backendMode === 'supabase';
