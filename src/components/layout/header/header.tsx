import { $, component$, useSignal } from '@builder.io/qwik';
import { useThemeContext } from '~/contexts/theme-context';
import { useMenuContext } from '~/contexts/menu-context';
import { TenantSwitcher } from '~/components/tenant/tenant-switcher';
import { NotificationBell } from '~/components/notifications/notification-bell';
import ImgLogo from '~/media/logo.png?jsx';
import { Btn } from '~/components/ds';

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

export const Header = component$(() => {
  const theme = useThemeContext();
  const menuContext = useMenuContext();
  const activeMainMenu = menuContext.activeMainMenu;
  const activeSidebarItem = menuContext.activeSidebarItem;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const showUserMenu = useSignal(false);
  const isMenuOpen = useSignal<boolean>(false);

  const handleLogout = $(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Full reload ensures layout state is cleared (prevents stale auth shell showing on /login)
    window.location.href = '/login';
  });
  const menuItems: MenuItem[] = [
    {
      id: 'hr',
      label: 'HR',
      icon: 'i-heroicons-users-solid',
      subItems: [
        { id: 'employees', label: 'Employees', href: '/hr/employees', icon: 'i-heroicons-user-solid' },
        { id: 'recruitment', label: 'Recruitment', href: '/hr/recruitment', icon: 'i-heroicons-clipboard-document-list-solid' },
        { id: 'payroll', label: 'Payroll', href: '/hr/payroll', icon: 'i-heroicons-banknotes-solid' },
        { id: 'performance', label: 'Performance', href: '/hr/performance', icon: 'i-heroicons-chart-bar-solid' },
        { id: 'training', label: 'Training', href: '/hr/training', icon: 'i-heroicons-academic-cap-solid' },
        { id: 'policies', label: 'Policies', href: '/hr/policies', icon: 'i-heroicons-document-text-solid' }
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: 'i-heroicons-currency-rupee-solid',
      subItems: [
        { id: 'accounts', label: 'Accounts', href: '/finance/accounts', icon: 'i-heroicons-building-library-solid' },
        { id: 'invoices', label: 'Invoices', href: '/finance/invoices', icon: 'i-heroicons-receipt-percent-solid' },
        { id: 'expenses', label: 'Expenses', href: '/finance/expenses', icon: 'i-heroicons-credit-card-solid' },
        { id: 'budgets', label: 'Budgets', href: '/finance/budgets', icon: 'i-heroicons-chart-bar-solid' },
        { id: 'reports', label: 'Reports', href: '/finance/reports', icon: 'i-heroicons-clipboard-document-list-solid' },
        { id: 'taxes', label: 'Taxes', href: '/finance/taxes', icon: 'i-heroicons-calculator-solid' }
      ]
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: 'i-heroicons-cog-solid',
      subItems: [
        { id: 'projects', label: 'Projects', href: '/operations/projects', icon: 'i-heroicons-folder-solid' },
        { id: 'inventory', label: 'Inventory', href: '/operations/inventory', icon: 'i-heroicons-archive-box-solid' },
        { id: 'suppliers', label: 'Suppliers', href: '/operations/suppliers', icon: 'i-heroicons-truck-solid' },
        { id: 'quality', label: 'Quality Control', href: '/operations/quality', icon: 'i-heroicons-check-badge-solid' },
        { id: 'maintenance', label: 'Maintenance', href: '/operations/maintenance', icon: 'i-heroicons-wrench-screwdriver-solid' }
      ]
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: 'i-heroicons-currency-dollar-solid',
      subItems: [
        { id: 'leads', label: 'Leads', href: '/sales/leads', icon: 'i-heroicons-cursor-arrow-rays-solid' },
        { id: 'customers', label: 'Customers', href: '/sales/customers', icon: 'i-heroicons-user-group-solid' },
        { id: 'orders', label: 'Orders', href: '/sales/orders', icon: 'i-heroicons-clipboard-document-list-solid' },
        { id: 'pipeline', label: 'Pipeline', href: '/sales/pipeline', icon: 'i-heroicons-arrow-path-rounded-square-solid' },
        { id: 'analytics', label: 'Analytics', href: '/sales/analytics', icon: 'i-heroicons-chart-bar-solid' }
      ]
    },
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

  const handleMainMenuClick = $((menuId: string) => {
    activeMainMenu.value = menuId;
    activeSidebarItem.value = '';
    isMenuOpen.value = false;
  });

  return (
    <header class="bg-white border-b border-gray-200 shadow-sm relative">
      <div class="px-6 py-3">
        <div class="flex items-center justify-between">
          {/* Logo */}
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center">
              <ImgLogo class="h-12 w-auto" />
            </div>
            <h1 class="text-xl font-bold text-gray-900">UGCL Portal</h1>
          </div>

          {/* Right Side - Tenant Switcher, Header Icons & User */}
          <div class="flex items-center gap-2">
            {/* Tenant Switcher */}
            <TenantSwitcher />

            {/* Individual Header Icons */}

            <div class="relative">
              <Btn
                size="sm"
                variant="ghost"
                class={`p-2 rounded-lg hover:bg-gray-100 bg-transparent border-0 transition-all duration-200 ${
                  isMenuOpen.value
                    ? 'bg-primary-500 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick$={toggleMenu}
              >
                <div class="i-heroicons-squares-2x2-solid w-6 h-6"></div>
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
                      {menuItems.map((item) => (
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

                      {/* Additional items */}
                      <Btn size="sm" variant="ghost" class="flex flex-col bg-transparent border-0 items-center justify-center gap-2 p-3 w-16 h-16 rounded-lg hover:bg-gray-50 transition-colors">
                        <div class="i-heroicons-user-circle w-6 h-6 text-gray-600"></div>
                        <span class="text-xs font-medium text-gray-700 text-center leading-none">Profile</span>
                      </Btn>

                      <Btn size="sm" variant="ghost" class="flex flex-col bg-transparent border-0 items-center justify-center gap-2 p-3 w-16 h-16 rounded-lg hover:bg-gray-50 transition-colors">
                        <div class="i-heroicons-squares-plus w-6 h-6 text-gray-600"></div>
                        <span class="text-xs font-medium text-gray-700 text-center leading-none">Products</span>
                      </Btn>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <Btn
              size="sm"
              variant="ghost"
              class="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent border-0 transition-all duration-200"
              title={theme.isDark ? 'Light Mode' : 'Dark Mode'}
              onClick$={() => theme.toggleTheme()}
            >
              <div class={theme.isDark ? 'i-tabler-sun w-5 h-5 text-yellow-400' : 'i-tabler-moon w-5 h-5'} />
            </Btn>

            {/* Notifications */}
            <NotificationBell />

            {/* Logout */}
            <Btn
              size="sm"
              variant="ghost"
              class="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 bg-transparent border-0 transition-all duration-200"
              onClick$={handleLogout}
              title="Logout"
            >
              <div class="i-tabler-logout w-5 h-5" />
            </Btn>

            {/* Profile */}
            <Btn
              size="sm"
              variant="ghost"
              class="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-100 bg-transparent border-0 transition-all duration-200"
              title="Profile"
            >
              <div class="i-heroicons-user-solid w-5 h-5" />
            </Btn>
          </div>
        </div>
      </div>
    </header>
  );
});