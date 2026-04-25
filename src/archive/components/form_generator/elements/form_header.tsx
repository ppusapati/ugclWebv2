 
import { type ActionStore, Form } from "@builder.io/qwik-city";
import { reset, type FormStore } from "@modular-forms/qwik";
import { P9EButton } from "./button";

type FormHeaderProps = {
  of: FormStore<any, any>;
  heading: string;
  resetAction?: ActionStore<object, Record<string, any>, true>;
  form?: string;
};

/**
 * Form header with heading and buttons to reset and submit the form.
 */
export function FormHeader({ of: formStore, heading, resetAction, form }: FormHeaderProps) {
  return (
    <header class="flex items-center justify-between">
      <h1 class="text-2xl text-slate-900 dark:text-slate-200 md:text-3xl lg:text-4xl">{heading}</h1>
      <div class="hidden md:hidden">
        {resetAction ? (
          <Form action={resetAction}>
            <P9EButton variant="secondary" label="Reset" type={resetAction ? "submit" : "button"} preventdefault:click onClick$={() => reset(formStore)} />
          </Form>
        ) : (
          <P9EButton variant="secondary" label="Reset" type={resetAction ? "submit" : "button"} preventdefault:click onClick$={() => reset(formStore)} />
        )}
        <P9EButton variant="primary" label="Submit" type="submit" form={form} />
      </div>
    </header>
  );
}
