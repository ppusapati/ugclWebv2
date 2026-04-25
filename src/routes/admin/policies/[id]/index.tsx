// src/routes/admin/policies/[id]/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, useLocation, useNavigate } from '@builder.io/qwik-city';
import { apiClient, createSSRApiClient } from '~/services';
import { Badge, Btn, TabBar } from '~/components/ds';

interface Policy {
  id: string;
  name: string;
  display_name: string;
  description: string;
  effect: 'ALLOW' | 'DENY';
  priority: number;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  business_vertical_id?: string;
  business_vertical?: {
    id: string;
    name: string;
    code: string;
  };
  conditions: any[];
  resources: string[];
  actions: string[];
  subjects: any[];
  context?: any;
  version: number;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: string;
    email: string;
    name: string;
  };
  updated_by?: {
    id: string;
    email: string;
    name: string;
  };
}

interface PolicyEvaluation {
  id: string;
  result: 'ALLOW' | 'DENY';
  executed_at: string;
  execution_time_ms: number;
  subject: any;
  action: string;
  resource: string;
}

export const usePolicyDetailData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const policyId = requestEvent.params.id;

  try {
    const [policyData, evaluationsData] = await Promise.all([
      ssrApiClient.get<Policy>(`/policies/${policyId}`),
      ssrApiClient.get<PolicyEvaluation[]>(`/policies/${policyId}/evaluations`, { limit: 10 }),
    ]);

    return {
      policy: policyData,
      evaluations: evaluationsData || [],
      error: '',
    };
  } catch (err: any) {
    return {
      policy: null as Policy | null,
      evaluations: [] as PolicyEvaluation[],
      error: err.message || 'Failed to load policy',
    };
  }
});

export default component$(() => {
  const initialData = usePolicyDetailData();
  const location = useLocation();
  const nav = useNavigate();
  const policyId = location.params.id;

  const policy = useSignal<Policy | null>(initialData.value.policy || null);
  const recentEvaluations = useSignal<PolicyEvaluation[]>(initialData.value.evaluations || []);
  const loading = useSignal(false);
  const error = useSignal(initialData.value.error || '');
  const activeTab = useSignal<'details' | 'conditions' | 'evaluations'>('details');

  // Fetch policy details
  const fetchPolicy = $(async () => {
    try {
      loading.value = true;
      const data = await apiClient.get<Policy>(`/policies/${policyId}`);
      policy.value = data;
    } catch (err: any) {
      error.value = err.message || 'Failed to load policy';
    } finally {
      loading.value = false;
    }
  });

  // Fetch recent evaluations
  const fetchEvaluations = $(async () => {
    try {
      const data = await apiClient.get<PolicyEvaluation[]>(`/policies/${policyId}/evaluations?limit=10`);
      recentEvaluations.value = data || [];
    } catch (err) {
      console.error('Failed to load evaluations:', err);
    }
  });

  // Activate policy
  const activatePolicy = $(async () => {
    try {
      await apiClient.post(`/policies/${policyId}/activate`, {});
      await fetchPolicy();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  });

  // Deactivate policy
  const deactivatePolicy = $(async () => {
    try {
      await apiClient.post(`/policies/${policyId}/deactivate`, {});
      await fetchPolicy();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  });

  // Delete policy
  const deletePolicy = $(async () => {
    if (!confirm('Are you sure you want to delete this policy? This action cannot be undone.')) return;

    try {
      await apiClient.delete(`/policies/${policyId}`);
      nav('/admin/policies');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  });

  if (loading.value) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading policy details...</p>
        </div>
      </div>
    );
  }

  if (error.value || !policy.value) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <i class="i-heroicons-exclamation-triangle-solid h-16 w-16 inline-block text-red-500 mb-4" aria-hidden="true"></i>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p class="text-gray-600 mb-6">{error.value || 'Policy not found'}</p>
          <Btn
            onClick$={() => nav('/admin/policies')}
            class="rounded-lg"
          >
            Back to Policies
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <div class="flex items-center gap-4 mb-2">
            <button
              onClick$={() => nav('/admin/policies')}
              class="text-gray-600 hover:text-gray-900"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 class="text-3xl font-bold text-gray-900">{policy.value.display_name}</h1>
            <Badge variant={
              policy.value.status === 'active'
                ? 'success'
                : policy.value.status === 'draft'
                  ? 'warning'
                  : 'neutral'
            } class="px-3 py-1 text-sm">
              {policy.value.status.toUpperCase()}
            </Badge>
            <Badge variant={policy.value.effect === 'ALLOW' ? 'success' : 'error'} class="px-3 py-1 text-sm">
              {policy.value.effect}
            </Badge>
          </div>
          <p class="text-gray-600">{policy.value.description}</p>
          <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>ID: {policy.value.id}</span>
            <span>•</span>
            <span>Priority: {policy.value.priority}</span>
            <span>•</span>
            <span>Version: {policy.value.version}</span>
          </div>
        </div>

        {/* Actions */}
        <div class="flex gap-2">
          <Btn
            onClick$={() => nav(`/admin/policies/${policyId}/test`)}
            class="rounded-lg"
          >
            Test Policy
          </Btn>
          <Btn
            onClick$={() => nav(`/admin/policies/${policyId}/edit`)}
            variant="secondary"
            class="rounded-lg"
          >
            Edit
          </Btn>
          {policy.value.status === 'active' ? (
            <Btn
              onClick$={deactivatePolicy}
              variant="secondary"
              class="rounded-lg"
            >
              Deactivate
            </Btn>
          ) : (
            <Btn
              onClick$={activatePolicy}
              class="rounded-lg"
            >
              Activate
            </Btn>
          )}
          <Btn
            onClick$={deletePolicy}
            variant="danger"
            class="rounded-lg"
          >
            Delete
          </Btn>
        </div>
      </div>

      {/* Tabs */}
      <div class="border-b border-gray-200 pb-4">
        <TabBar
          items={[
            { key: 'details', label: 'Details' },
            { key: 'conditions', label: 'Conditions & Rules' },
            { key: 'evaluations', label: 'Recent Evaluations' },
          ]}
          activeKey={activeTab.value}
          onTabChange$={(key) => {
            activeTab.value = key as 'details' | 'conditions' | 'evaluations';
          }}
        />
      </div>

      {/* Tab Content */}
      <div class="bg-white rounded-lg shadow p-6">
        {/* Details Tab */}
        {activeTab.value === 'details' && (
          <div class="space-y-6">
            <div class="grid grid-cols-2 gap-6">
              {/* Basic Information */}
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900">Basic Information</h3>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Policy Name</label>
                  <p class="mt-1 text-sm text-gray-900">{policy.value.name}</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Display Name</label>
                  <p class="mt-1 text-sm text-gray-900">{policy.value.display_name}</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Description</label>
                  <p class="mt-1 text-sm text-gray-900">{policy.value.description}</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Business Vertical</label>
                  <p class="mt-1 text-sm text-gray-900">
                    {policy.value.business_vertical?.name || 'Global'}
                  </p>
                </div>
              </div>

              {/* Configuration */}
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900">Configuration</h3>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Effect</label>
                  <p class="mt-1">
                    <Badge variant={policy.value.effect === 'ALLOW' ? 'success' : 'error'}>
                      {policy.value.effect}
                    </Badge>
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Priority</label>
                  <p class="mt-1 text-sm text-gray-900">{policy.value.priority}</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Status</label>
                  <p class="mt-1">
                    <Badge variant={
                      policy.value.status === 'active'
                        ? 'success'
                        : policy.value.status === 'draft'
                          ? 'warning'
                          : 'neutral'
                    }>
                      {policy.value.status.toUpperCase()}
                    </Badge>
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Version</label>
                  <p class="mt-1 text-sm text-gray-900">{policy.value.version}</p>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Resources</h3>
              <div class="flex flex-wrap gap-2">
                {policy.value.resources && policy.value.resources.length > 0 ? (
                  policy.value.resources.map((resource, idx) => (
                    <Badge key={idx} variant="info" class="px-3 py-1 text-sm">
                      {resource}
                    </Badge>
                  ))
                ) : (
                  <p class="text-sm text-gray-500">No resources defined</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Actions</h3>
              <div class="flex flex-wrap gap-2">
                {policy.value.actions && policy.value.actions.length > 0 ? (
                  policy.value.actions.map((action, idx) => (
                    <Badge key={idx} variant="info" class="px-3 py-1 text-sm">
                      {action}
                    </Badge>
                  ))
                ) : (
                  <p class="text-sm text-gray-500">No actions defined</p>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div class="pt-6 border-t border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Metadata</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label class="block text-gray-700 font-medium">Created At</label>
                  <p class="text-gray-900">{new Date(policy.value.created_at).toLocaleString()}</p>
                  {policy.value.created_by && (
                    <p class="text-gray-600 text-xs">by {policy.value.created_by.name || policy.value.created_by.email}</p>
                  )}
                </div>
                <div>
                  <label class="block text-gray-700 font-medium">Last Updated</label>
                  <p class="text-gray-900">{new Date(policy.value.updated_at).toLocaleString()}</p>
                  {policy.value.updated_by && (
                    <p class="text-gray-600 text-xs">by {policy.value.updated_by.name || policy.value.updated_by.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conditions Tab */}
        {activeTab.value === 'conditions' && (
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900">Policy Conditions</h3>
            {policy.value.conditions && policy.value.conditions.length > 0 ? (
              <div class="space-y-4">
                {policy.value.conditions.map((condition, idx) => (
                  <div key={idx} class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <pre class="text-sm text-gray-800 overflow-x-auto">
                      {JSON.stringify(condition, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div class="text-center py-8 text-gray-500">
                <p>No conditions defined for this policy</p>
                <p class="text-sm mt-2">This policy will apply to all matching subjects, resources, and actions</p>
              </div>
            )}

            {/* Subjects */}
            <div class="pt-4 border-t border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Subjects</h3>
              {policy.value.subjects && policy.value.subjects.length > 0 ? (
                <div class="space-y-2">
                  {policy.value.subjects.map((subject, idx) => (
                    <div key={idx} class="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <pre class="text-sm text-gray-800 overflow-x-auto">
                        {JSON.stringify(subject, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p class="text-sm text-gray-500">No subjects defined</p>
              )}
            </div>

            {/* Context */}
            {policy.value.context && (
              <div class="pt-4 border-t border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">Context</h3>
                <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <pre class="text-sm text-gray-800 overflow-x-auto">
                    {JSON.stringify(policy.value.context, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Evaluations Tab */}
        {activeTab.value === 'evaluations' && (
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">Recent Evaluations</h3>
              <button
                onClick$={fetchEvaluations}
                class="text-sm text-primary-600 hover:text-primary-700"
              >
                Refresh
              </button>
            </div>

            {recentEvaluations.value.length > 0 ? (
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    {recentEvaluations.value.map((evaluation) => (
                      <tr key={evaluation.id} class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(evaluation.executed_at).toLocaleString()}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class={`px-2 py-1 text-xs font-semibold rounded-full ${
                            evaluation.result === 'ALLOW'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {evaluation.result}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {evaluation.action}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {evaluation.resource}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {evaluation.execution_time_ms}ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div class="text-center py-8 text-gray-500">
                <p>No evaluations recorded yet</p>
                <p class="text-sm mt-2">Test this policy to see evaluation results</p>
                <Btn
                  onClick$={() => nav(`/admin/policies/${policyId}/test`)}
                  class="mt-4 rounded-lg"
                >
                  Test Policy
                </Btn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
