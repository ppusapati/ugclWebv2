// src/routes/admin/forms/new/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate, type DocumentHead } from '@builder.io/qwik-city';
import FormBuilderComplete from '~/components/form-builder/FormBuilder';
import { formBuilderService, workflowService, businessService, siteService } from '~/services';
import type { FormDefinition, WorkflowDefinition, Module } from '~/types/workflow';
import type { BusinessVertical, Site } from '~/services/types';

export default component$(() => {
  const nav = useNavigate();
  const modules = useSignal<Module[]>([]);
  const workflows = useSignal<WorkflowDefinition[]>([]);
  const businessVerticals = useSignal<BusinessVertical[]>([]);
  const sites = useSignal<Site[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const saving = useSignal(false);

  useVisibleTask$(async () => {
    try {
      loading.value = true;

      // Load all required data in parallel
      const [modulesData, workflowsData, businessVerticalsData, sitesData] = await Promise.all([
        formBuilderService.getModules(),
        workflowService.getAllWorkflows(),
        businessService.getAllBusinesses(),
        siteService.getAllSites(),
      ]);

      modules.value = modulesData;
      workflows.value = workflowsData;
      businessVerticals.value = businessVerticalsData.data || [];
      sites.value = sitesData.data || [];

      // Debug logging
      console.log('📊 Form Builder Data Loaded:');
      console.log('  - Modules:', modulesData.length);
      console.log('  - Workflows:', workflowsData.length);
      console.log('  - Business Verticals:', businessVerticals.value.length, businessVerticals.value);
      console.log('  - Sites:', sites.value.length, sites.value);
      console.log('  - Sample Site (first):', sites.value[0]);
      console.log('  - Sample Business Vertical (first):', businessVerticals.value[0]);
    } catch (err: any) {
      console.error('❌ Failed to load form builder data:', err);
      error.value = err.message || 'Failed to load required data';
    } finally {
      loading.value = false;
    }
  });

  const handleSave = $(async (definition: FormDefinition) => {
    try {
      saving.value = true;

      // Import the form definition
      const appForm = await formBuilderService.importFormDefinition(definition);

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
