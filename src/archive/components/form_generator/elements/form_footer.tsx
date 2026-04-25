 
import { type ActionStore, Form } from '@builder.io/qwik-city';
import { type FormStore, reset } from '@modular-forms/qwik';
import { P9EButton } from './button';
import { $ } from '@builder.io/qwik';

type FormFooterProps = {
  of: FormStore<any, any>;
  resetAction?: ActionStore<object, Record<string, any>, true>;
  form?: string;
};

const handleSubmit = $(()=>{});

/**
 * Form footer with buttons to reset and submit the form.
 */
export function FormFooter({
  of: formStore,
  resetAction,
  form,
}: FormFooterProps) {
  return (
    <footer class="flex space-x-6 px-8 float-end">
      <P9EButton
        variant="success"
        label="Submit"
        type="submit"
        form={form}
        onClick$={handleSubmit}
      />
      {resetAction ? (
        <Form action={resetAction}>
          <P9EButton
            variant="secondary"
            label="Reset"
            type={resetAction ? 'submit' : 'button'}
            preventdefault:click
            onClick$={() => reset(formStore)}
          />
        </Form>
      ) : (
        <P9EButton
          variant="secondary"
          label="Reset"
          type={resetAction ? 'submit' : 'button'}
          preventdefault:click
          onClick$={() => reset(formStore)}
        />
      )}
    </footer>
  );
}