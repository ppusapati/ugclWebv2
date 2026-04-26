import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useAuthContext } from '~/contexts/auth-context';
import { useThemeContext } from '~/contexts/theme-context';
import { useMenuContext } from '~/contexts/menu-context';
import { TenantSwitcher } from '~/components/tenant/tenant-switcher';
import { NotificationBell } from '~/components/notifications/notification-bell';
import ImgLogo from '~/media/logo.png?jsx';
import { Btn } from '~/components/ds';
import { chatService } from '~/services/chat.service';
import { formService } from '~/services/form.service';
import type { Module } from '~/services/types';
import { getUser, isSuperAdminUser } from '~/utils/auth';

export interface MenuItem {
  id: string
  label: string
  icon: string
  subItems?: SubMenuItem[]
}

export interface SubMenuItem {
  id: string
  label: string
  href: string
  icon: string
}

function resolveModuleIcon(module?: Module): string {
  if (module?.icon?.startsWith('i-')) {
    return module.icon;
  }

  return 'i-heroicons-squares-2x2-solid';
}

export const Header = component$(() => {
  const nav = useNavigate();
  const auth = useAuthContext();
  const theme = useThemeContext();
  const menuContext = useMenuContext();
  const activeMainMenu = menuContext.activeMainMenu;
  const activeSidebarItem = menuContext.activeSidebarItem;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const showUserMenu = useSignal(false);
  const isMenuOpen = useSignal<boolean>(false);
  const availableModules = useSignal<Module[]>([]);
  const modulesLoaded = useSignal(false);
  const effectiveUser = auth.user || getUser();
  const isSuperAdmin = isSuperAdminUser(effectiveUser);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const getCurrentUserId = (): string => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return '';
        const parsed = JSON.parse(userStr);
        return String(parsed?.id || parsed?.user_id || '');
      } catch {
        return '';
      }
    };

    const close = chatService.subscribeToChatEvents((event) => {
      if (event.type !== 'new_message' || !event.message) return;
      if (Notification.permission !== 'granted') return;

      const me = getCurrentUserId();
      if (me && String(event.message.sender_id) === me) {
        return;
      }

      // Browser/system notifications are delivered via Web Push (service worker)
      // to avoid duplicate popups when both SSE and push events arrive.
    });

    cleanup(() => {
      close();
    });
  });

  const handleLogout = $(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Full reload ensures layout state is cleared (prevents stale auth shell showing on /login)
    window.location.href = '/login';
  });
  const menuItems: MenuItem[] = [
    {
      id: 'admin',
      label: 'Admin',
      icon: 'i-heroicons-shield-check-solid',
      subItems: [
        { id: 'modules', label: 'Modules', href: '/masters/modules', icon: 'i-heroicons-squares-2x2-solid' },
        { id: 'users', label: 'Users', href: '/users', icon: 'i-heroicons-user-solid' },
        { id: 'roles', label: 'Roles & Permissions', href: '/roles', icon: 'i-heroicons-key-solid' },
        { id: 'settings', label: 'Settings', href: '/settings', icon: 'i-heroicons-cog-6-tooth-solid' },
        { id: 'audit', label: 'Audit Logs', href: '/audit', icon: 'i-heroicons-document-text-solid' },
        { id: 'backup', label: 'Backup', href: '/backup', icon: 'i-heroicons-circle-stack-solid' }
      ]
    }
  ];

  const toggleMenu = $(() => {
    isMenuOpen.value = !isMenuOpen.value;
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    track(() => isMenuOpen.value);
    if (!isMenuOpen.value || typeof window === 'undefined') return;

    if (modulesLoaded.value) {
      return;
    }

    try {
      availableModules.value = await formService.getModules();
    } catch {
      availableModules.value = [];
    } finally {
      modulesLoaded.value = true;
    }
  });

  const handleMainMenuClick = $((menuId: string) => {
    activeMainMenu.value = menuId;
    activeSidebarItem.value = '';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('activeMainMenu', menuId);
      localStorage.removeItem('activeSidebarItem');
    }
    isMenuOpen.value = false;
  });

  return (
    <header class="relative h-[73px] bg-white border-b border-gray-200 shadow-sm">
      <div class="h-full px-6">
        <div class="flex h-full items-center justify-between">
          {/* Logo */}
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 shrink-0 rounded-lg flex items-center justify-center">
              <ImgLogo class="h-12 w-12 object-contain" loading="eager" />
            </div>
            <h1 class="text-xl font-bold text-gray-900">UGCL Portal</h1>
          </div>

          {/* Right Side - Tenant Switcher, Header Icons & User */}
          <div class="flex items-center gap-1.5">
            {/* Tenant Switcher */}
            <TenantSwitcher />

            {/* Individual Header Icons */}

            <div class="relative">
              <Btn
                size="sm"
                variant="ghost"
                class={`h-10 w-10 p-0 rounded-lg bg-transparent border-0 transition-all duration-200 ${
                  isMenuOpen.value
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick$={toggleMenu}
              >
                <i class="i-heroicons-squares-2x2-solid inline-block h-5 w-5" aria-hidden="true"></i>
              </Btn>

              {/* Popup Menu */}
              {/* Overlay first (lower z-index) so popup renders on top */}
              {isMenuOpen.value && (
                <div
                  class="fixed inset-0 z-40"
                  onClick$={() => isMenuOpen.value = false}
                ></div>
              )}

              {/* Popup Menu */}
              {isMenuOpen.value && (
                <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div class="p-4">
                    <div class="grid grid-cols-3 gap-3 place-items-center">
                      {/* Main modules */}
                      {availableModules.value.map((item) => (
                        <Btn
                          key={item.id}
                          size="sm"
                          variant="ghost"
                          class="flex flex-col bg-transparent border-0 items-center justify-center gap-2 p-3 w-16 h-16 rounded-lg hover:bg-gray-50 transition-colors"
                          onClick$={() => handleMainMenuClick(item.id)}
                        >
                          <div class={`${resolveModuleIcon(item)} w-6 h-6 text-gray-600`}></div>
                          <span class="text-xs font-medium text-gray-700 text-center leading-none">{item.name}</span>
                        </Btn>
                      ))}
                      {menuItems
                        .filter((item) => item.id === 'admin' && isSuperAdmin)
                        .map((item) => (
                        <Btn
                          key={item.id}
                          size="sm"
                          variant="ghost"
                          class="flex flex-col bg-transparent border-0 items-center justify-center gap-2 p-3 w-16 h-16 rounded-lg hover:bg-gray-50 transition-colors"
                          onClick$={() => handleMainMenuClick(item.id)}
                        >
                          <div class={`${item.icon} w-6 h-6 text-gray-600`}></div>
                          <span class="text-xs font-medium text-gray-700 text-center leading-none">{item.label}</span>
                        </Btn>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <Btn
              size="sm"
              variant="ghost"
              class="h-10 w-10 p-0 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent border-0 transition-all duration-200"
              title={theme.isDark ? 'Light Mode' : 'Dark Mode'}
              onClick$={() => theme.toggleTheme()}
            >
              {theme.isDark ? (
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" stroke-width="2" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke-linecap="round" stroke-width="2" />
                </svg>
              ) : (
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M21.752 15.002A9.718 9.718 0 0 1 12 22C6.477 22 2 17.523 2 12c0-4.35 2.784-8.05 6.67-9.423a1 1 0 0 1 1.255 1.255A8.001 8.001 0 0 0 20.168 14.08a1 1 0 0 1 1.584.922Z" />
                </svg>
              )}
            </Btn>

            {/* Notifications */}
            <Btn
              size="sm"
              variant="ghost"
              class="h-10 w-10 p-0 rounded-lg border-0 bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              title="Chat"
              onClick$={() => nav('/chat')}
            >
              <i class="i-heroicons-chat-bubble-left-right-solid inline-block h-5 w-5" aria-hidden="true" />
            </Btn>

            <NotificationBell />

            {/* Logout */}
            <Btn
              size="sm"
              variant="ghost"
              class="h-10 w-10 p-0 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 bg-transparent border-0 transition-all duration-200"
              onClick$={handleLogout}
              title="Logout"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
                <path d="M10 17l5-5-5-5" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
                <path d="M15 12H3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
              </svg>
            </Btn>

            {/* Profile */}
            <Btn
              size="sm"
              variant="ghost"
              class="h-10 w-10 p-0 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-100 bg-transparent border-0 transition-all duration-200"
              title="Profile"
              onClick$={() => nav('/profile')}
            >
              <i class="i-heroicons-user-solid inline-block h-5 w-5" aria-hidden="true" />
            </Btn>
          </div>
        </div>
      </div>
    </header>
  );
});