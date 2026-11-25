import {
  DEFAULT_CRM_ANON_KEY,
  DEFAULT_CRM_RPC_URL,
  submitPublicLead,
} from './leadService';

describe('submitPublicLead', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('posts contact form fields directly to insert_public_lead with unfiltered p_notes', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: 'crm-lead-1' }),
    });

    const rawNotes = 'Looking for 3 BHK in Patia <script>alert(1)</script>\nBudget: 1.2 Cr';
    const result = await submitPublicLead({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      message: rawNotes,
    });

    expect(result).toEqual({ id: 'crm-lead-1' });
    expect(global.fetch).toHaveBeenCalledWith(DEFAULT_CRM_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: DEFAULT_CRM_ANON_KEY,
        Authorization: `Bearer ${DEFAULT_CRM_ANON_KEY}`,
      },
      body: JSON.stringify({
        p_company_slug: 'dealinee-estate',
        p_name: 'John Doe',
        p_phone: '9876543210',
        p_email: 'john@example.com',
        p_transaction_types: [],
        p_property_types: [],
        p_min_sqft: null,
        p_max_sqft: null,
        p_min_budget: null,
        p_max_budget: null,
        p_budget: null,
        p_location: null,
        p_notes: rawNotes,
      }),
    });
  });

  test('handles 204/empty response and optional phone', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    });

    const result = await submitPublicLead({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '',
      message: 'Call me back',
    });

    expect(result).toBeNull();
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.p_phone).toBe('');
  });

  test('throws error message when CRM RPC returns non-ok status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ message: 'Invalid company slug' }),
    });

    await expect(
      submitPublicLead({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '',
        message: 'Hello',
      })
    ).rejects.toThrow('Invalid company slug');
  });
});
