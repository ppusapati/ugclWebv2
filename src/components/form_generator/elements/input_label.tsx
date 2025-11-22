import { component$ } from "@builder.io/qwik";
import { P9EInputLabelProps } from "../types";

/**
 * Input label for a form field.
 */
export const P9EInputLabel = component$(
  ({ name, label, required, margin, error }: P9EInputLabelProps) => (
    <>
      {label && (
        <label
          class={['labelbase',
            !margin && "mb-4",
            error ? "text-danger-500" :'', 
          ]}
          for={name}
        >
          {label}{" "}
          {required && (
            <span class="ml-1 text-red-600 dark:text-red-400">*</span>
          )}
        </label>
      )}
    </>
  ),
);
