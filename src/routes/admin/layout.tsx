import { component$, isServer, Slot, useStore, useTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { Header } from '~/components/layout/header/header';
import { Sidebar } from '~/components/layout/sidebar';
import { Breadcrumb } from '~/components/breadcrumb';
import { getUser } from '~/utils/auth';

export default component$(() => {
  const state = useStore({ user: null as any, checked: false });
  const nav = useNavigate();

  // Hydrate on client
  useTask$(() => {
    if (isServer) {
      return;
    }

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
        <Header />
        <div class="flex min-h-[calc(100vh-73px)]">
          <Sidebar />
          <main class="flex-1 min-w-0">
            <Breadcrumb />
            <div class="px-6 pt-2 pb-6">
              <Slot />
            </div>
          </main>
        </div>
    </div>

    </>
  );
});
