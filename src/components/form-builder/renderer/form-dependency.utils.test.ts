import { describe, expect, it } from 'vitest';
import type { FormStep } from '~/types/workflow';
import { clearDependentValues, collectDependentFieldIds, isMissingValue } from './form-dependency.utils';

const buildSteps = (): FormStep[] => [
  {
    id: 'step_1',
    title: 'Step 1',
    fields: [
      { id: 'country', type: 'dropdown', label: 'Country' },
      { id: 'state', type: 'dropdown', label: 'State', dependsOn: 'country' },
      { id: 'city', type: 'dropdown', label: 'City', dependsOn: 'state' },
      { id: 'ward', type: 'dropdown', label: 'Ward', dependsOn: 'city' },
    ],
  },
];

describe('form dependency helpers', () => {
  it('collects chained dependent field ids in depth order', () => {
    const dependents = collectDependentFieldIds(buildSteps(), 'country');
    expect(dependents).toEqual(['state', 'city', 'ward']);
  });

  it('clears all descendant values and errors when parent changes', () => {
    const formData: Record<string, any> = {
      country: 'IN',
      state: 'KA',
      city: 'Bengaluru',
      ward: 'North',
      otherField: 'keep-me',
    };
    const errors: Record<string, string> = {
      state: 'Invalid state',
      city: 'Invalid city',
      ward: 'Invalid ward',
      otherField: 'keep-error',
    };

    clearDependentValues(buildSteps(), formData, errors, 'country');

    expect(formData.country).toBe('IN');
    expect(formData.state).toBeUndefined();
    expect(formData.city).toBeUndefined();
    expect(formData.ward).toBeUndefined();
    expect(formData.otherField).toBe('keep-me');

    expect(errors.state).toBeUndefined();
    expect(errors.city).toBeUndefined();
    expect(errors.ward).toBeUndefined();
    expect(errors.otherField).toBe('keep-error');
  });

  it('treats empty arrays as missing values for required checks', () => {
    expect(isMissingValue([])).toBe(true);
    expect(isMissingValue(['A'])).toBe(false);
    expect(isMissingValue('')).toBe(true);
    expect(isMissingValue('value')).toBe(false);
  });
});
