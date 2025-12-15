// src/routes/business/[code]/submissions/[submissionId]/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import SubmissionDetail from '~/components/form-builder/submissions/SubmissionDetail';
import { workflowService } from '~/services';

export default component$(() => {
  const nav = useNavigate();
  const loc = useLocation();
  const businessCode = loc.params.code;
  const submissionId = loc.params.submissionId;

  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const formCode = useSignal<string>('');

  useVisibleTask$(async () => {
    try {
      loading.value = true;

      // We need to get the form code from the submission
      // Try to fetch submission to get form_code
      const response = await fetch(`/api/v1/business/${businessCode}/submissions/${submissionId}`);
      if (!response.ok) throw new Error('Failed to load submission');

      const data = await response.json();
      formCode.value = data.submission.form_code;
    } catch (err: any) {
      error.value = err.message || 'Failed to load submission';
    } finally {
      loading.value = false;
    }
  });

  const handleBack = $(async () => {
    await nav(`/business/${businessCode}/submissions`);
  });

  // These handlers are available for future use in the component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleApprove = $(async () => {
    try {
      await workflowService.transitionSubmission(
        businessCode,
        formCode.value,
        submissionId,
        { action: 'approve' }
      );

      alert('Submission approved successfully!');

      // Reload the page to show updated state
      window.location.reload();
    } catch (err: any) {
      alert('Failed to approve submission: ' + err.message);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleReject = $(async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await workflowService.transitionSubmission(
        businessCode,
        formCode.value,
        submissionId,
        {
          action: 'reject',
          comment: reason,
        }
      );

      alert('Submission rejected!');

      // Reload the page to show updated state
      window.location.reload();
    } catch (err: any) {
      alert('Failed to reject submission: ' + err.message);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRecall = $(async () => {
    if (!confirm('Are you sure you want to recall this submission?')) return;

    try {
      await workflowService.transitionSubmission(
        businessCode,
        formCode.value,
        submissionId,
        { action: 'recall' }
      );

      alert('Submission recalled successfully!');

      // Reload the page to show updated state
      window.location.reload();
    } catch (err: any) {
      alert('Failed to recall submission: ' + err.message);
    }
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
              title="Back to submissions"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Submission Detail</h1>
              <p class="text-sm text-gray-600 mt-1">
                Business: <span class="font-medium">{businessCode.toUpperCase()}</span> •
                ID: <code class="font-mono">{submissionId.slice(0, 8)}...</code>
              </p>
            </div>
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
              <p class="mt-4 text-gray-600">Loading submission...</p>
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
              <h3 class="mt-4 text-lg font-medium text-gray-900">Submission Not Found</h3>
              <p class="mt-2 text-sm text-gray-600">{error.value}</p>
              <button
                onClick$={handleBack}
                class="mt-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Submission Detail */}
        {!loading.value && !error.value && formCode.value && (
          <SubmissionDetail
            businessCode={businessCode}
            formCode={formCode.value}
            submissionId={submissionId}
          />
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Submission Detail - Business',
  meta: [
    {
      name: 'description',
      content: 'View submission details and workflow history',
    },
  ],
};
