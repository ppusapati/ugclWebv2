// src/components/form-builder/renderer/fields/SelectField.tsx
import { component$, useSignal, useVisibleTask$, $, type PropFunction } from '@builder.io/qwik';
import { apiClient } from '~/services';
import type { FormField, FieldOption } from '~/types/workflow';

interface SelectFieldProps {
  field: FormField;
  value: any;
  error?: string;
  onChange: PropFunction<(value: any) => void>;
}

export default component$<SelectFieldProps>((props) => {
  const options = useSignal<FieldOption[]>(props.field.options || []);
  const loading = useSignal(false);

  // Load API options if configured
  useVisibleTask$(async () => {
    if (props.field.dataSource === 'api' && props.field.apiEndpoint) {
      try {
        loading.value = true;
        const data = await apiClient.get(props.field.apiEndpoint);
        const items = Array.isArray(data) ? data : data.items || [];

        options.value = items.map((item: any) => ({
          label: item[props.field.displayField || 'name'],
          value: item[props.field.valueField || 'id'],
        }));
      } catch (error) {
        console.error('Failed to load options:', error);
      } finally {
        loading.value = false;
      }
    }
  });

  // Dropdown
  if (props.field.type === 'dropdown') {
    return (
      <div class="field-wrapper">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {props.field.label}
          {props.field.required && <span class="text-red-500 ml-1">*</span>}
        </label>

        <select
          value={props.value || ''}
          onChange$={(e) => props.onChange((e.target as HTMLSelectElement).value)}
          required={props.field.required}
          disabled={loading.value}
          class={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            props.error ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">
            {loading.value ? 'Loading...' : (props.field.placeholder || 'Select an option...')}
          </option>
          {options.value.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {props.field.hint && !props.error && (
          <p class="text-xs text-gray-500 mt-1">{props.field.hint}</p>
        )}

        {props.error && (
          <p class="text-xs text-red-500 mt-1">{props.error}</p>
        )}
      </div>
    );
  }

  // Radio buttons
  if (props.field.type === 'radio') {
    return (
      <div class="field-wrapper">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {props.field.label}
          {props.field.required && <span class="text-red-500 ml-1">*</span>}
        </label>

        <div class="space-y-2">
          {options.value.map((option) => (
            <label key={option.value} class="flex items-center">
              <input
                type="radio"
                name={props.field.id}
                value={option.value}
                checked={props.value === option.value}
                onChange$={(e) => props.onChange((e.target as HTMLInputElement).value)}
                required={props.field.required}
                class="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>

        {props.field.hint && !props.error && (
          <p class="text-xs text-gray-500 mt-1">{props.field.hint}</p>
        )}

        {props.error && (
          <p class="text-xs text-red-500 mt-1">{props.error}</p>
        )}
      </div>
    );
  }

  // Checkboxes (multiple selection)
  if (props.field.type === 'checkbox') {
    const selectedValues = Array.isArray(props.value) ? props.value : [];

    const handleCheckboxChange = $((optionValue: string | number, checked: boolean) => {
      let newValues = [...selectedValues];
      if (checked) {
        newValues.push(optionValue);
      } else {
        newValues = newValues.filter(v => v !== optionValue);
      }
      props.onChange(newValues);
    });

    return (
      <div class="field-wrapper">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {props.field.label}
          {props.field.required && <span class="text-red-500 ml-1">*</span>}
        </label>

        <div class="space-y-2">
          {options.value.map((option) => (
            <label key={option.value} class="flex items-center">
              <input
                type="checkbox"
                value={option.value}
                checked={selectedValues.includes(option.value)}
                onChange$={(e) => handleCheckboxChange(option.value, (e.target as HTMLInputElement).checked)}
                class="mr-2 text-blue-600 focus:ring-blue-500 rounded"
              />
              <span class="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>

        {props.field.hint && !props.error && (
          <p class="text-xs text-gray-500 mt-1">{props.field.hint}</p>
        )}

        {props.error && (
          <p class="text-xs text-red-500 mt-1">{props.error}</p>
        )}
      </div>
    );
  }

  return null;
});
