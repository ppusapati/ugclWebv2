import { component$, useStylesScoped$ } from "@builder.io/qwik";
import { type P9EIconProps } from "../types";

const iconStyles = `
  :host {
    --icon-color: black;
  }

  @media (prefers-color-scheme: dark) {
    :host {
      --icon-color: white;
    }
  }

  svg {
    fill: var(--icon-color);
  }
`;

/**
 * Generate svg images with default view box of 0 0 24 24.
 * @param {P9EIconProps} props - Input parameters defined in interface P9EIconProps
 */
export const P9EIcon = component$((props: P9EIconProps) => {
  useStylesScoped$(iconStyles);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={props.iconSize || 24}
      height={props.iconSize || 24}
      style={props.style}
      onClick$={props.iconClick$}
      class={props.class}
    >
      <path fill={props.iconColor || "currentcolor"} d={props.icon} />
    </svg>
  );
});
