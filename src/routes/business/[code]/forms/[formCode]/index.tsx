// src/routes/business/[code]/forms/[formCode]/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import FormRenderer from '~/components/form-builder/renderer/FormRenderer';
import { formBuilderService, workflowService } from '~/services';
import type { AppForm } from '~/types/workflow';

export default component$(() => {
  const nav = useNavigate();
  const loc = useLocation();
  const businessCode = loc.params.code;
  const formCode = loc.params.formCode;

  const form = useSignal<AppForm | null>(null);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const submitting = useSignal(false);

  useVisibleTask$(async () => {
    try {
      loading.value = true;
      const formData = await formBuilderService.getFormByCode(formCode);

      // Check if form is accessible for this business vertical
      if (formData.vertical_access && formData.vertical_access.length > 0) {
        if (!formData.vertical_access.includes(businessCode)) {
          throw new Error('This form is not available for this business vertical');
        }
      }

      form.value = formData;
    } catch (err: any) {
      error.value = err.message || 'Failed to load form';
    } finally {
      loading.value = false;
    }
  });

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
      await nav(`/business/${businessCode}/submissions/${submission.id}`);
    } catch (err: any) {
      alert('Failed to submit form: ' + err.message);
      submitting.value = false;
    }
  });

  const handleSaveDraft = $(async (formData: Record<string, any>) => {
    try {
      // Create draft submission
      const submission = await workflowService.createSubmission(
        businessCode,
        formCode,
        formData
      );

      alert('Draft saved successfully!');

      // Navigate to submissions list
      await nav(`/business/${businessCode}/submissions`);
    } catch (err: any) {
      alert('Failed to save draft: ' + err.message);
    }
  });

  const handleCancel = $(async () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      await nav(`/business/${businessCode}/forms`);
    }
  });

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <div class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
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
                {form.value?.title || formCode}
              </h1>
              {form.value?.description && (
                <p class="text-sm text-gray-600 mt-1">{form.value.description}</p>
              )}
            </div>
          </div>
          {submitting.value && (
            <div class="flex items-center gap-2 text-blue-600">
              <div class="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span class="text-sm font-medium">Submitting...</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div class="max-w-4xl mx-auto p-6">
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
              <h3 class="mt-4 text-lg font-medium text-gray-900">Error Loading Form</h3>
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
