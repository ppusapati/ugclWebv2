import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import { isBrowser } from "@builder.io/qwik/build";
import { P9EExpandable } from "../utility/expandable";
import { type P9EInputErrorProps } from "../types";

/**
 * Input error that tells the user what to do to fix the problem.
 */
export const P9EInputError = component$(
  ({ name, error }: P9EInputErrorProps) => {
    // Use frozen error signal
    const frozenError = useSignal<string>();

    // Freeze error while element collapses to prevent UI from jumping
    useTask$(({ track, cleanup }) => {
      const nextError = track(() => error);
      if (isBrowser && !nextError) {
        const timeout = setTimeout(() => (frozenError.value = nextError), 200);
        cleanup(() => clearTimeout(timeout));
      } else {
        frozenError.value = nextError;
      }
    });

    return (
      <P9EExpandable expanded={!!error}>
        <div
          class="errorbase"
          id={`${name}-error`}
        >
          {frozenError.value}
        </div>
      </P9EExpandable>
    );
  },
);
