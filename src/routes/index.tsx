import { component$, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { getUser } from "~/utils/auth";

export default component$(() => {
  const state = useStore({ user: null as any, checked: false });
  const nav = useNavigate();
  useVisibleTask$(() => {
    const u = getUser();
    state.user = u;
    state.checked = true; // So we know the check ran
    if (u) nav('/admin/dashboard');
    else nav('/login');
  });

  // Optionally show a loading spinner or nothing
  return <></>;
});
