// src/routes/admin/forms/[formCode]/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, useNavigate, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import FormBuilderComplete from '~/components/form-builder/FormBuilder';
import { Btn, PageHeader, SectionCard } from '~/components/ds';
import { formBuilderService, createSSRApiClient } from '~/services';
import type { FormDefinition, WorkflowDefinition, Module, AppForm } from '~/types/workflow';
import type { BusinessVertical, Site, Permission } from '~/services/types';

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

export const useEditFormData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const formCode = requestEvent.params.formCode;

  try {
    const form = await ssrApiClient.get<AppForm>(`/admin/forms/${formCode}`);

    const [modulesData, workflowsData, businessVerticalsData, sitesData, permissionsData] = await Promise.all([
      ssrApiClient.get<{ modules: Module[] }>('/modules'),
      ssrApiClient.get<{ workflows: WorkflowDefinition[] }>('/admin/workflows'),
      ssrApiClient.get<any>('/admin/businesses'),
      ssrApiClient.get<{ data: Site[] }>('/admin/sites', { include: 'business_vertical' }),
      ssrApiClient.get<Permission[]>('/admin/permissions'),
    ]);

    return {
      existingForm: form,
      modules: modulesData.modules || [],
      workflows: workflowsData.workflows || [],
      businessVerticals: businessVerticalsData.data || businessVerticalsData.businesses || [],
      sites: sitesData.data || [],
      permissions: permissionsData || [],
      error: null as string | null,
    };
  } catch (err: any) {
    return {
      existingForm: null as AppForm | null,
      modules: [] as Module[],
      workflows: [] as WorkflowDefinition[],
      businessVerticals: [] as BusinessVertical[],
      sites: [] as Site[],
      permissions: [] as Permission[],
      error: err.message || 'Failed to load form',
    };
  }
});

export default component$(() => {
  const initialData = useEditFormData();
  const nav = useNavigate();
  const loc = useLocation();
  const formCode = loc.params.formCode;

  const modules = useSignal<Module[]>(initialData.value.modules || []);
  const workflows = useSignal<WorkflowDefinition[]>(initialData.value.workflows || []);
  const businessVerticals = useSignal<BusinessVertical[]>(initialData.value.businessVerticals || []);
  const sites = useSignal<Site[]>(initialData.value.sites || []);
  const permissions = useSignal<Permission[]>(initialData.value.permissions || []);
  const existingForm = useSignal<AppForm | null>(initialData.value.existingForm || null);
  const initialDefinition = useSignal<FormDefinition | null>(
    initialData.value.existingForm
      ? formBuilderService.exportFormDefinition(initialData.value.existingForm)
      : null
  );
  const loading = useSignal(false);
  const error = useSignal<string | null>(initialData.value.error || null);
  const saving = useSignal(false);

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

      // Update the form
      await formBuilderService.updateForm(formCode, {
        title: definition.title,
        description: definition.description,
        steps: definition.steps,
        version: newVersion,
        module_id: normalizedModuleId,
        accessible_verticals: normalizedVerticalIds,
        required_permission: definition.permissions?.create,
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
    await nav('/forms');
  });

  const handlePreview = $(async () => {
    await nav(`/forms/${formCode}/preview`);
  });

  return (
    <div class="space-y-6">
      <PageHeader
        title={`Edit Form: ${existingForm.value?.title || formCode}`}
        subtitle={`Version ${existingForm.value?.version || 1} • Code: ${formCode}`}
      >
        <Btn q:slot="actions" variant="ghost" onClick$={handleCancel}>
          Back to Forms
        </Btn>
        {!loading.value && !error.value && (
          <Btn q:slot="actions" variant="secondary" onClick$={handlePreview}>
            Preview
          </Btn>
        )}
        {saving.value && (
          <div q:slot="actions" class="flex items-center gap-2 text-sm font-medium text-color-interactive-primary">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-color-interactive-primary border-t-transparent"></div>
            <span>Saving...</span>
          </div>
        )}
      </PageHeader>

        {/* Loading State */}
        {loading.value && (
          <SectionCard class="p-12">
            <div class="flex flex-col items-center justify-center">
              <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p class="mt-4 text-gray-600">Loading form...</p>
            </div>
          </SectionCard>
        )}

        {/* Error State */}
        {error.value && (
          <SectionCard class="p-12">
            <div class="text-center">
              <svg class="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="mt-4 text-lg font-medium text-gray-900">Form Not Found</h3>
              <p class="mt-2 text-sm text-gray-600">{error.value}</p>
              <Btn onClick$={handleCancel} variant="secondary" class="mt-6">
                Go Back
              </Btn>
            </div>
          </SectionCard>
        )}

        {/* Form Builder */}
        {!loading.value && !error.value && initialDefinition.value && (
          <FormBuilderComplete
            initialDefinition={initialDefinition.value}
            modules={modules.value}
            workflows={workflows.value}
            permissions={permissions.value}
            businessVerticals={businessVerticals.value}
            sites={sites.value}
            onSave$={handleSave}
            onCancel$={handleCancel}
          />
        )}
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
