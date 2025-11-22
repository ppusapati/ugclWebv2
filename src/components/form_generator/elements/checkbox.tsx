import { component$ } from "@builder.io/qwik";
import { type P9ECheckboxProps } from "../types";
import { P9EInputError } from "./input_error";
import { P9EInputLabel } from "./input_label";

/**
 * Checkbox that allows users to select an option. The label next to the
 * checkbox describes the selection option.
 */
export const P9ECheckbox = component$(
  ({ label, error, ...props }: P9ECheckboxProps) => {
    const { name, required } = props;
    return (
      <>
       <P9EInputLabel name={name} label={label} required={required} margin={'none'}/>
          <input
            {...props}
            class="mt-1 h-4 w-4 cursor-pointer"
            type="checkbox"
            id={name}
            aria-invalid={!!error}
            aria-errormessage={`${name}-error`}
          />
          {required && (
            <span class="ml-1 text-red-600 dark:text-red-400">*</span>
          )}
        <P9EInputError name={name} error={error} />
      </>
    );
  },
);
