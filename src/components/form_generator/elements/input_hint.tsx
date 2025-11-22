import { component$} from "@builder.io/qwik";
import { P9EExpandable } from "../utility/expandable";
import { type P9EInputHintProps } from "../types";

/**
 * Input error that tells the user what to do to fix the problem.
 */
export const P9EInputHint = component$(
  ({ name, hint }: P9EInputHintProps) => {
    

    return (
      <P9EExpandable expanded={!!hint}>
        <span
          class="hintbase"
          id={`${name}-hint`}
        >
          {hint}
        </span>
      </P9EExpandable>
    );
  },
);
