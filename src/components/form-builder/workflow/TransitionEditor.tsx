// src/components/form-builder/workflow/TransitionEditor.tsx
import { component$, $ } from '@builder.io/qwik';
import type { WorkflowTransitionDef, WorkflowState } from '~/types/workflow';
import type { TransitionNotification } from '~/types/notification';
import NotificationConfigEditor from './NotificationConfigEditor';

interface TransitionEditorProps {
  transition: WorkflowTransitionDef;
  states: WorkflowState[];
  onUpdate: (transition: WorkflowTransitionDef) => void;
  onDelete: () => void;
}

const COMMON_ACTIONS = [
  { value: 'submit', label: 'Submit' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'recall', label: 'Recall' },
  { value: 'revise', label: 'Revise' },
  { value: 'cancel', label: 'Cancel' },
  { value: 'archive', label: 'Archive' },
];

const COMMON_PERMISSIONS = [
  'project:create',
  'project:read',
  'project:update',
  'project:delete',
  'project:approve',
  'admin_all',
];

export default component$<TransitionEditorProps>((props) => {
  const handleUpdate = $((field: keyof WorkflowTransitionDef, value: any) => {
    props.onUpdate({ ...props.transition, [field]: value });
  });

  const handleAddNotification = $(() => {
    const newNotification: TransitionNotification = {
      recipients: [],
      title_template: '',
      body_template: '',
      priority: 'normal',
      channels: ['in_app'],
    };
    const notifications = [...(props.transition.notifications || []), newNotification];
    handleUpdate('notifications', notifications);
  });

  const handleUpdateNotification = $((index: number, notification: TransitionNotification) => {
    const notifications = [...(props.transition.notifications || [])];
    notifications[index] = notification;
    handleUpdate('notifications', notifications);
  });

  const handleDeleteNotification = $((index: number) => {
    const notifications = props.transition.notifications?.filter((_, i) => i !== index) || [];
    handleUpdate('notifications', notifications);
  });

  return (
    <div class="border border-gray-300 rounded-lg p-4 bg-white">
      <div class="flex justify-between items-start mb-4">
        <h3 class="font-medium text-lg">Transition Configuration</h3>
        <button
          onClick$={props.onDelete}
          class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
        >
          Delete
        </button>
      </div>

      <div class="space-y-4">
        {/* From State */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            From State *
          </label>
          <select
            value={props.transition.from}
            onChange$={(e) => handleUpdate('from', (e.target as HTMLSelectElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select state...</option>
            {props.states.map((state) => (
              <option key={state.code} value={state.code}>
                {`${state.name} (${state.code})`}
              </option>
            ))}
          </select>
        </div>

        {/* To State */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            To State *
          </label>
          <select
            value={props.transition.to}
            onChange$={(e) => handleUpdate('to', (e.target as HTMLSelectElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select state...</option>
            {props.states.map((state) => (
              <option key={state.code} value={state.code}>
                {`${state.name} (${state.code})`}
              </option>
            ))}
          </select>
        </div>

        {/* Action */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Action *
          </label>
          <div class="flex gap-2">
            <select
              value={props.transition.action}
              onChange$={(e) => handleUpdate('action', (e.target as HTMLSelectElement).value)}
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select action...</option>
              {COMMON_ACTIONS.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
              <option value="custom">Custom...</option>
            </select>
            {props.transition.action === 'custom' && (
              <input
                type="text"
                value={props.transition.action}
                onInput$={(e) => handleUpdate('action', (e.target as HTMLInputElement).value)}
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Custom action name"
              />
            )}
          </div>
          <p class="text-xs text-gray-500 mt-1">
            The action verb used in the API (e.g., "submit", "approve")
          </p>
        </div>

        {/* Label */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Button Label
          </label>
          <input
            type="text"
            value={props.transition.label}
            onInput$={(e) => handleUpdate('label', (e.target as HTMLInputElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Submit for Approval, Approve, Reject"
          />
          <p class="text-xs text-gray-500 mt-1">
            Displayed on the action button. If empty, uses the action name.
          </p>
        </div>

        {/* Permission */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Required Permission
          </label>
          <div class="flex gap-2">
            <select
              value={props.transition.permission || ''}
              onChange$={(e) => handleUpdate('permission', (e.target as HTMLSelectElement).value || undefined)}
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No permission required</option>
              {COMMON_PERMISSIONS.map((perm) => (
                <option key={perm} value={perm}>
                  {perm}
                </option>
              ))}
              <option value="custom">Custom...</option>
            </select>
            {props.transition.permission === 'custom' && (
              <input
                type="text"
                value={props.transition.permission}
                onInput$={(e) => handleUpdate('permission', (e.target as HTMLInputElement).value)}
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="custom:permission"
              />
            )}
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Only users with this permission can perform this transition
          </p>
        </div>

        {/* Requires Comment */}
        <div class="flex items-center p-3 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id={`comment-${props.transition.action}`}
            checked={props.transition.requires_comment}
            onChange$={(e) => handleUpdate('requires_comment', (e.target as HTMLInputElement).checked)}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={`comment-${props.transition.action}`} class="ml-3">
            <span class="block text-sm font-medium text-gray-900">
              Require Comment
            </span>
            <span class="block text-xs text-gray-500">
              User must provide a comment when performing this action
            </span>
          </label>
        </div>

        {/* Preview */}
        <div class="border-t pt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Transition Preview
          </label>
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                {props.states.find(s => s.code === props.transition.from)?.name || props.transition.from || '?'}
              </span>
              <span class="text-gray-400">→</span>
              <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                {props.states.find(s => s.code === props.transition.to)?.name || props.transition.to || '?'}
              </span>
            </div>
            <div class="border-l pl-3 ml-auto">
              <button
                type="button"
                class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                {props.transition.label || props.transition.action || 'Action'}
              </button>
              {props.transition.requires_comment && (
                <span class="ml-2 text-xs text-gray-500">* comment required</span>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div class="border-t pt-4">
          <div class="flex justify-between items-center mb-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">
                Notifications
              </label>
              <p class="text-xs text-gray-500">
                Send notifications when this transition occurs
              </p>
            </div>
            <button
              onClick$={handleAddNotification}
              class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              + Add Notification
            </button>
          </div>

          <div class="space-y-3">
            {props.transition.notifications?.map((notification, index) => {
              const handleNotificationUpdate = $((updated: TransitionNotification) => {
                handleUpdateNotification(index, updated);
              });
              const handleNotificationDelete = $(() => {
                handleDeleteNotification(index);
              });

              return (
                <NotificationConfigEditor
                  key={index}
                  notification={notification}
                  onUpdate={handleNotificationUpdate}
                  onDelete={handleNotificationDelete}
                />
              );
            })}

            {(!props.transition.notifications || props.transition.notifications.length === 0) && (
              <div class="text-sm text-gray-500 italic bg-gray-50 rounded-lg p-4 text-center">
                No notifications configured for this transition
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
