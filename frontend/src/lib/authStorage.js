// Sessions end with this tab. Only short-lived PKCE proofs are shared across
// same-origin tabs, so an emailed link can open in a new tab in the same browser.
export function createAuthStorage(storageKey, sessions, proofs, now = Date.now) {
  const isProof = key => key.startsWith(`${storageKey}-`) && key.endsWith('-code-verifier');
  const readProof = key => {
    try {
      const record = JSON.parse(proofs.getItem(key));
      if (record && typeof record.value === 'string' && record.expiresAt > now()) return record.value;
    } catch (_) { /* Remove stale/invalid proof records, never promote to a session. */ }
    proofs.removeItem(key);
    return null;
  };
  for (let i = proofs.length - 1; i >= 0; i--) {
    const key = proofs.key(i);
    if (key && isProof(key)) readProof(key);
  }
  return {
    getItem: key => isProof(key) ? readProof(key) : sessions.getItem(key),
    setItem(key, value) {
      if (isProof(key)) proofs.setItem(key, JSON.stringify({ value, expiresAt: now() + 60 * 60 * 1000 }));
      else sessions.setItem(key, value);
    },
    removeItem: key => isProof(key) ? proofs.removeItem(key) : sessions.removeItem(key),
  };
}
