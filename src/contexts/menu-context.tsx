import { createContextId, useContext, useContextProvider, useSignal, component$, Slot, useVisibleTask$, useTask$, $ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import { STORAGE_KEYS } from '~/config/storage-keys';
import { resolveAdminSidebarItem } from '~/config/admin-menu';
import type { Module } from '~/services/types';

export interface MenuContextType {
  activeMainMenu: Signal<string>;
  activeSidebarItem: Signal<string>;
  moduleDefinitions: Signal<Module[]>;
  setActiveFromRoute: (path: string) => void;
}

export const MenuContext = createContextId<MenuContextType>('menu-context');

export const useMenuContext = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenuContext must be used within a MenuProvider');
  }
  return context;
};

export const MenuProvider = component$(() => {
  const location = useLocation();
  const activeMainMenu = useSignal<string>('admin');
  const activeSidebarItem = useSignal<string>('');
  const moduleDefinitions = useSignal<Module[]>([]);

  // Function to determine active menu from route
  const setActiveFromRoute = $((path: string) => {
    const matchingAdminItem = resolveAdminSidebarItem(path);
    if (matchingAdminItem) {
      activeMainMenu.value = 'admin';
      activeSidebarItem.value = matchingAdminItem;

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_MAIN_MENU, 'admin');
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SIDEBAR_ITEM, matchingAdminItem);
      }
      return;
    }

    const formRouteMatch = path.match(/^\/masters\/business\/[^/]+\/forms\/([^/]+)/i);
    if (formRouteMatch?.[1]) {
      activeSidebarItem.value = decodeURIComponent(formRouteMatch[1]);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SIDEBAR_ITEM, activeSidebarItem.value);
      }
      return;
    }

    const reportRouteMatch = path.match(/^\/analytics\/reports\/view\/([^/]+)/i);
    if (reportRouteMatch?.[1]) {
      activeSidebarItem.value = `report-${decodeURIComponent(reportRouteMatch[1])}`;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SIDEBAR_ITEM, activeSidebarItem.value);
      }
      return;
    }

    const mainSection = path.split('/')[1];
    if (!mainSection) {
      return;
    }

    const matchingModule = moduleDefinitions.value.find((module) => {
      const moduleTokens = [
        module.id,
        module.code,
        module.name,
        module.name?.toLowerCase().replace(/\s+/g, '_'),
        module.name?.toLowerCase().replace(/\s+/g, ''),
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return moduleTokens.includes(mainSection.toLowerCase());
    });

    if (matchingModule) {
      activeMainMenu.value = matchingModule.id;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_MAIN_MENU, matchingModule.id);
      }
    }
  });

  // Restore from localStorage and sync with current route on mount
  useTask$(({ track }) => {
    track(() => location.url.pathname);
    void setActiveFromRoute(location.url.pathname);
  });

  // Restore from localStorage and sync with current route on mount
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const savedMainMenu = localStorage.getItem(STORAGE_KEYS.ACTIVE_MAIN_MENU);
        const savedSidebarItem = localStorage.getItem(STORAGE_KEYS.ACTIVE_SIDEBAR_ITEM);

        if (savedMainMenu) {
          activeMainMenu.value = savedMainMenu;
        }
        if (savedSidebarItem) {
          activeSidebarItem.value = savedSidebarItem;
        }
      }
    } catch (error) {
      console.warn('Menu state restore failed:', error);
    }

  }, { strategy: 'document-ready' });

  const contextValue: MenuContextType = {
    activeMainMenu,
    activeSidebarItem,
    moduleDefinitions,
    setActiveFromRoute,
  };

  useContextProvider(MenuContext, contextValue);

  return <Slot />;
});