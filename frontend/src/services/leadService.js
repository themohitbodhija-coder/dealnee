export const DEFAULT_CRM_RPC_URL =
  'https://rtqtmgyqazsjtqxiooma.supabase.co/rest/v1/rpc/insert_public_lead';

export const DEFAULT_CRM_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0cXRtZ3lxYXpzanRxeGlvb21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTAzNTEsImV4cCI6MjA4Mzg4NjM1MX0.xbIlKGFbiJs0S9MgZ7XlbMSN1vcBphZMSnAkwMQmB7U';

const COMPANY_SLUG = 'dealinee-estate';

/**
 * Submit a public lead directly to the CRM Supabase PostgREST RPC endpoint.
 * Maps contact form fields directly without filtering p_notes.
 */
export async function submitPublicLead({ name, email, phone, message }) {
  const url = process.env.REACT_APP_CRM_RPC_URL || DEFAULT_CRM_RPC_URL;
  const anonKey = process.env.REACT_APP_CRM_ANON_KEY || DEFAULT_CRM_ANON_KEY;

  const payload = {
    p_company_slug: COMPANY_SLUG,
    p_name: name,
    p_phone: phone || '',
    p_email: email,
    p_notes: message,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = text;
    }
  }

  if (!response.ok) {
    const detail =
      typeof data === 'object' && data !== null
        ? data.message || data.error || data.hint
        : data;
    throw new Error(detail || 'Unable to send your inquiry. Please try again.');
  }

  return data;
}
