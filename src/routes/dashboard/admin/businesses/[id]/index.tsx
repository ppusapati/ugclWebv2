// src/routes/admin/businesses/[id]/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { businessService, authService } from '~/services';
import type { BusinessVertical } from '~/services';

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const businessId = loc.params.id;

  const business = useSignal<BusinessVertical | null>(null);
  const loading = useSignal(true);

  useVisibleTask$(async () => {
    const user = authService.getUser();
    if (!user?.is_super_admin) {
      nav('/dashboard');
      return;
    }

    try {
      const response = await businessService.getAllBusinesses();
      const foundBusiness = response.data.find(b => b.id === businessId);

      if (!foundBusiness) {
        nav('/admin/businesses');
        return;
      }

      business.value = foundBusiness;
    } catch (error) {
      console.error('Failed to load business:', error);
      nav('/admin/businesses');
    } finally {
      loading.value = false;
    }
  });

  if (loading.value) {
    return (
      <div class="min-h-screen bg-light-50 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-dark-600">Loading business details...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container-lg mx-auto">
        <div class="mb-6">
          <button
            onClick$={() => nav('/admin/businesses')}
            class="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
          >
            <span>←</span> Back to Businesses
          </button>
          <div class="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 class="text-3xl font-bold text-dark-800">{business.value?.name}</h1>
              <p class="text-dark-600 mt-2">Business Vertical Details</p>
            </div>
            <div class="flex gap-3">
              <button
                onClick$={() => nav(`/admin/businesses/${businessId}/edit`)}
                class="btn-primary px-6 py-2 rounded-lg"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div class="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div class="card bg-white shadow-lg rounded-xl p-8">
              <h2 class="text-2xl font-bold text-dark-800 mb-6">Basic Information</h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="text-sm font-medium text-dark-600">Business Name</label>
                  <p class="text-lg text-dark-800 mt-1">{business.value?.name}</p>
                </div>

                <div>
                  <label class="text-sm font-medium text-dark-600">Business Code</label>
                  <p class="text-lg text-dark-800 mt-1 font-mono">{business.value?.code}</p>
                </div>

                <div class="md:col-span-2">
                  <label class="text-sm font-medium text-dark-600">Description</label>
                  <p class="text-dark-800 mt-1">
                    {business.value?.description || 'No description provided'}
                  </p>
                </div>

                <div>
                  <label class="text-sm font-medium text-dark-600">Status</label>
                  <div class="mt-1">
                    {business.value?.is_active !== false ? (
                      <span class="badge-success">Active</span>
                    ) : (
                      <span class="badge-danger">Inactive</span>
                    )}
                  </div>
                </div>

                <div>
                  <label class="text-sm font-medium text-dark-600">Business ID</label>
                  <p class="text-sm text-dark-600 mt-1 font-mono">{business.value?.id}</p>
                </div>
              </div>
            </div>

            {/* Settings */}
            {business.value?.settings && Object.keys(business.value.settings).length > 0 && (
              <div class="card bg-white shadow-lg rounded-xl p-8">
                <h2 class="text-2xl font-bold text-dark-800 mb-6">Settings</h2>
                <pre class="bg-dark-900 text-light-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                  {JSON.stringify(business.value.settings, null, 2)}
                </pre>
              </div>
            )}

            {/* Statistics */}
            <div class="card bg-white shadow-lg rounded-xl p-8">
              <h2 class="text-2xl font-bold text-dark-800 mb-6">Statistics</h2>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center p-4 bg-primary-50 rounded-lg">
                  <div class="text-3xl font-bold text-primary-600">
                    {business.value?.user_count || 0}
                  </div>
                  <div class="text-sm text-primary-700 mt-1">Users</div>
                </div>

                <div class="text-center p-4 bg-success-50 rounded-lg">
                  <div class="text-3xl font-bold text-success-600">
                    {business.value?.role_count || 0}
                  </div>
                  <div class="text-sm text-success-700 mt-1">Roles</div>
                </div>

                <div class="text-center p-4 bg-info-50 rounded-lg">
                  <div class="text-3xl font-bold text-info-600">0</div>
                  <div class="text-sm text-info-700 mt-1">Sites</div>
                </div>

                <div class="text-center p-4 bg-warning-50 rounded-lg">
                  <div class="text-3xl font-bold text-warning-600">0</div>
                  <div class="text-sm text-warning-700 mt-1">Reports</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div class="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div class="card bg-white shadow-lg rounded-xl p-6">
              <h3 class="text-lg font-semibold text-dark-800 mb-4">Quick Actions</h3>
              <div class="space-y-3">
                <button
                  onClick$={() => nav(`/admin/businesses/${businessId}/edit`)}
                  class="w-full text-left px-4 py-3 rounded-lg bg-primary-50 hover:bg-primary-100 transition"
                >
                  <span class="text-primary-700">Edit Business</span>
                </button>
                <button
                  onClick$={() => nav(`/business/${business.value?.code}/roles`)}
                  class="w-full text-left px-4 py-3 rounded-lg bg-light-50 hover:bg-light-100 transition"
                >
                  <span class="text-dark-700">Manage Roles</span>
                </button>
                <button
                  onClick$={() => nav(`/business/${business.value?.code}/sites`)}
                  class="w-full text-left px-4 py-3 rounded-lg bg-light-50 hover:bg-light-100 transition"
                >
                  <span class="text-dark-700">Manage Sites</span>
                </button>
                <button
                  onClick$={() => nav(`/business/${business.value?.code}/users`)}
                  class="w-full text-left px-4 py-3 rounded-lg bg-light-50 hover:bg-light-100 transition"
                >
                  <span class="text-dark-700">View Users</span>
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div class="card bg-light-50 border border-light-300 rounded-xl p-6">
              <h3 class="text-lg font-semibold text-dark-800 mb-4">Metadata</h3>
              <div class="space-y-3 text-sm">
                <div>
                  <p class="text-dark-600 font-medium">Created At</p>
                  <p class="text-dark-800">
                    {business.value?.created_at
                      ? new Date(business.value.created_at).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p class="text-dark-600 font-medium">Last Updated</p>
                  <p class="text-dark-800">
                    {business.value?.updated_at
                      ? new Date(business.value.updated_at).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
