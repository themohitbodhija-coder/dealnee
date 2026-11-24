import { getWhatsAppUrl } from './whatsapp';

test('encodes property titles and absolute links without breaking the WhatsApp query', () => {
  const title = 'Home & Garden #2 / ₹50L?';
  const url = new URL(getWhatsAppUrl({ title, propertyPath: '/property/listing-1' }));
  expect(url.origin).toBe('https://wa.me');
  expect(url.pathname).toBe('/919776631999');
  expect([...url.searchParams.keys()]).toEqual(['text']);
  expect(url.searchParams.get('text')).toBe(`Hi Dealinee Estate, I would like to enquire about ${title}.\n${window.location.origin}/property/listing-1`);
});
