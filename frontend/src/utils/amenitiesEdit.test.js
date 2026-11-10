import {
  INITIAL_FORM_STATE, initializePropertyFormState, propertyFormReducer,
  createAmenityUpdateAction, createFieldUpdateAction,
} from '../reducers/propertyFormReducer';
import { transformFormDataForSubmission } from './propertyFormUtils';

test.each(['BUY', 'RENT', 'COMMERCIAL'])('%s edit retains amenities through 3 → 5 → 4 and price-only updates', (propertyType) => {
  const original = ['gym', 'parking', 'security'];
  const reopen = (amenities) => initializePropertyFormState({
    ...INITIAL_FORM_STATE,
    basicInfo: { propertyType, category: propertyType === 'COMMERCIAL' ? 'BUY' : 'RESALE' },
    propertyDetails: { price: 1000000, area: 1000, bathrooms: 2 },
    amenities,
  });
  const payload = (state) => transformFormDataForSubmission(state, 'qa');
  let state = reopen(original);
  expect(state.propertyDetails.amenities).toEqual(original);
  expect(payload(state).amenities).toEqual(original);
  for (const amenity of ['garden', 'water_supply']) state = propertyFormReducer(state, createAmenityUpdateAction(amenity, true));
  state = reopen(payload(state).amenities);
  expect(state.propertyDetails.amenities).toHaveLength(5);
  state = propertyFormReducer(state, createAmenityUpdateAction('parking', false));
  state = reopen(payload(state).amenities);
  expect(state.propertyDetails.amenities).toEqual(['gym', 'security', 'garden', 'water_supply']);
  state = propertyFormReducer(state, createFieldUpdateAction('propertyDetails', 'price', '1200000'));
  expect(payload(state).amenities).toEqual(['gym', 'security', 'garden', 'water_supply']);
  for (const amenity of [...state.propertyDetails.amenities]) state = propertyFormReducer(state, createAmenityUpdateAction(amenity, false));
  expect(payload(state).amenities).toEqual([]);
  expect(original).toEqual(['gym', 'parking', 'security']);
});
