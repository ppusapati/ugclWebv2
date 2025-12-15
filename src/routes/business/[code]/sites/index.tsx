// src/routes/business/[code]/sites/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { siteService, authService } from '~/services';
import type { Site } from '~/services';

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const businessCode = loc.params.code;

  const sites = useSignal<Site[]>([]);
  const loading = useSignal(true);
  const error = useSignal('');
  const showDeleteModal = useSignal(false);
  const siteToDelete = useSignal<Site | null>(null);
  const deleting = useSignal(false);



  const loadSites = $(async () => {
    try {
      loading.value = true;
      error.value = '';
      const sitesList = await siteService.getMySites(businessCode);
      sites.value = sitesList || [];
    } catch (err: any) {
      error.value = err.message || 'Failed to load sites';
    } finally {
      loading.value = false;
    }
  });

  const confirmDelete = $((site: Site) => {
    siteToDelete.value = site;
    showDeleteModal.value = true;
  });

  const handleDelete = $(async () => {
    if (!siteToDelete.value) return;

    try {
      deleting.value = true;
      await siteService.deleteSite(businessCode, siteToDelete.value.id);
      sites.value = sites.value.filter(s => s.id !== siteToDelete.value!.id);
      showDeleteModal.value = false;
      siteToDelete.value = null;
    } catch (err: any) {
      error.value = err.message || 'Failed to delete site';
    } finally {
      deleting.value = false;
    }
  });
  useVisibleTask$(async () => {
    await loadSites();
  });
  if (loading.value) {
    return (
      <div class="min-h-screen bg-light-50 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-dark-600">Loading sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container-lg mx-auto">
        <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold text-dark-800">Sites</h1>
            <p class="text-dark-600 mt-2">Manage sites for {businessCode}</p>
          </div>
          <button
            onClick$={() => nav(`/business/${businessCode}/sites/new`)}
            class="btn-primary px-6 py-3 rounded-lg font-semibold"
          >
            + Add Site
          </button>
        </div>

        {error.value && (
          <div class="alert-danger rounded-lg p-4 mb-6 bg-danger-50 border-l-4 border-danger-500">
            <p class="text-danger-800">{error.value}</p>
          </div>
        )}

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="card bg-white shadow rounded-lg p-6">
            <div class="text-sm text-dark-600">Total Sites</div>
            <div class="text-3xl font-bold text-primary-600 mt-2">{sites.value.length}</div>
          </div>
          <div class="card bg-white shadow rounded-lg p-6">
            <div class="text-sm text-dark-600">Active</div>
            <div class="text-3xl font-bold text-success-600 mt-2">
              {sites.value.filter(s => s.is_active !== false).length}
            </div>
          </div>
          <div class="card bg-white shadow rounded-lg p-6">
            <div class="text-sm text-dark-600">Inactive</div>
            <div class="text-3xl font-bold text-warning-600 mt-2">
              {sites.value.filter(s => s.is_active === false).length}
            </div>
          </div>
          <div class="card bg-white shadow rounded-lg p-6">
            <div class="text-sm text-dark-600">With Location</div>
            <div class="text-3xl font-bold text-info-600 mt-2">
              {sites.value.filter(s => s.location).length}
            </div>
          </div>
        </div>

        <div class="card bg-white shadow-lg rounded-xl p-6">
          {sites.value.length === 0 ? (
            <div class="text-center py-12">
              <div class="text-6xl text-light-300 mb-4">📍</div>
              <h3 class="text-xl font-semibold text-dark-800 mb-2">No Sites Yet</h3>
              <p class="text-dark-600 mb-6">Create your first site to get started</p>
              <button
                onClick$={() => nav(`/business/${businessCode}/sites/new`)}
                class="btn-primary px-6 py-3 rounded-lg"
              >
                Add Site
              </button>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-light-200">
                <thead class="bg-light-50">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">
                      Site Name
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">
                      Code
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">
                      Location
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">
                      Status
                    </th>
                    <th class="px-6 py-4 text-right text-xs font-semibold text-dark-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-light-200">
                  {sites.value.map((site) => (
                    <tr key={site.id} class="hover:bg-light-50 transition">
                      <td class="px-6 py-4">
                        <div class="flex flex-col">
                          <div class="text-sm font-medium text-dark-800">{site.name}</div>
                          {site.description && (
                            <div class="text-xs text-dark-500 mt-1">
                              {site.description.slice(0, 60)}
                              {site.description.length > 60 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="badge-light-300 text-xs font-mono">{site.code}</span>
                      </td>
                      <td class="px-6 py-4">
                        {site.location ? (
                          <div class="text-xs text-dark-600">
                            <div>{site.location.lat}, {site.location.lng}</div>
                            {site.location.address && (
                              <div class="text-dark-500">{site.location.address.slice(0, 30)}...</div>
                            )}
                          </div>
                        ) : (
                          <span class="text-xs text-dark-400">No location</span>
                        )}
                      </td>
                      <td class="px-6 py-4">
                        {site.is_active !== false ? (
                          <span class="badge-success">Active</span>
                        ) : (
                          <span class="badge-danger">Inactive</span>
                        )}
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2">
                          <button
                            onClick$={() => nav(`/business/${businessCode}/sites/${site.id}/access`)}
                            class="text-info-600 hover:text-info-700 px-3 py-1 text-sm"
                            title="Manage Access"
                          >
                            🔐
                          </button>
                          <button
                            onClick$={() => nav(`/business/${businessCode}/sites/${site.id}/edit`)}
                            class="text-primary-600 hover:text-primary-700 px-3 py-1 text-sm"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick$={() => confirmDelete(site)}
                            class="text-danger-600 hover:text-danger-700 px-3 py-1 text-sm"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showDeleteModal.value && (
          <div class="fixed inset-0 bg-dark-950/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
              <h3 class="text-2xl font-bold text-dark-800 mb-4">Confirm Delete</h3>
              <p class="text-dark-600 mb-2">Are you sure you want to delete this site:</p>
              <p class="font-semibold text-dark-800 mb-6">"{siteToDelete.value?.name}"?</p>
              <p class="text-sm text-danger-600 mb-6">
                This action cannot be undone. All associated data will be removed.
              </p>
              <div class="flex gap-4">
                <button
                  onClick$={handleDelete}
                  disabled={deleting.value}
                  class="btn-danger flex-1 py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {deleting.value ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick$={() => {
                    showDeleteModal.value = false;
                    siteToDelete.value = null;
                  }}
                  disabled={deleting.value}
                  class="btn-light-300 flex-1 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
