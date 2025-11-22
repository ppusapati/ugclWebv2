import { $, component$, PropFunction, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';

export const DashboardNavbar = component$((props: { onToggle$: PropFunction<() => void>, name: string, collapsed: boolean }) => {
  const nav = useNavigate();

  // Store for dark mode, with hydration
  const state = useStore({
    darkMode: false,
  });

  // Sync dark mode with html class
  useVisibleTask$(({ track }) => {
    track(() => state.darkMode);
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  });

  // On mount, check localStorage for dark mode
  useVisibleTask$(() => {
    state.darkMode = localStorage.getItem('darkMode') === 'true';
  });

  const handleLogout = $(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    nav('/login');
  });

  return (
    <header class="sticky top-0 z-30 w-full bg-white dark:bg-dark-900 shadow-sm h-16 flex items-center gap-4 border-b border-light-200 dark:border-dark-700">
      {/* Collapse button */}
      <span
        title="Toggle Sidebar"
        class={[
          props.collapsed
            ? 'i-tabler-layout-sidebar-right-collapse-filled'
            : 'i-tabler-layout-sidebar-left-collapse-filled',
          'w-8 h-8 ml-2 mt-2 p-2 hover:bg-dark-500 dark:text-white cursor-pointer transition-colors'
        ].join(' ')}
        onClick$={props.onToggle$}
      />

      {/* Search bar */}
      <div class="flex items-center gap-3 flex-1 max-w-md">
        <form class="w-full">
          <div class="relative flex items-center w-full">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center dark:text-white i-tabler-search w-5 h-5"></span>
            <input
              id="search-input"
              type="text"
              placeholder="Search or type command..."
              class="h-11 w-full rounded-lg border border-gray-200 bg-transparent pl-11 pr-14 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:outline-none dark:border-gray-800 dark:bg-dark-900 dark:text-white dark:placeholder:text-white/40"
              style="line-height: 1.25;"
            />
            <button
              id="search-button"
              type="submit"
              class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-2 pt-2 text-xs text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
            >
              <span class="i-tabler-command w-4 h-4"></span>
            </button>
          </div>
        </form>
      </div>

      <div class="flex-1" />

      {/* Dark mode toggle button */}
        <span title={state.darkMode ? 'Light Mode' : 'Dark Mode'}  onClick$={() => (state.darkMode = !state.darkMode)} class={[state.darkMode ? 'i-tabler-sun text-yellow-400' : 'i-tabler-moon text-gray-600',
          "transition h-6 w-6 p-2"
        ]} />

      {/* Logout and user */}
      <span class="i-tabler-logout w-6 h-6 relative hover:bg-dark-500 dark:hover:bg-dark-700 p-2 rounded-full transition"
        onClick$={handleLogout}>
        Logout
      </span>
      <div class="flex items-center justify-center text-primary-700 text-lg">
        {props.name}
      </div>
    </header>
  );
});
