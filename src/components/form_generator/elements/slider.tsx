import { component$ } from "@builder.io/qwik";
import { type P9ESliderProps } from "../types";
import { P9EInputError } from "./input_error";
import { P9EInputLabel } from "./input_label";

/**
 * Range slider that allows users to select predefined numbers. Various
 * decorations can be displayed in or around the field to communicate the
 * entry requirements.
 */
export const P9ESlider = component$(
  ({ label, error, ...props }: P9ESliderProps) => {
    const { name, required } = props;
    return (
      <>
        <P9EInputLabel name={name} label={label} required={required} />
        <input
          {...props}
          class="w-full"
          type="range"
          id={`${name}+1`}
          aria-invalid={!!error}
          aria-errormessage={`${name}-error`}
        />
        <P9EInputError name={name} error={error} />
      </>
    );
  },
);
