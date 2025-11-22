import { component$, Slot, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { DashboardNavbar } from '~/components/navbar';
import {Sidebar}  from '~/components/layout/sidebar';
import { getUser } from '~/utils/auth';

export default component$(() => {
  const state = useStore({ sidebarCollapsed: false, user: null as any, checked: false });
 const nav = useNavigate(); 

  // Hydrate on client
  useVisibleTask$(() => {
    const u = getUser();
    state.user = u;
    state.checked = true; // So we know the check ran
    if (!u) nav('/login');
  });

  if (!state.checked) {
    // Optionally show a spinner here
    return <div>Loading...</div>;
  }

  if (!state.user) return null; 

  return (
    <div class="flex min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Sidebar */}
      <Sidebar collapsed={state.sidebarCollapsed}
        onToggle$={() => state.sidebarCollapsed = !state.sidebarCollapsed} />

      {/* Main area: header + content */}
      <div class={[
        "transition-all duration-300 min-h-screen flex-1",
        state.sidebarCollapsed ? "ml-20" : "ml-64"
      ]}>
        {/* Header */}
        <DashboardNavbar onToggle$={() => state.sidebarCollapsed = !state.sidebarCollapsed} name= {state.user.name} collapsed={state.sidebarCollapsed}  />

        {/* Main content (slot) */}
        <main class="flex-1 overflow-y-auto p-6">
          <Slot />
        </main>
      </div>
    </div>
  );
});
