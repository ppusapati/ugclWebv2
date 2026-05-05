export interface RouteRegistryEntry {
  pathPattern: string;
  label: string;
  icon?: string;
  parentPathPattern?: string;
  adminMenuId?: string;
  adminMenuLabel?: string;
  adminMenuOrder?: number;
  helpTopicId?: string;
  helpVariantId?: string;
}

export interface BreadcrumbRouteConfig {
  path: string;
  label: string;
  icon?: string;
  parent?: string;
}

export interface AdminMenuProjection {
  id: string;
  label: string;
  href: string;
  icon: string;
  order: number;
}

export interface HelpRouteMatch {
  topicId: string;
  variantId?: string;
  score: number;
}

const ROUTE_REGISTRY: RouteRegistryEntry[] = [
  { pathPattern: '/', label: 'Admin', icon: 'i-heroicons-shield-check-solid', adminMenuId: 'dashboard', adminMenuLabel: 'Home', adminMenuOrder: 10, helpTopicId: 'dashboard' },
  { pathPattern: '/dashboard', label: 'Dashboard', icon: 'i-heroicons-home-solid', helpTopicId: 'dashboard' },
  { pathPattern: '/help', label: 'Help Center', icon: 'i-heroicons-question-mark-circle-solid', parentPathPattern: '/', helpTopicId: 'general' },

  { pathPattern: '/projects', label: 'Projects', icon: 'i-heroicons-folder-open-solid', parentPathPattern: '/', adminMenuId: 'projects', adminMenuOrder: 110, helpTopicId: 'projects', helpVariantId: 'list' },
  { pathPattern: '/projects/create', label: 'New Project', icon: 'i-heroicons-plus-circle-solid', parentPathPattern: '/projects', helpTopicId: 'projects', helpVariantId: 'create' },
  { pathPattern: '/projects/:projectId', label: 'Project Detail', icon: 'i-heroicons-folder-open-solid', parentPathPattern: '/projects', helpTopicId: 'projects' },
  { pathPattern: '/projects/:projectId/tasks', label: 'Tasks', icon: 'i-heroicons-clipboard-document-list-solid', parentPathPattern: '/projects', helpTopicId: 'projects', helpVariantId: 'project-task-list' },
  { pathPattern: '/projects/:projectId/tasks/create', label: 'New Task', icon: 'i-heroicons-plus-circle-solid', parentPathPattern: '/projects/:projectId/tasks', helpTopicId: 'projects', helpVariantId: 'project-task-create' },

  { pathPattern: '/tasks', label: 'Tasks', icon: 'i-heroicons-clipboard-document-list-solid', parentPathPattern: '/projects', helpTopicId: 'tasks', helpVariantId: 'list' },
  { pathPattern: '/tasks/:id', label: 'Task Detail', icon: 'i-heroicons-clipboard-document-list-solid', parentPathPattern: '/tasks', helpTopicId: 'tasks', helpVariantId: 'detail' },

  { pathPattern: '/forms', label: 'Forms', icon: 'i-heroicons-document-text-solid', parentPathPattern: '/', adminMenuId: 'forms', adminMenuOrder: 90, helpTopicId: 'forms', helpVariantId: 'list' },
  { pathPattern: '/forms/new', label: 'Create Form', icon: 'i-heroicons-plus-circle-solid', parentPathPattern: '/forms', helpTopicId: 'forms', helpVariantId: 'create' },
  { pathPattern: '/forms/:formCode', label: 'Edit Form', icon: 'i-heroicons-document-text-solid', parentPathPattern: '/forms', helpTopicId: 'forms', helpVariantId: 'edit' },
  { pathPattern: '/forms/:formCode/preview', label: 'Form Preview', icon: 'i-heroicons-eye-solid', parentPathPattern: '/forms/:formCode', helpTopicId: 'forms', helpVariantId: 'preview' },

  { pathPattern: '/masters', label: 'Masters', icon: 'i-heroicons-cube-solid', parentPathPattern: '/' },
  { pathPattern: '/masters/module', label: 'Modules', icon: 'i-heroicons-squares-plus-solid', parentPathPattern: '/masters', adminMenuId: 'modules', adminMenuOrder: 20, helpTopicId: 'masters-and-business', helpVariantId: 'modules' },
  { pathPattern: '/masters/business', label: 'Business Verticals', icon: 'i-heroicons-building-office-solid', parentPathPattern: '/masters', adminMenuId: 'business-vertical', adminMenuLabel: 'Business - Vertical', adminMenuOrder: 30, helpTopicId: 'masters-and-business', helpVariantId: 'business-verticals' },
  { pathPattern: '/masters/business/:code', label: 'Business Vertical Detail', icon: 'i-heroicons-building-office-solid', parentPathPattern: '/masters/business', helpTopicId: 'masters-and-business', helpVariantId: 'business-verticals' },
  { pathPattern: '/masters/business/:code/roles', label: 'Business Roles', icon: 'i-heroicons-shield-check-solid', parentPathPattern: '/masters/business/:code', helpTopicId: 'masters-and-business', helpVariantId: 'business-verticals' },
  { pathPattern: '/masters/sites', label: 'Sites', icon: 'i-heroicons-map-pin-solid', parentPathPattern: '/masters', adminMenuId: 'sites', adminMenuOrder: 40, helpTopicId: 'masters-and-business', helpVariantId: 'sites' },
  { pathPattern: '/masters/sites/new', label: 'New Site', icon: 'i-heroicons-plus-circle-solid', parentPathPattern: '/masters/sites', helpTopicId: 'masters-and-business', helpVariantId: 'site-create-edit' },
  { pathPattern: '/masters/sites/:id/edit', label: 'Edit Site', icon: 'i-heroicons-pencil-square-solid', parentPathPattern: '/masters/sites', helpTopicId: 'masters-and-business', helpVariantId: 'site-create-edit' },
  { pathPattern: '/masters/sites/:id/access', label: 'Site Access', icon: 'i-heroicons-key-solid', parentPathPattern: '/masters/sites', helpTopicId: 'masters-and-business', helpVariantId: 'site-access' },
  { pathPattern: '/masters/attendance', label: 'Attendance', icon: 'i-heroicons-clipboard-document-list-solid', parentPathPattern: '/masters', adminMenuId: 'attendance', adminMenuOrder: 130, helpTopicId: 'masters-and-business', helpVariantId: 'attendance' },
  { pathPattern: '/masters/business/:code/sites', label: 'Sites', icon: 'i-heroicons-map-pin-solid', parentPathPattern: '/masters/business/:code', helpTopicId: 'masters-and-business', helpVariantId: 'sites' },
  { pathPattern: '/masters/business/:code/sites/new', label: 'New Site', icon: 'i-heroicons-plus-circle-solid', parentPathPattern: '/masters/business/:code/sites', helpTopicId: 'masters-and-business', helpVariantId: 'site-create-edit' },
  { pathPattern: '/masters/business/:code/sites/:id/edit', label: 'Edit Site', icon: 'i-heroicons-pencil-square-solid', parentPathPattern: '/masters/business/:code/sites', helpTopicId: 'masters-and-business', helpVariantId: 'site-create-edit' },
  { pathPattern: '/masters/business/:code/sites/:id/access', label: 'Site Access', icon: 'i-heroicons-key-solid', parentPathPattern: '/masters/business/:code/sites', helpTopicId: 'masters-and-business', helpVariantId: 'site-access' },
  { pathPattern: '/masters/business/:code/attendance', label: 'Attendance', icon: 'i-heroicons-clipboard-document-list-solid', parentPathPattern: '/masters/business/:code', helpTopicId: 'masters-and-business', helpVariantId: 'attendance' },
  { pathPattern: '/masters/business/:code/forms', label: 'Form Catalog', icon: 'i-heroicons-document-text-solid', parentPathPattern: '/masters/business/:code', helpTopicId: 'forms', helpVariantId: 'list' },
  { pathPattern: '/masters/business/:code/forms/:formCode', label: 'Form Detail', icon: 'i-heroicons-document-text-solid', parentPathPattern: '/masters/business/:code/forms', helpTopicId: 'forms', helpVariantId: 'edit' },
  { pathPattern: '/masters/business/:code/submissions', label: 'Submissions', icon: 'i-heroicons-inbox-stack-solid', parentPathPattern: '/masters/business/:code', helpTopicId: 'submissions', helpVariantId: 'list' },
  { pathPattern: '/masters/business/:code/submissions/:submissionId', label: 'Submission Detail', icon: 'i-heroicons-document-check-solid', parentPathPattern: '/masters/business/:code/submissions', helpTopicId: 'submissions', helpVariantId: 'detail' },

  { pathPattern: '/users', label: 'Users', icon: 'i-heroicons-users-solid', parentPathPattern: '/', adminMenuId: 'users', adminMenuOrder: 80, helpTopicId: 'users-and-access', helpVariantId: 'users' },
  { pathPattern: '/rbac', label: 'RBAC', icon: 'i-heroicons-shield-check-solid', parentPathPattern: '/', helpTopicId: 'users-and-access', helpVariantId: 'roles-and-permissions' },
  { pathPattern: '/rbac/roles', label: 'Roles & Permissions', icon: 'i-heroicons-finger-print-solid', parentPathPattern: '/rbac', adminMenuId: 'roles', adminMenuOrder: 50, helpTopicId: 'users-and-access', helpVariantId: 'roles-and-permissions' },
  { pathPattern: '/rbac/global-roles', label: 'Global Roles', icon: 'i-heroicons-shield-check-solid', parentPathPattern: '/rbac', helpTopicId: 'users-and-access', helpVariantId: 'roles-and-permissions' },
  { pathPattern: '/rbac/business-roles', label: 'Business Roles', icon: 'i-heroicons-building-office-solid', parentPathPattern: '/rbac', helpTopicId: 'users-and-access', helpVariantId: 'roles-and-permissions' },
  { pathPattern: '/rbac/permissions', label: 'Permissions', icon: 'i-heroicons-key-solid', parentPathPattern: '/rbac', helpTopicId: 'users-and-access', helpVariantId: 'roles-and-permissions' },
  { pathPattern: '/policies', label: 'ABAC Policies', icon: 'i-heroicons-shield-check-solid', parentPathPattern: '/', adminMenuId: 'policies', adminMenuOrder: 70, helpTopicId: 'users-and-access', helpVariantId: 'policies' },
  { pathPattern: '/policies/create', label: 'Create Policy', icon: 'i-heroicons-plus-circle-solid', parentPathPattern: '/policies', helpTopicId: 'users-and-access', helpVariantId: 'policies' },
  { pathPattern: '/policies/:id', label: 'Policy Detail', icon: 'i-heroicons-shield-check-solid', parentPathPattern: '/policies', helpTopicId: 'users-and-access', helpVariantId: 'policies' },
  { pathPattern: '/attributes', label: 'Attributes', icon: 'i-heroicons-tag-solid', parentPathPattern: '/', adminMenuId: 'attributes', adminMenuOrder: 60, helpTopicId: 'users-and-access', helpVariantId: 'attributes' },

  { pathPattern: '/analytics/reports', label: 'Reports', icon: 'i-heroicons-document-chart-bar-solid', parentPathPattern: '/', adminMenuId: 'reports', adminMenuOrder: 140, helpTopicId: 'reports', helpVariantId: 'report-list' },
  { pathPattern: '/analytics/reports/builder', label: 'Report Builder', icon: 'i-heroicons-chart-bar-solid', parentPathPattern: '/analytics/reports', helpTopicId: 'reports', helpVariantId: 'report-builder' },
  { pathPattern: '/analytics/reports/view/:id', label: 'Report View', icon: 'i-heroicons-chart-pie-solid', parentPathPattern: '/analytics/reports', helpTopicId: 'reports', helpVariantId: 'report-view' },
  { pathPattern: '/analytics/dashboards', label: 'Dashboards', icon: 'i-heroicons-squares-2x2-solid', parentPathPattern: '/', adminMenuId: 'dashboards', adminMenuOrder: 150, helpTopicId: 'reports' },
  { pathPattern: '/analytics/dashboards/builder', label: 'Dashboard Builder', icon: 'i-heroicons-presentation-chart-line-solid', parentPathPattern: '/analytics/dashboards', helpTopicId: 'reports', helpVariantId: 'dashboard-builder' },
  { pathPattern: '/analytics/dashboards/view/:id', label: 'Dashboard View', icon: 'i-heroicons-presentation-chart-line-solid', parentPathPattern: '/analytics/dashboards', helpTopicId: 'reports', helpVariantId: 'dashboard-view' },

  { pathPattern: '/documents', label: 'Documents', icon: 'i-heroicons-server-solid', parentPathPattern: '/', adminMenuId: 'documents', adminMenuOrder: 120, helpTopicId: 'documents' },
  { pathPattern: '/notifications', label: 'Notifications', icon: 'i-heroicons-bell-solid', parentPathPattern: '/', adminMenuId: 'notifications', adminMenuOrder: 170, helpTopicId: 'notifications' },
  { pathPattern: '/notifications/preferences', label: 'Notification Preferences', icon: 'i-heroicons-adjustments-horizontal-solid', parentPathPattern: '/notifications', helpTopicId: 'notifications' },
  { pathPattern: '/chat', label: 'Chat', icon: 'i-heroicons-chat-bubble-left-right-solid', parentPathPattern: '/', adminMenuId: 'chat', adminMenuOrder: 160, helpTopicId: 'notifications' },
  { pathPattern: '/chats', label: 'Chats', icon: 'i-heroicons-chat-bubble-left-right-solid', parentPathPattern: '/', helpTopicId: 'notifications' },
  { pathPattern: '/workflows', label: 'Workflows', icon: 'i-heroicons-arrow-path-solid', parentPathPattern: '/', adminMenuId: 'workflow', adminMenuLabel: 'Work Flows', adminMenuOrder: 100, helpTopicId: 'workflows' },
  { pathPattern: '/profile', label: 'Profile', icon: 'i-heroicons-user-circle-solid', parentPathPattern: '/', helpTopicId: 'profile' },
  { pathPattern: '/change-password', label: 'Change Password', icon: 'i-heroicons-lock-closed-solid', parentPathPattern: '/profile', helpTopicId: 'profile' },
  { pathPattern: '/integrations', label: 'Integrations', icon: 'i-heroicons-arrows-right-left-solid', parentPathPattern: '/', adminMenuId: 'integrations', adminMenuOrder: 180, helpTopicId: 'integrations', helpVariantId: 'list' },
  { pathPattern: '/integrations/:id', label: 'Integration Detail', icon: 'i-heroicons-arrows-right-left-solid', parentPathPattern: '/integrations', helpTopicId: 'integrations', helpVariantId: 'detail' },
];

function normalizePath(pathname: string): string {
  if (!pathname) {
    return '/';
  }

  if (pathname === '/') {
    return pathname;
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patternToRegex(pattern: string): RegExp {
  if (pattern === '/') {
    return /^\/$/;
  }

  const normalizedPattern = normalizePath(pattern);
  const tokenizedPattern = normalizedPattern
    .replace(/:[A-Za-z0-9_]+/g, '__PARAM__')
    .replace(/\*/g, '__WILDCARD__');
  const escapedPattern = escapeRegex(tokenizedPattern);
  const regexSource = escapedPattern
    .replace(/__PARAM__/g, '[^/]+')
    .replace(/__WILDCARD__/g, '.*');

  return new RegExp(`^${regexSource}$`);
}

export function getRoutePatternScore(pathname: string, pattern: string): number {
  const normalizedPath = normalizePath(pathname);
  const regex = patternToRegex(pattern);
  if (!regex.test(normalizedPath)) {
    return -1;
  }

  return pattern.length;
}

function getBestRouteEntry(pathname: string, filter?: (entry: RouteRegistryEntry) => boolean): { entry: RouteRegistryEntry; score: number } | null {
  const normalizedPath = normalizePath(pathname);
  let bestEntry: RouteRegistryEntry | null = null;
  let bestScore = -1;

  for (const entry of ROUTE_REGISTRY) {
    if (filter && !filter(entry)) {
      continue;
    }

    const score = getRoutePatternScore(normalizedPath, entry.pathPattern);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  return bestEntry ? { entry: bestEntry, score: bestScore } : null;
}

export function getBreadcrumbRouteConfigs(): BreadcrumbRouteConfig[] {
  const unique = new Map<string, BreadcrumbRouteConfig>();

  for (const entry of ROUTE_REGISTRY) {
    if (unique.has(entry.pathPattern)) {
      continue;
    }

    unique.set(entry.pathPattern, {
      path: entry.pathPattern,
      label: entry.label,
      icon: entry.icon,
      parent: entry.parentPathPattern,
    });
  }

  return Array.from(unique.values());
}

export function getAdminMenuItems(): AdminMenuProjection[] {
  return ROUTE_REGISTRY
    .filter((entry): entry is RouteRegistryEntry & { adminMenuId: string; adminMenuOrder: number } => Boolean(entry.adminMenuId && entry.adminMenuOrder !== undefined))
    .map((entry) => ({
      id: entry.adminMenuId,
      label: entry.adminMenuLabel || entry.label,
      href: entry.pathPattern,
      icon: entry.icon || 'i-heroicons-square-3-stack-3d-solid',
      order: entry.adminMenuOrder,
    }))
    .sort((left, right) => left.order - right.order);
}

export function resolveAdminRouteItem(pathname: string): string | null {
  const matched = getBestRouteEntry(pathname, (entry) => Boolean(entry.adminMenuId));
  return matched?.entry.adminMenuId || null;
}

export function resolveHelpRouteContext(pathname: string): HelpRouteMatch | null {
  const matched = getBestRouteEntry(pathname, (entry) => Boolean(entry.helpTopicId));
  if (!matched || !matched.entry.helpTopicId) {
    return null;
  }

  return {
    topicId: matched.entry.helpTopicId,
    variantId: matched.entry.helpVariantId,
    score: matched.score,
  };
}