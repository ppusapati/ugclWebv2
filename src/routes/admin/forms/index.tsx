// src/routes/admin/forms/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate, type DocumentHead } from '@builder.io/qwik-city';
import { formBuilderService } from '~/services';
import type { AppForm } from '~/types/workflow';

export default component$(() => {
  const nav = useNavigate();
  const forms = useSignal<AppForm[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const searchQuery = useSignal('');
  const selectedModule = useSignal('');

  useVisibleTask$(async () => {
    try {
      loading.value = true;
      const data = await formBuilderService.getAllForms();
      forms.value = data;
    } catch (err: any) {
      error.value = err.message || 'Failed to load forms';
    } finally {
      loading.value = false;
    }
  });

  const handleCreateNew = $(async () => {
    await nav('/admin/forms/new');
  });

  const handleEdit = $(async (formCode: string) => {
    await nav(`/admin/forms/${formCode}`);
  });

  const handlePreview = $(async (formCode: string) => {
    await nav(`/admin/forms/${formCode}/preview`);
  });

  const handleDelete = $(async (formCode: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await formBuilderService.deleteForm(formCode);
      forms.value = (forms.value || []).filter(f => f.code !== formCode);
    } catch (err: any) {
      alert('Failed to delete form: ' + err.message);
    }
  });

  const filteredForms = (forms.value || []).filter(form => {
    const matchesSearch = !searchQuery.value ||
      form.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      form.code.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesModule = !selectedModule.value || form.module!.id === selectedModule.value;

    return matchesSearch && matchesModule;
  });

  const uniqueModules = Array.from(new Set((forms.value || []).map(f => f.module!.id).filter(Boolean)));

  return (
    <div class="container mx-auto px-4 py-6">
      {/* Header */}
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Form Builder</h1>
          <p class="text-gray-600 mt-1">Create and manage dynamic forms</p>
        </div>
        <button
          onClick$={handleCreateNew}
          class="btn btn-primary"
        >
          <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-2"></i>
          Create New Form
        </button>
      </div>

      {/* Filters */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label class="form-label text-xs mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery.value}
              onInput$={(e) => searchQuery.value = (e.target as HTMLInputElement).value}
              placeholder="Search by code or title..."
              class="form-input w-full"
            />
          </div>

          {/* Module Filter */}
          <div>
            <label class="form-label text-xs mb-1">
              Module
            </label>
            <select
              value={selectedModule.value}
              onChange$={(e) => selectedModule.value = (e.target as HTMLSelectElement).value}
              class="form-input w-full"
            >
              <option value="">All Modules</option>
              {uniqueModules.map((moduleId) => (
                <option key={moduleId} value={moduleId}>
                  {moduleId}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading.value && (
        <div class="flex justify-center py-12">
          <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Error State */}
      {error.value && (
        <div class="alert-error p-4 rounded-md">
          <i class="i-heroicons-exclamation-circle-solid w-4 h-4 inline-block mr-2"></i>
          {error.value}
        </div>
      )}

      {/* Forms Table */}
      {!loading.value && !error.value && (
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredForms.length === 0 ? (
            <div class="text-center py-12">
              <i class="i-heroicons-document-text w-16 h-16 inline-block text-gray-400 mb-3"></i>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">No forms found</h3>
              <p class="text-sm text-gray-600">
                {searchQuery.value || selectedModule.value
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new form'
                }
              </p>
            </div>
          ) : (
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DB Table
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
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
                {filteredForms.map((form) => (
                  <tr key={form.code} class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <code class="text-sm font-mono text-gray-900">{form.code}</code>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm font-medium text-gray-900">{form.title}</div>
                      {form.description && (
                        <div class="text-sm text-gray-500 truncate max-w-md">
                          {form.description}
                        </div>
                      )}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm text-gray-600">
                        {form.module?.name || form.module?.code || '-'}
                      </span>
                    </td>
                               <td class="px-6 py-4 whitespace-nowrap">
                      {form.module?.schema_name && form.table_name ? (
                        <code class="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {form.module.schema_name}.{form.table_name}
                        </code>
                      ) : (
                        <span class="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm text-gray-600">v{form.version}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class={`px-2 py-1 text-xs rounded ${
                        form.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {form.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex justify-end gap-2">
                        <button
                          onClick$={() => handlePreview(form.code)}
                          class="text-blue-600 hover:text-blue-900 p-1"
                          title="Preview"
                        >
                          <i class="i-heroicons-eye-solid w-5 h-5 inline-block"></i>
                        </button>
                        <button
                          onClick$={() => handleEdit(form.code)}
                          class="text-green-600 hover:text-green-900 p-1"
                          title="Edit"
                        >
                          <i class="i-heroicons-pencil-square-solid w-5 h-5 inline-block"></i>
                        </button>
                        <button
                          onClick$={() => handleDelete(form.code, form.title)}
                          class="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <i class="i-heroicons-trash-solid w-5 h-5 inline-block"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Summary */}
      {!loading.value && !error.value && (
        <div class="mt-4 text-sm text-gray-600">
          Showing {filteredForms.length} of {(forms.value || []).length} forms
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Form Builder - Admin',
  meta: [
    {
      name: 'description',
      content: 'Manage dynamic forms and workflows',
    },
  ],
};
