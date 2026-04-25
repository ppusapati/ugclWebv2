// src/components/form-builder/workflow/NotificationConfigEditor.tsx
import { component$, $, type PropFunction } from '@builder.io/qwik';
import type { TransitionNotification, NotificationRecipientDef } from '~/types/notification';
import { FormField } from '~/components/ds';
import { Btn } from '~/components/ds';

interface NotificationConfigEditorProps {
  notification: TransitionNotification;
  onUpdate$: PropFunction<(notification: TransitionNotification) => void>;
  onDelete$: PropFunction<() => void>;
}

const RECIPIENT_TYPES = [
  { value: 'user', label: 'Specific User' },
  { value: 'role', label: 'Global Role' },
  { value: 'business_role', label: 'Business Role' },
  { value: 'permission', label: 'Users with Permission' },
  { value: 'submitter', label: 'Form Submitter' },
  { value: 'approver', label: 'Workflow Approver' },
  { value: 'field_value', label: 'User from Form Field' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const CHANNELS = [
  { value: 'in_app', label: 'In-App' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'web_push', label: 'Browser Push' },
] as const;

export default component$<NotificationConfigEditorProps>((props) => {
  const handleUpdate = $(async (field: keyof TransitionNotification, value: any) => {
    await props.onUpdate$({ ...props.notification, [field]: value });
  });

  const handleAddRecipient = $(async () => {
    const newRecipient: NotificationRecipientDef = {
      type: 'user',
      value: '',
    };
    const recipients = [...(props.notification.recipients || []), newRecipient];
    await handleUpdate('recipients', recipients);
  });

  const handleUpdateRecipient = $(async (index: number, field: keyof NotificationRecipientDef, value: any) => {
    const recipients = [...(props.notification.recipients || [])];
    recipients[index] = { ...recipients[index], [field]: value };
    await handleUpdate('recipients', recipients);
  });

  const handleDeleteRecipient = $(async (index: number) => {
    const recipients = props.notification.recipients?.filter((_, i) => i !== index) || [];
    await handleUpdate('recipients', recipients);
  });

  const handleToggleChannel = $(async (channel: (typeof CHANNELS)[number]['value']) => {
    const channels = props.notification.channels || [];
    if (channels.includes(channel)) {
      await handleUpdate('channels', channels.filter((c) => c !== channel));
    } else {
      await handleUpdate('channels', [...channels, channel]);
    }
  });

  return (
    <div class="border border-gray-300 rounded-lg p-4 bg-white">
      <div class="flex justify-between items-start mb-4">
        <h4 class="font-medium text-lg">Notification Configuration</h4>
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
        {/* Title Template */}
        <FormField
          id="workflow-notification-title-template"
          label="Title Template"
          required
          hint="Use {{variable_name}} for dynamic values"
        >
          <input
            id="workflow-notification-title-template"
            type="text"
            value={props.notification.title_template}
            onInput$={(e) => handleUpdate('title_template', (e.target as HTMLInputElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., New {{form_title}} submission"
            required
            aria-required="true"
            aria-describedby="workflow-notification-title-template-hint"
          />
        </FormField>

        {/* Body Template */}
        <FormField
          id="workflow-notification-body-template"
          label="Body Template"
          required
          hint="Available variables: {{submitter_name}}, {{approver_name}}, {{form_title}}, {{current_state}}, {{form_data.field_name}}"
        >
          <textarea
            id="workflow-notification-body-template"
            value={props.notification.body_template}
            onInput$={(e) => handleUpdate('body_template', (e.target as HTMLTextAreaElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="e.g., {{submitter_name}} submitted a form for your review"
            required
            aria-required="true"
            aria-describedby="workflow-notification-body-template-hint"
          />
        </FormField>

        {/* Priority */}
        <FormField id="workflow-notification-priority" label="Priority">
          <select
            id="workflow-notification-priority"
            value={props.notification.priority || 'normal'}
            onChange$={(e) => handleUpdate('priority', (e.target as HTMLSelectElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </FormField>

        {/* Delivery Channels */}
        <FormField id="workflow-notification-channels" label="Delivery Channels">
          <div class="space-y-2">
            {CHANNELS.map((channel) => (
              <label key={channel.value} class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={props.notification.channels?.includes(channel.value) || false}
                  onChange$={() => handleToggleChannel(channel.value)}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="text-sm text-gray-900">{channel.label}</span>
              </label>
            ))}
          </div>
        </FormField>

        {/* Recipients */}
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700">
              Recipients *
            </label>
            <Btn
              size="sm"
              variant="secondary"
              onClick$={handleAddRecipient}
              class="text-blue-600 hover:bg-blue-50"
            >
              + Add Recipient
            </Btn>
          </div>

          <div class="space-y-3">
            {props.notification.recipients?.map((recipient, index) => (
              <div key={index} class="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div class="flex gap-2 mb-2">
                  <select
                    value={recipient.type}
                    onChange$={(e) => handleUpdateRecipient(index, 'type', (e.target as HTMLSelectElement).value)}
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {RECIPIENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <Btn
                    size="sm"
                    variant="danger"
                    onClick$={() => handleDeleteRecipient(index)}
                    class="text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Btn>
                </div>

                {/* Dynamic fields based on recipient type */}
                {recipient.type === 'user' && (
                  <input
                    type="text"
                    value={recipient.value || ''}
                    onInput$={(e) => handleUpdateRecipient(index, 'value', (e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="User ID"
                  />
                )}

                {recipient.type === 'role' && (
                  <input
                    type="text"
                    value={recipient.role_id || ''}
                    onInput$={(e) => handleUpdateRecipient(index, 'role_id', (e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Role UUID"
                  />
                )}

                {recipient.type === 'business_role' && (
                  <input
                    type="text"
                    value={recipient.business_role_id || ''}
                    onInput$={(e) => handleUpdateRecipient(index, 'business_role_id', (e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Business Role UUID"
                  />
                )}

                {recipient.type === 'permission' && (
                  <input
                    type="text"
                    value={recipient.permission_code || ''}
                    onInput$={(e) => handleUpdateRecipient(index, 'permission_code', (e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g., project:approve"
                  />
                )}

                {recipient.type === 'field_value' && (
                  <input
                    type="text"
                    value={recipient.value || ''}
                    onInput$={(e) => handleUpdateRecipient(index, 'value', (e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Form field name (e.g., assigned_to)"
                  />
                )}

                {(recipient.type === 'submitter' || recipient.type === 'approver') && (
                  <p class="text-xs text-gray-600 italic">
                    Automatically resolves to the {recipient.type}
                  </p>
                )}
              </div>
            ))}

            {(!props.notification.recipients || props.notification.recipients.length === 0) && (
              <p class="text-sm text-gray-500 italic">
                No recipients configured. Click "Add Recipient" to add one.
              </p>
            )}
          </div>
        </div>

        {/* Preview */}
        <div class="border-t pt-4">
          <h5 class="text-sm font-medium text-gray-700 mb-2">Preview</h5>
          <div class="bg-gray-50 rounded-lg p-3 space-y-2">
            <div class="text-sm">
              <span class="font-medium">Priority:</span>{' '}
              <span class={`px-2 py-1 rounded text-xs ${
                props.notification.priority === 'critical' ? 'bg-red-100 text-red-800' :
                props.notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                props.notification.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {props.notification.priority || 'normal'}
              </span>
            </div>
            <div class="text-sm">
              <span class="font-medium">Channels:</span>{' '}
              {props.notification.channels?.join(', ') || 'in_app'}
            </div>
            <div class="text-sm">
              <span class="font-medium">Recipients:</span>{' '}
              {props.notification.recipients?.length || 0} configured
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
