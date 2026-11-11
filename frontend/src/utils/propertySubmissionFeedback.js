const sectionSteps = {
  basicInfo: 'basic_info', title: 'basic_info', description: 'basic_info', propertyType: 'basic_info',
  category: 'basic_info', subcategory: 'basic_info', location: 'location', address: 'location',
  contact: 'contact', phone: 'contact', listing_phone: 'contact', propertyDetails: 'details',
  commonInfo: 'details', resaleInfo: 'details', rentalInfo: 'details', commercialDetails: 'details',
  newProjectInfo: 'project_details', projectPricing: 'project_details', images: 'images',
};

export function propertyFieldIssues(errors, path = '') {
  if (typeof errors === 'string') {
    const message = errors.trim();
    if (!message) return [];
    const field = path.replace(/^property\./, '');
    const parts = field.split('.');
    const name = parts[parts.length - 1];
    const label = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
    return [{ field, label, message, stepId: sectionSteps[parts[0]] || (field ? 'details' : undefined) }];
  }
  if (!errors || typeof errors !== 'object') return [];
  if (typeof errors.message === 'string') return propertyFieldIssues(errors.message, errors.field || path);
  if (Array.isArray(errors)) return errors.flatMap(error => propertyFieldIssues(error, path));
  return Object.entries(errors).flatMap(([field, error]) => propertyFieldIssues(error, path ? `${path}.${field}` : field));
}

export function propertySubmissionFeedback(error) {
  const status = error.response?.status;
  const data = error.response?.data;
  const message = [data?.message, data?.error].find(value => typeof value === 'string' && value.trim());
  const issues = propertyFieldIssues(data?.fieldErrors || data?.errors);
  if (error.name === 'AbortError') return { message: 'Submission was cancelled.', issues };
  if (error.message === 'Request timeout') {
    return { message: 'The save timed out. Check your connection and try again.', issues, retryable: true };
  }
  if (!status && !data) {
    const offline = error.code === 'ERR_NETWORK' || error.request;
    return {
      message: offline ? 'Could not reach the property service. Check your connection and try again.' : error.message || 'Could not prepare the property for saving.',
      issues,
      retryable: Boolean(offline),
    };
  }
  return { message: message || 'Could not save the property. Please try again.', issues, retryable: status >= 500 && !issues.length };
}
