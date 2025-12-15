// src/components/form-builder/renderer/fields/NumberField.tsx
import { component$, type PropFunction } from '@builder.io/qwik';
import type { FormField } from '~/types/workflow';

interface NumberFieldProps {
  field: FormField;
  value: number | string;
  error?: string;
  onChange$: PropFunction<(value: number | string) => void>;
}

export default component$<NumberFieldProps>((props) => {
  return (
    <div class="field-wrapper">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {props.field.label}
        {props.field.required && <span class="text-red-500 ml-1">*</span>}
      </label>

      <div class="relative">
        {props.field.prefix && (
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {props.field.prefix}
          </span>
        )}

        <input
          type="number"
          value={props.value || ''}
          onInput$={async (e) => {
            const value = (e.target as HTMLInputElement).value;
            await props.onChange$(value === '' ? '' : parseFloat(value));
          }}
          placeholder={props.field.placeholder}
          required={props.field.required}
          min={props.field.min}
          max={props.field.max}
          step={props.field.step || 1}
          class={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            props.field.prefix ? 'pl-8' : ''
          } ${props.field.suffix ? 'pr-12' : ''} ${
            props.error ? 'border-red-500' : 'border-gray-300'
          }`}
        />

        {props.field.suffix && (
          <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {props.field.suffix}
          </span>
        )}
      </div>

      {props.field.hint && !props.error && (
        <p class="text-xs text-gray-500 mt-1">{props.field.hint}</p>
      )}

      {props.error && (
        <p class="text-xs text-red-500 mt-1">{props.error}</p>
      )}
    </div>
  );
});
