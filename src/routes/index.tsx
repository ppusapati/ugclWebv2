import { component$, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { getUser } from "~/utils/auth";

export default component$(() => {
  const state = useStore({ user: null as any, checked: false });
  const nav = useNavigate();
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const u = getUser();
    state.user = u;
    state.checked = true; // So we know the check ran

    void nav(u ? '/admin/dashboard' : '/login');
  });

  return (
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div class="text-center">
        <div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
        <p class="mt-4 text-gray-600">
          {state.checked ? 'Redirecting...' : 'Loading...'}
        </p>
      </div>
    </div>
  );
});
