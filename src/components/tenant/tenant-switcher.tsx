import { component$, $, useSignal } from '@builder.io/qwik';
import { useAuthContext } from '~/contexts/auth-context';

export const TenantSwitcher = component$(() => {
  const auth = useAuthContext();
  const isOpen = useSignal(false);

  const toggleDropdown = $(() => {
    isOpen.value = !isOpen.value;
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const switchTenant = $(async (tenantId: string, _tenantSlug: string) => {
    try {
      isOpen.value = false;
      await auth.selectTenant(tenantId);

      // Optionally switch to subdomain
      // await auth.switchTenant(tenantSlug, 'subdomain');
    } catch (error) {
      console.error('Failed to switch tenant:', error);
    }
  });

  const openTenantSettings = $(() => {
    isOpen.value = false;
    // Navigate to tenant management (will be in the tenant app)
    window.open('/tenant/settings', '_blank');
  });

  if (!auth.currentTenant) {
    return null;
  }

  return (
    <div class="relative">
      <button
        class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
        onClick$={toggleDropdown}
      >
        <div class="flex items-center gap-2">
          {/* Tenant Logo/Icon */}
          <div class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            {auth.currentTenant.branding?.logo ? (
              <img
                src={auth.currentTenant.branding.logo}
                alt={auth.currentTenant.name}
                class="w-6 h-6 rounded"
              />
            ) : (
              <span class="text-primary-600 font-semibold text-sm">
                {auth.currentTenant.name.charAt(0)}
              </span>
            )}
          </div>

          <div class="text-left hidden md:block">
            <div class="text-sm font-medium text-gray-900">
              {auth.currentTenant.name}
            </div>
            <div class="text-xs text-gray-500">
              {auth.user?.tenants.find(t => t.tenantId === auth.currentTenant?.id)?.role}
            </div>
          </div>
        </div>

        <svg
          class={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen.value ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen.value && (
        <>
          <div
            class="fixed inset-0 z-40"
            onClick$={() => (isOpen.value = false)}
          ></div>

          <div class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div class="p-4 border-b border-gray-200">
              <h3 class="text-sm font-semibold text-gray-900 mb-1">
                Switch Organization
              </h3>
              <p class="text-xs text-gray-500">
                You have access to {auth.availableTenants.length} organization{auth.availableTenants.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div class="max-h-64 overflow-y-auto">
              {auth.availableTenants.map((tenant) => {
                const userTenant = auth.user?.tenants.find(ut => ut.tenantId === tenant.id);
                const isCurrent = tenant.id === auth.currentTenant?.id;

                return (
                  <button
                    key={tenant.id}
                    class={`w-full text-left p-3 hover:bg-gray-50 flex items-center gap-3 ${
                      isCurrent ? 'bg-primary-50 border-r-2 border-primary-500' : ''
                    }`}
                    onClick$={() => switchTenant(tenant.id, tenant.slug)}
                    disabled={isCurrent}
                  >
                    <div class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {tenant.branding?.logo ? (
                        <img
                          src={tenant.branding.logo}
                          alt={tenant.name}
                          class="w-6 h-6 rounded"
                        />
                      ) : (
                        <span class="text-primary-600 font-semibold text-sm">
                          {tenant.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900 truncate">
                          {tenant.name}
                        </span>
                        {isCurrent && (
                          <span class="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                        {userTenant?.isDefault && (
                          <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <div class="text-xs text-gray-500">
                        {userTenant?.role} • {tenant.slug}
                      </div>
                    </div>

                    {isCurrent && (
                      <svg class="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            <div class="p-3 border-t border-gray-200">
              <button
                class="w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md flex items-center gap-2"
                onClick$={openTenantSettings}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Tenant Settings
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
