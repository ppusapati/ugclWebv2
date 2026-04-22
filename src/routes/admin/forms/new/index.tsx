// src/routes/admin/forms/new/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, useNavigate, type DocumentHead } from '@builder.io/qwik-city';
import FormBuilderComplete from '~/components/form-builder/FormBuilder';
import { formBuilderService, createSSRApiClient } from '~/services';
import type { FormDefinition, WorkflowDefinition, Module } from '~/types/workflow';
import type { BusinessVertical, Site } from '~/services/types';

export const useNewFormData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const [modulesData, workflowsData, businessVerticalsData, sitesData] = await Promise.all([
      ssrApiClient.get<{ modules: Module[] }>('/modules'),
      ssrApiClient.get<{ workflows: WorkflowDefinition[] }>('/admin/workflows'),
      ssrApiClient.get<any>('/admin/businesses'),
      ssrApiClient.get<{ data: Site[] }>('/admin/sites', { include: 'business_vertical' }),
    ]);

    return {
      modules: modulesData.modules || [],
      workflows: workflowsData.workflows || [],
      businessVerticals: businessVerticalsData.data || businessVerticalsData.businesses || [],
      sites: sitesData.data || [],
      error: null as string | null,
    };
  } catch (err: any) {
    return {
      modules: [] as Module[],
      workflows: [] as WorkflowDefinition[],
      businessVerticals: [] as BusinessVertical[],
      sites: [] as Site[],
      error: err.message || 'Failed to load required data',
    };
  }
});

export default component$(() => {
  const initialData = useNewFormData();
  const nav = useNavigate();
  const modules = useSignal<Module[]>(initialData.value.modules || []);
  const workflows = useSignal<WorkflowDefinition[]>(initialData.value.workflows || []);
  const businessVerticals = useSignal<BusinessVertical[]>(initialData.value.businessVerticals || []);
  const sites = useSignal<Site[]>(initialData.value.sites || []);
  const loading = useSignal(false);
  const error = useSignal<string | null>(initialData.value.error || null);
  const saving = useSignal(false);

  const normalizeIdentifier = (value: string, fallback: string): string => {
    const cleaned = String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

    const base = cleaned || fallback;
    return /^[a-z_]/.test(base) ? base : `f_${base}`;
  };

  const isUuid = (value: string): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  const handleSave = $(async (definition: FormDefinition) => {
    try {
      saving.value = true;

      const normalizedFormCode = normalizeIdentifier(definition.form_code, 'form');
      const normalizedModuleId = isUuid(definition.module)
        ? definition.module
        : modules.value.find(
            (module) =>
              module.id === definition.module || module.code === definition.module
          )?.id || definition.module;

      const normalizedVerticalIds = (definition.accessible_verticals || [])
        .map((verticalCodeOrId) => {
          const matchedVertical = businessVerticals.value.find(
            (vertical) =>
              vertical.id === verticalCodeOrId || vertical.code === verticalCodeOrId
          );
          return matchedVertical?.id || verticalCodeOrId;
        })
        .filter(Boolean);

      const normalizedDefinition: FormDefinition = {
        ...definition,
        form_code: normalizedFormCode,
        module: normalizedModuleId,
        accessible_verticals: normalizedVerticalIds,
        steps: (definition.steps || []).map((step, stepIndex) => ({
          ...step,
          id: normalizeIdentifier(step.id || `step_${stepIndex + 1}`, `step_${stepIndex + 1}`),
          fields: (step.fields || []).map((field, fieldIndex) => ({
            ...field,
            id: normalizeIdentifier(
              field.id || `field_${stepIndex + 1}_${fieldIndex + 1}`,
              `field_${stepIndex + 1}_${fieldIndex + 1}`
            ),
          })),
        })),
      };

      // Import the form definition
      const appForm = await formBuilderService.importFormDefinition(normalizedDefinition);

      // Show success message
      alert('Form created successfully!');

      // Navigate to edit page
      await nav(`/admin/forms/${appForm.code}`);
    } catch (err: any) {
      alert('Failed to create form: ' + err.message);
    } finally {
      saving.value = false;
    }
  });

  const handleCancel = $(async () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      await nav('/admin/forms');
    }
  });

  return (
    <div class="bg-gray-50">
      {/* Header */}
      <div class="bg-white border-b border-gray-200 p-6">
        <div class="mx-auto flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              onClick$={handleCancel}
              class="text-gray-600 hover:text-gray-900"
              title="Back to forms"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Create New Form</h1>
              <p class="text-sm text-gray-600 mt-1">Design a new dynamic form with workflow</p>
            </div>
          </div>
          {saving.value && (
            <div class="flex items-center gap-2 text-blue-600">
              <div class="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span class="text-sm font-medium">Saving...</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div class="mx-auto">
        {/* Loading State */}
        {loading.value && (
          <div class="bg-white rounded-lg shadow-sm">
            <div class="flex flex-col items-center justify-center">
              <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p class="mt-4 text-gray-600">Loading form builder...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error.value && (
          <div class="bg-white rounded-lg shadow-sm p-12">
            <div class="text-center">
              <svg class="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="mt-4 text-lg font-medium text-gray-900">Error Loading</h3>
              <p class="mt-2 text-sm text-gray-600">{error.value}</p>
              <button
                onClick$={handleCancel}
                class="mt-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Form Builder */}
        {!loading.value && !error.value && (
          <FormBuilderComplete
            modules={modules.value}
            workflows={workflows.value}
            businessVerticals={businessVerticals.value}
            sites={sites.value}
            onSave$={handleSave}
            onCancel$={handleCancel}
          />
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Create New Form - Admin',
  meta: [
    {
      name: 'description',
      content: 'Create a new dynamic form with workflow',
    },
  ],
};
