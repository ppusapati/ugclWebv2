// src/routes/admin/forms/[formCode]/preview/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, useNavigate, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import FormRenderer from '~/components/form-builder/renderer/FormRenderer';
import { Badge, Btn, PageHeader, SectionCard } from '~/components/ds';
import { createSSRApiClient } from '~/services';
import type { AppForm } from '~/types/workflow';

export const usePreviewFormData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const formCode = requestEvent.params.formCode;

  try {
    const form = await ssrApiClient.get<AppForm>(`/admin/forms/${formCode}`);
    return {
      form,
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
  const initialData = usePreviewFormData();
  const nav = useNavigate();
  const loc = useLocation();
  const formCode = loc.params.formCode;

  const form = useSignal<AppForm | null>(initialData.value.form || null);
  const loading = useSignal(false);
  const error = useSignal<string | null>(initialData.value.error || null);
  const previewData = useSignal<Record<string, any>>({});

  const handleBack = $(async () => {
    await nav(`/forms/${formCode}`);
  });

  const handleBackToList = $(async () => {
    await nav('/forms');
  });

  const handleSubmit = $((data: Record<string, any>) => {
    previewData.value = data;
    alert('Preview submission received! Check console for data.');
    console.log('Form data:', data);
  });

  const handleSaveDraft = $((data: Record<string, any>) => {
    console.log('Draft saved:', data);
    alert('Draft saved! (Preview mode - not actually saved)');
  });

  return (
    <div class="space-y-6">
      <PageHeader
        title={`Preview: ${form.value?.title || formCode}`}
        subtitle="This is a preview. Submissions will not be saved."
      >
        <Btn q:slot="actions" variant="ghost" onClick$={handleBack}>
          Back to Edit
        </Btn>
        <Badge q:slot="actions" variant="warning">Preview Mode</Badge>
        <Btn q:slot="actions" variant="secondary" onClick$={handleBackToList}>
          Back to Forms
        </Btn>
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
              <Btn onClick$={handleBackToList} variant="secondary" class="mt-6">
                Go Back
              </Btn>
            </div>
          </SectionCard>
        )}

        {/* Form Preview */}
        {!loading.value && !error.value && form.value && (
          <>
            {/* Info Banner */}
            <SectionCard class="border-color-interactive-primary/20 bg-color-interactive-primary/5 p-4">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-blue-900">Preview Mode</h3>
                  <p class="text-sm text-blue-700 mt-1">
                    You can test the form behavior, but submissions will not be saved to the database.
                    Form data will be logged to the browser console.
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Form Renderer */}
            <FormRenderer
              businessCode="preview"
              formCode={formCode}
              onSubmit$={handleSubmit}
              onSaveDraft$={handleSaveDraft}
              onCancel$={handleBack}
            />

            {/* Debug Info (if data submitted) */}
            {Object.keys(previewData.value).length > 0 && (
              <div class="mt-6 bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Submitted Data</h3>
                <pre class="bg-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
                  {JSON.stringify(previewData.value, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Preview Form - Admin',
  meta: [
    {
      name: 'description',
      content: 'Preview form before publishing',
    },
  ],
};
