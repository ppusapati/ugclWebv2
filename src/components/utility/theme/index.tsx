import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import clsx from "clsx";

export const P9EThemeToggle = component$(() => {
  const isDark = useSignal(false);

  const toggleTheme = $(() => {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle("dark", isDark.value);
    try {
      localStorage.setItem("theme", isDark.value ? "dark" : "light");
    } catch (e) {
      console.error("Failed to save theme to localStorage", e);
    }
  });

  useVisibleTask$(() => {
    let storedTheme;
    try {
      storedTheme = localStorage.getItem("theme");
    } catch (e) {
      console.error("Failed to retrieve theme from localStorage", e);
    }

    if (storedTheme) {
      isDark.value = storedTheme === "dark";
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      isDark.value = prefersDark;
    }

    document.documentElement.classList.toggle("dark", isDark.value);
  });

  return (
    <>
    <div onClick$={toggleTheme} class={clsx("i-carbon-sun dark:i-carbon-moon text-xl dark:text-white")} />
    </>
  );
});
