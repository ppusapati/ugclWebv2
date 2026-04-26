import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { useAuthContext } from '~/contexts/auth-context';
import { useMenuContext } from '~/contexts/menu-context';
import { formBuilderService } from '~/services/form-builder.service';
import { formService } from '~/services/form.service';
import type { Module } from '~/services/types';
import { getUser, isSuperAdminUser } from '~/utils/auth';
import { analyticsService } from '~/services/analytics.service';

interface SidebarFormItem {
  code: string;
  title: string;
  module_id: string;
  icon?: string;
  accessible_verticals?: string[];
}

interface SidebarReportItem {
  id: string;
  name: string;
  module_id?: string;
  business_vertical_id?: string;
  report_type?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}

function resolveBusinessCodeForForm(
  form: SidebarFormItem,
  currentBusinessCode: string,
  user: any
): string {
  const tokens = (form.accessible_verticals || []).map((value) => String(value).trim()).filter(Boolean);
  const businessRoles = Array.isArray(user?.business_roles) ? user.business_roles : [];

  for (const token of tokens) {
    const normalizedToken = token.toLowerCase();
    const matchedRole = businessRoles.find((role: any) => {
      const roleId = String(role?.vertical_id || role?.business_vertical_id || '').toLowerCase();
      const roleCode = String(role?.vertical_code || role?.business_vertical?.code || role?.business_code || '').toLowerCase();
      return normalizedToken === roleId || normalizedToken === roleCode;
    });

    const matchedCode = matchedRole?.vertical_code || matchedRole?.business_vertical?.code || matchedRole?.business_code;
    if (matchedCode) {
      return matchedCode;
    }

    if (!token.includes('-') && !token.includes(' ')) {
      return token;
    }
  }

  return (
    currentBusinessCode ||
    businessRoles[0]?.vertical_code ||
    businessRoles[0]?.business_vertical?.code ||
    businessRoles[0]?.business_code ||
    ''
  );
}

export const Sidebar = component$(() => {
  const auth = useAuthContext();
  const menuContext = useMenuContext();
  const effectiveUser = auth.user || getUser();
  const activeSidebarItem = menuContext.activeSidebarItem;
  const moduleDefinitions = useSignal<Module[]>([]);
  const moduleForms = useSignal<SidebarFormItem[]>([]);
  const moduleReports = useSignal<SidebarReportItem[]>([]);
  const dynamicMenuLabel = useSignal('');
  const currentBusinessCode = useSignal('');
  const currentBusinessId = useSignal('');
  const isSuperAdmin = isSuperAdminUser(effectiveUser);

  const menuItems: MenuItem[] = [
    {
      id: 'admin',
      label: 'Admin',
      icon: 'i-heroicons-lock-closed-solid',
      subItems: [
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
      ]
    }
  ];

  const handleSidebarItemClick = $((itemId: string) => {
    activeSidebarItem.value = itemId;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('activeSidebarItem', itemId);
    }
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    track(() => menuContext.activeMainMenu.value);
    track(() => auth.user?.business_roles?.length || 0);
    track(() => auth.user?.is_super_admin);
    track(() => auth.user?.role);
    track(() => (auth.user as any)?.global_role);
    const activeMenuId = menuContext.activeMainMenu.value;
    const isSuperAdmin = isSuperAdminUser(auth.user || getUser());
    const user = auth.user || getUser();
    const userPermissions = Array.isArray((user as any)?.permissions)
      ? (user as any).permissions.map((p: any) => String(p))
      : [];
    const canReadReportDefinitions =
      isSuperAdmin ||
      userPermissions.includes('*:*:*') ||
      userPermissions.includes('report:read') ||
      userPermissions.includes('report:*') ||
      userPermissions.includes('read_reports');

    const storedBusinessId = localStorage.getItem('ugcl_current_business_vertical');
    const storedBusinessCode =
      localStorage.getItem('business_code') ||
      localStorage.getItem('businessCode') ||
      localStorage.getItem('active_business_code') ||
      '';
    const firstBusinessRole = user?.business_roles?.[0];
    if (storedBusinessId) {
      currentBusinessId.value = storedBusinessId;
      const businessRole = user?.business_roles?.find(
        (role: any) => (role.vertical_id || role.business_vertical_id) === storedBusinessId
      );
      currentBusinessCode.value =
        businessRole?.vertical_code ||
        businessRole?.business_vertical?.code ||
        businessRole?.business_code ||
        storedBusinessCode ||
        firstBusinessRole?.vertical_code ||
        firstBusinessRole?.business_vertical?.code ||
        firstBusinessRole?.business_code ||
        '';
    } else {
      currentBusinessId.value =
        firstBusinessRole?.vertical_id ||
        firstBusinessRole?.business_vertical_id ||
        user?.business_vertical_id ||
        '';
      currentBusinessCode.value =
        storedBusinessCode ||
        firstBusinessRole?.vertical_code ||
        firstBusinessRole?.business_vertical?.code ||
        firstBusinessRole?.business_code ||
        user?.business_vertical_name ||
        '';
    }

    let effectiveMenuId = activeMenuId;

    if (activeMenuId === 'admin') {
      if (!isSuperAdmin) {
        if (moduleDefinitions.value.length === 0) {
          moduleDefinitions.value = await formService.getModules();
        }

        const fallbackModuleId = moduleDefinitions.value[0]?.id || '';
        if (fallbackModuleId && fallbackModuleId !== activeMenuId) {
          menuContext.activeMainMenu.value = fallbackModuleId;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('activeMainMenu', fallbackModuleId);
          }
          effectiveMenuId = fallbackModuleId;
        } else {
          // If modules are unavailable, continue and show all accessible forms.
          effectiveMenuId = '';
        }

        dynamicMenuLabel.value = moduleDefinitions.value[0]?.name || 'Module';
      } else {
        dynamicMenuLabel.value = 'Admin';
        moduleForms.value = [];
        moduleReports.value = [];
        return;
      }
    }

    try {
      if (moduleDefinitions.value.length === 0) {
        moduleDefinitions.value = await formService.getModules();
      }

      const selectedModule = moduleDefinitions.value.find((module) => module.id === effectiveMenuId);
      dynamicMenuLabel.value = selectedModule?.name || 'Module';
      const moduleTokens = new Set(
        [
          selectedModule?.id,
          (selectedModule as any)?.module_id,
          selectedModule?.code,
          selectedModule?.name,
          selectedModule?.name?.toLowerCase().replace(/\s+/g, '_'),
          selectedModule?.name?.toLowerCase().replace(/\s+/g, ''),
          selectedModule?.code?.toLowerCase(),
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase())
      );

      const forms = isSuperAdmin
        ? await formBuilderService.getAllForms()
        : currentBusinessCode.value
          ? await formService.getBusinessForms(currentBusinessCode.value)
          : [];

      moduleForms.value = forms
        .filter((form: any) => {
          if (moduleTokens.size === 0) {
            return true;
          }

          const formModuleId =
            form.module_id ||
            form.module?.id ||
            form.module?.module_id ||
            form.module;
          const normalizedFormModule = String(formModuleId || '')
            .toLowerCase()
            .trim();

          return moduleTokens.has(normalizedFormModule);
        })
        .map((form: any) => ({
          code: form.code,
          title: form.title,
          module_id: form.module_id || form.module?.id || form.module?.module_id,
          icon: form.icon,
          accessible_verticals: form.accessible_verticals || [],
        }));

      try {
        if (!canReadReportDefinitions) {
          moduleReports.value = [];
          return;
        }

        const reportsResponse = await analyticsService.getReports(
          !isSuperAdmin && currentBusinessId.value
            ? { business_vertical_id: currentBusinessId.value }
            : undefined
        );

        moduleReports.value = (reportsResponse.reports || [])
          .filter((report: any) => {
            const reportModuleId =
              report.module_id ||
              report.moduleId ||
              report.module ||
              report.module?.id ||
              report.module?.module_id;
            const reportBusinessId =
              report.business_vertical_id ||
              report.business_id ||
              report.vertical_id;

            const normalizedReportModule = String(reportModuleId || '')
              .toLowerCase()
              .trim();
            const isModuleMatch = moduleTokens.has(normalizedReportModule);
            const isBusinessMatch =
              isSuperAdmin ||
              !currentBusinessId.value ||
              !reportBusinessId ||
              String(reportBusinessId) === String(currentBusinessId.value);

            return isModuleMatch && isBusinessMatch;
          })
          .map((report: any) => ({
            id: String(report.id),
            name: report.name || report.title || 'Report',
            module_id: report.module_id,
            business_vertical_id: report.business_vertical_id,
            report_type: report.report_type,
          }));
      } catch {
        // Keep forms visible even when report APIs are forbidden for this user.
        moduleReports.value = [];
      }
    } catch {
      dynamicMenuLabel.value = 'Module';
      moduleForms.value = [];
      moduleReports.value = [];
    }
  });

  const adminSubItems = (menuItems.find(item => item.id === 'admin')?.subItems || []).filter((item) => item.id !== 'dashboard');

  const formSubItems = moduleForms.value.map((form) => ({
    id: form.code,
    label: form.title,
    href: `/masters/business/${resolveBusinessCodeForForm(form, currentBusinessCode.value, effectiveUser)}/forms/${form.code}`,
    icon: form.icon || 'i-heroicons-document-text-solid',
  }));

  const reportSubItems = moduleReports.value.map((report) => ({
    id: `report-${report.id}`,
    label: report.name,
    href: `/analytics/reports/view/${report.id}`,
    icon:
      report.report_type === 'chart'
        ? 'i-heroicons-chart-bar-solid'
        : report.report_type === 'kpi'
          ? 'i-heroicons-presentation-chart-line-solid'
          : 'i-heroicons-document-chart-bar-solid',
  }));

  return (
    <aside
      class="w-64 bg-white border-r border-gray-200 self-stretch"
      style="box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);"
    >
      <div class="px-4 py-4">
        <div class="mb-4">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Common
          </h2>
          <nav class="space-y-1">
            <Link
              href="/"
              class={`flex items-center gap-3 py-2 rounded-lg no-underline text-sm font-medium transition-all duration-200 border-l-4 ${
                menuContext.activeSidebarItem.value === 'dashboard'
                  ? 'bg-primary-50 text-primary-700 border-primary-500 pl-2 pr-3'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent pl-3 pr-3'
              }`}
              onClick$={() => handleSidebarItemClick('dashboard')}
            >
              <span class="i-heroicons-home-solid w-5 h-5 flex-shrink-0"></span>
              <span>Home</span>
            </Link>
          </nav>
        </div>

        <div class="mb-4">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {menuContext.activeMainMenu.value === 'admin' && isSuperAdmin
              ? 'Admin Menu'
              : `${dynamicMenuLabel.value || 'Module'} Menu`}
          </h2>
        </div>

        {menuContext.activeMainMenu.value === 'admin' && isSuperAdmin ? (
        <nav class="space-y-1">
          {adminSubItems.map((subItem) => (
            <Link
              key={subItem.id}
              href={subItem.href}
              class={`flex items-center gap-3 py-2 rounded-lg no-underline text-sm font-medium transition-all duration-200 border-l-4 ${
                menuContext.activeSidebarItem.value === subItem.id
                  ? 'bg-primary-50 text-primary-700 border-primary-500 pl-2 pr-3'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent pl-3 pr-3'
              }`}
              onClick$={() => handleSidebarItemClick(subItem.id)}
            >
              <span class={`${subItem.icon} w-5 h-5 flex-shrink-0`}></span>
              <span>{subItem.label}</span>
            </Link>
          ))}
        </nav>
        ) : (
          <div class="space-y-4">
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Forms</p>
              <nav class="space-y-1">
                {formSubItems.map((subItem) => (
                  <Link
                    key={subItem.id}
                    href={subItem.href}
                    class={`flex items-center gap-3 py-2 rounded-lg no-underline text-sm font-medium transition-all duration-200 border-l-4 ${
                      menuContext.activeSidebarItem.value === subItem.id
                        ? 'bg-primary-50 text-primary-700 border-primary-500 pl-2 pr-3'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent pl-3 pr-3'
                    }`}
                    onClick$={() => handleSidebarItemClick(subItem.id)}
                  >
                    <span class={`${subItem.icon} w-5 h-5 flex-shrink-0`}></span>
                    <span>{subItem.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Reports</p>
              <nav class="space-y-1">
                {reportSubItems.map((subItem) => (
                  <Link
                    key={subItem.id}
                    href={subItem.href}
                    class={`flex items-center gap-3 py-2 rounded-lg no-underline text-sm font-medium transition-all duration-200 border-l-4 ${
                      menuContext.activeSidebarItem.value === subItem.id
                        ? 'bg-primary-50 text-primary-700 border-primary-500 pl-2 pr-3'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent pl-3 pr-3'
                    }`}
                    onClick$={() => handleSidebarItemClick(subItem.id)}
                  >
                    <span class={`${subItem.icon} w-5 h-5 flex-shrink-0`}></span>
                    <span>{subItem.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
});