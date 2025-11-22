// src/components/form-builder/renderer/fields/TextAreaField.tsx
import { component$, useSignal, $, type PropFunction } from '@builder.io/qwik';
import type { FormField } from '~/types/workflow';

interface TextAreaFieldProps {
  field: FormField;
  value: string;
  error?: string;
  onChange: PropFunction<(value: string) => void>;
}

export default component$<TextAreaFieldProps>((props) => {
  const charCount = useSignal(props.value?.length || 0);

  const handleInput = $((e: Event) => {
    const value = (e.target as HTMLTextAreaElement).value;
    charCount.value = value.length;
    props.onChange(value);
  });

  return (
    <div class="field-wrapper">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {props.field.label}
        {props.field.required && <span class="text-red-500 ml-1">*</span>}
      </label>

      <textarea
        value={props.value || ''}
        onInput$={handleInput}
        placeholder={props.field.placeholder}
        required={props.field.required}
        rows={props.field.rows || 4}
        maxLength={props.field.maxLength}
        class={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
          props.error ? 'border-red-500' : 'border-gray-300'
        }`}
      />

      <div class="flex justify-between items-center mt-1">
        <div>
          {props.field.hint && !props.error && (
            <p class="text-xs text-gray-500">{props.field.hint}</p>
          )}
          {props.error && (
            <p class="text-xs text-red-500">{props.error}</p>
          )}
        </div>

        {props.field.maxLength && (
          <p class="text-xs text-gray-500">
            {charCount.value} / {props.field.maxLength}
          </p>
        )}
      </div>
    </div>
  );
});
