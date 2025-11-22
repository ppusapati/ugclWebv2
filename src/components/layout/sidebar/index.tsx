import { $, component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { useMenuContext } from '~/contexts/menu-context';

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

export const Sidebar = component$(() => {
  const menuContext = useMenuContext();

  const menuItems: MenuItem[] = [
    {
      id: 'hr',
      label: 'HR',
      icon: 'i-heroicons-user-group-solid',
      subItems: [
        { id: 'employees', label: 'Employees', href: '/hr/employees', icon: 'i-heroicons-user-solid' },
        { id: 'recruitment', label: 'Recruitment', href: '/hr/recruitment', icon: 'i-heroicons-clipboard-document-list-solid' },
        { id: 'payroll', label: 'Payroll', href: '/hr/payroll', icon: 'i-heroicons-currency-dollar-solid' },
        { id: 'performance', label: 'Performance', href: '/hr/performance', icon: 'i-heroicons-chart-bar-solid' },
        { id: 'training', label: 'Training', href: '/hr/training', icon: 'i-heroicons-academic-cap-solid' },
        { id: 'policies', label: 'Policies', href: '/hr/policies', icon: 'i-heroicons-document-text-solid' }
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: 'i-heroicons-currency-dollar-solid',
      subItems: [
        { id: 'accounts', label: 'Accounts', href: '/finance/accounts', icon: 'i-heroicons-building-library-solid' },
        { id: 'invoices', label: 'Invoices', href: '/finance/invoices', icon: 'i-heroicons-document-text-solid' },
        { id: 'expenses', label: 'Expenses', href: '/finance/expenses', icon: 'i-heroicons-credit-card-solid' },
        { id: 'budgets', label: 'Budgets', href: '/finance/budgets', icon: 'i-heroicons-arrow-trending-up-solid' },
        { id: 'reports', label: 'Reports', href: '/finance/reports', icon: 'i-heroicons-document-chart-bar-solid' },
        { id: 'taxes', label: 'Taxes', href: '/finance/taxes', icon: 'i-heroicons-calculator-solid' }
      ]
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: 'i-heroicons-cog-solid',
      subItems: [
        { id: 'projects', label: 'Projects', href: '/operations/projects', icon: 'i-heroicons-folder-solid' },
        { id: 'inventory', label: 'Inventory', href: '/operations/inventory', icon: 'i-heroicons-cube-solid' },
        { id: 'suppliers', label: 'Suppliers', href: '/operations/suppliers', icon: 'i-heroicons-truck-solid' },
        { id: 'quality', label: 'Quality Control', href: '/operations/quality', icon: 'i-heroicons-check-circle-solid' },
        { id: 'maintenance', label: 'Maintenance', href: '/operations/maintenance', icon: 'i-heroicons-wrench-screwdriver-solid' }
      ]
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: 'i-heroicons-arrow-trending-up-solid',
      subItems: [
        { id: 'leads', label: 'Leads', href: '/sales/leads', icon: 'i-heroicons-flag-solid' },
        { id: 'customers', label: 'Customers', href: '/sales/customers', icon: 'i-heroicons-user-group-solid' },
        { id: 'orders', label: 'Orders', href: '/sales/orders', icon: 'i-heroicons-shopping-cart-solid' },
        { id: 'pipeline', label: 'Pipeline', href: '/sales/pipeline', icon: 'i-heroicons-arrow-path-solid' },
        { id: 'analytics', label: 'Analytics', href: '/sales/analytics', icon: 'i-heroicons-chart-bar-solid' }
      ]
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: 'i-heroicons-lock-closed-solid',
      subItems: [
        { id: 'modules', label: 'Modules', href: '/admin/masters/module', icon: 'i-streamline-module-three-solid' },
        { id: 'business-vertical', label: 'Business - Vertical', href: '/admin/masters/business-verticals', icon: 'i-heroicons-building-office-solid' },
        { id: 'sites', label: 'Sites', href: '/admin/masters/sites', icon: 'i-heroicons-map-pin-solid' },
        { id: 'roles', label: 'Roles & Permissions', href: '/admin/rbac/roles', icon: 'i-icon-park-permissions' },
        { id: 'attributes', label: 'Attributes', href: '/admin/attributes', icon: 'i-heroicons-tag-solid' },
        { id: 'policies', label: 'ABAC Policies', href: '/admin/policies', icon: 'i-heroicons-shield-check-solid' },
        { id: 'users', label: 'Users', href: '/admin/users', icon: 'i-heroicons-user-solid' },
        { id: 'forms', label: 'Forms', href: '/admin/forms', icon: 'i-heroicons-document-text-solid' },
        { id: 'projects', label: 'Projects', href: '/admin/projects', icon: 'i-heroicons-document-text-solid' },
        { id: 'documents', label: 'Documents', href: '/admin/documents', icon: 'i-heroicons-server-solid' },
        { id: 'reports', label: 'Reports', href: '/admin/reports', icon: 'i-heroicons-document-chart-bar-solid' }
      ]
    }
  ];

  const handleSidebarItemClick = $((itemId: string) => {
    menuContext.activeSidebarItem.value = itemId;
  });

  const currentSubItems = menuItems.find(item => item.id === menuContext.activeMainMenu.value)?.subItems || [];

  return (
    <aside
      class="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]"
      style="box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);"
    >
      <div class="px-4 py-4">
        <div class="mb-4">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {menuItems.find(item => item.id === menuContext.activeMainMenu.value)?.label} Menu
          </h2>
        </div>

        <nav class="space-y-1">
          {currentSubItems.map((subItem) => (
            <Link
              key={subItem.id}
              href={subItem.href}
              class={`flex items-center gap-3 px-3 py-2 rounded-lg no-underline text-sm font-medium transition-all duration-200 ${
                menuContext.activeSidebarItem.value === subItem.id
                  ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick$={() => handleSidebarItemClick(subItem.id)}
            >
              <span class={`${subItem.icon}`}></span>
              <span>{subItem.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
});