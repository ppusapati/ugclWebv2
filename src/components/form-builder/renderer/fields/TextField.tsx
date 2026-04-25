// src/components/form-builder/renderer/fields/TextField.tsx
import { component$, type PropFunction } from '@builder.io/qwik';
import { FormField } from '~/components/ds';
import type { FormField as WorkflowFormField } from '~/types/workflow';

interface TextFieldProps {
  field: WorkflowFormField;
  value: string;
  error?: string;
  onChange$: PropFunction<(value: string) => void>;
}

export default component$<TextFieldProps>((props) => {
  const inputType = props.field.type === 'email' ? 'email' :
                    props.field.type === 'phone' ? 'tel' : 'text';

  return (
    <div class="field-wrapper">
      <FormField
        id={props.field.id}
        label={props.field.label}
        required={props.field.required}
        hint={props.field.hint}
        error={props.error}
      >
        <input
          id={props.field.id}
          type={inputType}
          value={props.value || ''}
          onInput$={async (e) => await props.onChange$((e.target as HTMLInputElement).value)}
          placeholder={props.field.placeholder}
          required={props.field.required}
          minLength={props.field.validation?.minLength}
          maxLength={props.field.validation?.maxLength}
          pattern={props.field.validation?.pattern}
          class={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            props.error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
      </FormField>
    </div>
  );
});
