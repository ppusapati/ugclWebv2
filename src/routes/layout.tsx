import { component$, Slot, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$, useLocation, useNavigate } from '@builder.io/qwik-city';
import { Header } from '~/components/layout/header/header';
import { Sidebar } from '~/components/layout/sidebar';
import { Breadcrumb } from '~/components/breadcrumb';
import { getUser } from '~/utils/auth';

export const useLayoutAuth = routeLoader$(({ cookie }) => {
  const token = cookie.get('token')?.value || '';
  const rawUser = cookie.get('user')?.value || '';

  let user: any = null;
  if (rawUser) {
    try {
      user = JSON.parse(decodeURIComponent(rawUser));
    } catch {
      user = null;
    }
  }

  return {
    hasToken: !!token,
    user,
  };
});

export default component$(() => {
  const auth = useLayoutAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const state = useStore({
    user: (auth.value.user || (auth.value.hasToken ? ({ id: 'session' } as any) : null)) as any,
    checked: true,
  });
  const isLandingRoute = loc.url.pathname === '/';
  const hideBreadcrumb = loc.url.pathname === '/' || loc.url.pathname.startsWith('/analytics/dashboards/view/');
  const isPublicRoute =
    isLandingRoute ||
    loc.url.pathname.startsWith('/login') ||
    loc.url.pathname.startsWith('/register');

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const u = getUser();
    if (u) {
      state.user = u;
      return;
    }

    if (auth.value.user) {
      state.user = auth.value.user;
      try {
        localStorage.setItem('user', JSON.stringify(auth.value.user));
      } catch {
        // Ignore storage sync errors.
      }
      return;
    }

    state.user = null;
    if (!u && !isPublicRoute) {
      void nav('/login');
    }
  });

  // Not authenticated — render bare slot (login page fills this)
  if (!state.user && !isLandingRoute) {
    return <Slot />;
  }

  // Authenticated — full app shell
  return (
    <div class="min-h-screen bg-gray-50">
      <Header />
      <div class="flex min-h-[calc(100vh-73px)]">
        <Sidebar />
        <main class="flex-1 min-w-0">
          {!hideBreadcrumb && <Breadcrumb />}
          <div class="px-6 pt-2 pb-6">
            <Slot />
          </div>
        </main>
      </div>
    </div>
  );
});
