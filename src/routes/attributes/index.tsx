// src/routes/admin/attributes/index.tsx
import { component$, isServer, useStore, useSignal, useTask$, $ } from '@builder.io/qwik';
import { apiClient } from '~/services';
import { Badge, Btn, DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeaderCell, DataTableRow, FormField, PageHeader } from '~/components/ds';

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

const parseAttributesResponse = (payload: any): Attribute[] => {
  const list = payload?.attributes || payload?.data || payload || [];
  return Array.isArray(list) ? list : [];
};

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

  const getAttributesList = $(async () => {
    try {
      return await apiClient.get<any>('/admin/attributes');
    } catch (err: any) {
      if (err?.status === 404 || String(err?.message || '').includes('404')) {
        return await apiClient.get<any>('/attributes');
      }
      throw err;
    }
  });

  const createAttribute = $(async (payload: any) => {
    try {
      return await apiClient.post('/admin/attributes', payload);
    } catch (err: any) {
      if (err?.status === 404 || String(err?.message || '').includes('404')) {
        return await apiClient.post('/attributes', payload);
      }
      throw err;
    }
  });

  const updateAttribute = $(async (id: string, payload: any) => {
    try {
      return await apiClient.put(`/admin/attributes/${id}`, payload);
    } catch (err: any) {
      if (err?.status === 404 || String(err?.message || '').includes('404')) {
        return await apiClient.put(`/attributes/${id}`, payload);
      }
      throw err;
    }
  });

  const deleteAttribute = $(async (id: string) => {
    try {
      return await apiClient.delete(`/admin/attributes/${id}`);
    } catch (err: any) {
      if (err?.status === 404 || String(err?.message || '').includes('404')) {
        return await apiClient.delete(`/attributes/${id}`);
      }
      throw err;
    }
  });

  // Load attributes
  const loadAttributes = $(async () => {
    try {
      loading.value = true;
      const data = await getAttributesList();
      attributes.value = parseAttributesResponse(data);
      error.value = '';
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
        await updateAttribute(editingAttribute.value.id, form);
      } else {
        await createAttribute(form);
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
      await deleteAttribute(id);
      await loadAttributes();
    } catch (err: any) {
      error.value = err.message || 'Failed to delete attribute';
    }
  });

  // Load on mount
  useTask$(async () => {
    if (isServer) {
      return;
    }

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
      <PageHeader title="Attribute Management" subtitle="Define and manage user and resource attributes for ABAC policies">
        <Btn q:slot="actions" onClick$={openCreateModal}>
          Create Attribute
        </Btn>
      </PageHeader>

      {/* Error Message */}
      {error.value && (
        <div class="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error.value}
        </div>
      )}

      {/* Filters */}
      <div class="bg-white rounded-lg shadow p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField id="attributes-search" label="Search">
            <input
              id="attributes-search"
              type="text"
              value={filters.search}
              onInput$={(e) => (filters.search = (e.target as HTMLInputElement).value)}
              placeholder="Search attributes..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </FormField>

          <FormField id="attributes-category" label="Category">
            <select
              id="attributes-category"
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
          </FormField>

          <FormField id="attributes-data-type" label="Data Type">
            <select
              id="attributes-data-type"
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
          </FormField>
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
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableHeaderCell>Name</DataTableHeaderCell>
                <DataTableHeaderCell>Category</DataTableHeaderCell>
                <DataTableHeaderCell>Data Type</DataTableHeaderCell>
                <DataTableHeaderCell>Required</DataTableHeaderCell>
                <DataTableHeaderCell>System</DataTableHeaderCell>
                <DataTableHeaderCell class="text-right">Actions</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {filteredAttributes.map((attribute) => (
                <DataTableRow key={attribute.id}>
                  <DataTableCell>
                    <div class="text-sm font-medium text-neutral-900">{attribute.display_name}</div>
                    <div class="text-sm text-neutral-500">{attribute.name}</div>
                    {attribute.description && (
                      <div class="text-xs text-neutral-500 mt-1">{attribute.description}</div>
                    )}
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="info">{attribute.category || 'General'}</Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="neutral">{attribute.data_type}</Badge>
                  </DataTableCell>
                  <DataTableCell class="text-sm text-neutral-900">
                    {attribute.is_required ? (
                      <span class="text-success-600 inline-flex items-center gap-1">
                        <i class="i-heroicons-check-solid h-3.5 w-3.5 inline-block" aria-hidden="true"></i>
                        Yes
                      </span>
                    ) : (
                      <span class="text-neutral-400">No</span>
                    )}
                  </DataTableCell>
                  <DataTableCell class="text-sm text-neutral-900">
                    {attribute.is_system ? (
                      <span class="text-warning-600 inline-flex items-center gap-1">
                        <i class="i-heroicons-check-solid h-3.5 w-3.5 inline-block" aria-hidden="true"></i>
                        System
                      </span>
                    ) : (
                      <span class="text-neutral-400">Custom</span>
                    )}
                  </DataTableCell>
                  <DataTableCell class="text-right">
                    <div class="flex justify-end gap-2">
                      <Btn
                        size="sm"
                        variant="primary"
                        onClick$={() => openEditModal(attribute)}
                        disabled={attribute.is_system}
                      >
                        Edit
                      </Btn>
                      <Btn
                        size="sm"
                        variant="danger"
                        onClick$={() => handleDelete(attribute.id, attribute.name)}
                        disabled={attribute.is_system}
                      >
                        Delete
                      </Btn>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
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
                  <FormField id="attr-name" label="Name" required hint="Unique identifier (dot notation)">
                    <input
                      id="attr-name"
                      type="text"
                      value={form.name}
                      onInput$={(e) => (form.name = (e.target as HTMLInputElement).value)}
                      placeholder="e.g., user.department"
                      required
                      aria-required="true"
                      aria-describedby="attr-name-hint"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </FormField>

                  <FormField id="attr-display-name" label="Display Name" required>
                    <input
                      id="attr-display-name"
                      type="text"
                      value={form.display_name}
                      onInput$={(e) => (form.display_name = (e.target as HTMLInputElement).value)}
                      placeholder="e.g., Department"
                      required
                      aria-required="true"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </FormField>
                </div>

                <FormField id="attr-description" label="Description">
                  <textarea
                    id="attr-description"
                    value={form.description}
                    onInput$={(e) => (form.description = (e.target as HTMLTextAreaElement).value)}
                    rows={2}
                    placeholder="Describe this attribute..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  ></textarea>
                </FormField>

                <div class="grid grid-cols-2 gap-4">
                  <FormField id="attr-data-type" label="Data Type" required>
                    <select
                      id="attr-data-type"
                      value={form.data_type}
                      onChange$={(e) =>
                        (form.data_type = (e.target as HTMLSelectElement).value as any)
                      }
                      required
                      aria-required="true"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                      <option value="json">JSON</option>
                    </select>
                  </FormField>

                  <FormField id="attr-category" label="Category">
                    <input
                      id="attr-category"
                      type="text"
                      value={form.category}
                      onInput$={(e) => (form.category = (e.target as HTMLInputElement).value)}
                      placeholder="e.g., user, resource, system"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </FormField>
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
                      <span class="text-sm font-medium text-neutral-700">Required Attribute</span>
                    </label>
                  </div>

                  <FormField id="attr-default-value" label="Default Value">
                    <input
                      id="attr-default-value"
                      type="text"
                      value={form.default_value}
                      onInput$={(e) => (form.default_value = (e.target as HTMLInputElement).value)}
                      placeholder="Optional default value"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </FormField>
                </div>
              </div>

              <div class="flex justify-end gap-3 mt-6">
                <Btn
                  variant="secondary"
                  onClick$={() => {
                    showModal.value = false;
                    editingAttribute.value = null;
                  }}
                >
                  Cancel
                </Btn>
                <Btn
                  onClick$={handleSave}
                >
                  {editingAttribute.value ? 'Update' : 'Create'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
