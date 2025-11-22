// src/components/form-builder/submissions/SubmissionList.tsx
import { component$, useSignal, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { workflowService } from '~/services';
import type { FormSubmission, SubmissionFilters } from '~/types/workflow';

interface SubmissionListProps {
  businessCode: string;
  formCode: string;
  filters?: SubmissionFilters;
  onSubmissionClick?: (submission: FormSubmission) => void;
}

export default component$<SubmissionListProps>((props) => {
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const submissions = useStore<FormSubmission[]>([]);

  const activeFilters = useStore<SubmissionFilters>({
    state: props.filters?.state || '',
    site_id: props.filters?.site_id || '',
    my_submissions: props.filters?.my_submissions || false,
  });

  const loadSubmissions = $(async () => {
    try {
      loading.value = true;
      error.value = null;

      const data = await workflowService.getSubmissions(
        props.businessCode,
        props.formCode,
        activeFilters
      );

      submissions.splice(0, submissions.length, ...data);
    } catch (err: any) {
      error.value = err.message || 'Failed to load submissions';
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadSubmissions();
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

  const formatDate = $((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  if (loading.value) {
    return (
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error.value) {
    return (
      <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-800">{error.value}</p>
        <button
          onClick$={loadSubmissions}
          class="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div class="submission-list">
      {/* Filters */}
      <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div class="grid grid-cols-4 gap-4">
          {/* State Filter */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={activeFilters.state}
              onChange$={async (e) => {
                activeFilters.state = (e.target as HTMLSelectElement).value;
                await loadSubmissions();
              }}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* My Submissions Toggle */}
          <div class="flex items-end">
            <label class="flex items-center">
              <input
                type="checkbox"
                checked={activeFilters.my_submissions}
                onChange$={async (e) => {
                  activeFilters.my_submissions = (e.target as HTMLInputElement).checked;
                  await loadSubmissions();
                }}
                class="mr-2"
              />
              <span class="text-sm">My Submissions Only</span>
            </label>
          </div>

          {/* Refresh Button */}
          <div class="flex items-end">
            <button
              onClick$={loadSubmissions}
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Results Count */}
          <div class="flex items-end justify-end">
            <span class="text-sm text-gray-600">
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      {submissions.length === 0 ? (
        <div class="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
          <p>No submissions found</p>
          <p class="text-sm mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted By
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted At
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Modified
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {submissions.map((submission) => (
                <tr
                  key={submission.id}
                  class="hover:bg-gray-50 cursor-pointer"
                  onClick$={() => props.onSubmissionClick?.(submission)}
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                    {submission.id.substring(0, 8)}...
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class={`px-2 py-1 text-xs font-medium rounded-full ${getStateBadgeClass(
                        submission.current_state
                      )}`}
                    >
                      {submission.current_state}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {submission.submitted_by}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(submission.submitted_at)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.last_modified_at ? formatDate(submission.last_modified_at) : '-'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick$={(e) => {
                        e.stopPropagation();
                        props.onSubmissionClick?.(submission);
                      }}
                      class="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
