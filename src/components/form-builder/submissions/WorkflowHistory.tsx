// src/components/form-builder/submissions/WorkflowHistory.tsx
import { component$, $ } from '@builder.io/qwik';
import type { WorkflowTransition } from '~/types/workflow';

interface WorkflowHistoryProps {
  transitions: WorkflowTransition[];
}

export default component$<WorkflowHistoryProps>((props) => {
  const formatDate = $((dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  const getStateColor = $((state: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-400',
      submitted: 'bg-blue-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
    };
    return colors[state] || 'bg-gray-400';
  });

  return (
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-xl font-bold mb-4">Workflow History</h2>

      {props.transitions.length === 0 ? (
        <p class="text-gray-500 text-center py-8 text-sm">
          No transitions yet
        </p>
      ) : (
        <div class="relative">
          {/* Timeline line */}
          <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {/* Transitions */}
          <div class="space-y-6">
            {props.transitions.map((transition, index) => (
              <div key={transition.id} class="relative pl-10">
                {/* Timeline dot */}
                <div
                  class={`absolute left-0 w-8 h-8 rounded-full border-4 border-white ${getStateColor(
                    transition.to_state
                  )} flex items-center justify-center`}
                >
                  <span class="text-white text-xs font-bold">
                    {index + 1}
                  </span>
                </div>

                {/* Transition card */}
                <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {/* Action & State */}
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                        {transition.from_state}
                      </span>
                      <span class="text-gray-400">→</span>
                      <span
                        class={`px-2 py-1 text-xs rounded text-white ${
                          transition.to_state === 'approved'
                            ? 'bg-green-600'
                            : transition.to_state === 'rejected'
                            ? 'bg-red-600'
                            : transition.to_state === 'submitted'
                            ? 'bg-blue-600'
                            : 'bg-gray-600'
                        }`}
                      >
                        {transition.to_state}
                      </span>
                    </div>

                    <span class="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {transition.action}
                    </span>
                  </div>

                  {/* Actor info */}
                  <div class="text-sm mb-2">
                    <p class="font-medium text-gray-900">
                      {transition.actor_name || transition.actor_id}
                    </p>
                    {transition.actor_role && (
                      <p class="text-xs text-gray-500">{transition.actor_role}</p>
                    )}
                  </div>

                  {/* Comment */}
                  {transition.comment && (
                    <div class="bg-white rounded p-3 text-sm text-gray-700 border border-gray-200 mb-2">
                      <p class="text-xs text-gray-500 mb-1">Comment:</p>
                      <p>{transition.comment}</p>
                    </div>
                  )}

                  {/* Metadata */}
                  {transition.metadata && Object.keys(transition.metadata).length > 0 && (
                    <details class="text-xs text-gray-500">
                      <summary class="cursor-pointer hover:text-gray-700">
                        Additional details
                      </summary>
                      <pre class="mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(transition.metadata, null, 2)}
                      </pre>
                    </details>
                  )}

                  {/* Timestamp */}
                  <p class="text-xs text-gray-500 mt-2">
                    {formatDate(transition.transitioned_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
