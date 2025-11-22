// src/routes/admin/forms/[formCode]/preview/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import FormRenderer from '~/components/form-builder/renderer/FormRenderer';
import { formBuilderService } from '~/services';
import type { AppForm } from '~/types/workflow';

export default component$(() => {
  const nav = useNavigate();
  const loc = useLocation();
  const formCode = loc.params.formCode;

  const form = useSignal<AppForm | null>(null);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const previewData = useSignal<Record<string, any>>({});

  useVisibleTask$(async () => {
    try {
      loading.value = true;
      const formData = await formBuilderService.getFormByCode(formCode);
      form.value = formData;
    } catch (err: any) {
      error.value = err.message || 'Failed to load form';
    } finally {
      loading.value = false;
    }
  });

  const handleBack = $(async () => {
    await nav(`/admin/forms/${formCode}`);
  });

  const handleBackToList = $(async () => {
    await nav('/admin/forms');
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
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <div class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              onClick$={handleBack}
              class="text-gray-600 hover:text-gray-900"
              title="Back to edit"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                Preview: {form.value?.title || formCode}
              </h1>
              <p class="text-sm text-gray-600 mt-1">
                This is a preview - submissions will not be saved
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-lg font-medium">
              Preview Mode
            </span>
            <button
              onClick$={handleBackToList}
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Back to Forms
            </button>
          </div>
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
              <h3 class="mt-4 text-lg font-medium text-gray-900">Form Not Found</h3>
              <p class="mt-2 text-sm text-gray-600">{error.value}</p>
              <button
                onClick$={handleBackToList}
                class="mt-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Form Preview */}
        {!loading.value && !error.value && form.value && (
          <>
            {/* Info Banner */}
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
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
            </div>

            {/* Form Renderer */}
            <FormRenderer
              businessCode="preview"
              formCode={formCode}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              onCancel={handleBack}
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
