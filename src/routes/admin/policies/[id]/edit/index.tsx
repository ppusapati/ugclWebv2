// src/routes/admin/policies/[id]/edit/index.tsx
import { component$, useStore, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { apiClient } from '~/services';

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

export default component$(() => {
  const location = useLocation();
  const nav = useNavigate();
  const policyId = location.params.id;

  const verticals = useSignal<BusinessVertical[]>([]);
  const loading = useSignal(true);
  const saving = useSignal(false);
  const error = useSignal('');

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

  // Load business verticals
  const loadVerticals = $(async () => {
    try {
      const data = await apiClient.get<{ businesses?: BusinessVertical[]; data?: BusinessVertical[] }>('/admin/businesses');
      verticals.value = data.businesses || data.data || [];
    } catch (err) {
      console.error('Failed to load verticals:', err);
    }
  });

  // Load policy
  const loadPolicy = $(async () => {
    try {
      loading.value = true;
      const data = await apiClient.get<Policy>(`/policies/${policyId}`);

      // Copy all properties to form
      form.id = data.id;
      form.name = data.name;
      form.display_name = data.display_name;
      form.description = data.description;
      form.effect = data.effect;
      form.priority = data.priority;
      form.status = data.status;
      form.business_vertical_id = data.business_vertical_id || '';
      form.resources = data.resources || [];
      form.actions = data.actions || [];
      form.conditions = data.conditions || [];
      form.subjects = data.subjects || [];
      form.context = data.context || {};
    } catch (err: any) {
      error.value = err.message || 'Failed to load policy';
    } finally {
      loading.value = false;
    }
  });

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
      nav(`/admin/policies/${policyId}`);
    } catch (err: any) {
      error.value = err.message || 'Failed to update policy';
    } finally {
      saving.value = false;
    }
  });

  // Load data on mount
  useVisibleTask$(async () => {
    await Promise.all([loadPolicy(), loadVerticals()]);
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
    <div class="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div class="flex items-center gap-4">
        <button
          onClick$={() => nav(`/admin/policies/${policyId}`)}
          class="text-gray-600 hover:text-gray-900"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 class="text-3xl font-bold text-gray-900">Edit Policy</h1>
        <span class="text-sm text-gray-500">({form.name})</span>
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
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Policy Name *
              </label>
              <input
                type="text"
                value={form.name}
                onInput$={(e) => form.name = (e.target as HTMLInputElement).value}
                placeholder="e.g., allow_project_view"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p class="text-xs text-gray-500 mt-1">Unique identifier (lowercase, underscores)</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                value={form.display_name}
                onInput$={(e) => form.display_name = (e.target as HTMLInputElement).value}
                placeholder="e.g., Allow Project View"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p class="text-xs text-gray-500 mt-1">Human-readable name</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onInput$={(e) => form.description = (e.target as HTMLTextAreaElement).value}
              rows={3}
              placeholder="Describe what this policy does..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            ></textarea>
          </div>
        </div>

        {/* Configuration */}
        <div class="space-y-4 pt-6 border-t border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Configuration</h2>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Effect *
              </label>
              <select
                value={form.effect}
                onChange$={(e) => form.effect = (e.target as HTMLSelectElement).value as 'ALLOW' | 'DENY'}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="ALLOW">ALLOW</option>
                <option value="DENY">DENY</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">Whether this policy allows or denies access</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <input
                type="number"
                value={form.priority}
                onInput$={(e) => form.priority = parseInt((e.target as HTMLInputElement).value) || 100}
                min="0"
                max="1000"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p class="text-xs text-gray-500 mt-1">Lower numbers = higher priority (0-1000)</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange$={(e) => form.status = (e.target as HTMLSelectElement).value as any}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">Policy will only be enforced if Active</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Business Vertical
              </label>
              <select
                value={form.business_vertical_id}
                onChange$={(e) => form.business_vertical_id = (e.target as HTMLSelectElement).value}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Global (All Verticals)</option>
                {verticals.value.map((vertical) => (
                  <option key={vertical.id} value={vertical.id}>
                    {vertical.name}
                  </option>
                ))}
              </select>
              <p class="text-xs text-gray-500 mt-1">Leave empty for global policy</p>
            </div>
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
            <button
              onClick$={addResource}
              type="button"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Add
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            {form.resources.map((resource, idx) => (
              <span
                key={idx}
                class="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {resource}
                <button
                  onClick$={() => removeResource(idx)}
                  type="button"
                  class="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
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
            <button
              onClick$={addAction}
              type="button"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Add
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            {form.actions.map((action, idx) => (
              <span
                key={idx}
                class="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
              >
                {action}
                <button
                  onClick$={() => removeAction(idx)}
                  type="button"
                  class="text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
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
          onClick$={() => nav(`/admin/policies/${policyId}`)}
          disabled={saving.value}
          type="button"
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick$={handleSubmit}
          disabled={saving.value}
          type="button"
          class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving.value ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
});
