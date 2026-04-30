export interface AdminMenuItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}

import { getAdminMenuItems, resolveAdminRouteItem } from '~/config/route-registry';

export const ADMIN_MENU_ITEMS: AdminMenuItem[] = getAdminMenuItems().map((entry) => ({
  id: entry.id,
  label: entry.label,
  href: entry.href,
  icon: entry.icon,
}));

export function resolveAdminSidebarItem(path: string): string | null {
  return resolveAdminRouteItem(path);
}