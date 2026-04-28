// src/routes/admin/forms/index.tsx
// src/routes/admin/forms/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, useNavigate, type DocumentHead } from '@builder.io/qwik-city';
import { formBuilderService, createSSRApiClient } from '~/services';
import type { AppForm } from '~/types/workflow';
import type { BusinessVertical } from '~/services/types';
import { Alert, Badge, Btn, FormField, PageHeader } from '~/components/ds';

export const useFormsData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const [formsResponse, verticalsResponse] = await Promise.all([
      ssrApiClient.get<{ forms: AppForm[] }>('/admin/app-forms'),
      ssrApiClient.get<any>('/admin/businesses'),
    ]);

    return {
      forms: formsResponse?.forms || [],
      businessVerticals: verticalsResponse?.data || verticalsResponse?.businesses || [],
      error: null as string | null,
    };
  } catch (err: any) {
    return {
      forms: [] as AppForm[],
      businessVerticals: [] as BusinessVertical[],
      error: err.message || 'Failed to load forms',
    };
  }
});

export default component$(() => {
  const initialData = useFormsData();
  const nav = useNavigate();
  const forms = useSignal<AppForm[]>(initialData.value.forms || []);
  const businessVerticals = useSignal<BusinessVertical[]>(initialData.value.businessVerticals || []);
  const loading = useSignal(false);
  const error = useSignal<string | null>(initialData.value.error || null);
  const searchQuery = useSignal('');
  const selectedModule = useSignal('');

  const handleCreateNew = $(async () => { await nav('/forms/new'); });
  const handleEdit = $(async (formCode: string) => { await nav(`/forms/${formCode}`); });
  const handlePreview = $(async (formCode: string) => { await nav(`/forms/${formCode}/preview`); });

  const handleDelete = $(async (formCode: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await formBuilderService.deleteForm(formCode);
      forms.value = (forms.value || []).filter(f => f.code !== formCode);
    } catch (err: any) {
      alert('Failed to delete form: ' + err.message);
    }
  });

  const handleToggleStatus = $(async (formCode: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      await formBuilderService.toggleFormStatus(formCode, newStatus);
      forms.value = (forms.value || []).map(f =>
        f.code === formCode ? { ...f, is_active: newStatus } : f
      );
    } catch (err: any) {
      alert('Failed to update form status: ' + err.message);
    }
  });

  const getModuleId = (form: AppForm): string => {
    if (typeof form.module === 'string') return form.module;
    return form.module?.id || form.module_id || '';
  };

  const getModuleLabel = (form: AppForm): string => {
    if (typeof form.module === 'string') return form.module;
    return form.module?.name || form.module?.code || form.module_id || '-';
  };

  const getVerticalName = (codeOrId: string): string => {
    const bv = businessVerticals.value.find(v => v.code === codeOrId || v.id === codeOrId);
    return bv ? bv.name : codeOrId;
  };

  const getVerticalsLabel = (form: AppForm): string => {
    if (!form.accessible_verticals || form.accessible_verticals.length === 0) return 'All Verticals';
    return form.accessible_verticals.map(getVerticalName).join(', ');
  };

  const filteredForms = (forms.value || []).filter(form => {
    const matchesSearch = !searchQuery.value ||
      form.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      form.code.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesModule = !selectedModule.value || getModuleId(form) === selectedModule.value;
    return matchesSearch && matchesModule;
  });

  const moduleFilterOptions = Array.from(
    (forms.value || []).reduce((acc, form) => {
      const id = getModuleId(form);
      if (!id || acc.has(id)) return acc;
      acc.set(id, getModuleLabel(form));
      return acc;
    }, new Map<string, string>())
  );

  return (
    <div class="py-4">
      <PageHeader title="Form Builder" subtitle="Create and manage dynamic forms">
        <Btn q:slot="actions" onClick$={handleCreateNew}>
          <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-2"></i>
          Create New Form
        </Btn>
      </PageHeader>

      {/* Filters */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField id="form-search" label="Search">
            <input
              id="form-search"
              type="text"
              value={searchQuery.value}
              onInput$={(e) => searchQuery.value = (e.target as HTMLInputElement).value}
              placeholder="Search by code or title..."
              class="form-input w-full"
            />
          </FormField>
          <FormField id="form-module-filter" label="Module">
            <select
              id="form-module-filter"
              value={selectedModule.value}
              onChange$={(e) => selectedModule.value = (e.target as HTMLSelectElement).value}
              class="form-input w-full"
            >
              <option value="">All Modules</option>
              {moduleFilterOptions.map(([moduleId, moduleLabel]) => (
                <option key={moduleId} value={moduleId}>{moduleLabel}</option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {/* Loading */}
      {loading.value && (
        <div class="flex justify-center py-12">
          <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Error */}
      {error.value && (
        <Alert variant="error" class="flex items-center gap-2">
          <i class="i-heroicons-exclamation-circle-solid w-4 h-4 flex-shrink-0"></i>
          {error.value}
        </Alert>
      )}

      {/* Forms Table */}
      {!loading.value && !error.value && (
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="overflow-x-auto">
            {filteredForms.length === 0 ? (
              <div class="text-center py-12">
                <i class="i-heroicons-document-text w-16 h-16 inline-block text-gray-400 mb-3"></i>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">No forms found</h3>
                <p class="text-sm text-gray-600">
                  {searchQuery.value || selectedModule.value
                    ? 'Try adjusting your filters'
                    : 'Get started by creating a new form'}
                </p>
              </div>
            ) : (
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Verticals</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {filteredForms.map((form) => (
                    <tr key={form.code} class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <code class="text-sm font-mono text-gray-900">{form.code}</code>
                      </td>
                      <td class="px-6 py-4 max-w-[240px]">
                        <div class="text-sm font-medium text-gray-900 truncate">{form.title}</div>
                        {form.description && (
                          <div class="text-xs text-gray-500 truncate">{form.description}</div>
                        )}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-600">{getModuleLabel(form)}</span>
                      </td>
                      <td class="px-6 py-4 max-w-[200px]">
                        <span class="text-sm text-gray-600 line-clamp-2">{getVerticalsLabel(form)}</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-600">{form.version ? `v${form.version}` : '-'}</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <Badge variant={form.is_active ? 'success' : 'neutral'}>
                          {form.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right">
                        <div class="flex justify-end items-center gap-1">
                          <Btn
                            size="sm"
                            variant={form.is_active ? 'secondary' : 'primary'}
                            onClick$={() => handleToggleStatus(form.code, form.is_active ?? false)}
                            title={form.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <i class={form.is_active ? 'i-heroicons-pause-solid w-3.5 h-3.5' : 'i-heroicons-play-solid w-3.5 h-3.5'} />
                          </Btn>
                          <Btn
                            size="sm"
                            variant="secondary"
                            onClick$={() => handlePreview(form.code)}
                            title="Preview"
                          >
                            <i class="i-heroicons-eye-solid w-3.5 h-3.5" />
                          </Btn>
                          <Btn
                            size="sm"
                            variant="secondary"
                            onClick$={() => handleEdit(form.code)}
                            title="Edit"
                          >
                            <i class="i-heroicons-pencil-solid w-3.5 h-3.5" />
                          </Btn>
                          <Btn
                            size="sm"
                            variant="danger"
                            onClick$={() => handleDelete(form.code, form.title)}
                            title="Delete"
                          >
                            <i class="i-heroicons-trash-solid w-3.5 h-3.5" />
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading.value && !error.value && (
        <div class="mt-4 text-sm text-gray-500">
          Showing {filteredForms.length} of {(forms.value || []).length} forms
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Form Builder - Admin',
  meta: [{ name: 'description', content: 'Manage dynamic forms and workflows' }],
};
