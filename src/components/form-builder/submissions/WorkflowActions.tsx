// src/components/form-builder/submissions/WorkflowActions.tsx
import { component$, useSignal, $, type PropFunction } from '@builder.io/qwik';
import { workflowService } from '~/services';
import type { WorkflowAction } from '~/types/workflow';
import CommentModal from './CommentModal';

interface WorkflowActionsProps {
  businessCode: string;
  formCode: string;
  submissionId: string;
  currentState: string;
  availableActions: WorkflowAction[];
  onTransition$: PropFunction<() => void>;
}

export default component$<WorkflowActionsProps>((props) => {
  const showCommentModal = useSignal(false);
  const selectedAction = useSignal<WorkflowAction | null>(null);
  const processing = useSignal(false);

  const performTransition = async (action: string, comment: string) => {
    try {
      processing.value = true;

      await workflowService.transitionSubmission(
        props.businessCode,
        props.formCode,
        props.submissionId,
        {
          action,
          comment: comment || undefined,
        }
      );

      showCommentModal.value = false;
      selectedAction.value = null;
      await props.onTransition$();
    } catch (error: any) {
      alert('Transition failed: ' + error.message);
    } finally {
      processing.value = false;
    }
  };

  const handleActionClick = $((action: WorkflowAction) => {
    if (action.requires_comment) {
      selectedAction.value = action;
      showCommentModal.value = true;
    } else {
      performTransition(action.action, '');
    }
  });

  const handleCommentSubmit = $((comment: string) => {
    if (selectedAction.value) {
      performTransition(selectedAction.value.action, comment);
    }
  });

  if (!props.availableActions || props.availableActions.length === 0) {
    return (
      <div class="text-sm text-gray-500">
        No actions available
      </div>
    );
  }

  const getActionButtonClass = (action: string) => {
    switch (action) {
      case 'approve':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'reject':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'submit':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'recall':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  return (
    <>
      <div class="flex flex-col gap-2">
        {props.availableActions.map((action) => (
          <button
            key={action.action}
            onClick$={() => handleActionClick(action)}
            disabled={processing.value}
            class={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getActionButtonClass(
              action.action
            )}`}
          >
            {action.label}
            {action.requires_comment && ' *'}
          </button>
        ))}

        {props.availableActions.some(a => a.requires_comment) && (
          <p class="text-xs text-gray-500 mt-1">
            * Comment required
          </p>
        )}
      </div>

      {/* Comment Modal */}
      {showCommentModal.value && selectedAction.value && (
        <CommentModal
          title={`${selectedAction.value.label} - Add Comment`}
          required={selectedAction.value.requires_comment}
          onSubmit$={handleCommentSubmit}
          onCancel$={$(() => {
            showCommentModal.value = false;
            selectedAction.value = null;
          })}
        />
      )}
    </>
  );
});
