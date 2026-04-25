import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import clsx from "clsx";
import { P9EInputError } from "./input_error";
import { P9EInputLabel } from "./input_label";
import {type P9ETextInputProps}  from "../types";
import { P9EInputHint } from "./input_hint";

/**
 * Text input field that users can type into. Various decorations can be
 * displayed in or around the field to communicate the entry requirements.
 */
export const P9ETextInput = component$(
  ({ label, value, error, type, hint, ...props }: P9ETextInputProps) => {
    const { name, required } = props;
    const input = useSignal<string | number>();
    useTask$(({ track }) => {
      if (!Number.isNaN(track(() => value))) {
        input.value = value;
      }
    });
    return (
      <>
        <P9EInputLabel name={name} label={label} required={required} error={error} margin={'none'}/>
        <input
          {...props}
          class={clsx('inputbase',
            error
              ? "inputerror"
              : "",
          )}
          id={name}
          value={input.value}
          type={type}
          // Todo disable
          disabled={props.disabled}
          aria-invalid={!!error}
          aria-errormessage={`${name}-error`}
        />
        <P9EInputHint name={name} hint={hint} />
        <P9EInputError name={name} error={error} />
      </>
    );
  },
);
