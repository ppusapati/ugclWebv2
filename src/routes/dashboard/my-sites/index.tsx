// src/routes/my-sites/index.tsx
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { siteService, businessService, authService } from '~/services';
import type { Site } from '~/services';

export default component$(() => {
  const nav = useNavigate();

  const sites = useSignal<Site[]>([]);
  const loading = useSignal(true);
  const selectedBusiness = useSignal(businessService.getSelectedBusiness());

  useVisibleTask$(async () => {
    const user = authService.getUser();
    if (!user) {
      nav('/login');
      return;
    }

    try {
      if (selectedBusiness.value) {
        const data = await siteService.getMySites(selectedBusiness.value.code);
        sites.value = data;
      }
    } catch (error) {
      console.error('Failed to load sites:', error);
    } finally {
      loading.value = false;
    }
  });

  if (loading.value) {
    return (
      <div class="min-h-screen bg-light-50 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-dark-600">Loading your sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container mx-auto">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-dark-800">My Sites</h1>
          <p class="text-dark-600 mt-2">Sites you have access to</p>
        </div>

        {!selectedBusiness.value ? (
          <div class="card bg-warning-50 border border-warning-200 rounded-xl p-6">
            <h3 class="text-lg font-semibold text-warning-800 mb-2">No Business Selected</h3>
            <p class="text-warning-700 mb-4">Please select a business vertical to view your sites.</p>
            <button onClick$={() => nav('/my-businesses')} class="btn-warning px-6 py-2 rounded-lg">
              Select Business
            </button>
          </div>
        ) : sites.value.length === 0 ? (
          <div class="card bg-white shadow-lg rounded-xl p-12 text-center">
            <div class="text-6xl text-light-300 mb-4">📍</div>
            <h3 class="text-xl font-semibold text-dark-800 mb-2">No Sites Assigned</h3>
            <p class="text-dark-600">Contact your administrator to get access to sites</p>
          </div>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.value.map((site) => (
              <div key={site.id} class="card bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition">
                <div class="flex justify-between items-start mb-4">
                  <div class="flex-1">
                    <h3 class="text-xl font-bold text-dark-800 mb-1">{site.name}</h3>
                    <p class="text-sm text-dark-600 font-mono">{site.code}</p>
                  </div>
                  {site.is_active !== false ? (
                    <span class="badge-success text-xs">Active</span>
                  ) : (
                    <span class="badge-danger text-xs">Inactive</span>
                  )}
                </div>

                {site.description && (
                  <p class="text-sm text-dark-600 mb-4">{site.description}</p>
                )}

                {site.location && (
                  <div class="mb-4 p-3 bg-light-50 rounded-lg">
                    <div class="text-xs text-dark-600 mb-1">Location</div>
                    <div class="text-sm text-dark-800 font-mono">
                      {site.location.lat.toFixed(6)}, {site.location.lng.toFixed(6)}
                    </div>
                    {site.location.address && (
                      <div class="text-xs text-dark-600 mt-1">{site.location.address}</div>
                    )}
                  </div>
                )}

                <button
                  onClick$={() => nav(`/business/${selectedBusiness.value?.code}/sites/${site.id}`)}
                  class="btn-primary w-full py-2 rounded-lg text-sm font-semibold"
                >
                  View Details →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
