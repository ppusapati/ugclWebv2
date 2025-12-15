// src/components/form-builder/workflow/StateEditor.tsx
import { component$, $, type PropFunction } from '@builder.io/qwik';
import type { WorkflowState } from '~/types/workflow';

interface StateEditorProps {
  state: WorkflowState;
  onUpdate$: PropFunction<(state: WorkflowState) => void>;
  onDelete$: PropFunction<() => void>;
  canDelete: boolean;
}

const STATE_COLORS = [
  { value: 'gray', label: 'Gray', class: 'bg-gray-100 text-gray-700' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-100 text-blue-700' },
  { value: 'green', label: 'Green', class: 'bg-green-100 text-green-700' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-100 text-yellow-700' },
  { value: 'red', label: 'Red', class: 'bg-red-100 text-red-700' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-100 text-purple-700' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-100 text-orange-700' },
];

const STATE_ICONS = [
  'edit', 'send', 'check', 'close', 'clock', 'archive', 'star', 'flag'
];

export default component$<StateEditorProps>((props) => {
  const handleUpdate = $(async (field: keyof WorkflowState, value: any) => {
    await props.onUpdate$({ ...props.state, [field]: value });
  });

  return (
    <div class="border border-gray-300 rounded-lg p-4 bg-white">
      <div class="flex justify-between items-start mb-4">
        <h3 class="font-medium text-lg">State Configuration</h3>
        {props.canDelete && (
          <button
            onClick$={props.onDelete$}
            class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            Delete State
          </button>
        )}
      </div>

      <div class="space-y-4">
        {/* State Code */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            State Code *
          </label>
          <input
            type="text"
            value={props.state.code}
            onInput$={(e) => handleUpdate('code', (e.target as HTMLInputElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., draft, submitted, approved"
            required
          />
          <p class="text-xs text-gray-500 mt-1">
            Lowercase, no spaces. Used in API and database.
          </p>
        </div>

        {/* State Name */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Display Name *
          </label>
          <input
            type="text"
            value={props.state.name}
            onInput$={(e) => handleUpdate('name', (e.target as HTMLInputElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Draft, Submitted, Approved"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={props.state.description}
            onInput$={(e) => handleUpdate('description', (e.target as HTMLTextAreaElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Brief description of this state"
          />
        </div>

        {/* Color */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Badge Color
          </label>
          <div class="grid grid-cols-4 gap-2">
            {STATE_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick$={() => handleUpdate('color', color.value)}
                class={`px-3 py-2 rounded text-sm font-medium ${color.class} ${
                  props.state.color === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                }`}
              >
                {color.label}
              </button>
            ))}
          </div>
        </div>

        {/* Icon */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Icon
          </label>
          <div class="grid grid-cols-4 gap-2">
            {STATE_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick$={() => handleUpdate('icon', icon)}
                class={`px-3 py-2 border rounded text-sm capitalize ${
                  props.state.icon === icon
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Is Final State */}
        <div class="flex items-center p-3 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id={`final-${props.state.code}`}
            checked={props.state.is_final}
            onChange$={(e) => handleUpdate('is_final', (e.target as HTMLInputElement).checked)}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={`final-${props.state.code}`} class="ml-3">
            <span class="block text-sm font-medium text-gray-900">
              Final State (Terminal)
            </span>
            <span class="block text-xs text-gray-500">
              No further transitions allowed from this state
            </span>
          </label>
        </div>

        {/* Preview */}
        <div class="border-t pt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Preview
          </label>
          <div class="flex items-center gap-3">
            <span
              class={`px-3 py-1 rounded-full text-sm font-medium ${
                STATE_COLORS.find(c => c.value === props.state.color)?.class || 'bg-gray-100 text-gray-700'
              }`}
            >
              {props.state.icon && `${props.state.icon} `}
              {props.state.name || 'State Name'}
            </span>
            {props.state.is_final && (
              <span class="text-xs text-gray-500 italic">
                (Final State)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
