import { component$, Slot } from "@builder.io/qwik";
import clsx from "clsx";
import { type P9EBaseProps } from "../types";

/**
 * Button group displays multiple related actions side-by-side and helps with
 * arrangement and spacing.
 */
export const P9EButtonGroup = component$((props: P9EBaseProps) => (
  <div class={clsx("flex flex-wrap gap-6 px-8 lg:gap-8 lg:px-10", props.class)}>
    <Slot />
  </div>
));
