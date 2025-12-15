// src/components/form-builder/renderer/fields/DateField.tsx
import { component$, type PropFunction } from '@builder.io/qwik';
import type { FormField } from '~/types/workflow';

interface DateFieldProps {
  field: FormField;
  value: string;
  error?: string;
  onChange$: PropFunction<(value: string) => void>;
}

export default component$<DateFieldProps>((props) => {
  const inputType = props.field.type === 'datetime' ? 'datetime-local' :
                    props.field.type === 'time' ? 'time' : 'date';

  return (
    <div class="field-wrapper">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {props.field.label}
        {props.field.required && <span class="text-red-500 ml-1">*</span>}
      </label>

      <input
        type={inputType}
        value={props.value || ''}
        onInput$={async (e) => await props.onChange$((e.target as HTMLInputElement).value)}
        required={props.field.required}
        min={props.field.validation?.minDate}
        max={props.field.validation?.maxDate}
        class={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
          props.error ? 'border-red-500' : 'border-gray-300'
        }`}
      />

      {props.field.hint && !props.error && (
        <p class="text-xs text-gray-500 mt-1">{props.field.hint}</p>
      )}

      {props.error && (
        <p class="text-xs text-red-500 mt-1">{props.error}</p>
      )}
    </div>
  );
});
