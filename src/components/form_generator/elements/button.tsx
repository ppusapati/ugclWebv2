import { $, component$, useSignal, useStore } from "@builder.io/qwik";
import { P9EIcon } from "../utility/icon";
import { type P9EButtonProps, type SubmitValue } from "../types";
import { clsx } from "clsx";
import { P9ESpinner } from "../utility/spinner";

export const P9EButton = component$<P9EButtonProps>((props: P9EButtonProps) => {
  const submitData = useStore<SubmitValue>({});
  const loading = useSignal(false);
  const handleSubmit = $(async () => {
    console.log(submitData);
    loading.value = true;
    await props.onClick$!(submitData);
    loading.value = false;
  });

  return (
      <button
        {...props}
        class={clsx(
          "btn",
          props.variant === "primary" && "btn-primary",
          props.variant === "secondary" && "btn-secondary",
          props.variant === "success" && "btn-success",
          props.variant === "danger" && "btn-danger",
          props.variant === "warning" && "btn-warning",
          props.variant === "info" && "btn-info",
          props.variant === "light" && "btn-light",
          props.variant === "dark" && "btn-dark",
        )}
        onClick$={props.onClick$ && handleSubmit}
      >
        {props.icon && (
          <P9EIcon
            icon={`${props.icon}`}
            iconColor={`${props.iconColor}`}
            iconSize={props.iconSize ?? 24}
            class="pr-2"
          />
        )}
        <div
          class={clsx(
            "transition-[opacity,transform,visibility] duration-200",
            loading.value || props.loading
              ? "invisible translate-x-5 opacity-0"
              : "visible delay-200",
          )}
        >
          {props.label}
        </div>
        <div
          class={clsx(
            "absolute duration-200",
            loading.value || props.loading
              ? "visible delay-200"
              : "invisible -translate-x-5 opacity-0",
          )}
        >
          <P9ESpinner />
        </div>
      </button>
  );
});
