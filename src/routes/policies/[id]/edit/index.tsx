// src/routes/admin/policies/[id]/edit/index.tsx
import { component$, useStore, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, useLocation, useNavigate } from '@builder.io/qwik-city';
import { apiClient, createSSRApiClient } from '~/services';
import { Badge, Btn, FormField, PageHeader } from '~/components/ds';

interface BusinessVertical {
  id: string;
  name: string;
  code: string;
}

interface Policy {
  id: string;
  name: string;
  display_name: string;
  description: string;
  effect: 'ALLOW' | 'DENY';
  priority: number;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  business_vertical_id?: string;
  resources: string[];
  actions: string[];
  conditions: any[];
  subjects: any[];
  context: any;
}

export const usePolicyEditData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const policyId = requestEvent.params.id;

  try {
    const [policyData, verticalsData] = await Promise.all([
      ssrApiClient.get<Policy>(`/policies/${policyId}`),
      ssrApiClient.get<{ businesses?: BusinessVertical[]; data?: BusinessVertical[] }>('/admin/businesses'),
    ]);

    return {
      policy: policyData,
      verticals: verticalsData.businesses || verticalsData.data || [],
      error: '',
    };
  } catch (err: any) {
    return {
      policy: null as Policy | null,
      verticals: [] as BusinessVertical[],
      error: err.message || 'Failed to load policy',
    };
  }
});

export default component$(() => {
  const initialData = usePolicyEditData();
  const location = useLocation();
  const nav = useNavigate();
  const policyId = location.params.id;

  const verticals = useSignal<BusinessVertical[]>(initialData.value.verticals || []);
  const loading = useSignal(false);
  const saving = useSignal(false);
  const error = useSignal(initialData.value.error || '');

  const form = useStore<Policy>({
    id: '',
    name: '',
    display_name: '',
    description: '',
    effect: 'ALLOW',
    priority: 100,
    status: 'draft',
    business_vertical_id: '',
    resources: [],
    actions: [],
    conditions: [],
    subjects: [],
    context: {},
  });

  // Temporary inputs for adding resources/actions
  const newResource = useSignal('');
  const newAction = useSignal('');

  if (initialData.value.policy) {
    form.id = initialData.value.policy.id;
    form.name = initialData.value.policy.name;
    form.display_name = initialData.value.policy.display_name;
    form.description = initialData.value.policy.description;
    form.effect = initialData.value.policy.effect;
    form.priority = initialData.value.policy.priority;
    form.status = initialData.value.policy.status;
    form.business_vertical_id = initialData.value.policy.business_vertical_id || '';
    form.resources = initialData.value.policy.resources || [];
    form.actions = initialData.value.policy.actions || [];
    form.conditions = initialData.value.policy.conditions || [];
    form.subjects = initialData.value.policy.subjects || [];
    form.context = initialData.value.policy.context || {};
  }

  // Add resource
  const addResource = $(() => {
    if (newResource.value.trim()) {
      form.resources = [...form.resources, newResource.value.trim()];
      newResource.value = '';
    }
  });

  // Remove resource
  const removeResource = $((index: number) => {
    form.resources = form.resources.filter((_, i) => i !== index);
  });

  // Add action
  const addAction = $(() => {
    if (newAction.value.trim()) {
      form.actions = [...form.actions, newAction.value.trim()];
      newAction.value = '';
    }
  });

  // Remove action
  const removeAction = $((index: number) => {
    form.actions = form.actions.filter((_, i) => i !== index);
  });

  // Submit form
  const handleSubmit = $(async () => {
    // Validation
    if (!form.name.trim()) {
      error.value = 'Policy name is required';
      return;
    }

    if (!form.display_name.trim()) {
      error.value = 'Display name is required';
      return;
    }

    if (form.resources.length === 0) {
      error.value = 'At least one resource is required';
      return;
    }

    if (form.actions.length === 0) {
      error.value = 'At least one action is required';
      return;
    }

    try {
      saving.value = true;
      error.value = '';

      await apiClient.put(`/policies/${policyId}`, form);

      // Redirect to policy detail
      nav(`/policies/${policyId}`);
    } catch (err: any) {
      error.value = err.message || 'Failed to update policy';
    } finally {
      saving.value = false;
    }
  });

  if (loading.value) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading policy...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {/* Header */}
      <PageHeader title="Edit Policy" subtitle={form.name ? `Updating ${form.name}` : 'Update policy configuration'}>
        <Btn
          q:slot="actions"
          variant="ghost"
          onClick$={() => nav(`/policies/${policyId}`)}
        >
          <i class="i-heroicons-arrow-left-solid mr-1 h-4 w-4 inline-block" aria-hidden="true"></i>
          Back to Policy
        </Btn>
      </PageHeader>

      {/* Error Message */}
      {error.value && (
        <div class="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error.value}
        </div>
      )}

      {/* Form */}
      <div class="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Basic Information */}
        <div class="space-y-4">
          <h2 class="text-xl font-semibold text-gray-900">Basic Information</h2>

          <div class="grid grid-cols-2 gap-4">
            <FormField id="policy-name" label="Policy Name" required hint="Unique identifier (lowercase, underscores)">
              <input
                id="policy-name"
                type="text"
                value={form.name}
                onInput$={(e) => form.name = (e.target as HTMLInputElement).value}
                placeholder="e.g., allow_project_view"
                required
                aria-required="true"
                aria-describedby="policy-name-hint"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </FormField>

            <FormField id="policy-display-name" label="Display Name" required hint="Human-readable name">
              <input
                id="policy-display-name"
                type="text"
                value={form.display_name}
                onInput$={(e) => form.display_name = (e.target as HTMLInputElement).value}
                placeholder="e.g., Allow Project View"
                required
                aria-required="true"
                aria-describedby="policy-display-name-hint"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </FormField>
          </div>

          <FormField id="policy-description" label="Description">
            <textarea
              id="policy-description"
              value={form.description}
              onInput$={(e) => form.description = (e.target as HTMLTextAreaElement).value}
              rows={3}
              placeholder="Describe what this policy does..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            ></textarea>
          </FormField>
        </div>

        {/* Configuration */}
        <div class="space-y-4 pt-6 border-t border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Configuration</h2>

          <div class="grid grid-cols-2 gap-4">
            <FormField id="policy-effect" label="Effect" required hint="Whether this policy allows or denies access">
              <select
                id="policy-effect"
                value={form.effect}
                onChange$={(e) => form.effect = (e.target as HTMLSelectElement).value as 'ALLOW' | 'DENY'}
                required
                aria-required="true"
                aria-describedby="policy-effect-hint"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="ALLOW">ALLOW</option>
                <option value="DENY">DENY</option>
              </select>
            </FormField>

            <FormField id="policy-priority" label="Priority" required hint="Lower numbers = higher priority (0-1000)">
              <input
                id="policy-priority"
                type="number"
                value={form.priority}
                onInput$={(e) => form.priority = parseInt((e.target as HTMLInputElement).value) || 100}
                min="0"
                max="1000"
                required
                aria-required="true"
                aria-describedby="policy-priority-hint"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </FormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <FormField id="policy-status" label="Status" hint="Policy will only be enforced if Active">
              <select
                id="policy-status"
                value={form.status}
                onChange$={(e) => form.status = (e.target as HTMLSelectElement).value as any}
                aria-describedby="policy-status-hint"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </FormField>

            <FormField id="policy-business-vertical" label="Business Vertical" hint="Leave empty for global policy">
              <select
                id="policy-business-vertical"
                value={form.business_vertical_id}
                onChange$={(e) => form.business_vertical_id = (e.target as HTMLSelectElement).value}
                aria-describedby="policy-business-vertical-hint"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Global (All Verticals)</option>
                {verticals.value.map((vertical) => (
                  <option key={vertical.id} value={vertical.id}>
                    {vertical.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>

        {/* Resources */}
        <div class="space-y-4 pt-6 border-t border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Resources *</h2>
          <p class="text-sm text-gray-600">
            Define which resources this policy applies to (e.g., "project:*", "project:123", "report:*")
          </p>

          <div class="flex gap-2">
            <input
              type="text"
              value={newResource.value}
              onInput$={(e) => newResource.value = (e.target as HTMLInputElement).value}
              onKeyPress$={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addResource();
                }
              }}
              placeholder="e.g., project:*, user:123"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Btn
              onClick$={addResource}
              type="button"
              class="rounded-lg"
            >
              Add
            </Btn>
          </div>

          <div class="flex flex-wrap gap-2">
            {form.resources.map((resource, idx) => (
              <Badge
                key={idx}
                variant="info"
                class="inline-flex items-center gap-2 px-3 py-1 text-sm"
              >
                {resource}
                <button
                  onClick$={() => removeResource(idx)}
                  type="button"
                  class="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div class="space-y-4 pt-6 border-t border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Actions *</h2>
          <p class="text-sm text-gray-600">
            Define which actions this policy applies to (e.g., "read", "write", "delete", "approve")
          </p>

          <div class="flex gap-2">
            <input
              type="text"
              value={newAction.value}
              onInput$={(e) => newAction.value = (e.target as HTMLInputElement).value}
              onKeyPress$={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAction();
                }
              }}
              placeholder="e.g., read, write, delete"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Btn
              onClick$={addAction}
              type="button"
              class="rounded-lg"
            >
              Add
            </Btn>
          </div>

          <div class="flex flex-wrap gap-2">
            {form.actions.map((action, idx) => (
              <Badge
                key={idx}
                variant="info"
                class="inline-flex items-center gap-2 px-3 py-1 text-sm"
              >
                {action}
                <button
                  onClick$={() => removeAction(idx)}
                  type="button"
                  class="text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Conditions (Advanced) */}
        <div class="space-y-4 pt-6 border-t border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Conditions (Optional)</h2>
          <p class="text-sm text-gray-600">
            Advanced: Define conditions using JSON. Leave empty to apply to all matching subjects/resources/actions.
          </p>
          <div class="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <p class="text-sm text-gray-600 mb-2">Current conditions:</p>
            <pre class="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
              {JSON.stringify(form.conditions, null, 2) || '[]'}
            </pre>
          </div>
          <p class="text-sm text-yellow-600">
            💡 For now, conditions must be edited via API. A visual condition builder is coming soon!
          </p>
        </div>
      </div>

      {/* Actions */}
      <div class="flex justify-end gap-4">
        <button
          onClick$={() => nav(`/policies/${policyId}`)}
          disabled={saving.value}
          type="button"
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <Btn
          onClick$={handleSubmit}
          disabled={saving.value}
          type="button"
          class="rounded-lg"
        >
          {saving.value ? 'Saving...' : 'Save Changes'}
        </Btn>
      </div>
    </div>
  );
});
