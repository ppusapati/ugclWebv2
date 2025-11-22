import { component$, $, useSignal } from '@builder.io/qwik';
import { useAuthContext } from '~/contexts/auth-context';

export const BusinessVerticalSwitcher = component$(() => {
  const auth = useAuthContext();
  const isOpen = useSignal(false);

  const toggleDropdown = $(() => {
    isOpen.value = !isOpen.value;
  });

  const switchVertical = $(async (businessVerticalId: string) => {
    try {
      isOpen.value = false;
      await auth.switchBusinessVertical(businessVerticalId);

      // Reload to apply new business context
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch business vertical:', error);
    }
  });

  // Get current business vertical
  const getCurrentBusiness = () => {
    if (!auth.user || !auth.user.business_roles) return null;

    const storedBusinessId = typeof window !== 'undefined'
      ? localStorage.getItem('ugcl_current_business_vertical')
      : null;

    if (storedBusinessId) {
      const businessRole = auth.user.business_roles.find(
        (br: any) => br.business_vertical_id === storedBusinessId
      );
      if (businessRole) return businessRole;
    }

    return auth.user.business_roles[0] || null;
  };

  const currentBusiness = getCurrentBusiness();

  if (!auth.user || !auth.user.business_roles || auth.user.business_roles.length === 0) {
    return null;
  }

  return (
    <div class="relative">
      <button
        class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
        onClick$={toggleDropdown}
      >
        <div class="flex items-center gap-2">
          {/* Business Vertical Icon */}
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>

          <div class="text-left hidden md:block">
            <div class="text-sm font-medium text-gray-900">
              {currentBusiness?.business_vertical?.name || 'No Business'}
            </div>
            <div class="text-xs text-gray-500">
              {currentBusiness?.is_admin ? 'Admin' : 'User'}
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
                Switch Business Vertical
              </h3>
              <p class="text-xs text-gray-500">
                You have access to {auth.user.business_roles.length} business vertical{auth.user.business_roles.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div class="max-h-64 overflow-y-auto">
              {auth.user.business_roles.map((businessRole: any) => {
                const isCurrent = businessRole.business_vertical_id === currentBusiness?.business_vertical_id;

                return (
                  <button
                    key={businessRole.business_vertical_id}
                    class={`w-full text-left p-3 hover:bg-gray-50 flex items-center gap-3 ${
                      isCurrent ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                    onClick$={() => switchVertical(businessRole.business_vertical_id)}
                    disabled={isCurrent}
                  >
                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900 truncate">
                          {businessRole.business_vertical?.name || businessRole.business_vertical_id}
                        </span>
                        {isCurrent && (
                          <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                        {businessRole.is_admin && (
                          <span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <div class="text-xs text-gray-500">
                        {businessRole.roles?.join(', ') || 'No roles'} • {businessRole.permissions?.length || 0} permissions
                      </div>
                    </div>

                    {isCurrent && (
                      <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
});
