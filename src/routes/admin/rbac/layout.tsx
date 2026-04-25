// src/routes/admin/rbac/layout.tsx
import { component$, Slot } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { SectionCard, TabBar } from '~/components/ds';

export default component$(() => {
  const location = useLocation();
  const nav = useNavigate();
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
    <div class="space-y-6">
      <SectionCard class="p-0">
        <div class="border-b border-color-border-primary px-6 py-4">
          <TabBar
            items={tabs.map((tab) => ({ key: tab.id, label: tab.label }))}
            activeKey={tabs.find((tab) => isActiveTab(tab.path))?.id || tabs[0].id}
            onTabChange$={(key) => {
              const target = tabs.find((tab) => tab.id === key);
              if (target) {
                nav(target.path);
              }
            }}
          />
        </div>

        <div class="border-b border-color-border-primary bg-color-surface-secondary px-6 py-3">
          {tabs.map((tab) => {
            if (isActiveTab(tab.path)) {
              return (
                <p key={tab.id} class="flex items-center text-sm text-color-text-secondary">
                  <i class={`${tab.icon} mr-2 h-4 w-4 text-color-interactive-primary`} />
                  {tab.description}
                </p>
              );
            }
            return null;
          })}
        </div>
      </SectionCard>

      <Slot />
    </div>
  );
});
