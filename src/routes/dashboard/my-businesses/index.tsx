// src/routes/my-businesses/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { businessService, authService } from '~/services';
import type { BusinessVertical } from '~/services';

export default component$(() => {
  const nav = useNavigate();

  const businesses = useSignal<BusinessVertical[]>([]);
  const loading = useSignal(true);
  const searchQuery = useSignal('');
  const filterStatus = useSignal<'all' | 'active' | 'inactive'>('all');

  useVisibleTask$(async () => {
    const user = authService.getUser();
    if (!user) {
      nav('/login');
      return;
    }

    try {
      const data = await businessService.getMyBusinesses();
      businesses.value = data;
    } catch (error) {
      console.error('Failed to load businesses:', error);
    } finally {
      loading.value = false;
    }
  });

  const getFilteredBusinesses = () => {
    let filtered = businesses.value;

    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        b =>
          b.name.toLowerCase().includes(query) ||
          b.code.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filterStatus.value === 'active') {
      filtered = filtered.filter(b => b.is_active !== false);
    } else if (filterStatus.value === 'inactive') {
      filtered = filtered.filter(b => b.is_active === false);
    }

    return filtered;
  };

  const handleSelectBusiness = $((business: BusinessVertical) => {
    businessService.setSelectedBusiness(business);
    nav('/dashboard');
  });

  if (loading.value) {
    return (
      <div class="min-h-screen bg-light-50 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-dark-600">Loading your businesses...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container- mx-auto">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-dark-800">My Business Verticals</h1>
          <p class="text-dark-600 mt-2">Access and manage your business verticals</p>
        </div>

        {/* Search and Filter */}
        <div class="card bg-white shadow rounded-xl p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                value={searchQuery.value}
                onInput$={(e) => {
                  searchQuery.value = (e.target as HTMLInputElement).value;
                }}
                class="form-input w-full px-4 py-3 border border-light-300 rounded-lg"
                placeholder="Search by name or code..."
              />
            </div>
            <div>
              <select
                value={filterStatus.value}
                onChange$={(e) => {
                  filterStatus.value = (e.target as HTMLSelectElement).value as any;
                }}
                class="form-select w-full px-4 py-3 border border-light-300 rounded-lg"
              >
                <option value="all">All Businesses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="card bg-white shadow rounded-lg p-6">
            <div class="text-sm text-dark-600">Total Accessible</div>
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
            <div class="text-sm text-dark-600">Admin Access</div>
            <div class="text-3xl font-bold text-warning-600 mt-2">
              {businesses.value.filter(b => b.access_type === 'admin').length}
            </div>
          </div>
        </div>

        {/* Business Cards */}
        {businesses.value.length === 0 ? (
          <div class="card bg-white shadow-lg rounded-xl p-12 text-center">
            <div class="text-6xl text-light-300 mb-4">🏢</div>
            <h3 class="text-xl font-semibold text-dark-800 mb-2">No Businesses Assigned</h3>
            <p class="text-dark-600">
              Contact your administrator to get access to business verticals
            </p>
          </div>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredBusinesses().map((business) => (
              <div
                key={business.id}
                class="card bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-primary-400"
                onClick$={() => handleSelectBusiness(business)}
              >
                {/* Header */}
                <div class="flex justify-between items-start mb-4">
                  <div class="flex-1">
                    <h3 class="text-xl font-bold text-dark-800 mb-1">{business.name}</h3>
                    <p class="text-sm text-dark-600 font-mono">{business.code}</p>
                  </div>
                  {business.is_active !== false ? (
                    <span class="badge-success text-xs">Active</span>
                  ) : (
                    <span class="badge-danger text-xs">Inactive</span>
                  )}
                </div>

                {/* Description */}
                {business.description && (
                  <p class="text-sm text-dark-600 mb-4">
                    {business.description.slice(0, 100)}
                    {business.description.length > 100 ? '...' : ''}
                  </p>
                )}

                {/* Access Type */}
                <div class="mb-4">
                  <div class="flex items-center gap-2 text-sm">
                    <span class="text-dark-600">Access:</span>
                    {business.access_type === 'admin' ? (
                      <span class="badge-warning text-xs">Admin</span>
                    ) : (
                      <span class="badge-info text-xs">User</span>
                    )}
                  </div>
                </div>

                {/* Roles */}
                {business.roles && business.roles.length > 0 && (
                  <div class="mb-4">
                    <div class="text-xs text-dark-600 mb-2">Your Roles:</div>
                    <div class="flex flex-wrap gap-1">
                      {business.roles.slice(0, 3).map((role: string, idx: number) => (
                        <span key={idx} class="badge-primary-100 text-xs">
                          {role}
                        </span>
                      ))}
                      {business.roles.length > 3 && (
                        <span class="badge-light-300 text-xs">
                          +{business.roles.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Permissions */}
                {business.permissions && business.permissions.length > 0 && (
                  <div class="mb-4">
                    <div class="text-xs text-dark-600 mb-2">Permissions:</div>
                    <div class="flex flex-wrap gap-1">
                      {business.permissions.slice(0, 3).map((perm: string, idx: number) => (
                        <span key={idx} class="badge-success-100 text-xs">
                          {perm.replace('_', ' ')}
                        </span>
                      ))}
                      {business.permissions.length > 3 && (
                        <span class="badge-light-300 text-xs">
                          +{business.permissions.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick$={() => handleSelectBusiness(business)}
                  class="btn-primary w-full py-2 rounded-lg text-sm font-semibold"
                >
                  Select & Continue →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
