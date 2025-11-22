import { component$, useStore, useVisibleTask$, PropFunction, useSignal, $ } from '@builder.io/qwik';


const menuData = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    href: '/dashboard',
    roles: ['super_admin', 'project_coordinator', 'engineer', 'other'], // Everyone
  },
  {
    key: 'profile',
    label: 'My Profile',
    icon: 'i-heroicons-user-circle',
    href: '/dashboard/profile',
    roles: ['super_admin', 'project_coordinator', 'engineer', 'other'], // Everyone
  },
  {
    key: 'my-businesses',
    label: 'My Businesses',
    icon: 'i-heroicons-building-office',
    href: '/dashboard/my-businesses',
    roles: ['super_admin', 'project_coordinator', 'engineer', 'other'], // Everyone
  },
  {
    key: 'my-sites',
    label: 'My Sites',
    icon: 'i-heroicons-map-pin',
    href: '/dashboard/my-sites',
    roles: ['super_admin', 'project_coordinator', 'engineer', 'other'], // Everyone
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: 'i-heroicons-document-text',
    href: '#',
    roles: ['super_admin', 'project_coordinator', 'engineer'],
    children: [
      { key: 'dprsite', label: 'DPR Site Reports', href: '/reports/dprsite' },
      { key: 'water', label: 'Water Tanker', href: '/reports/water' },
      { key: 'wrapping', label: 'Wrapping', href: '/reports/wrapping' },
      { key: 'eway', label: 'E-way Bills', href: '/reports/eway' },
      { key: 'material', label: 'Material', href: '/reports/material' },
      { key: 'payment', label: 'Payments', href: '/reports/payment' },
      { key: 'stock', label: 'Stock', href: '/reports/stock' },
      { key: 'dairysite', label: 'Dairy Site', href: '/reports/dairysite' },
      { key: 'mnr', label: 'MNR', href: '/reports/mnr' },
      { key: 'nmr_vehicle', label: 'NMR Vehicle', href: '/reports/nmr_vehicle' },
      { key: 'contractor', label: 'Contractor', href: '/reports/contractor' },
      { key: 'painting', label: 'Painting', href: '/reports/painting' },
      { key: 'diesel', label: 'Diesel', href: '/reports/diesel' },
      { key: 'tasks', label: 'Tasks', href: '/reports/tasks' },
      { key: 'vehiclelog', label: 'Vehicle Logs', href: '/reports/vehiclelog' },
    ],
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: 'i-heroicons-cog-6-tooth',
    href: '#',
    roles: ['super_admin'], // Only Super Admin
    children: [
      { key: 'businesses', label: 'Business Verticals', href: '/admin/businesses' },
      { key: 'roles', label: 'Roles & Permissions', href: '/admin/roles' },
      { key: 'authorization', label: 'Authorization Dashboard', href: '/admin/authorization' },
      { key: 'users', label: 'User Management', href: '/dashboard/users' },
    ],
  },
  {
    key: 'report builder',
    label: 'Report Builder',
    icon: 'i-heroicons-chat-bubble-left-right',
    href: '/dashboard/report_builder',
    roles: ['super_admin'],
  },
  {
    key: 'form builder',
    label: 'Form Builder',
    icon: 'i-heroicons-envelope',
    href: '/dashboard/form_builder',
    roles: ['super_admin',],
  },
  {
    key: 'form',
    label: 'Legacy Reports',
    icon: 'i-formkit-filedoc',
    href: '/dashboard/form',
    roles: ['super_admin', 'project_coordinator'], // Only these roles
  },
];

const MenuItem = component$<{ item: any; collapsed: boolean }>((props) => {
  const expanded = useSignal(false);
  const hasChildren = props.item.children && props.item.children.length > 0;

  const toggleExpand = $(() => {
    if (hasChildren) {
      expanded.value = !expanded.value;
    }
  });

  return (
    <li>
      {hasChildren ? (
        <>
          <button
            onClick$={toggleExpand}
            class={[
              "flex items-center w-full px-4 py-2 rounded-lg transition-all no-underline text-dark-800 dark:text-white",
              "hover:bg-primary-50 dark:hover:bg-primary-900 dark:hover:text-light-100",
            ].join(' ')}
          >
            <span class={[props.item.icon, "w-5 h-5 text-black mr-3 dark:text-white"].join(' ')} />
            <span class={props.collapsed ? "hidden" : "flex-1 text-left"}>{props.item.label}</span>
            {!props.collapsed && (
              <span class={[
                "i-heroicons-chevron-down w-4 h-4 transition-transform",
                expanded.value ? "rotate-180" : ""
              ].join(' ')} />
            )}
          </button>
          {expanded.value && !props.collapsed && (
            <ul class="flex flex-col gap-1 list-none pl-8 mt-1">
              {props.item.children.map((child: any) => (
                <li key={child.key}>
                  <a
                    href={child.href}
                    class={[
                      "flex px-4 py-1.5 rounded-lg transition-all no-underline text-sm text-dark-700 dark:text-gray-300",
                      "hover:bg-primary-50 dark:hover:bg-primary-900 dark:hover:text-light-100",
                    ].join(' ')}
                  >
                    {child.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <a
          href={props.item.href}
          class={[
            "flex px-4 py-2 rounded-lg transition-all no-underline text-dark-800 dark:text-white",
            "hover:bg-primary-50 dark:hover:bg-primary-900 dark:hover:text-light-100",
          ].join(' ')}
        >
          <span class={[props.item.icon, "w-5 h-5 text-black mr-3 dark:text-white"].join(' ')} />
          <span class={props.collapsed ? "hidden" : "block"}>{props.item.label}</span>
        </a>
      )}
    </li>
  );
});

export default component$((props: {
  collapsed: boolean;
  onToggle$: PropFunction<() => void>;
}) => {
  const state = useStore({
    userRole: '', // e.g., 'super_admin', 'project_coordinator'
  });

  useVisibleTask$(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        state.userRole = user.role; // adapt if your user object is nested
      }
    } catch (e) {
      console.error('Error reading user role from localStorage:', e);
      state.userRole = '';
    }
  });

  return (
    <aside class={[
      "fixed left-0 top-0 z-40 h-screen flex flex-col overflow-y-hidden",
      // GLASSY BORDER
      "border-r border-white/30 dark:border-white/10",
      // GLASSY BACKGROUND
      "bg-white/60 dark:bg-dark-800/70 backdrop-blur-md",
      // DROP SHADOW
      "shadow-lg",
      // WIDTH AND TRANSITION
      props.collapsed ? "w-20" : "w-64",
      "duration-300 ease-linear",
    ].join(' ')}>
      {/* Sidebar header/logo/collapse btn */}
      <div class="flex items-center justify-center pt-4 pb-4">
        <a href="/" class="flex flex-col items-center w-full  no-underline">
          {/* Large logo for expanded sidebar */}
          <img
            src="/logo.png"
            alt="Logo"
            class={[
              props.collapsed ? 'hidden' : 'block',
              'h-20 w-auto mb-2 transition-all dark:bg-white duration-200',
            ].join(' ')}
          />
          {/* Company name below logo (only when expanded) */}
          <span
            class={[
              props.collapsed ? 'hidden' : 'block',
              'text-lg font-bold text-center text-dark-900 dark:text-white',
            ].join(' ')}
          >
            Sree UGCL Projects Limited
          </span>
          {/* Small logo for collapsed sidebar */}
          <img
            src="/logo.png"
            alt="Logo Icon"
            class={[
              props.collapsed ? 'block' : 'hidden',
              'w-10',
            ].join(' ')}
          />
        </a>
      </div>
      <div class="block h-px mb-2 bg-gradient-to-b 
      from-black/40 via-black/10 to-transparent dark:from-white/20 dark:to-transparent rounded"></div>

      <nav class="flex-1 overflow-y-auto no-scrollbar">
      <ul class="flex flex-col gap-2 list-none p-2 m-0">
      {menuData
        .filter(item => item.roles.includes(state.userRole))
        .map((item) => (
          <MenuItem key={item.key} item={item} collapsed={props.collapsed} />
      ))}
    </ul>

      </nav>
    </aside>
  );
});
