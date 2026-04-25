import { component$, useSignal, useStore, $ } from '@builder.io/qwik';
import { routeLoader$, useNavigate } from '@builder.io/qwik-city';
import { apiClient } from '~/services/api-client';
import { createSSRApiClient } from '~/services';
import { Badge, Btn, DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeaderCell, DataTableRow, PageHeader, SectionCard } from '~/components/ds';

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

export const usePoliciesData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const [policiesData, statsData] = await Promise.all([
      ssrApiClient.get<{ policies: Policy[]; total: number }>('/policies', {
        limit: 20,
        offset: 0,
      }),
      ssrApiClient.get<PolicyStats>('/policies/statistics'),
    ]);

    return {
      policies: policiesData.policies || [],
      total: policiesData.total || 0,
      stats: statsData,
      error: '',
    };
  } catch (err: any) {
    return {
      policies: [] as Policy[],
      total: 0,
      stats: null as PolicyStats | null,
      error: err.message || 'Failed to fetch policies',
    };
  }
});

export default component$(() => {
  const initialData = usePoliciesData();
  const nav = useNavigate();
  const policies = useSignal<Policy[]>(initialData.value.policies || []);
  const stats = useSignal<PolicyStats | null>(initialData.value.stats || null);
  const loading = useSignal(false);
  const error = useSignal(initialData.value.error || '');

  const filters = useStore({
    status: '',
    effect: '',
    search: ''
  });

  const pagination = useStore({
    page: 1,
    limit: 20,
    total: initialData.value.total || 0
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
      <PageHeader title="Policy Management" subtitle="Manage ABAC policies and authorization rules">
        <Btn q:slot="actions" onClick$={() => nav('/policies/create')}>
          Create Policy
        </Btn>
      </PageHeader>

      {/* Statistics Cards */}
      {stats.value && (
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Policies by Status */}
          {stats.value.by_status?.map((stat: any) => (
            <SectionCard key={stat.status} class="p-6">
              <div class="text-sm font-medium uppercase text-color-text-secondary">{stat.status}</div>
              <div class="mt-2 text-3xl font-bold text-color-text-primary">{stat.count}</div>
            </SectionCard>
          ))}

          {/* Total Evaluations */}
          <SectionCard class="p-6">
            <div class="text-sm font-medium uppercase text-color-text-secondary">Total Evaluations</div>
            <div class="mt-2 text-3xl font-bold text-color-text-primary">{stats.value.total_evaluations}</div>
          </SectionCard>

          {/* Last 24h Evaluations */}
          <SectionCard class="p-6">
            <div class="text-sm font-medium uppercase text-color-text-secondary">Last 24 Hours</div>
            <div class="mt-2 text-3xl font-bold text-color-text-primary">{stats.value.evaluations_last_24h}</div>
          </SectionCard>
        </div>
      )}

      {/* Filters */}
      <SectionCard title="Filters" subtitle="Refine policies by search term, status, and effect.">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="mb-2 block text-sm font-medium text-color-text-secondary">Search</label>
            <input
              type="text"
              value={filters.search}
              onInput$={(e) => filters.search = (e.target as HTMLInputElement).value}
              placeholder="Search policies..."
              class="w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-4 py-2 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-color-text-secondary">Status</label>
            <select
              value={filters.status}
              onChange$={(e) => filters.status = (e.target as HTMLSelectElement).value}
              class="w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-4 py-2 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-color-text-secondary">Effect</label>
            <select
              value={filters.effect}
              onChange$={(e) => filters.effect = (e.target as HTMLSelectElement).value}
              class="w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-4 py-2 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none"
            >
              <option value="">All Effects</option>
              <option value="ALLOW">Allow</option>
              <option value="DENY">Deny</option>
            </select>
          </div>
        </div>
      </SectionCard>

      {/* Policies Table */}
      <SectionCard class="overflow-hidden p-0">
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
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableHeaderCell>Policy Name</DataTableHeaderCell>
                <DataTableHeaderCell>Effect</DataTableHeaderCell>
                <DataTableHeaderCell>Priority</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell class="text-right">Actions</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {filteredPolicies.map((policy) => (
                <DataTableRow key={policy.id}>
                  <DataTableCell>
                    <div class="text-sm font-medium text-neutral-900">{policy.display_name}</div>
                    <div class="text-sm text-neutral-500">{policy.description}</div>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant={policy.effect === 'ALLOW' ? 'success' : 'error'}>{policy.effect}</Badge>
                  </DataTableCell>
                  <DataTableCell class="text-sm text-neutral-900">{policy.priority}</DataTableCell>
                  <DataTableCell>
                    <Badge variant={
                      policy.status === 'active' ? 'success' :
                      policy.status === 'draft' ? 'warning' :
                      'neutral'
                    }>{policy.status}</Badge>
                  </DataTableCell>
                  <DataTableCell class="text-right">
                    <div class="flex justify-end gap-1">
                      <Btn size="sm" variant="ghost" onClick$={() => nav(`/policies/${policy.id}`)}>View</Btn>
                      <Btn size="sm" variant="primary" onClick$={() => nav(`/policies/${policy.id}/edit`)}>Edit</Btn>
                      <Btn size="sm" variant="ghost" onClick$={() => nav(`/policies/${policy.id}/test`)}>Test</Btn>
                      {policy.status === 'active' ? (
                        <Btn size="sm" variant="secondary" onClick$={() => deactivatePolicy(policy.id)}>Deactivate</Btn>
                      ) : (
                        <Btn size="sm" variant="secondary" onClick$={() => activatePolicy(policy.id)}>Activate</Btn>
                      )}
                      <Btn size="sm" variant="danger" onClick$={() => deletePolicy(policy.id)}>Delete</Btn>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </SectionCard>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <SectionCard class="px-6 py-4">
          <div class="flex items-center justify-between gap-4">
            <div class="text-sm text-color-text-secondary">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} policies
            </div>
            <div class="flex gap-2">
              <Btn
                variant="secondary"
                onClick$={() => { pagination.page--; fetchPolicies(); }}
                disabled={pagination.page === 1}
              >
                Previous
              </Btn>
              <Btn
                variant="secondary"
                onClick$={() => { pagination.page++; fetchPolicies(); }}
                disabled={pagination.page * pagination.limit >= pagination.total}
              >
                Next
              </Btn>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
});
