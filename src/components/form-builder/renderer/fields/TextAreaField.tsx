// src/components/form-builder/renderer/fields/TextAreaField.tsx
import { component$, useSignal, $, type PropFunction } from '@builder.io/qwik';
import { FormField } from '~/components/ds';
import type { FormField as WorkflowFormField } from '~/types/workflow';

interface TextAreaFieldProps {
  field: WorkflowFormField;
  value: string;
  error?: string;
  onChange$: PropFunction<(value: string) => void>;
}

export default component$<TextAreaFieldProps>((props) => {
  const charCount = useSignal(props.value?.length || 0);

  const handleInput = $(async (e: Event) => {
    const value = (e.target as HTMLTextAreaElement).value;
    charCount.value = value.length;
    await props.onChange$(value);
  });

  return (
    <div class="field-wrapper">
      <FormField
        id={props.field.id}
        label={props.field.label}
        required={props.field.required}
        hint={props.field.hint}
        error={props.error}
      >
        <textarea
          id={props.field.id}
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
      </FormField>

      {props.field.maxLength && (
        <p class="text-xs text-gray-500 mt-1 text-right">
          {charCount.value} / {props.field.maxLength}
        </p>
      )}
    </div>
  );
});
