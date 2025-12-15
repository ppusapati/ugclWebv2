/* eslint-disable qwik/valid-lexical-scope */
import { createContextId, useContext, useContextProvider, useSignal, component$, Slot, useVisibleTask$, $ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';

export interface MenuContextType {
  activeMainMenu: Signal<string>;
  activeSidebarItem: Signal<string>;
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

// Menu item configuration
interface MenuItem {
  id: string;
  label: string;
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  id: string;
  label: string;
  href: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'hr',
    label: 'HR',
    subItems: [
      { id: 'employees', label: 'Employees', href: '/hr/employees' },
      { id: 'recruitment', label: 'Recruitment', href: '/hr/recruitment' },
      { id: 'payroll', label: 'Payroll', href: '/hr/payroll' },
      { id: 'performance', label: 'Performance', href: '/hr/performance' },
      { id: 'training', label: 'Training', href: '/hr/training' },
      { id: 'policies', label: 'Policies', href: '/hr/policies' }
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    subItems: [
      { id: 'accounts', label: 'Accounts', href: '/finance/accounts' },
      { id: 'invoices', label: 'Invoices', href: '/finance/invoices' },
      { id: 'expenses', label: 'Expenses', href: '/finance/expenses' },
      { id: 'budgets', label: 'Budgets', href: '/finance/budgets' },
      { id: 'reports', label: 'Reports', href: '/finance/reports' },
      { id: 'taxes', label: 'Taxes', href: '/finance/taxes' }
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    subItems: [
      { id: 'projects', label: 'Projects', href: '/operations/projects' },
      { id: 'inventory', label: 'Inventory', href: '/operations/inventory' },
      { id: 'suppliers', label: 'Suppliers', href: '/operations/suppliers' },
      { id: 'quality', label: 'Quality Control', href: '/operations/quality' },
      { id: 'maintenance', label: 'Maintenance', href: '/operations/maintenance' }
    ]
  },
  {
    id: 'sales',
    label: 'Sales',
    subItems: [
      { id: 'leads', label: 'Leads', href: '/sales/leads' },
      { id: 'customers', label: 'Customers', href: '/sales/customers' },
      { id: 'orders', label: 'Orders', href: '/sales/orders' },
      { id: 'pipeline', label: 'Pipeline', href: '/sales/pipeline' },
      { id: 'analytics', label: 'Analytics', href: '/sales/analytics' }
    ]
  },
  {
    id: 'admin',
    label: 'Admin',
    subItems: [
      { id: 'modules', label: 'Modules', href: '/admin/masters/module' },
      { id: 'users', label: 'Users', href: '/admin/users' },
      { id: 'roles', label: 'Roles & Permissions', href: '/admin/roles' },
      { id: 'settings', label: 'Settings', href: '/admin/settings' },
      { id: 'audit', label: 'Audit Logs', href: '/admin/audit' },
      { id: 'backup', label: 'Backup', href: '/admin/backup' }
    ]
  }
];

export const MenuProvider = component$(() => {
  const location = useLocation();
  const activeMainMenu = useSignal<string>('admin');
  const activeSidebarItem = useSignal<string>('');

  // Function to determine active menu from route
  const setActiveFromRoute = $((path: string) => {
    // Find matching menu item and sidebar item based on path
    for (const menu of menuItems) {
      const matchingSubItem = menu.subItems?.find(sub => path.startsWith(sub.href));
      if (matchingSubItem) {
        activeMainMenu.value = menu.id;
        activeSidebarItem.value = matchingSubItem.id;

        // Persist to localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('activeMainMenu', menu.id);
          localStorage.setItem('activeSidebarItem', matchingSubItem.id);
        }
        return;
      }
    }

    // If no exact match, try to match by main section (e.g., /admin, /hr, etc.)
    const mainSection = path.split('/')[1]; // Get first segment after /
    const matchingMenu = menuItems.find(menu => menu.id === mainSection);
    if (matchingMenu) {
      activeMainMenu.value = matchingMenu.id;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('activeMainMenu', matchingMenu.id);
      }
    }
  });

  // Restore from localStorage and sync with current route on mount
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    if (typeof localStorage !== 'undefined') {
      const savedMainMenu = localStorage.getItem('activeMainMenu');
      const savedSidebarItem = localStorage.getItem('activeSidebarItem');

      if (savedMainMenu) {
        activeMainMenu.value = savedMainMenu;
      }
      if (savedSidebarItem) {
        activeSidebarItem.value = savedSidebarItem;
      }
    }

    // Sync with current route
    await setActiveFromRoute(location.url.pathname);
  });

  // Watch for route changes
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    track(() => location.url.pathname);
    await setActiveFromRoute(location.url.pathname);
  });

  const contextValue: MenuContextType = {
    activeMainMenu,
    activeSidebarItem,
    setActiveFromRoute,
  };

  useContextProvider(MenuContext, contextValue);

  return <Slot />;
});