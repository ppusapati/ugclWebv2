import { component$, Slot, useTask$ } from '@builder.io/qwik';
import { routeLoader$, useLocation } from '@builder.io/qwik-city';
import { Header } from '~/components/layout/header/header';
import { Sidebar } from '~/components/layout/sidebar';
import { Breadcrumb } from '~/components/breadcrumb';
import { createSSRApiClient } from '~/services/api-client';
import { extractModules } from '~/services/form.service';
import type { Module } from '~/services/types';
import { useMenuContext } from '~/contexts/menu-context';

export const useLayoutAuth = routeLoader$(({ cookie, redirect, url }) => {
  const path = url.pathname;
  const isAuthRoute =
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/platform');

  if (isAuthRoute) {
    return {
      hasToken: false,
      user: null,
    };
  }

  const token = cookie.get('token')?.value || '';

  if (!token) {
    throw redirect(302, '/login/');
  }

  // The `user` cookie is best-effort only — it carries the full user
  // payload (role_assignments, permissions, etc.), which for admin-type
  // accounts can exceed the ~4KB per-cookie limit once URL-encoded.
  // Browsers silently drop or truncate an oversized cookie with no error
  // surfaced to JS, which previously made this a hard requirement for
  // the auth check — locking out exactly the accounts with the most
  // roles/permissions. The session is valid as long as `token` exists;
  // every subsequent API call is independently authorized via its own
  // Authorization header, not this cookie.
  //
  // Qwik City's cookie.get() already URL-decodes the raw cookie value
  // (parseCookieString calls decodeURIComponent internally) — do not
  // decode it again here, or a payload containing a literal '%' will
  // fail to parse.
  const rawUser = cookie.get('user')?.value || '';
  let user: any = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
  }

  return {
    hasToken: !!token,
    user,
  };
});

export const useLayoutMenuData = routeLoader$(async (requestEvent) => {
  const path = requestEvent.url.pathname;
  const isAuthRoute =
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/platform');

  if (isAuthRoute) {
    return { modules: [] as Module[] };
  }

  const token = requestEvent.cookie.get('token')?.value || '';
  if (!token) {
    return { modules: [] as Module[] };
  }

  try {
    const apiClient = createSSRApiClient(requestEvent);
    const modulesResponse = await Promise.race([
      apiClient.get<unknown>('/modules'),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);
    if (!modulesResponse) {
      return { modules: [] as Module[] };
    }
    const modules = extractModules(modulesResponse);

    return {
      modules,
    };
  } catch {
    return {
      modules: [] as Module[],
    };
  }
});

export default component$(() => {
  useLayoutAuth();
  const layoutMenuData = useLayoutMenuData();
  const moduleDefinitions = useMenuContext().moduleDefinitions;
  const loc = useLocation();
  const isAuthRoute =
    loc.url.pathname.startsWith('/login') ||
    loc.url.pathname.startsWith('/register') ||
    loc.url.pathname.startsWith('/platform');

  const hideBreadcrumb = loc.url.pathname === '/' || loc.url.pathname.startsWith('/analytics/dashboards/view/');

  useTask$(({ track }) => {
    const modules = track(() => layoutMenuData.value.modules);
    if (modules.length > 0) {
      moduleDefinitions.value = modules;
    }
  });

  if (isAuthRoute) {
    return <Slot />;
  }

  // Non-auth routes always use app shell to avoid missing header/sidebar on refresh.
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
