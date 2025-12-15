// src/components/form-builder/submissions/CommentModal.tsx
import { component$, useSignal, $, type PropFunction } from '@builder.io/qwik';

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
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Comment
            {props.required && <span class="text-red-500 ml-1">*</span>}
          </label>
          <textarea
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
          {error.value && (
            <p class="mt-1 text-sm text-red-500">{error.value}</p>
          )}
          {props.required && (
            <p class="mt-1 text-xs text-gray-500">
              A comment is required for this action
            </p>
          )}
        </div>

        {/* Footer */}
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
          <button
            type="button"
            onClick$={handleCancel}
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick$={handleSubmit}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
});
