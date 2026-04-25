import { Slot, component$ } from '@builder.io/qwik';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  class?: string;
  id?: string;
  labelFor?: string;
}

export const FormField = component$<FormFieldProps>((props) => {
  const classes = ['space-y-1.5', props.class].filter(Boolean).join(' ');
  const controlId = props.labelFor || props.id;
  const hintId = props.id ? `${props.id}-hint` : undefined;
  const errorId = props.id ? `${props.id}-error` : undefined;

  return (
    <div class={classes}>
      <label class="block text-sm font-medium text-color-text-primary" for={controlId}>
        {props.label}
        {props.required ? <span class="ml-1 text-color-semantic-error-600">*</span> : null}
      </label>
      <Slot />
      {props.error ? (
        <p id={errorId} class="text-xs text-color-semantic-error-700" role="alert" aria-live="polite">
          {props.error}
        </p>
      ) : props.hint ? (
        <p id={hintId} class="text-xs text-color-text-tertiary">{props.hint}</p>
      ) : null}
    </div>
  );
});
