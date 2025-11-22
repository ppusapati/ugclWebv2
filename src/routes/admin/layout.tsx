import { component$, Slot, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { Header } from '~/components/layout/header/header';
import { Sidebar } from '~/components/layout/sidebar';
import { Breadcrumb } from '~/components/breadcrumb';
import { MenuProvider } from '~/contexts/menu-context';
import { getUser } from '~/utils/auth';

export default component$(() => {
  const state = useStore({ user: null as any, checked: false });
  const nav = useNavigate();

  // Hydrate on client
  useVisibleTask$(() => {
    const u = getUser();
    state.user = u;
    state.checked = true;
    if (!u) nav('/login');
  });

  if (!state.checked) {
    return <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>;
  }

  if (!state.user) return null;

  return (
    <>
     <div class="min-h-screen bg-gray-50">
      <MenuProvider>
        <Header />
        <div class="flex">
          <Sidebar />
          <main class="flex-1">
            <Breadcrumb />
            <div class="px-6 pb-6">
              <Slot />
            </div>
          </main>
        </div>
      </MenuProvider>
    </div>

    </>
  );
});
