import {
  $,
  component$,
  Slot,
  useSignal,
  useOnWindow,
  useVisibleTask$,
} from "@builder.io/qwik";
import clsx from "clsx";
import { type P9EExpandableProps } from "../types";

/**
 * Wrapper component to vertically expand or collapse content.
 */
export const P9EExpandable = component$(
  ({ id, expanded, ...props }: P9EExpandableProps) => {
    // Use element signal
    const element = useSignal<HTMLDivElement>();

    /**
     * Updates the expandable element height.
     */
    const updateElementHeight = $(() => {
      if(element.value) {
      element.value.style.height = `${
        expanded ? element.value!.scrollHeight : 0
      }px`;
    }
    });

    // Expand or collapse content when expanded prop change
    useVisibleTask$(({ track }) => {
      track(() => expanded);
      updateElementHeight();
    });

    // Update element height when window size change
    useOnWindow(
      "resize",
      $(async () => {
        if(element.value) {
        element.value.style.maxHeight = "0";
        await updateElementHeight();
        element.value!.style.maxHeight = "";
      }
  }),
    );


    return (
      <div
        class={clsx(
          "!m-0 origin-top duration-200",
          !expanded && "invisible h-0 -translate-y-2 scale-y-75 opacity-0",
          props.class,
        )}
        id={id}
        ref={element}
        aria-hidden={!expanded}
      >
        <Slot />
      </div>
    );
  },
);
