import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import clsx from "clsx";
import {type P9ESelectProps} from "../types";
import { P9EInputLabel } from "./input_label";
import { P9EInputError } from "./input_error";
import { P9EIcon } from "../utility/icon";

/**
 * Select field that allows users to select predefined values. Various
 * decorations can be displayed in or around the field to communicate the
 * entry requirements.
 */
export const P9ESelect = component$(
  ({ value, options, label, error, ...props }: P9ESelectProps) => {
    const { name, required, multiple, placeholder } = props;
    const ANGLE_DOWN = "M10 4h4v9l3.5-3.5l2.42 2.42L12 19.84l-7.92-7.92L6.5 9.5L10 13z";
    // const ANGLE_DOWN = "M9 4h6v8h4.84L12 19.84L4.16 12H9z";
    // Create computed value of selected values
    const values = useSignal<string[]>();
    useTask$(({ track }) => {
      track(() => value);
      values.value = Array.isArray(value)
        ? value
        : value && typeof value === "string"
          ? [value]
          : [];
    });
    return (
      <>
        <P9EInputLabel name={name} label={label} required={required} margin="none" />
        <div class="relative flex items-center">
          <select onSelect$={props.onSelect$}
            {...props}
            class={clsx(
              "w-full appearance-none  rounded-md border-1 bg-transparent outline-none md:h-10 md:text-base",
              error
                ? "border-red-600/50 dark:border-red-400/50"
                : "border-slate-200 hover:border-slate-300 focus:border-sky-600/50 dark:border-slate-800 dark:hover:border-slate-700 dark:focus:border-sky-400/50",
              multiple ? "py-5" : "",
              placeholder && !values.value?.length && "text-slate-500",
            )}
            id={name}
            aria-invalid={!!error}
            aria-errormessage={`${name}-error`}
          >
            <option value="" disabled hidden selected={!value}>
              {placeholder}
            </option>
            {options?.map(({ label, value }) => (
              <option
                key={value}
                value={value}
                selected={values.value?.includes(value)}
              >
                {label}
              </option>
            ))}
          </select>
          {!multiple && (
            <P9EIcon iconSize={24}
              class="pointer-events-none absolute right-0"
              icon={ANGLE_DOWN}
            />
          )}
        </div>
        <P9EInputError name={name} error={error} />
      </>
    );
  },
);