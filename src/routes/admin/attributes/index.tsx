// src/routes/admin/attributes/index.tsx
import { component$, useStore, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { apiClient } from '~/services';

interface Attribute {
  id: string;
  name: string;
  display_name: string;
  description: string;
  data_type: 'string' | 'number' | 'boolean' | 'date' | 'json';
  category: string;
  is_required: boolean;
  is_system: boolean;
  default_value?: any;
  validation_rules?: any;
  created_at: string;
  updated_at: string;
}

export default component$(() => {
  const attributes = useSignal<Attribute[]>([]);
  const loading = useSignal(true);
  const error = useSignal('');

  const filters = useStore({
    search: '',
    category: '',
    dataType: '',
  });

  const showModal = useSignal(false);
  const editingAttribute = useSignal<Attribute | null>(null);

  const form = useStore({
    name: '',
    display_name: '',
    description: '',
    data_type: 'string' as 'string' | 'number' | 'boolean' | 'date' | 'json',
    category: '',
    is_required: false,
    default_value: '',
  });

  // Load attributes
  const loadAttributes = $(async () => {
    try {
      loading.value = true;
      const data = await apiClient.get<Attribute[]>('/admin/attributes');
      attributes.value = data || [];
    } catch (err: any) {
      error.value = err.message || 'Failed to load attributes';
    } finally {
      loading.value = false;
    }
  });

  // Open create modal
  const openCreateModal = $(() => {
    editingAttribute.value = null;
    form.name = '';
    form.display_name = '';
    form.description = '';
    form.data_type = 'string';
    form.category = '';
    form.is_required = false;
    form.default_value = '';
    showModal.value = true;
  });

  // Open edit modal
  const openEditModal = $((attribute: Attribute) => {
    editingAttribute.value = attribute;
    form.name = attribute.name;
    form.display_name = attribute.display_name;
    form.description = attribute.description;
    form.data_type = attribute.data_type;
    form.category = attribute.category;
    form.is_required = attribute.is_required;
    form.default_value = attribute.default_value ? String(attribute.default_value) : '';
    showModal.value = true;
  });

  // Save attribute
  const handleSave = $(async () => {
    // Validation
    if (!form.name.trim()) {
      error.value = 'Attribute name is required';
      return;
    }

    if (!form.display_name.trim()) {
      error.value = 'Display name is required';
      return;
    }

    try {
      error.value = '';

      if (editingAttribute.value) {
        await apiClient.put(`/admin/attributes/${editingAttribute.value.id}`, form);
      } else {
        await apiClient.post('/admin/attributes', form);
      }

      await loadAttributes();
      showModal.value = false;
    } catch (err: any) {
      error.value = err.message || 'Failed to save attribute';
    }
  });

  // Delete attribute
  const handleDelete = $(async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete attribute "${name}"?`)) return;

    try {
      await apiClient.delete(`/admin/attributes/${id}`);
      await loadAttributes();
    } catch (err: any) {
      error.value = err.message || 'Failed to delete attribute';
    }
  });

  // Load on mount
  useVisibleTask$(async () => {
    await loadAttributes();
  });

  // Filter attributes
  const filteredAttributes = attributes.value.filter((attr) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (
        !attr.name.toLowerCase().includes(search) &&
        !attr.display_name.toLowerCase().includes(search) &&
        !attr.description?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    if (filters.category && attr.category !== filters.category) return false;
    if (filters.dataType && attr.data_type !== filters.dataType) return false;

    return true;
  });

  // Get unique categories
  const categories = [...new Set(attributes.value.map((a) => a.category))].filter(Boolean).sort();

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Attribute Management</h1>
          <p class="text-gray-600 mt-1">Define and manage user and resource attributes for ABAC policies</p>
        </div>
        <button
          onClick$={openCreateModal}
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Attribute
        </button>
      </div>

      {/* Error Message */}
      {error.value && (
        <div class="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error.value}
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
              onInput$={(e) => (filters.search = (e.target as HTMLInputElement).value)}
              placeholder="Search attributes..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category}
              onChange$={(e) => (filters.category = (e.target as HTMLSelectElement).value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
            <select
              value={filters.dataType}
              onChange$={(e) => (filters.dataType = (e.target as HTMLSelectElement).value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="date">Date</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attributes Table */}
      <div class="bg-white rounded-lg shadow overflow-hidden">
        {loading.value ? (
          <div class="p-12 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">Loading attributes...</p>
          </div>
        ) : filteredAttributes.length === 0 ? (
          <div class="p-12 text-center text-gray-500">
            <p>No attributes found</p>
          </div>
        ) : (
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">System</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {filteredAttributes.map((attribute) => (
                <tr key={attribute.id} class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div>
                      <div class="text-sm font-medium text-gray-900">{attribute.display_name}</div>
                      <div class="text-sm text-gray-500">{attribute.name}</div>
                      {attribute.description && (
                        <div class="text-xs text-gray-500 mt-1">{attribute.description}</div>
                      )}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {attribute.category || 'General'}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      {attribute.data_type}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    {attribute.is_required ? (
                      <span class="text-green-600">✓ Yes</span>
                    ) : (
                      <span class="text-gray-400">No</span>
                    )}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    {attribute.is_system ? (
                      <span class="text-orange-600">✓ System</span>
                    ) : (
                      <span class="text-gray-400">Custom</span>
                    )}
                  </td>
                  <td class="px-6 py-4 text-right text-sm font-medium space-x-2">
                    <button
                      onClick$={() => openEditModal(attribute)}
                      class="text-indigo-600 hover:text-indigo-900"
                      disabled={attribute.is_system}
                    >
                      Edit
                    </button>
                    <button
                      onClick$={() => handleDelete(attribute.id, attribute.name)}
                      class="text-red-600 hover:text-red-900"
                      disabled={attribute.is_system}
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

      {/* Create/Edit Modal */}
      {showModal.value && (
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div class="p-6">
              <h3 class="text-lg font-semibold mb-4">
                {editingAttribute.value ? 'Edit Attribute' : 'Create Attribute'}
              </h3>

              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onInput$={(e) => (form.name = (e.target as HTMLInputElement).value)}
                      placeholder="e.g., user.department"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p class="text-xs text-gray-500 mt-1">Unique identifier (dot notation)</p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                    <input
                      type="text"
                      value={form.display_name}
                      onInput$={(e) => (form.display_name = (e.target as HTMLInputElement).value)}
                      placeholder="e.g., Department"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onInput$={(e) => (form.description = (e.target as HTMLTextAreaElement).value)}
                    rows={2}
                    placeholder="Describe this attribute..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  ></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Data Type *</label>
                    <select
                      value={form.data_type}
                      onChange$={(e) =>
                        (form.data_type = (e.target as HTMLSelectElement).value as any)
                      }
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={form.category}
                      onInput$={(e) => (form.category = (e.target as HTMLInputElement).value)}
                      placeholder="e.g., user, resource, system"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.is_required}
                        onChange$={(e) => (form.is_required = (e.target as HTMLInputElement).checked)}
                        class="mr-2"
                      />
                      <span class="text-sm font-medium text-gray-700">Required Attribute</span>
                    </label>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Default Value</label>
                    <input
                      type="text"
                      value={form.default_value}
                      onInput$={(e) => (form.default_value = (e.target as HTMLInputElement).value)}
                      placeholder="Optional default value"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div class="flex justify-end gap-3 mt-6">
                <button
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  onClick$={() => {
                    showModal.value = false;
                    editingAttribute.value = null;
                  }}
                >
                  Cancel
                </button>
                <button
                  class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                  onClick$={handleSave}
                >
                  {editingAttribute.value ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
