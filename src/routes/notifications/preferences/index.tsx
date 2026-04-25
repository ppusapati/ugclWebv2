// src/routes/notifications/preferences/index.tsx
import { component$, useSignal, $, useStore } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services';
import { notificationService } from '~/services/notification.service';
import type { NotificationPreference, NotificationType } from '~/types/notification';
import { Btn, FormField, PageHeader, SectionCard } from '~/components/ds';

export const useNotificationPreferencesData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const response = await ssrApiClient.get<{ preferences: NotificationPreference }>('/notifications/preferences');
    return {
      preferences: response.preferences,
      error: null as string | null,
    };
  } catch (err: any) {
    return {
      preferences: null as NotificationPreference | null,
      error: err.message || 'Failed to load preferences',
    };
  }
});

export default component$(() => {
  const initialData = useNotificationPreferencesData();
  const loading = useSignal(false);
  const saving = useSignal(false);
  const error = useSignal<string | null>(initialData.value.error || null);
  const success = useSignal<string | null>(null);

  const preferences = useStore<NotificationPreference>({
    id: '',
    user_id: '',
    enable_in_app: true,
    enable_email: true,
    enable_sms: false,
    enable_web_push: true,
    disabled_types: [],
    quiet_hours_enabled: false,
    quiet_hours_start: '',
    quiet_hours_end: '',
    digest_enabled: false,
    digest_frequency: undefined,
    created_at: '',
    updated_at: '',
  });

  if (initialData.value.preferences) {
    Object.assign(preferences, initialData.value.preferences);
  }

  const handleSave = $(async () => {
    try {
      saving.value = true;
      error.value = null;
      success.value = null;

      await notificationService.updatePreferences({
        enable_in_app: preferences.enable_in_app,
        enable_email: preferences.enable_email,
        enable_sms: preferences.enable_sms,
        enable_web_push: preferences.enable_web_push,
        disabled_types: preferences.disabled_types,
        quiet_hours_enabled: preferences.quiet_hours_enabled,
        quiet_hours_start: preferences.quiet_hours_start || undefined,
        quiet_hours_end: preferences.quiet_hours_end || undefined,
        digest_enabled: preferences.digest_enabled,
        digest_frequency: preferences.digest_frequency || undefined,
      });

      success.value = 'Preferences saved successfully!';
      setTimeout(() => {
        success.value = null;
      }, 3000);
    } catch (err: any) {
      error.value = err.message || 'Failed to save preferences';
    } finally {
      saving.value = false;
    }
  });

  const toggleDisabledType = $((type: NotificationType) => {
    if (preferences.disabled_types.includes(type)) {
      preferences.disabled_types = preferences.disabled_types.filter((t) => t !== type);
    } else {
      preferences.disabled_types = [...preferences.disabled_types, type];
    }
  });

  return (
    <div class="space-y-6">
      <PageHeader
        title="Notification Preferences"
        subtitle="Customize how and when you receive notifications"
      >
        <a
          q:slot="actions"
          href="/notifications"
          class="inline-flex items-center justify-center rounded-lg border border-color-border-primary bg-color-surface-primary px-4 py-2 text-sm font-medium text-color-text-secondary transition-colors duration-200 hover:bg-color-surface-secondary"
        >
          <i class="i-heroicons-arrow-left-solid mr-1 h-4 w-4 inline-block" aria-hidden="true"></i>
          Back to Notifications
        </a>
      </PageHeader>

      {/* Loading State */}
      {loading.value && (
        <div class="flex justify-center py-12">
          <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Error State */}
      {error.value && (
        <div class="rounded-lg border border-color-semantic-error-300 bg-color-semantic-error-100 p-4 text-sm text-color-semantic-error-700">
          {error.value}
        </div>
      )}

      {/* Success State */}
      {success.value && (
        <div class="rounded-lg border border-color-semantic-success-300 bg-color-semantic-success-100 p-4 text-sm text-color-semantic-success-700">
          {success.value}
        </div>
      )}

      {/* Preferences Form */}
      {!loading.value && (
        <div class="space-y-6">
          {/* Delivery Channels */}
          <SectionCard title="Delivery Channels" subtitle="Choose how you want to receive notifications.">

            <div class="space-y-4">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.enable_in_app}
                  onChange$={(e) =>
                    (preferences.enable_in_app = (e.target as HTMLInputElement).checked)
                  }
                  class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div class="font-medium text-gray-900">In-App Notifications</div>
                  <div class="text-sm text-gray-600">
                    Show notifications in the notification bell
                  </div>
                </div>
              </label>

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.enable_email}
                  onChange$={(e) =>
                    (preferences.enable_email = (e.target as HTMLInputElement).checked)
                  }
                  class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div class="font-medium text-gray-900">Email Notifications</div>
                  <div class="text-sm text-gray-600">
                    Receive notifications via email
                  </div>
                </div>
              </label>

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.enable_sms}
                  onChange$={(e) =>
                    (preferences.enable_sms = (e.target as HTMLInputElement).checked)
                  }
                  class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div class="font-medium text-gray-900">SMS Notifications</div>
                  <div class="text-sm text-gray-600">
                    Receive notifications via SMS (charges may apply)
                  </div>
                </div>
              </label>

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.enable_web_push}
                  onChange$={(e) =>
                    (preferences.enable_web_push = (e.target as HTMLInputElement).checked)
                  }
                  class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div class="font-medium text-gray-900">Browser Push Notifications</div>
                  <div class="text-sm text-gray-600">
                    Receive browser push notifications even when the app is closed
                  </div>
                </div>
              </label>
            </div>
          </SectionCard>

          {/* Notification Types */}
          <SectionCard title="Notification Types" subtitle="Select which types of notifications you want to receive.">

            <div class="space-y-3">
              {([
                { value: 'workflow_transition' as NotificationType, label: 'Workflow State Changes' },
                { value: 'approval_required' as NotificationType, label: 'Approval Required' },
                { value: 'approval_approved' as NotificationType, label: 'Approval Approved' },
                { value: 'approval_rejected' as NotificationType, label: 'Approval Rejected' },
                { value: 'task_assigned' as NotificationType, label: 'Task Assigned' },
                { value: 'task_completed' as NotificationType, label: 'Task Completed' },
                { value: 'system_alert' as NotificationType, label: 'System Alerts' },
              ]).map((type) => (
                <label key={type.value} class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!preferences.disabled_types.includes(type.value)}
                    onChange$={() => toggleDisabledType(type.value)}
                    class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-gray-900">{type.label}</span>
                </label>
              ))}
            </div>
          </SectionCard>

          {/* Quiet Hours */}
          <SectionCard title="Quiet Hours" subtitle="Pause notifications during specific hours.">

            <label class="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={preferences.quiet_hours_enabled}
                onChange$={(e) =>
                  (preferences.quiet_hours_enabled = (
                    e.target as HTMLInputElement
                  ).checked)
                }
                class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-gray-900">Enable Quiet Hours</span>
            </label>

            {preferences.quiet_hours_enabled && (
              <div class="grid grid-cols-2 gap-4">
                <FormField id="notif-pref-start-time" label="Start Time">
                  <input
                    id="notif-pref-start-time"
                    type="time"
                    value={preferences.quiet_hours_start}
                    onInput$={(e) =>
                      (preferences.quiet_hours_start = (
                        e.target as HTMLInputElement
                      ).value)
                    }
                    class="w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-3 py-2 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none"
                  />
                </FormField>
                <FormField id="notif-pref-end-time" label="End Time">
                  <input
                    id="notif-pref-end-time"
                    type="time"
                    value={preferences.quiet_hours_end}
                    onInput$={(e) =>
                      (preferences.quiet_hours_end = (e.target as HTMLInputElement).value)
                    }
                    class="w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-3 py-2 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none"
                  />
                </FormField>
              </div>
            )}
          </SectionCard>

          {/* Digest Settings */}
          <SectionCard title="Notification Digest" subtitle="Receive a summary of notifications at regular intervals.">

            <label class="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={preferences.digest_enabled}
                onChange$={(e) =>
                  (preferences.digest_enabled = (e.target as HTMLInputElement).checked)
                }
                class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-gray-900">Enable Notification Digest</span>
            </label>

            {preferences.digest_enabled && (
              <FormField id="notif-pref-frequency" label="Frequency">
                <select
                  id="notif-pref-frequency"
                  value={preferences.digest_frequency || ''}
                  onChange$={(e) => {
                    const val = (e.target as HTMLSelectElement).value;
                    preferences.digest_frequency = val === '' ? undefined : val as 'daily' | 'weekly';
                  }}
                  class="w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-3 py-2 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none"
                >
                  <option value="">Select frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </FormField>
            )}
          </SectionCard>

          {/* Save Button */}
          <div class="flex justify-end gap-3">
            <a
              href="/notifications"
              class="inline-flex items-center justify-center rounded-lg border border-color-border-primary bg-color-surface-secondary px-6 py-2 text-sm font-medium text-color-text-secondary transition-colors duration-200 hover:bg-color-surface-tertiary"
            >
              Cancel
            </a>
            <Btn
              onClick$={handleSave}
              disabled={saving.value}
            >
              {saving.value ? 'Saving...' : 'Save Preferences'}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Notification Preferences',
  meta: [
    {
      name: 'description',
      content: 'Customize your notification settings',
    },
  ],
};
