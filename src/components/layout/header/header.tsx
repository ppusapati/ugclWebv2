import { $, component$, useSignal } from '@builder.io/qwik';
import { useThemeContext } from '~/contexts/theme-context';
import { useMenuContext } from '~/contexts/menu-context';
import { TenantSwitcher } from '~/components/tenant/tenant-switcher';
import { NotificationBell } from '~/components/notifications/notification-bell';
import { useNavigate } from '@builder.io/qwik-city';

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
  const nav = useNavigate();

  const handleLogout = $(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    nav('/login');
  });
  const menuItems: MenuItem[] = [
    {
      id: 'hr',
      label: 'HR',
      icon: 'i-heroicons-users-solid',
      subItems: [
        { id: 'employees', label: 'Employees', href: '/hr/employees', icon: 'i-heroicons-user-solid' },
        { id: 'recruitment', label: 'Recruitment', href: '/hr/recruitment', icon: '📋' },
        { id: 'payroll', label: 'Payroll', href: '/hr/payroll', icon: '💰' },
        { id: 'performance', label: 'Performance', href: '/hr/performance', icon: '📊' },
        { id: 'training', label: 'Training', href: '/hr/training', icon: '🎓' },
        { id: 'policies', label: 'Policies', href: '/hr/policies', icon: '📄' }
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: 'i-heroicons-currency-rupee-solid',
      subItems: [
        { id: 'accounts', label: 'Accounts', href: '/finance/accounts', icon: '🏦' },
        { id: 'invoices', label: 'Invoices', href: '/finance/invoices', icon: '🧾' },
        { id: 'expenses', label: 'Expenses', href: '/finance/expenses', icon: '💳' },
        { id: 'budgets', label: 'Budgets', href: '/finance/budgets', icon: '📈' },
        { id: 'reports', label: 'Reports', href: '/finance/reports', icon: '📋' },
        { id: 'taxes', label: 'Taxes', href: '/finance/taxes', icon: '🧮' }
      ]
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: 'i-heroicons-cog-solid',
      subItems: [
        { id: 'projects', label: 'Projects', href: '/operations/projects', icon: '📁' },
        { id: 'inventory', label: 'Inventory', href: '/operations/inventory', icon: '📦' },
        { id: 'suppliers', label: 'Suppliers', href: '/operations/suppliers', icon: '🚚' },
        { id: 'quality', label: 'Quality Control', href: '/operations/quality', icon: '✅' },
        { id: 'maintenance', label: 'Maintenance', href: '/operations/maintenance', icon: '🔧' }
      ]
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: 'i-heroicons-currency-dollar-solid',
      subItems: [
        { id: 'leads', label: 'Leads', href: '/sales/leads', icon: '🎯' },
        { id: 'customers', label: 'Customers', href: '/sales/customers', icon: '👥' },
        { id: 'orders', label: 'Orders', href: '/sales/orders', icon: '📋' },
        { id: 'pipeline', label: 'Pipeline', href: '/sales/pipeline', icon: '🔄' },
        { id: 'analytics', label: 'Analytics', href: '/sales/analytics', icon: '📊' }
      ]
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: 'i-heroicons-shield-check-solid',
      subItems: [
        { id: 'modules', label: 'Modules', href: '/admin/masters/modules', icon: 'i-streamline-module-three-solid' },
        { id: 'users', label: 'Users', href: '/admin/users', icon: '👤' },
        { id: 'roles', label: 'Roles & Permissions', href: '/admin/roles', icon: '🔑' },
        { id: 'settings', label: 'Settings', href: '/admin/settings', icon: '⚙️' },
        { id: 'audit', label: 'Audit Logs', href: '/admin/audit', icon: '📝' },
        { id: 'backup', label: 'Backup', href: '/admin/backup', icon: '💾' }
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
              <img
                src="/logo.png"
                alt="Logo"
                class="h-12 w-auto"
              />
            </div>
            <h1 class="text-xl font-bold text-gray-900">UGCL Portal</h1>
          </div>

          {/* Right Side - Tenant Switcher, Header Icons & User */}
          <div class="flex items-center gap-2">
            {/* Tenant Switcher */}
            <TenantSwitcher />

            {/* Individual Header Icons */}

            <div class="relative">
              <button
                class={`p-2 rounded-lg hover:bg-gray-100 bg-transparent border-0 transition-all duration-200 ${
                  isMenuOpen.value
                    ? 'bg-primary-500 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick$={toggleMenu}
              >
                <div class="i-heroicons-squares-2x2-solid w-6 h-6"></div>
              </button>

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
                        <button
                          key={item.id}
                          class="flex flex-col bg-transparent border-0 items-center justify-center gap-2 p-3 w-16 h-16 rounded-lg hover:bg-gray-50 transition-colors"
                          onClick$={() => handleMainMenuClick(item.id)}
                        >
                          <div class={`${item.icon} w-6 h-6 text-gray-600`}></div>
                          <span class="text-xs font-medium text-gray-700 text-center leading-none">{item.label}</span>
                        </button>
                      ))}

                      {/* Additional items */}
                      <button class="flex flex-col bg-transparent border-0 items-center justify-center gap-2 p-3 w-16 h-16 rounded-lg hover:bg-gray-50 transition-colors">
                        <div class="i-heroicons-user-circle w-6 h-6 text-gray-600"></div>
                        <span class="text-xs font-medium text-gray-700 text-center leading-none">Profile</span>
                      </button>

                      <button class="flex flex-col bg-transparent border-0 items-center justify-center gap-2 p-3 w-16 h-16 rounded-lg hover:bg-gray-50 transition-colors">
                        <div class="i-heroicons-squares-plus w-6 h-6 text-gray-600"></div>
                        <span class="text-xs font-medium text-gray-700 text-center leading-none">Products</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <button
              class="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent border-0 transition-all duration-200"
              title={theme.isDark ? 'Light Mode' : 'Dark Mode'}
              onClick$={() => theme.toggleTheme()}
            >
              <div class={theme.isDark ? 'i-tabler-sun w-5 h-5 text-yellow-400' : 'i-tabler-moon w-5 h-5'} />
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* Logout */}
            <button
              class="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 bg-transparent border-0 transition-all duration-200"
              onClick$={handleLogout}
              title="Logout"
            >
              <div class="i-tabler-logout w-5 h-5" />
            </button>

            {/* Profile */}
            <button
              class="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-100 bg-transparent border-0 transition-all duration-200"
              title="Profile"
            >
              <div class="i-heroicons-user-solid w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});