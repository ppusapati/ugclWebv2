// src/components/form-builder/workflow/TransitionEditor.tsx
import { component$, $, type PropFunction } from '@builder.io/qwik';
import type { WorkflowTransitionDef, WorkflowState } from '~/types/workflow';
import type { TransitionNotification } from '~/types/notification';
import NotificationConfigEditor from './NotificationConfigEditor';
import { FormField } from '~/components/ds';
import { Btn } from '~/components/ds';

interface TransitionEditorProps {
  transition: WorkflowTransitionDef;
  states: WorkflowState[];
  availablePermissions: string[];
  onUpdate$: PropFunction<(transition: WorkflowTransitionDef) => void>;
  onDelete$: PropFunction<() => void>;
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

export default component$<TransitionEditorProps>((props) => {
  const handleUpdate = $(async (field: keyof WorkflowTransitionDef, value: any) => {
    await props.onUpdate$({ ...props.transition, [field]: value });
  });

  const handleAddNotification = $(async () => {
    const newNotification: TransitionNotification = {
      recipients: [],
      title_template: '',
      body_template: '',
      priority: 'normal',
      channels: ['in_app'],
    };
    const notifications = [...(props.transition.notifications || []), newNotification];
    await handleUpdate('notifications', notifications);
  });

  const handleUpdateNotification = $(async (index: number, notification: TransitionNotification) => {
    const notifications = [...(props.transition.notifications || [])];
    notifications[index] = notification;
    await handleUpdate('notifications', notifications);
  });

  const handleDeleteNotification = $(async (index: number) => {
    const notifications = props.transition.notifications?.filter((_, i) => i !== index) || [];
    await handleUpdate('notifications', notifications);
  });

  return (
    <div class="border border-gray-300 rounded-lg p-4 bg-white">
      <div class="flex justify-between items-start mb-4">
        <h3 class="font-medium text-lg">Transition Configuration</h3>
        <Btn
          size="sm"
          variant="danger"
          onClick$={props.onDelete$}
          class="text-red-600 hover:bg-red-50"
        >
          Delete
        </Btn>
      </div>

      <div class="space-y-4">
        {/* From State */}
        <FormField id={`transition-from-${props.transition.action || 'new'}`} label="From State" required>
          <select
            id={`transition-from-${props.transition.action || 'new'}`}
            value={props.transition.from}
            onChange$={(e) => handleUpdate('from', (e.target as HTMLSelectElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            aria-required="true"
          >
            <option value="">Select state...</option>
            {props.states.map((state) => (
              <option key={state.code} value={state.code}>
                {`${state.name} (${state.code})`}
              </option>
            ))}
          </select>
        </FormField>

        {/* To State */}
        <FormField id={`transition-to-${props.transition.action || 'new'}`} label="To State" required>
          <select
            id={`transition-to-${props.transition.action || 'new'}`}
            value={props.transition.to}
            onChange$={(e) => handleUpdate('to', (e.target as HTMLSelectElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            aria-required="true"
          >
            <option value="">Select state...</option>
            {props.states.map((state) => (
              <option key={state.code} value={state.code}>
                {`${state.name} (${state.code})`}
              </option>
            ))}
          </select>
        </FormField>

        {/* Action */}
        <FormField
          id={`transition-action-${props.transition.action || 'new'}`}
          label="Action"
          required
          hint="The action verb used in the API (e.g., submit, approve)."
        >
          <div class="flex gap-2">
            <select
              id={`transition-action-${props.transition.action || 'new'}`}
              value={props.transition.action}
              onChange$={(e) => handleUpdate('action', (e.target as HTMLSelectElement).value)}
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-required="true"
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
        </FormField>

        {/* Label */}
        <FormField
          id={`transition-label-${props.transition.action || 'new'}`}
          label="Button Label"
          hint="Displayed on the action button. If empty, uses the action name."
        >
          <input
            id={`transition-label-${props.transition.action || 'new'}`}
            type="text"
            value={props.transition.label}
            onInput$={(e) => handleUpdate('label', (e.target as HTMLInputElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Submit for Approval, Approve, Reject"
          />
        </FormField>

        {/* Permission */}
        <FormField
          id={`transition-permission-${props.transition.action || 'new'}`}
          label="Required Permission"
          hint="Only users with this permission can perform this transition."
        >
          <div class="flex gap-2">
            <select
              id={`transition-permission-${props.transition.action || 'new'}`}
              value={props.transition.permission || ''}
              onChange$={(e) => handleUpdate('permission', (e.target as HTMLSelectElement).value || undefined)}
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No permission required</option>
              {props.availablePermissions.map((perm) => (
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
        </FormField>

        {/* Requires Comment */}
        <div class="flex items-center p-3 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id={`comment-${props.transition.action}`}
            checked={props.transition.requires_comment}
            onChange$={(e) => handleUpdate('requires_comment', (e.target as HTMLInputElement).checked)}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for={`comment-${props.transition.action}`} class="ml-3">
            <span class="block text-sm font-medium text-gray-900">
              Require Comment
            </span>
            <span class="block text-xs text-gray-500">
              User must provide a comment when performing this action
            </span>
          </label>
        </div>

        {/* DMS Requirements */}
        <div class="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-3">
          <div>
            <p class="text-sm font-medium text-amber-900">Document Compliance (PMS + DMS)</p>
            <p class="text-xs text-amber-800">
              Block this workflow action until linked task documents satisfy minimum evidence requirements.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              id={`transition-min-docs-${props.transition.action || 'new'}`}
              label="Min Linked Documents"
              hint="Minimum number of documents linked to task context."
            >
              <input
                id={`transition-min-docs-${props.transition.action || 'new'}`}
                type="number"
                min="0"
                value={String(props.transition.document_requirements?.min_documents || 0)}
                onInput$={(e) => {
                  const minDocuments = Number((e.target as HTMLInputElement).value) || 0;
                  handleUpdate('document_requirements', {
                    ...(props.transition.document_requirements || {}),
                    min_documents: minDocuments,
                  });
                }}
                class="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </FormField>

            <FormField
              id={`transition-min-approved-docs-${props.transition.action || 'new'}`}
              label="Min Approved Documents"
              hint="Minimum number of linked documents with Approved status."
            >
              <input
                id={`transition-min-approved-docs-${props.transition.action || 'new'}`}
                type="number"
                min="0"
                value={String(props.transition.document_requirements?.min_approved_documents || 0)}
                onInput$={(e) => {
                  const minApprovedDocuments = Number((e.target as HTMLInputElement).value) || 0;
                  handleUpdate('document_requirements', {
                    ...(props.transition.document_requirements || {}),
                    min_approved_documents: minApprovedDocuments,
                  });
                }}
                class="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </FormField>
          </div>
        </div>

        {/* Preview */}
        <div class="border-t pt-4">
          <h5 class="text-sm font-medium text-gray-700 mb-2">Transition Preview</h5>
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                {props.states.find(s => s.code === props.transition.from)?.name || props.transition.from || '?'}
              </span>
              <i class="i-heroicons-arrow-right-solid h-3.5 w-3.5 inline-block text-gray-400" aria-hidden="true"></i>
              <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                {props.states.find(s => s.code === props.transition.to)?.name || props.transition.to || '?'}
              </span>
            </div>
            <div class="border-l pl-3 ml-auto">
              <Btn
                type="button"
                size="sm"
                variant="primary"
              >
                {props.transition.label || props.transition.action || 'Action'}
              </Btn>
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
            <Btn
              size="sm"
              variant="secondary"
              onClick$={handleAddNotification}
              class="text-blue-600 hover:bg-blue-50"
            >
              + Add Notification
            </Btn>
          </div>

          <div class="space-y-3">
            {props.transition.notifications?.map((notification, index) => {
              const handleNotificationUpdate = $(async (updated: TransitionNotification) => {
                await handleUpdateNotification(index, updated);
              });
              const handleNotificationDelete = $(async () => {
                await handleDeleteNotification(index);
              });

              return (
                <NotificationConfigEditor
                  key={index}
                  notification={notification}
                  onUpdate$={handleNotificationUpdate}
                  onDelete$={handleNotificationDelete}
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
