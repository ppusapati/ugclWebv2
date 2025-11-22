import { component$, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useAuthContext } from '~/contexts/auth-context';

export const TenantSelector = component$(() => {
  const auth = useAuthContext();
  const nav = useNavigate();

  const selectTenant = $(async (tenantId: string) => {
    try {
      await auth.selectTenant(tenantId);

      // Navigate to dashboard after selection
      nav('/dashboard');
    } catch (error) {
      console.error('Failed to select tenant:', error);
      // Could show a toast notification here
    }
  });

  const switchToSubdomain = $(async (tenantSlug: string) => {
    try {
      await auth.switchTenant(tenantSlug, 'subdomain');
    } catch (error) {
      console.error('Failed to switch to subdomain:', error);
    }
  });

  const switchToPath = $(async (tenantSlug: string) => {
    try {
      await auth.switchTenant(tenantSlug, 'path');
    } catch (error) {
      console.error('Failed to switch to path:', error);
    }
  });

  if (auth.isLoadingTenant) {
    return (
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="enterprise-card max-w-md w-full text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading your organizations...</p>
        </div>
      </div>
    );
  }

  if (auth.tenantError) {
    return (
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="enterprise-card max-w-md w-full">
          <div class="text-center">
            <div class="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900 mb-2">Access Error</h2>
            <p class="text-red-600 mb-4">{auth.tenantError}</p>
            <button
              class="btn-primary"
              onClick$={auth.refreshTenants}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="enterprise-card">
          <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">Select Organization</h1>
            <p class="text-gray-600 mt-2">Choose which organization you'd like to access</p>
          </div>

          <div class="space-y-3">
            {auth.availableTenants.map((tenant) => {
              const userTenant = auth.user?.tenants.find(ut => ut.tenantId === tenant.id);

              return (
                <div key={tenant.id} class="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                  <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                      <h3 class="text-lg font-semibold text-gray-900 truncate">
                        {tenant.name}
                      </h3>
                      <p class="text-sm text-gray-500 mb-2">
                        {userTenant?.role} • {tenant.slug}
                      </p>
                      {userTenant?.isDefault && (
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          Default
                        </span>
                      )}
                    </div>
                  </div>

                  <div class="flex flex-col gap-2 mt-4">
                    {/* Session-based selection (stays on current domain) */}
                    <button
                      class="btn-primary w-full"
                      onClick$={() => selectTenant(tenant.id)}
                    >
                      Access {tenant.name}
                    </button>

                    {/* Alternative access methods */}
                    <div class="flex gap-2">
                      <button
                        class="btn-outline-primary flex-1 text-xs"
                        onClick$={() => switchToSubdomain(tenant.slug)}
                        title={`Access via ${tenant.slug}.ugcl.com`}
                      >
                        Subdomain
                      </button>
                      <button
                        class="btn-outline-primary flex-1 text-xs"
                        onClick$={() => switchToPath(tenant.slug)}
                        title={`Access via /${tenant.slug}/dashboard`}
                      >
                        Path
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {auth.availableTenants.length === 0 && (
            <div class="text-center py-8">
              <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No Organizations Available</h3>
              <p class="text-gray-500 mb-4">You don't have access to any organizations yet.</p>
              <button class="btn-outline-primary" onClick$={auth.logout}>
                Switch Account
              </button>
            </div>
          )}

          <div class="mt-6 pt-6 border-t border-gray-200">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Signed in as {auth.user?.email}</span>
              <button
                class="text-red-600 hover:text-red-800 font-medium"
                onClick$={auth.logout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Detection Strategy Info */}
        {auth.detectionStrategy && auth.detectionStrategy !== 'none' && (
          <div class="mt-4 text-center">
            <p class="text-xs text-gray-500">
              Detection strategy: {auth.detectionStrategy}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});