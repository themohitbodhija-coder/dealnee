import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProjectDetailsStep from '../components/admin/property-steps/ProjectDetailsStep';
import {
  INITIAL_FORM_STATE,
  initializePropertyFormState,
  propertyFormReducer,
  createUnitConfigurationUpdateAction,
} from './propertyFormReducer';

describe('New Project edit initialization', () => {
  test.each([undefined, null, {}, { unitConfigurations: null }])(
    'renders incomplete API pricing without crashing: %p',
    (projectPricing) => {
      const state = initializePropertyFormState({ ...INITIAL_FORM_STATE, projectPricing });
      expect(() => renderToStaticMarkup(
        <ProjectDetailsStep formData={state} dispatch={() => {}} />
      )).not.toThrow();
      expect(state.projectPricing.unitConfigurations.bhk2.carpetArea).toBe('');
    }
  );

  test('preserves populated BHK data and other fields when initializing and editing a missing unit', () => {
    const saved = {
      ...INITIAL_FORM_STATE,
      propertyDetails: { bathrooms: 2, price: 7500000 },
      projectPricing: {
        startingPrice: 7500000,
        unitConfigurations: { bhk2: { carpetArea: 0, price: 6000000 }, bhk4: null },
      },
    };
    const state = initializePropertyFormState(saved);
    expect(state.projectPricing.startingPrice).toBe(7500000);
    expect(state.projectPricing.unitConfigurations.bhk2).toMatchObject({ carpetArea: 0, price: 6000000 });
    expect(state.propertyDetails).toEqual({ ...saved.propertyDetails, amenities: [], facilities: [], furnishingItems: [], outdoorFeatures: [], featured: false });
    const updated = propertyFormReducer(state, createUnitConfigurationUpdateAction('bhk3', 'carpetArea', '900'));
    expect(updated.projectPricing.unitConfigurations.bhk3.carpetArea).toBe('900');
    expect(updated.projectPricing.unitConfigurations.bhk2).toEqual(state.projectPricing.unitConfigurations.bhk2);
    expect(saved.projectPricing.unitConfigurations.bhk3).toBeUndefined();
    expect(state.projectPricing.unitConfigurations.bhk3.carpetArea).toBe('');
  });
});
