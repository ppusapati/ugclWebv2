// src/routes/admin/policies/create/index.tsx
import { component$, useStore, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, useNavigate } from '@builder.io/qwik-city';
import { apiClient, createSSRApiClient } from '~/services';
import { ConditionBuilder } from '~/components/policy/condition-builder';
import { Badge, Btn, FormField } from '~/components/ds';

interface BusinessVertical {
  id: string;
  name: string;
  code: string;
}

interface PolicyForm {
  name: string;
  display_name: string;
  description: string;
  effect: 'ALLOW' | 'DENY';
  priority: number;
  status: 'active' | 'inactive' | 'draft';
  business_vertical_id: string;
  resources: string[];
  actions: string[];
  conditions: any[];
  subjects: any[];
  context: any;
}

export const usePolicyCreateData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const data = await ssrApiClient.get<{ businesses?: BusinessVertical[]; data?: BusinessVertical[] }>('/admin/businesses');
    return {
      verticals: data.businesses || data.data || [],
    };
  } catch {
    return {
      verticals: [] as BusinessVertical[],
    };
  }
});

export default component$(() => {
  const initialData = usePolicyCreateData();
  const nav = useNavigate();

  const verticals = useSignal<BusinessVertical[]>(initialData.value.verticals || []);
  const saving = useSignal(false);
  const error = useSignal('');

  const form = useStore<PolicyForm>({
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

      await apiClient.post('/policies', form);

      // Redirect to policies list
      nav('/policies');
    } catch (err: any) {
      error.value = err.message || 'Failed to create policy';
    } finally {
      saving.value = false;
    }
  });

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center gap-4">
        <button
          onClick$={() => nav('/policies')}
          class="text-gray-600 hover:text-gray-900"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 class="text-3xl font-bold text-gray-900">Create New Policy</h1>
      </div>

      {/* Policy Pattern Examples */}
      <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-indigo-900 mb-2 inline-flex items-center gap-1">
          <i class="i-heroicons-book-open-solid h-4 w-4 inline-block" aria-hidden="true"></i>
          Policy Configuration Patterns
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div class="bg-white rounded p-3 border border-indigo-100">
            <div class="font-semibold text-indigo-800 mb-1">Pattern 1: Simple Actions + Resource Types</div>
            <div class="space-y-1 text-gray-700">
              <div><strong>Actions:</strong> <code class="bg-gray-100 px-1 rounded">read</code>, <code class="bg-gray-100 px-1 rounded">write</code></div>
              <div><strong>Resources:</strong> <code class="bg-gray-100 px-1 rounded">project</code>, <code class="bg-gray-100 px-1 rounded">payment</code></div>
              <div class="text-green-600 mt-1 inline-flex items-center gap-1">
                <i class="i-heroicons-check-solid h-3.5 w-3.5 inline-block" aria-hidden="true"></i>
                Best for general policies
              </div>
            </div>
          </div>
          <div class="bg-white rounded p-3 border border-indigo-100">
            <div class="font-semibold text-indigo-800 mb-1">Pattern 2: Namespaced Actions + Wildcards</div>
            <div class="space-y-1 text-gray-700">
              <div><strong>Actions:</strong> <code class="bg-gray-100 px-1 rounded">payment:approve</code>, <code class="bg-gray-100 px-1 rounded">project:create</code></div>
              <div><strong>Resources:</strong> <code class="bg-gray-100 px-1 rounded">*</code> or specific</div>
              <div class="text-green-600 mt-1 inline-flex items-center gap-1">
                <i class="i-heroicons-check-solid h-3.5 w-3.5 inline-block" aria-hidden="true"></i>
                Best for specific operations
              </div>
            </div>
          </div>
        </div>
      </div>

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
                onChange$={(e) => form.status = (e.target as HTMLSelectElement).value as 'active' | 'inactive' | 'draft'}
                aria-describedby="policy-status-hint"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
            Define which <strong>resources</strong> this policy applies to. Resources are the things being acted upon.
          </p>
          <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-2">
            <div>
              <p class="text-green-800 font-semibold mb-1">Resource Types:</p>
              <div class="space-y-1 text-green-700">
                <div><code class="bg-green-100 px-2 py-0.5 rounded">project</code> - All projects (use with action: "read", "write")</div>
                <div><code class="bg-green-100 px-2 py-0.5 rounded">payment</code> - All payments (use with action: "approve", "create")</div>
                <div><code class="bg-green-100 px-2 py-0.5 rounded">user</code> - User resources</div>
                <div><code class="bg-green-100 px-2 py-0.5 rounded">*</code> - All resources (use with namespaced actions)</div>
              </div>
            </div>
            <div>
              <p class="text-green-800 font-semibold mb-1">With Wildcards (Pattern Matching):</p>
              <div class="space-y-1 text-green-700">
                <div><code class="bg-green-100 px-2 py-0.5 rounded">project:*</code> - All projects with IDs</div>
                <div><code class="bg-green-100 px-2 py-0.5 rounded">project:123</code> - Specific project ID 123</div>
              </div>
            </div>
            <p class="text-green-600 text-xs">
              💡 Combine simple actions + resource types, OR namespaced actions + wildcard (*)
            </p>
          </div>

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
              placeholder="e.g., project:*, user:123, report:*"
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
            Define which <strong>operations</strong> this policy applies to. Actions can be simple verbs or namespaced (resource:action).
          </p>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm space-y-2">
            <div>
              <p class="text-blue-800 font-semibold mb-1">Simple Actions (recommended):</p>
              <div class="flex flex-wrap gap-2 text-blue-700">
                <code class="bg-blue-100 px-2 py-0.5 rounded">read</code>
                <code class="bg-blue-100 px-2 py-0.5 rounded">write</code>
                <code class="bg-blue-100 px-2 py-0.5 rounded">create</code>
                <code class="bg-blue-100 px-2 py-0.5 rounded">update</code>
                <code class="bg-blue-100 px-2 py-0.5 rounded">delete</code>
                <code class="bg-blue-100 px-2 py-0.5 rounded">approve</code>
                <code class="bg-blue-100 px-2 py-0.5 rounded">submit</code>
              </div>
            </div>
            <div>
              <p class="text-blue-800 font-semibold mb-1">Or Namespaced Actions:</p>
              <div class="flex flex-wrap gap-2 text-blue-700">
                <code class="bg-blue-100 px-2 py-0.5 rounded">payment:create</code>
                <code class="bg-blue-100 px-2 py-0.5 rounded">payment:approve</code>
                <code class="bg-blue-100 px-2 py-0.5 rounded">project:update</code>
                <code class="bg-blue-100 px-2 py-0.5 rounded">dprsite:create</code>
              </div>
            </div>
            <p class="text-blue-600 text-xs">
              💡 Use simple actions with specific resources, OR use namespaced actions with wildcard resources (*)
            </p>
          </div>

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
              placeholder="e.g., read OR payment:approve"
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
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">Conditions (Optional)</h2>
              <p class="text-sm text-gray-600 mt-1">
                Define when this policy should apply based on attributes like user properties, resource properties, or environmental factors.
              </p>
            </div>
          </div>

          <ConditionBuilder
            conditions={form.conditions}
            onChange$={$((newConditions: any) => {
              form.conditions = newConditions;
            })}
          />
        </div>
      </div>

      {/* Actions */}
      <div class="flex justify-end gap-4">
        <button
          onClick$={() => nav('/policies')}
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
          {saving.value ? 'Creating...' : 'Create Policy'}
        </Btn>
      </div>
    </div>
  );
});
