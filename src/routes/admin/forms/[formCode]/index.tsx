// src/routes/admin/forms/[formCode]/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import FormBuilderComplete from '~/components/form-builder/FormBuilder';
import { formBuilderService, workflowService, businessService, siteService } from '~/services';
import type { FormDefinition, WorkflowDefinition, Module, AppForm } from '~/types/workflow';
import type { BusinessVertical, Site } from '~/services/types';

export default component$(() => {
  const nav = useNavigate();
  const loc = useLocation();
  const formCode = loc.params.formCode;

  const modules = useSignal<Module[]>([]);
  const workflows = useSignal<WorkflowDefinition[]>([]);
  const businessVerticals = useSignal<BusinessVertical[]>([]);
  const sites = useSignal<Site[]>([]);
  const existingForm = useSignal<AppForm | null>(null);
  const initialDefinition = useSignal<FormDefinition | null>(null);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const saving = useSignal(false);

  useVisibleTask$(async () => {
    try {
      loading.value = true;

      // Load the existing form
      const form = await formBuilderService.getFormByCode(formCode);
      existingForm.value = form;

      // Convert AppForm to FormDefinition for editing
      initialDefinition.value = formBuilderService.exportFormDefinition(form);

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
    } catch (err: any) {
      error.value = err.message || 'Failed to load form';
    } finally {
      loading.value = false;
    }
  });

  const handleSave = $(async (definition: FormDefinition) => {
    try {
      saving.value = true;

      // Calculate new version - parse existing version and increment
      const currentVersion = existingForm.value?.version || '1.0.0';
      const versionParts = String(currentVersion).split('.');
      const major = parseInt(versionParts[0] || '1', 10);
      const minor = parseInt(versionParts[1] || '0', 10);
      const patch = parseInt(versionParts[2] || '0', 10);
      const newVersion = `${major}.${minor}.${patch + 1}`;

      // Update the form
      await formBuilderService.updateForm(formCode, {
        title: definition.title,
        description: definition.description,
        steps: definition.steps,
        version: newVersion,
        workflow_id: (definition as any).workflow_id,
        initial_state: definition.workflow?.initial_state,
      } as any);

      // Show success message
      alert('Form updated successfully!');

      // Reload the form
      const updatedForm = await formBuilderService.getFormByCode(formCode);
      existingForm.value = updatedForm;
      initialDefinition.value = formBuilderService.exportFormDefinition(updatedForm);
    } catch (err: any) {
      alert('Failed to update form: ' + err.message);
    } finally {
      saving.value = false;
    }
  });

  const handleCancel = $(async () => {
    await nav('/admin/forms');
  });

  const handlePreview = $(async () => {
    await nav(`/admin/forms/${formCode}/preview`);
  });

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <div class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
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
              <h1 class="text-2xl font-bold text-gray-900">
                Edit Form: {existingForm.value?.title || formCode}
              </h1>
              <p class="text-sm text-gray-600 mt-1">
                Version {existingForm.value?.version || 1} •
                Code: <code class="font-mono">{formCode}</code>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            {saving.value && (
              <div class="flex items-center gap-2 text-blue-600">
                <div class="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span class="text-sm font-medium">Saving...</span>
              </div>
            )}
            {!loading.value && !error.value && (
              <button
                onClick$={handlePreview}
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div class="max-w-7xl mx-auto p-6">
        {/* Loading State */}
        {loading.value && (
          <div class="bg-white rounded-lg shadow-sm p-12">
            <div class="flex flex-col items-center justify-center">
              <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p class="mt-4 text-gray-600">Loading form...</p>
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
              <h3 class="mt-4 text-lg font-medium text-gray-900">Form Not Found</h3>
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
        {!loading.value && !error.value && initialDefinition.value && (
          <FormBuilderComplete
            initialDefinition={initialDefinition.value}
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
  title: 'Edit Form - Admin',
  meta: [
    {
      name: 'description',
      content: 'Edit form definition and workflow',
    },
  ],
};
