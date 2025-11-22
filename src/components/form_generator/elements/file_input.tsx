import {
  component$,
  type NoSerialize,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import clsx from "clsx";
import { P9EInputLabel } from "./input_label";
import { P9EInputError } from "./input_error";
import { type P9EFileInputProps } from "../types";
import { P9EInputHint } from "./input_hint";

/**
 * File input field that users can click or drag files into. Various
 * decorations can be displayed in or around the field to communicate the entry
 * requirements.
 */
export const P9EFileInput = component$(
  ({ value, label, error, ...props }: P9EFileInputProps) => {
    const { name, required, multiple } = props;

    // Create computed value of selected files
    const files = useSignal<NoSerialize<Blob>[] | NoSerialize<File>[]>();
    useTask$(({ track }) => {
      track(() => value);
      files.value = value ? (Array.isArray(value) ? value : [value]) : [];
    });

    return (
      <>
        <P9EInputLabel name={name} label={label} required={required} />
        <div
          class={clsx(
            "relative flex w-full items-center justify-center rounded-2xl border-[3px] border-dashed border-slate-200 p-8 text-center focus-within:border-sky-600/50 hover:border-slate-300 dark:border-slate-800 dark:focus-within:border-sky-400/50 dark:hover:border-slate-700 md:min-h-[112px] md:text-lg lg:min-h-[128px] lg:p-10 lg:text-xl",
            !files.value?.length && "text-dark-400",
          )}
        >
          {files.value?.length
            ? `Selected file${multiple ? "s" : ""}: ${files.value
                .map((file) => (file instanceof File ? file.name : ""))
                .join(", ")}`
            : `Click or drag and drop file${multiple ? "s" : ""}`}
          <input
            {...props}
            class="inputbase"
            type="file"
            id={name}
            aria-invalid={!!error}
            aria-errormessage={`${name}-error`}
          />
        </div>
        <P9EInputHint hint={props.hint} />
        <P9EInputError name={name} error={error} />
      </>
    );
  },
);
