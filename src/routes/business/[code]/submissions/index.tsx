// src/routes/business/[code]/submissions/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import SubmissionList from '~/components/form-builder/submissions/SubmissionList';
import { formBuilderService, workflowService } from '~/services';
import type { AppForm, SubmissionFilters, FormSubmission } from '~/types/workflow';

export default component$(() => {
  const nav = useNavigate();
  const loc = useLocation();
  const businessCode = loc.params.code;

  const forms = useSignal<AppForm[]>([]);
  const selectedFormCode = useSignal<string>('');
  const filters = useSignal<SubmissionFilters>({
    state: '',
    my_submissions: true,
  });
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const stats = useSignal<Record<string, number>>({});

  useVisibleTask$(async () => {
    try {
      loading.value = true;

      // Load forms for this business vertical
      const allForms = await formBuilderService.getAllForms();
      forms.value = allForms.filter(f =>
        f.is_active &&
        (!f.accessible_verticals || f.accessible_verticals.length === 0 || f.accessible_verticals.includes(businessCode))
      );

      // Load stats for the first form if available
      if (forms.value.length > 0 && !selectedFormCode.value) {
        selectedFormCode.value = forms.value[0].code;
        await loadStats(forms.value[0].code);
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to load forms';
    } finally {
      loading.value = false;
    }
  });

  const loadStats = $(async (formCode: string) => {
    try {
      const data = await workflowService.getWorkflowStats(businessCode, formCode);
      stats.value = data.stats || {};
    } catch (err) {
      console.warn('Failed to load stats:', err);
      stats.value = {};
    }
  });

  const handleFormChange = $(async (formCode: string) => {
    selectedFormCode.value = formCode;
    await loadStats(formCode);
  });

  const handleSubmissionClick = $((submission: FormSubmission) => {
    nav(`/business/${businessCode}/submissions/${submission.id}`);
  });

  const handleCreateNew = $(async () => {
    if (selectedFormCode.value) {
      await nav(`/business/${businessCode}/forms/${selectedFormCode.value}`);
    } else {
      await nav(`/business/${businessCode}/forms`);
    }
  });

  return (
    <div class="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div class="mb-6 flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">My Submissions</h1>
          <p class="text-gray-600 mt-1">
            View and manage your form submissions - Business: <span class="font-medium">{businessCode.toUpperCase()}</span>
          </p>
        </div>
        <button
          onClick$={handleCreateNew}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Submission
        </button>
      </div>

      {/* Loading State */}
      {loading.value && (
        <div class="flex justify-center py-12">
          <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Error State */}
      {error.value && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error.value}
        </div>
      )}

      {/* Content */}
      {!loading.value && !error.value && (
        <>
          {forms.value.length === 0 ? (
            <div class="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No forms available</h3>
              <p class="mt-1 text-sm text-gray-500">
                No forms are currently available for this business vertical
              </p>
            </div>
          ) : (
            <>
              {/* Form Selector & Stats */}
              <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                {/* Form Selector */}
                <div class="lg:col-span-1">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Select Form
                  </label>
                  <select
                    value={selectedFormCode.value}
                    onChange$={(e) => handleFormChange((e.target as HTMLSelectElement).value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {forms.value.map((form) => (
                      <option key={form.code} value={form.code}>
                        {form.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stats Cards */}
                <div class="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div class="text-sm text-gray-600 mb-1">Draft</div>
                    <div class="text-2xl font-bold text-gray-900">
                      {stats.value.draft || 0}
                    </div>
                  </div>
                  <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div class="text-sm text-blue-600 mb-1">Submitted</div>
                    <div class="text-2xl font-bold text-blue-900">
                      {stats.value.submitted || 0}
                    </div>
                  </div>
                  <div class="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div class="text-sm text-green-600 mb-1">Approved</div>
                    <div class="text-2xl font-bold text-green-900">
                      {stats.value.approved || 0}
                    </div>
                  </div>
                  <div class="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div class="text-sm text-red-600 mb-1">Rejected</div>
                    <div class="text-2xl font-bold text-red-900">
                      {stats.value.rejected || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submissions List */}
              {selectedFormCode.value && (
                <SubmissionList
                  businessCode={businessCode}
                  formCode={selectedFormCode.value}
                  filters={filters.value}
                  onSubmissionClick$={handleSubmissionClick}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'My Submissions - Business',
  meta: [
    {
      name: 'description',
      content: 'View and manage form submissions',
    },
  ],
};
