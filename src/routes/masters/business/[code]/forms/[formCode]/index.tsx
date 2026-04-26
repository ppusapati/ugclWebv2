// src/routes/masters/business/[code]/forms/[formCode]/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { useNavigate, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import FormRenderer from '~/components/form-builder/renderer/FormRenderer';
import { Btn, PageHeader } from '~/components/ds';
import { workflowService } from '~/services';
import type { AppForm } from '~/types/workflow';

export default component$(() => {
  const nav = useNavigate();
  const loc = useLocation();
  const businessCode = loc.params.code;
  const formCode = loc.params.formCode;

  // SSR data is not used; FormRenderer fetches the form client-side with the
  // user's auth token, which avoids the SSR "Invalid or missing API key" error.
  const form = useSignal<AppForm | null>(null);
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
      await nav(`/masters/business/${businessCode}/submissions/${submission.id}`);
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
      await nav(`/masters/business/${businessCode}/submissions`);
    } catch (err: any) {
      alert('Failed to save draft: ' + err.message);
    }
  });

  const handleCancel = $(async () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      await nav(`/masters/business/${businessCode}/forms`);
    }
  });

  return (
    <div class="space-y-6">
      <PageHeader
        title={form.value?.title || formCode}
        subtitle={form.value?.description || `Submit form for ${businessCode?.toUpperCase() ?? ''}`}
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

      {/* FormRenderer always mounts and fetches the form definition client-side
          using the user's auth token. SSR is intentionally skipped to avoid
          the "Invalid or missing API key" error when the server has no auth context. */}
      <FormRenderer
        businessCode={businessCode}
        formCode={formCode}
        onSubmit$={handleSubmit}
        onSaveDraft$={handleSaveDraft}
        onCancel$={handleCancel}
      />
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
