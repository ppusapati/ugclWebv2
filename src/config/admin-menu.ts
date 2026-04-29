export interface AdminMenuItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}

export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  { id: 'dashboard', label: 'Home', href: '/', icon: 'i-heroicons-home-solid' },
  { id: 'modules', label: 'Modules', href: '/masters/module', icon: 'i-streamline-module-three-solid' },
  { id: 'business-vertical', label: 'Business - Vertical', href: '/masters/business', icon: 'i-heroicons-building-office-solid' },
  { id: 'sites', label: 'Sites', href: '/masters/sites', icon: 'i-heroicons-map-pin-solid' },
  { id: 'roles', label: 'Roles & Permissions', href: '/rbac/roles', icon: 'i-icon-park-permissions' },
  { id: 'attributes', label: 'Attributes', href: '/attributes', icon: 'i-heroicons-tag-solid' },
  { id: 'policies', label: 'ABAC Policies', href: '/policies', icon: 'i-heroicons-shield-check-solid' },
  { id: 'users', label: 'Users', href: '/users', icon: 'i-heroicons-user-solid' },
  { id: 'forms', label: 'Forms', href: '/forms', icon: 'i-heroicons-document-text-solid' },
  { id: 'workflow', label: 'Work Flows', href: '/workflows', icon: 'i-heroicons-document-text-solid' },
  { id: 'projects', label: 'Projects', href: '/projects', icon: 'i-heroicons-document-text-solid' },
  { id: 'documents', label: 'Documents', href: '/documents', icon: 'i-heroicons-server-solid' },
  { id: 'attendance', label: 'Attendance', href: '/masters/attendance', icon: 'i-heroicons-clipboard-document-list-solid' },
  { id: 'reports', label: 'Reports', href: '/analytics/reports', icon: 'i-heroicons-document-chart-bar-solid' },
  { id: 'dashboards', label: 'Dashboards', href: '/analytics/dashboards', icon: 'i-heroicons-document-chart-bar-solid' },
  { id: 'chat', label: 'Chat', href: '/chat', icon: 'i-heroicons-chat-bubble-left-right-solid' },
  { id: 'notifications', label: 'Notifications', href: '/notifications', icon: 'i-heroicons-document-chart-bar-solid' },
  { id: 'integrations', label: 'Integrations', href: '/integrations', icon: 'i-heroicons-arrows-right-left-solid' }
];

export function resolveAdminSidebarItem(path: string): string | null {
  const matchedItem = [...ADMIN_MENU_ITEMS]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => (item.href === '/' ? path === '/' : path.startsWith(item.href)));

  return matchedItem?.id || null;
}