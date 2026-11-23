const WHATSAPP_NUMBER = '+917008937155';

export function getWhatsAppUrl({ title, propertyPath } = {}) {
  const message = propertyPath
    ? `Hi Dealinee Estate, I would like to enquire about ${title}.\n${new URL(propertyPath, window.location.origin).href}`
    : 'Hi Dealinee Estate, I would like to enquire about a property. Please help me with my requirement.';
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
