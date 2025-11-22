// src/routes/admin/businesses/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { businessService, authService } from '~/services';
import type { BusinessVertical } from '~/services';
import { P9ETable } from '~/components/table/table';

export default component$(() => {
  const nav = useNavigate();

  const businesses = useSignal<BusinessVertical[]>([]);
  const loading = useSignal(true);
  const error = useSignal('');
  const showDeleteModal = useSignal(false);
  const businessToDelete = useSignal<BusinessVertical | null>(null);
  const deleting = useSignal(false);

  // Check admin access
  useVisibleTask$(async () => {
    const user = authService.getUser();
    if (!user?.is_super_admin) {
      nav('/dashboard');
      return;
    }

    await loadBusinesses();
  });

  const loadBusinesses = $(async () => {
    try {
      loading.value = true;
      error.value = '';
      const response = await businessService.getAllBusinesses();
      businesses.value = response.data || [];
    } catch (err: any) {
      error.value = err.message || 'Failed to load businesses';
    } finally {
      loading.value = false;
    }
  });

  const handleCreate = $(() => {
    nav('/admin/businesses/new');
  });

  const handleEdit = $((business: BusinessVertical) => {
    nav(`/admin/businesses/${business.id}/edit`);
  });

  const confirmDelete = $((business: BusinessVertical) => {
    businessToDelete.value = business;
    showDeleteModal.value = true;
  });

  const handleDelete = $(async () => {
    if (!businessToDelete.value) return;

    try {
      deleting.value = true;
      await businessService.deleteBusiness(businessToDelete.value.id);

      // Remove from list
      businesses.value = businesses.value.filter(
        b => b.id !== businessToDelete.value!.id
      );

      // Close modal
      showDeleteModal.value = false;
      businessToDelete.value = null;
    } catch (err: any) {
      error.value = err.message || 'Failed to delete business';
    } finally {
      deleting.value = false;
    }
  });

  const cancelDelete = $(() => {
    showDeleteModal.value = false;
    businessToDelete.value = null;
  });

  if (loading.value) {
    return (
      <div class="min-h-screen bg-light-50 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-dark-600">Loading businesses...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container-lg mx-auto">
        {/* Header */}
        <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold text-dark-800">Business Verticals</h1>
            <p class="text-dark-600 mt-2">
              Manage business verticals and their configurations
            </p>
          </div>
          <button onClick$={handleCreate} class="btn-primary px-6 py-3 rounded-lg font-semibold">
            + Create Business
          </button>
        </div>

        {/* Error Alert */}
        {error.value && (
          <div class="alert-danger rounded-lg p-4 mb-6 bg-danger-50 border-l-4 border-danger-500">
            <p class="text-danger-800">{error.value}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="card bg-white shadow rounded-lg p-6">
            <div class="text-sm text-dark-600">Total Businesses</div>
            <div class="text-3xl font-bold text-primary-600 mt-2">
              {businesses.value.length}
            </div>
          </div>
          <div class="card bg-white shadow rounded-lg p-6">
            <div class="text-sm text-dark-600">Active</div>
            <div class="text-3xl font-bold text-success-600 mt-2">
              {businesses.value.filter(b => b.is_active !== false).length}
            </div>
          </div>
          <div class="card bg-white shadow rounded-lg p-6">
            <div class="text-sm text-dark-600">Inactive</div>
            <div class="text-3xl font-bold text-warning-600 mt-2">
              {businesses.value.filter(b => b.is_active === false).length}
            </div>
          </div>
          <div class="card bg-white shadow rounded-lg p-6">
            <div class="text-sm text-dark-600">Total Users</div>
            <div class="text-3xl font-bold text-info-600 mt-2">
              {businesses.value.reduce((sum, b) => sum + (b.user_count || 0), 0)}
            </div>
          </div>
        </div>

        {/* Businesses Table */}
        <div class="card bg-white shadow-lg rounded-xl p-6">
          {businesses.value.length === 0 ? (
            <div class="text-center py-12">
              <div class="text-6xl text-light-300 mb-4">📊</div>
              <h3 class="text-xl font-semibold text-dark-800 mb-2">No Businesses Yet</h3>
              <p class="text-dark-600 mb-6">
                Get started by creating your first business vertical
              </p>
              <button onClick$={handleCreate} class="btn-primary px-6 py-3 rounded-lg">
                Create Business
              </button>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-light-200">
                <thead class="bg-light-50">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                      Business Name
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                      Code
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                      Users
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                      Roles
                    </th>
                    <th class="px-6 py-4 text-right text-xs font-semibold text-dark-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-light-200">
                  {businesses.value.map((business) => (
                    <tr key={business.id} class="hover:bg-light-50 transition">
                      <td class="px-6 py-4">
                        <div class="flex items-start flex-col">
                          <div class="text-sm font-medium text-dark-800">
                            {business.name}
                          </div>
                          {business.description && (
                            <div class="text-xs text-dark-500 mt-1">
                              {business.description.slice(0, 60)}
                              {business.description.length > 60 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="badge-light-300 text-xs font-mono">
                          {business.code}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        {business.is_active !== false ? (
                          <span class="badge-success">Active</span>
                        ) : (
                          <span class="badge-danger">Inactive</span>
                        )}
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-dark-700">
                          {business.user_count || 0}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-dark-700">
                          {business.role_count || 0}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2">
                          <button
                            onClick$={() => nav(`/admin/businesses/${business.id}`)}
                            class="text-info-600 hover:text-info-700 px-3 py-1 text-sm"
                            title="View"
                          >
                            👁️
                          </button>
                          <button
                            onClick$={() => handleEdit(business)}
                            class="text-primary-600 hover:text-primary-700 px-3 py-1 text-sm"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick$={() => confirmDelete(business)}
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal.value && (
          <div class="fixed inset-0 bg-dark-950/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
              <h3 class="text-2xl font-bold text-dark-800 mb-4">Confirm Delete</h3>
              <p class="text-dark-600 mb-2">
                Are you sure you want to delete the business vertical:
              </p>
              <p class="font-semibold text-dark-800 mb-6">
                "{businessToDelete.value?.name}"?
              </p>
              <p class="text-sm text-danger-600 mb-6">
                This action cannot be undone. All associated data will be permanently removed.
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
                  onClick$={cancelDelete}
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
