import { component$, useSignal, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { apiClient } from '~/services/api-client';

interface Policy {
  id: string;
  name: string;
  display_name: string;
  description: string;
  effect: 'ALLOW' | 'DENY';
  priority: number;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  business_vertical_id?: string;
  created_at: string;
  updated_at: string;
}

interface PolicyStats {
  by_status: Array<{ status: string; count: number }>;
  by_effect: Array<{ effect: string; count: number }>;
  total_evaluations: number;
  evaluations_last_24h: number;
}

export default component$(() => {
  const nav = useNavigate();
  const policies = useSignal<Policy[]>([]);
  const stats = useSignal<PolicyStats | null>(null);
  const loading = useSignal(true);
  const error = useSignal('');

  const filters = useStore({
    status: '',
    effect: '',
    search: ''
  });

  const pagination = useStore({
    page: 1,
    limit: 20,
    total: 0
  });

  // Fetch policies
  const fetchPolicies = $(async () => {
    try {
      loading.value = true;

      const params: Record<string, string> = {
        limit: pagination.limit.toString(),
        offset: ((pagination.page - 1) * pagination.limit).toString(),
      };

      if (filters.status) params.status = filters.status;

      const data = await apiClient.get<{ policies: Policy[]; total: number }>('/policies', params);
      policies.value = data.policies || [];
      pagination.total = data.total || 0;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch policies';
    } finally {
      loading.value = false;
    }
  });

  // Fetch statistics
  const fetchStats = $(async () => {
    try {
      stats.value = await apiClient.get<PolicyStats>('/policies/statistics');
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  });

  // Activate policy
  const activatePolicy = $(async (policyId: string) => {
    try {
      await apiClient.post(`/policies/${policyId}/activate`);
      await fetchPolicies();
      await fetchStats();
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to activate policy'}`);
    }
  });

  // Deactivate policy
  const deactivatePolicy = $(async (policyId: string) => {
    try {
      await apiClient.post(`/policies/${policyId}/deactivate`);
      await fetchPolicies();
      await fetchStats();
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to deactivate policy'}`);
    }
  });

  // Delete policy
  const deletePolicy = $(async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      await apiClient.delete(`/policies/${policyId}`);
      await fetchPolicies();
      await fetchStats();
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to delete policy'}`);
    }
  });

  // Load data on mount
  useVisibleTask$(async () => {
    await fetchPolicies();
    await fetchStats();
  });

  // Filter policies
  const filteredPolicies = policies.value.filter(policy => {
    if (filters.status && policy.status !== filters.status) return false;
    if (filters.effect && policy.effect !== filters.effect) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return policy.name.toLowerCase().includes(search) ||
             policy.display_name.toLowerCase().includes(search);
    }
    return true;
  });

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Policy Management</h1>
          <p class="text-gray-600 mt-1">Manage ABAC policies and authorization rules</p>
        </div>
        <button
          onClick$={() => nav('/admin/policies/create')}
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Policy
        </button>
      </div>

      {/* Statistics Cards */}
      {stats.value && (
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Policies by Status */}
          {stats.value.by_status?.map((stat: any) => (
            <div key={stat.status} class="bg-white rounded-lg shadow p-6">
              <div class="text-sm font-medium text-gray-600 uppercase">{stat.status}</div>
              <div class="text-3xl font-bold text-gray-900 mt-2">{stat.count}</div>
            </div>
          ))}

          {/* Total Evaluations */}
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm font-medium text-gray-600 uppercase">Total Evaluations</div>
            <div class="text-3xl font-bold text-gray-900 mt-2">{stats.value.total_evaluations}</div>
          </div>

          {/* Last 24h Evaluations */}
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm font-medium text-gray-600 uppercase">Last 24 Hours</div>
            <div class="text-3xl font-bold text-gray-900 mt-2">{stats.value.evaluations_last_24h}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div class="bg-white rounded-lg shadow p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onInput$={(e) => filters.search = (e.target as HTMLInputElement).value}
              placeholder="Search policies..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange$={(e) => filters.status = (e.target as HTMLSelectElement).value}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Effect</label>
            <select
              value={filters.effect}
              onChange$={(e) => filters.effect = (e.target as HTMLSelectElement).value}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Effects</option>
              <option value="ALLOW">Allow</option>
              <option value="DENY">Deny</option>
            </select>
          </div>
        </div>
      </div>

      {/* Policies Table */}
      <div class="bg-white rounded-lg shadow overflow-hidden">
        {loading.value ? (
          <div class="p-12 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">Loading policies...</p>
          </div>
        ) : error.value ? (
          <div class="p-12 text-center">
            <p class="text-red-600">{error.value}</p>
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div class="p-12 text-center">
            <p class="text-gray-600">No policies found</p>
          </div>
        ) : (
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Policy Name
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Effect
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {filteredPolicies.map((policy) => (
                <tr key={policy.id} class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div>
                      <div class="text-sm font-medium text-gray-900">{policy.display_name}</div>
                      <div class="text-sm text-gray-500">{policy.description}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      policy.effect === 'ALLOW'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {policy.effect}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    {policy.priority}
                  </td>
                  <td class="px-6 py-4">
                    <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      policy.status === 'active' ? 'bg-green-100 text-green-800' :
                      policy.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      policy.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {policy.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right text-sm font-medium space-x-2">
                    <button
                      onClick$={() => nav(`/admin/policies/${policy.id}`)}
                      class="text-primary-600 hover:text-primary-900"
                    >
                      View
                    </button>
                    <button
                      onClick$={() => nav(`/admin/policies/${policy.id}/edit`)}
                      class="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick$={() => nav(`/admin/policies/${policy.id}/test`)}
                      class="text-blue-600 hover:text-blue-900"
                    >
                      Test
                    </button>
                    {policy.status === 'active' ? (
                      <button
                        onClick$={() => deactivatePolicy(policy.id)}
                        class="text-orange-600 hover:text-orange-900"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick$={() => activatePolicy(policy.id)}
                        class="text-green-600 hover:text-green-900"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick$={() => deletePolicy(policy.id)}
                      class="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div class="flex justify-between items-center bg-white px-6 py-4 rounded-lg shadow">
          <div class="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} policies
          </div>
          <div class="flex gap-2">
            <button
              onClick$={() => { pagination.page--; fetchPolicies(); }}
              disabled={pagination.page === 1}
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick$={() => { pagination.page++; fetchPolicies(); }}
              disabled={pagination.page * pagination.limit >= pagination.total}
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
