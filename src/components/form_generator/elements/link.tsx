import { component$, Slot } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { P9LinkProps } from "../types";

export const P9ELink = component$<P9LinkProps>((props: P9LinkProps) => {
  return (
    <Link {...props} rel={props.target === "_blank" ? "noreferrer" : undefined}>
      <Slot />
    </Link>
  );
});
