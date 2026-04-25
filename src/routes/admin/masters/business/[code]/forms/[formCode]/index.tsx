// src/routes/business/[code]/forms/[formCode]/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, useNavigate, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import FormRenderer from '~/components/form-builder/renderer/FormRenderer';
import { Btn, PageHeader, SectionCard } from '~/components/ds';
import { createSSRApiClient, workflowService } from '~/services';
import type { AppForm } from '~/types/workflow';

export const useBusinessFormData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const businessCode = requestEvent.params.code;
  const formCode = requestEvent.params.formCode;

  try {
    const formData = await ssrApiClient.get<AppForm>(`/admin/forms/${formCode}`);

    // Preserve existing access control behavior.
    if ((formData as any).vertical_access && (formData as any).vertical_access.length > 0) {
      if (!(formData as any).vertical_access.includes(businessCode)) {
        throw new Error('This form is not available for this business vertical');
      }
    }

    return {
      form: formData,
      error: null as string | null,
    };
  } catch (err: any) {
    return {
      form: null as AppForm | null,
      error: err.message || 'Failed to load form',
    };
  }
});

export default component$(() => {
  const initialData = useBusinessFormData();
  const nav = useNavigate();
  const loc = useLocation();
  const businessCode = loc.params.code;
  const formCode = loc.params.formCode;

  const form = useSignal<AppForm | null>(initialData.value.form || null);
  const loading = useSignal(false);
  const error = useSignal<string | null>(initialData.value.error || null);
  const submitting = useSignal(false);

  const handleSubmit = $(async (formData: Record<string, any>) => {
    try {
      submitting.value = true;

      // Create submission
      const submission = await workflowService.createSubmission(
        businessCode,
        formCode,
        formData
      );

      // Auto-submit if workflow is configured
      if (form.value?.workflow_id) {
        try {
          await workflowService.transitionSubmission(
            businessCode,
            formCode,
            submission.id,
            { action: 'submit' }
          );
        } catch (err) {
          // If auto-submit fails, just log it - the submission is still created
          console.warn('Auto-submit failed:', err);
        }
      }

      // Show success message
      alert('Form submitted successfully!');

      // Navigate to submission detail
      await nav(`/admin/masters/business/${businessCode}/submissions/${submission.id}`);
    } catch (err: any) {
      alert('Failed to submit form: ' + err.message);
      submitting.value = false;
    }
  });

  const handleSaveDraft = $(async (formData: Record<string, any>) => {
    try {
      // Create draft submission
      await workflowService.createSubmission(
        businessCode,
        formCode,
        formData
      );

      alert('Draft saved successfully!');

      // Navigate to submissions list
      await nav(`/admin/masters/business/${businessCode}/submissions`);
    } catch (err: any) {
      alert('Failed to save draft: ' + err.message);
    }
  });

  const handleCancel = $(async () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      await nav(`/admin/masters/business/${businessCode}/forms`);
    }
  });

  return (
    <div class="space-y-6">
      <PageHeader
        title={form.value?.title || formCode}
        subtitle={form.value?.description || `Submit form for ${businessCode.toUpperCase()}`}
      >
        <Btn q:slot="actions" variant="ghost" onClick$={handleCancel}>
          Back to Forms
        </Btn>
        {submitting.value && (
          <div q:slot="actions" class="flex items-center gap-2 text-sm font-medium text-color-interactive-primary">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-color-interactive-primary border-t-transparent"></div>
            <span>Submitting...</span>
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
              <h3 class="mt-4 text-lg font-medium text-gray-900">Error Loading Form</h3>
              <p class="mt-2 text-sm text-gray-600">{error.value}</p>
              <Btn onClick$={handleCancel} variant="secondary" class="mt-6">
                Go Back
              </Btn>
            </div>
          </SectionCard>
        )}

        {/* Form Renderer */}
        {!loading.value && !error.value && form.value && (
          <FormRenderer
            businessCode={businessCode}
            formCode={formCode}
            onSubmit$={handleSubmit}
            onSaveDraft$={handleSaveDraft}
            onCancel$={handleCancel}
          />
        )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Submit Form - Business',
  meta: [
    {
      name: 'description',
      content: 'Submit a new form',
    },
  ],
};
