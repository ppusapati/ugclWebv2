// src/routes/notifications/preferences/index.tsx
import { component$, useSignal, useVisibleTask$, $, useStore } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import { notificationService } from '~/services/notification.service';
import type { NotificationPreference } from '~/types/notification';

export default component$(() => {
  const loading = useSignal(true);
  const saving = useSignal(false);
  const error = useSignal<string | null>(null);
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
    digest_frequency: '',
    created_at: '',
    updated_at: '',
  });

  useVisibleTask$(async () => {
    try {
      loading.value = true;
      const prefs = await notificationService.getPreferences();
      Object.assign(preferences, prefs);
      error.value = null;
    } catch (err: any) {
      error.value = err.message || 'Failed to load preferences';
    } finally {
      loading.value = false;
    }
  });

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

  const toggleDisabledType = $((type: string) => {
    if (preferences.disabled_types.includes(type)) {
      preferences.disabled_types = preferences.disabled_types.filter((t) => t !== type);
    } else {
      preferences.disabled_types = [...preferences.disabled_types, type];
    }
  });

  return (
    <div class="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <a href="/notifications" class="text-blue-600 hover:text-blue-800">
            ← Back to Notifications
          </a>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">Notification Preferences</h1>
        <p class="text-gray-600 mt-1">
          Customize how and when you receive notifications
        </p>
      </div>

      {/* Loading State */}
      {loading.value && (
        <div class="flex justify-center py-12">
          <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Error State */}
      {error.value && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error.value}
        </div>
      )}

      {/* Success State */}
      {success.value && (
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 mb-6">
          {success.value}
        </div>
      )}

      {/* Preferences Form */}
      {!loading.value && (
        <div class="space-y-6">
          {/* Delivery Channels */}
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              Delivery Channels
            </h2>
            <p class="text-sm text-gray-600 mb-4">
              Choose how you want to receive notifications
            </p>

            <div class="space-y-4">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.enable_in_app}
                  onChange$={(e) =>
                    (preferences.enable_in_app = (e.target as HTMLInputElement).checked)
                  }
                  class="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                  class="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                  class="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                  class="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div class="font-medium text-gray-900">Browser Push Notifications</div>
                  <div class="text-sm text-gray-600">
                    Receive browser push notifications even when the app is closed
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Notification Types */}
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              Notification Types
            </h2>
            <p class="text-sm text-gray-600 mb-4">
              Select which types of notifications you want to receive
            </p>

            <div class="space-y-3">
              {[
                { value: 'workflow_transition', label: 'Workflow State Changes' },
                { value: 'approval_required', label: 'Approval Required' },
                { value: 'approval_approved', label: 'Approval Approved' },
                { value: 'approval_rejected', label: 'Approval Rejected' },
                { value: 'task_assigned', label: 'Task Assigned' },
                { value: 'task_completed', label: 'Task Completed' },
                { value: 'system_alert', label: 'System Alerts' },
              ].map((type) => (
                <label key={type.value} class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!preferences.disabled_types.includes(type.value)}
                    onChange$={() => toggleDisabledType(type.value)}
                    class="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span class="text-gray-900">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Quiet Hours</h2>
            <p class="text-sm text-gray-600 mb-4">
              Pause notifications during specific hours
            </p>

            <label class="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={preferences.quiet_hours_enabled}
                onChange$={(e) =>
                  (preferences.quiet_hours_enabled = (
                    e.target as HTMLInputElement
                  ).checked)
                }
                class="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="text-gray-900">Enable Quiet Hours</span>
            </label>

            {preferences.quiet_hours_enabled && (
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_start}
                    onInput$={(e) =>
                      (preferences.quiet_hours_start = (
                        e.target as HTMLInputElement
                      ).value)
                    }
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_end}
                    onInput$={(e) =>
                      (preferences.quiet_hours_end = (e.target as HTMLInputElement).value)
                    }
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Digest Settings */}
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              Notification Digest
            </h2>
            <p class="text-sm text-gray-600 mb-4">
              Receive a summary of notifications at regular intervals
            </p>

            <label class="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={preferences.digest_enabled}
                onChange$={(e) =>
                  (preferences.digest_enabled = (e.target as HTMLInputElement).checked)
                }
                class="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="text-gray-900">Enable Notification Digest</span>
            </label>

            {preferences.digest_enabled && (
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={preferences.digest_frequency}
                  onChange$={(e) =>
                    (preferences.digest_frequency = (
                      e.target as HTMLSelectElement
                    ).value)
                  }
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div class="flex justify-end gap-3">
            <a
              href="/notifications"
              class="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </a>
            <button
              onClick$={handleSave}
              disabled={saving.value}
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving.value ? 'Saving...' : 'Save Preferences'}
            </button>
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
