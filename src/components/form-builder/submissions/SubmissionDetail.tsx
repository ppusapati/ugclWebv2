// src/components/form-builder/submissions/SubmissionDetail.tsx
import { component$, useSignal, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { workflowService } from '~/services';
import type { FormSubmission, WorkflowTransition } from '~/types/workflow';
import WorkflowHistory from './WorkflowHistory';
import WorkflowActions from './WorkflowActions';

interface SubmissionDetailProps {
  businessCode: string;
  formCode: string;
  submissionId: string;
  onBack?: () => void;
}

export default component$<SubmissionDetailProps>((props) => {
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const submission = useStore<Partial<FormSubmission>>({});
  const history = useStore<WorkflowTransition[]>([]);

  const loadSubmission = $(async () => {
    try {
      loading.value = true;
      error.value = null;

      const data = await workflowService.getSubmission(
        props.businessCode,
        props.formCode,
        props.submissionId
      );

      Object.assign(submission, data.submission);
      history.splice(0, history.length, ...data.history);
    } catch (err: any) {
      error.value = err.message || 'Failed to load submission';
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadSubmission();
  });

  const handleTransition = $(async () => {
    // Reload after transition
    await loadSubmission();
  });

  const getStateBadgeClass = $((state: string) => {
    const classes: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      submitted: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return classes[state] || 'bg-gray-100 text-gray-700';
  });

  if (loading.value) {
    return (
      <div class="flex justify-center items-center min-h-screen">
        <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error.value) {
    return (
      <div class="max-w-4xl mx-auto p-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 class="text-red-800 font-medium">Error</h2>
          <p class="text-red-600 mt-2">{error.value}</p>
          <button
            onClick$={loadSubmission}
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="submission-detail min-h-screen bg-gray-50 py-8">
      <div class="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                {props.onBack && (
                  <button
                    onClick$={props.onBack}
                    class="text-gray-600 hover:text-gray-900"
                  >
                    ← Back
                  </button>
                )}
                <h1 class="text-2xl font-bold text-gray-900">
                  {submission.form_title || props.formCode}
                </h1>
              </div>

              <div class="flex items-center gap-4 text-sm text-gray-600">
                <span class="font-mono">{submission.id}</span>
                <span
                  class={`px-3 py-1 text-sm font-medium rounded-full ${getStateBadgeClass(
                    submission.current_state || ''
                  )}`}
                >
                  {submission.current_state}
                </span>
              </div>

              <div class="mt-3 text-sm text-gray-600">
                <p>Submitted by: <strong>{submission.submitted_by}</strong></p>
                <p>
                  Submitted at:{' '}
                  {submission.submitted_at &&
                    new Date(submission.submitted_at).toLocaleString()}
                </p>
                {submission.last_modified_by && (
                  <p>
                    Last modified by: <strong>{submission.last_modified_by}</strong> at{' '}
                    {submission.last_modified_at &&
                      new Date(submission.last_modified_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Workflow Actions */}
            <WorkflowActions
              businessCode={props.businessCode}
              formCode={props.formCode}
              submissionId={props.submissionId}
              currentState={submission.current_state || ''}
              availableActions={submission.available_actions || []}
              onTransition={handleTransition}
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-6">
          {/* Form Data */}
          <div class="col-span-2">
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h2 class="text-xl font-bold mb-4">Submission Data</h2>

              {submission.form_data && Object.keys(submission.form_data).length > 0 ? (
                <div class="space-y-4">
                  {Object.entries(submission.form_data).map(([key, value]) => (
                    <div key={key} class="border-b border-gray-200 pb-3">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      <div class="text-gray-900">
                        {typeof value === 'object' ? (
                          <pre class="text-sm bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : Array.isArray(value) ? (
                          <div class="flex flex-wrap gap-2">
                            {value.map((v, i) => (
                              <span key={i} class="px-2 py-1 bg-gray-100 rounded text-sm">
                                {String(v)}
                              </span>
                            ))}
                          </div>
                        ) : value && String(value).startsWith('http') ? (
                          <a
                            href={String(value)}
                            target="_blank"
                            class="text-blue-600 hover:underline"
                          >
                            {String(value)}
                          </a>
                        ) : (
                          <span>{String(value || '-')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p class="text-gray-500 text-center py-8">No data available</p>
              )}

              {/* Action Buttons */}
              <div class="mt-6 flex gap-3">
                <button
                  onClick$={() => window.print()}
                  class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  🖨️ Print
                </button>
                <button
                  onClick$={() => {
                    const json = JSON.stringify(submission.form_data, null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `submission-${submission.id}.json`;
                    a.click();
                  }}
                  class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  💾 Export JSON
                </button>
              </div>
            </div>
          </div>

          {/* Workflow History */}
          <div class="col-span-1">
            <WorkflowHistory
              transitions={history}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
