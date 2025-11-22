 
// src/components/DynamicForm.tsx
import { $, component$, type PropFunction, useStore } from "@builder.io/qwik";
import { P9EButton } from "../elements/button";
import { type SubmitValue } from "../types";
import { P9EIcon } from "../utility/icon";
// import { P9EIcon } from "../icon/icon";

type FormField<T> = {
  type: string;
  name: T;
  label: string;
  icon?: string | any;
  iconStyle?: string;
  iconColor?: string;
  iconSize?: number;
  labelStyle?: string;
  inputStyle?: string;
  placeholder?: string;
  options?: string[];
  hint?: string;
  error?: string;
  variant?: string;
}

export type FormProps<T> = {
  formName: string;
  schema: FormField<T>[];
  onSubmit$: PropFunction<(data: SubmitValue) => void>;
}

export const P9EForm = component$((props: FormProps<any>) => {
  const formData = useStore<SubmitValue>({});

  const handleChange = $((event: Event) => {
    const target = event.target as HTMLInputElement;
    formData[target.name] =
      target.type === "checkbox" ? target.checked : target.value;
  });

  const handleSubmit = $(() => {
    props.onSubmit$(formData);
  });

  return (
    <div class="container mx-auto p-4">
      <form class="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit$={(e) => {e.preventDefault(); handleSubmit();}}>
        <h2 class="text-xl mb-4 text-center dark:text-white">
          {props.formName}
        </h2>
        {props.schema.map((field) => {
          switch (field.type) {
            case "text":
            case "email":
            case "number":
            case "password":
            case "url":
            case "date":
            case "datetime-local":
            case "month":
            case "week":
            case "time":
            case "search":
            case "tel":
              return (
                <>
                  <label
                    for={field.name}
                    class="label-base block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    {field.label}
                  </label>
                  <div class="flex">
                    {field.icon ? (
                      <span class="input-icon">
                        <P9EIcon icon={field.icon} iconSize={field.iconSize} />
                      </span>
                    ) : (
                      ""
                    )}
                    <input
                      type={field.type}
                      required
                      id={field.name}
                      class={`input-base ${field.error ? "input-error" : "input-focused"}`}
                      placeholder={field.placeholder}
                      onChange$={handleChange}
                    />
                  </div>
                  {field.hint && <p class="hint-base">{field.hint}</p>}
                  {field.error && <p class="error-base">{field.error}</p>}
                </>
              );
            case "checkbox":
              return (
                <div>
                  <label>
                    <input
                      type="checkbox"
                      name={field.name}
                      onChange$={handleChange}
                    />
                    {field.label}
                  </label>
                </div>
              );
            case "radio":
              return (
                <div>
                  <label>{field.label}</label>
                  {field.options?.map((option) => (
                    <label key={field.name}>
                      <input
                        type="radio"
                        name={field.name}
                        value={option}
                        onChange$={handleChange}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              );
            case "textarea":
              return (
                <div>
                  <label>{field.label}</label>
                  <textarea
                    name={field.name}
                    onChange$={handleChange}
                  ></textarea>
                </div>
              );
            case "select":
              return (
                <div>
                  <label>{field.label}</label>
                  <select name={field.name} onChange$={handleChange}>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              );
            // TODO: select multiple is pending
            case "select[multiple]":
              return (
                <div>
                  <label>{field.label}</label>
                  <select multiple name={field.name} onChange$={handleChange}>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              );
            default:
              return null;
          }
        })}
        <P9EButton type="button" label="Submit" onClick$={handleSubmit} />
      </form>
    </div>
  );
});
