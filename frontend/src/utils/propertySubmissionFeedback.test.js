import { propertyFieldIssues, propertySubmissionFeedback } from './propertySubmissionFeedback';

test('shows every nested error with the corresponding wizard step', () => {
  expect(propertyFieldIssues({ location: { address: 'Enter an address.' }, projectPricing: { unitConfigurations: 'Complete a unit.' } })).toEqual([
    { field: 'location.address', label: 'address', message: 'Enter an address.', stepId: 'location' },
    { field: 'projectPricing.unitConfigurations', label: 'unit Configurations', message: 'Complete a unit.', stepId: 'project_details' },
  ]);
});

test('preserves an actionable server message instead of replacing it based on status', () => {
  expect(propertySubmissionFeedback({ response: { status: 403, data: { error: 'Origin is not allowed.' } } })).toEqual({ message: 'Origin is not allowed.', issues: [], retryable: false });
  expect(propertySubmissionFeedback({ response: { status: 400, data: { message: 'Check the details.', fieldErrors: { 'contact.phone': 'Enter a phone number.' } } } }).issues[0].stepId).toBe('contact');
});
