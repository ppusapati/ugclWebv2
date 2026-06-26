import type { FormStep } from '~/types/workflow';

export const isMissingValue = (value: any): boolean => {
  if (Array.isArray(value)) return value.length === 0;
  return value === undefined || value === null || String(value).trim() === '';
};

export const collectDependentFieldIds = (
  steps: FormStep[],
  parentFieldId: string,
  visited: Set<string> = new Set()
): string[] => {
  const dependents: string[] = [];

  for (const step of steps) {
    for (const field of step.fields || []) {
      if (field.dependsOn !== parentFieldId) continue;
      if (visited.has(field.id)) continue;

      visited.add(field.id);
      dependents.push(field.id);
      dependents.push(...collectDependentFieldIds(steps, field.id, visited));
    }
  }

  return dependents;
};

export const clearDependentValues = (
  steps: FormStep[],
  formData: Record<string, any>,
  errors: Record<string, string>,
  fieldId: string
) => {
  for (const dependentFieldId of collectDependentFieldIds(steps, fieldId)) {
    delete formData[dependentFieldId];
    delete errors[dependentFieldId];
  }
};
