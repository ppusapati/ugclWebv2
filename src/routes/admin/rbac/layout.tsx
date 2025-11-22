// src/routes/admin/rbac/layout.tsx
import { component$, Slot } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';

export default component$(() => {
  const location = useLocation();
  const currentPath = location.url.pathname;

  const tabs = [
    {
      id: 'roles',
      label: 'Roles',
      path: '/admin/rbac/roles/',
      icon: 'i-heroicons-shield-check-solid',
      description: 'System-wide roles (super_admin, system_admin, etc.)',
    },
    {
      id: 'permissions',
      label: 'Permissions',
      path: '/admin/rbac/permissions/',
      icon: 'i-heroicons-key-solid',
      description: 'Manage granular permissions',
    },
  ];

  const isActiveTab = (path: string) => {
    return currentPath.startsWith(path);
  };

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container mx-auto max-w-7xl">
        {/* Header */}
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-dark-800 mb-2">Role-Based Access Control</h1>
          <p class="text-dark-600">Manage roles and permissions across the system</p>
        </div>

        {/* Tabs */}
        <div class="bg-white rounded-lg shadow-sm border border-light-200 mb-6">
          <div class="border-b border-light-200">
            <nav class="flex -mb-px" aria-label="Tabs">
              {tabs.map((tab) => {
                const isActive = isActiveTab(tab.path);
                return (
                  <Link
                    key={tab.id}
                    href={tab.path}
                    class={`
                      group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm
                      transition-all duration-200 min-w-[200px] justify-center
                      ${
                        isActive
                          ? 'border-primary-500 text-primary-600 bg-primary-50'
                          : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-dark-300 hover:bg-light-50'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <i class={`${tab.icon} w-5 h-5 mr-2 ${isActive ? 'text-primary-600' : 'text-dark-400 group-hover:text-dark-600'}`} />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Tab Description */}
          <div class="px-6 py-3 bg-light-50 border-b border-light-200">
            {tabs.map((tab) => {
              if (isActiveTab(tab.path)) {
                return (
                  <p key={tab.id} class="text-sm text-dark-600 flex items-center">
                    <i class={`${tab.icon} w-4 h-4 mr-2 text-primary-500`} />
                    {tab.description}
                  </p>
                );
              }
              return null;
            })}
          </div>

          {/* Tab Content */}
          <div class="p-6">
            <Slot />
          </div>
        </div>
      </div>
    </div>
  );
});
