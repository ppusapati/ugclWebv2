import { component$, useSignal, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$, useLocation, useNavigate } from '@builder.io/qwik-city';
import { apiClient, createSSRApiClient, userAttributeService } from '~/services';
import type { Attribute } from '~/services/types';

// SSR data loading
export const useUserAttributesData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const userId = requestEvent.params.userId;

  try {
    const [userAttributes, allAttributes, user] = await Promise.all([
      ssrApiClient.get<Record<string, string>>(`/users/${userId}/attributes`),
      ssrApiClient.get<Attribute[]>('/attributes?type=user'),
      ssrApiClient.get(`/users/${userId}`)
    ]);

    return { userAttributes, allAttributes, user, userId };
  } catch (err: any) {
    return { userAttributes: {}, allAttributes: [], user: null, userId, error: err.message };
  }
});

export default component$(() => {
  const initialData = useUserAttributesData();
  const loc = useLocation();
  const nav = useNavigate();

  const userAttributes = useSignal<Record<string, string>>(initialData.value.userAttributes);
  const allAttributes = useSignal<Attribute[]>(initialData.value.allAttributes);
  const user = useSignal(initialData.value.user);
  const userId = initialData.value.userId;

  const showAssignModal = useSignal(false);
  const loading = useSignal(false);
  const error = useSignal('');
  const success = useSignal('');

  const assignForm = useStore({
    attribute_id: '',
    value: '',
    valid_until: ''
  });

  // Load data client-side
  const loadData = $(async () => {
    try {
      loading.value = true;
      const [attrs, allAttrs, userData] = await Promise.all([
        userAttributeService.getUserAttributes(userId),
        apiClient.get<Attribute[]>('/attributes?type=user'),
        apiClient.get(`/users/${userId}`)
      ]);

      userAttributes.value = attrs;
      allAttributes.value = allAttrs;
      user.value = userData;
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  });

  // Handle assign attribute
  const handleAssignAttribute = $(async () => {
    if (!assignForm.attribute_id || !assignForm.value) {
      error.value = 'Please select an attribute and enter a value';
      return;
    }

    try {
      loading.value = true;
      error.value = '';

      await userAttributeService.assignUserAttribute(userId, {
        attribute_id: assignForm.attribute_id,
        value: assignForm.value,
        valid_until: assignForm.valid_until || undefined
      });

      success.value = 'Attribute assigned successfully!';
      showAssignModal.value = false;

      // Reset form
      assignForm.attribute_id = '';
      assignForm.value = '';
      assignForm.valid_until = '';

      // Reload data
      await loadData();

      setTimeout(() => { success.value = ''; }, 3000);
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  });

  // Handle remove attribute
  const handleRemoveAttribute = $((attributeId: string) => {
    if (!confirm('Are you sure you want to remove this attribute?')) return;

    (async () => {
      try {
        loading.value = true;
        await userAttributeService.removeUserAttribute(userId, attributeId);
        success.value = 'Attribute removed successfully!';
        await loadData();
        setTimeout(() => { success.value = ''; }, 3000);
      } catch (err: any) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    })();
  });

  // Get attribute by name
  const getAttributeByName = $((name: string) => {
    return allAttributes.value.find(attr => attr.name === name);
  });

  // Get available attributes (not yet assigned)
  const availableAttributes = $(async () => {
    const assigned = Object.keys(userAttributes.value);
    return allAttributes.value.filter(attr => !assigned.includes(attr.name));
  });

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">User Attributes</h1>
          {user.value && (
            <p class="mt-2 text-gray-600">
              Manage ABAC attributes for <strong>{user.value.name}</strong> ({user.value.email})
            </p>
          )}
        </div>
        <button
          type="button"
          onClick$={() => nav(`/admin/users/${userId}`)}
          class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          Back to User
        </button>
      </div>

      {/* Alerts */}
      {error.value && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error.value}
        </div>
      )}

      {success.value && (
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success.value}
        </div>
      )}

      {/* Actions */}
      <div class="flex justify-between items-center">
        <div class="text-sm text-gray-600">
          {Object.keys(userAttributes.value).length} attribute(s) assigned
        </div>
        <button
          type="button"
          onClick$={() => showAssignModal.value = true}
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          disabled={loading.value}
        >
          <span class="i-heroicons-plus mr-2"></span>
          Assign Attribute
        </button>
      </div>

      {/* Attributes List */}
      <div class="bg-white rounded-lg shadow-lg border border-gray-200">
        {Object.keys(userAttributes.value).length === 0 ? (
          <div class="p-12 text-center text-gray-500">
            <div class="i-heroicons-tag text-6xl mx-auto mb-4 opacity-50"></div>
            <p>No attributes assigned yet</p>
            <p class="text-sm mt-2">Click "Assign Attribute" to add ABAC attributes</p>
          </div>
        ) : (
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attribute
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {Object.entries(userAttributes.value).map(([name, value]) => {
                const attribute = allAttributes.value.find(attr => attr.name === name);
                return (
                  <tr key={name} class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                      <div class="font-medium text-gray-900">
                        {attribute?.display_name || name}
                      </div>
                      <div class="text-sm text-gray-500">{name}</div>
                      {attribute?.description && (
                        <div class="text-xs text-gray-400 mt-1">{attribute.description}</div>
                      )}
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {value}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                      {attribute?.data_type || 'string'}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick$={() => attribute && handleRemoveAttribute(attribute.id)}
                        class="text-red-600 hover:text-red-800 transition-colors"
                        disabled={loading.value}
                      >
                        <span class="i-heroicons-trash"></span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Card */}
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start">
          <span class="i-heroicons-information-circle text-blue-600 text-xl mt-0.5 mr-3"></span>
          <div class="text-sm text-blue-800">
            <p class="font-medium mb-1">About User Attributes</p>
            <p>
              User attributes are key-value pairs used in ABAC (Attribute-Based Access Control) policies.
              They define properties of the user such as department, clearance level, approval limits, etc.
              These attributes are evaluated against policy conditions to make authorization decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Assign Attribute Modal */}
      {showAssignModal.value && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 class="text-xl font-semibold text-gray-900">Assign Attribute</h3>
              <button
                type="button"
                onClick$={() => showAssignModal.value = false}
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span class="i-heroicons-x-mark text-2xl"></span>
              </button>
            </div>

            <form preventdefault:submit onSubmit$={handleAssignAttribute} class="p-6 space-y-4">
              {/* Attribute Selection */}
              <div>
                <label for="attribute" class="block text-sm font-medium text-gray-700 mb-1">
                  Attribute *
                </label>
                <select
                  id="attribute"
                  value={assignForm.attribute_id}
                  onInput$={(e) => {
                    assignForm.attribute_id = (e.target as HTMLSelectElement).value;
                    assignForm.value = ''; // Reset value when attribute changes
                  }}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select an attribute...</option>
                  {allAttributes.value
                    .filter(attr => !Object.keys(userAttributes.value).includes(attr.name))
                    .map(attr => (
                      <option key={attr.id} value={attr.id}>
                        {attr.display_name} ({attr.name}) - {attr.data_type}
                      </option>
                    ))}
                </select>
                <p class="mt-1 text-xs text-gray-500">
                  Select the attribute you want to assign to this user
                </p>
              </div>

              {/* Value Input */}
              <div>
                <label for="value" class="block text-sm font-medium text-gray-700 mb-1">
                  Value *
                </label>
                <input
                  id="value"
                  type="text"
                  value={assignForm.value}
                  onInput$={(e) => assignForm.value = (e.target as HTMLInputElement).value}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter attribute value..."
                  required
                />
                <p class="mt-1 text-xs text-gray-500">
                  The value will be validated based on the attribute's data type
                </p>
              </div>

              {/* Valid Until (Optional) */}
              <div>
                <label for="valid_until" class="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until (Optional)
                </label>
                <input
                  id="valid_until"
                  type="datetime-local"
                  value={assignForm.valid_until}
                  onInput$={(e) => assignForm.valid_until = (e.target as HTMLInputElement).value}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Leave empty for permanent assignment
                </p>
              </div>

              {/* Actions */}
              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick$={() => showAssignModal.value = false}
                  class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  disabled={loading.value}
                >
                  {loading.value ? 'Assigning...' : 'Assign Attribute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});
