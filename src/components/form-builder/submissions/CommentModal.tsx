// src/components/form-builder/submissions/CommentModal.tsx
import { component$, useSignal, $, type PropFunction } from '@builder.io/qwik';
import { Btn, FormField } from '~/components/ds';

interface CommentModalProps {
  title: string;
  required: boolean;
  onSubmit$: PropFunction<(comment: string) => void>;
  onCancel$: PropFunction<() => void>;
}

export default component$<CommentModalProps>((props) => {
  const comment = useSignal('');
  const error = useSignal('');

  const handleSubmit = $(async () => {
    if (props.required && !comment.value.trim()) {
      error.value = 'Comment is required for this action';
      return;
    }

    await props.onSubmit$(comment.value);
    comment.value = '';
    error.value = '';
  });

  const handleCancel = $(async () => {
    comment.value = '';
    error.value = '';
    await props.onCancel$();
  });

  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">{props.title}</h3>
        </div>

        {/* Body */}
        <div class="px-6 py-4">
          <FormField id="submission-comment" label="Comment" required={props.required} error={error.value || undefined}>
            <textarea
              id="submission-comment"
              value={comment.value}
              onInput$={(e) => {
                comment.value = (e.target as HTMLTextAreaElement).value;
                error.value = '';
              }}
              placeholder="Enter your comment..."
              rows={4}
              class={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error.value ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </FormField>
          {props.required && (
            <p class="mt-1 text-xs text-gray-500">
              A comment is required for this action
            </p>
          )}
        </div>

        {/* Footer */}
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
          <Btn
            type="button"
            onClick$={handleCancel}
            variant="secondary"
            class="rounded"
          >
            Cancel
          </Btn>
          <Btn
            type="button"
            onClick$={handleSubmit}
            class="rounded"
          >
            Submit
          </Btn>
        </div>
      </div>
    </div>
  );
});
