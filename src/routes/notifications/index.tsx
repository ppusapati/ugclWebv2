// src/routes/notifications/index.tsx
import { component$, useSignal, useVisibleTask$, $, useStore } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import { notificationService } from '~/services/notification.service';
import type { NotificationDTO } from '~/types/notification';

export default component$(() => {
  const notifications = useSignal<NotificationDTO[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);

  const filters = useStore({
    type: '',
    priority: '',
    read: '',
    limit: 50,
    offset: 0,
  });

  const loadNotifications = $(async () => {
    try {
      loading.value = true;
      const filterParams: any = { limit: filters.limit, offset: filters.offset };

      if (filters.type) filterParams.type = filters.type;
      if (filters.priority) filterParams.priority = filters.priority;
      if (filters.read !== '') filterParams.read = filters.read === 'true';

      const response = await notificationService.getNotifications(filterParams);
      notifications.value = response.notifications;
      error.value = null;
    } catch (err: any) {
      error.value = err.message || 'Failed to load notifications';
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadNotifications();
  });

  const handleMarkAsRead = $(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      // Update local state
      notifications.value = notifications.value.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  });

  const handleMarkAllAsRead = $(async () => {
    try {
      await notificationService.markAllAsRead();
      notifications.value = notifications.value.map((n) => ({ ...n, is_read: true }));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  });

  const handleDelete = $(async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      await notificationService.deleteNotification(id);
      notifications.value = notifications.value.filter((n) => n.id !== id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  });

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'normal':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'low':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'workflow_transition':
        return '🔄';
      case 'approval_required':
        return '⏰';
      case 'approval_approved':
        return '✅';
      case 'approval_rejected':
        return '❌';
      case 'task_assigned':
        return '📋';
      case 'task_completed':
        return '✓';
      case 'system_alert':
        return '⚠️';
      default:
        return '📬';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div class="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Notifications</h1>
          <p class="text-gray-600 mt-1">Manage your notifications and alerts</p>
        </div>
        <div class="flex gap-2">
          <button
            onClick$={handleMarkAllAsRead}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Mark All as Read
          </button>
          <a
            href="/notifications/preferences"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
          >
            Preferences
          </a>
        </div>
      </div>

      {/* Filters */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange$={(e) => {
                filters.type = (e.target as HTMLSelectElement).value;
                loadNotifications();
              }}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="workflow_transition">Workflow Transition</option>
              <option value="approval_required">Approval Required</option>
              <option value="approval_approved">Approval Approved</option>
              <option value="approval_rejected">Approval Rejected</option>
              <option value="task_assigned">Task Assigned</option>
              <option value="system_alert">System Alert</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange$={(e) => {
                filters.priority = (e.target as HTMLSelectElement).value;
                loadNotifications();
              }}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.read}
              onChange$={(e) => {
                filters.read = (e.target as HTMLSelectElement).value;
                loadNotifications();
              }}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading.value && (
        <div class="flex justify-center py-12">
          <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Error State */}
      {error.value && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error.value}
        </div>
      )}

      {/* Notification List */}
      {!loading.value && !error.value && (
        <>
          {notifications.value.length === 0 ? (
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg
                class="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 class="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
              <p class="text-gray-600">You're all caught up!</p>
            </div>
          ) : (
            <div class="space-y-3">
              {notifications.value.map((notification) => (
                <div
                  key={notification.id}
                  class={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow ${
                    !notification.is_read ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div class="flex items-start gap-4">
                    {/* Type Icon */}
                    <span class="text-3xl flex-shrink-0">
                      {getTypeIcon(notification.type)}
                    </span>

                    {/* Content */}
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between mb-2">
                        <h3 class="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span class="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 ml-2"></span>
                        )}
                      </div>

                      <p class="text-gray-700 mb-3">{notification.body}</p>

                      <div class="flex items-center gap-3 flex-wrap mb-3">
                        {/* Priority Badge */}
                        <span
                          class={`text-xs px-2 py-1 rounded border font-medium ${getPriorityClass(
                            notification.priority
                          )}`}
                        >
                          {notification.priority}
                        </span>

                        {/* Type Badge */}
                        <span class="text-xs px-2 py-1 rounded border border-gray-300 bg-gray-100 text-gray-700">
                          {notification.type.replace(/_/g, ' ')}
                        </span>

                        {/* Time */}
                        <span class="text-xs text-gray-500">
                          {formatTime(notification.created_at)}
                        </span>

                        {/* Form Code */}
                        {notification.form_code && (
                          <span class="text-xs text-gray-500">
                            Form: {notification.form_code}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div class="flex items-center gap-2">
                        {!notification.is_read && (
                          <button
                            onClick$={() => handleMarkAsRead(notification.id)}
                            class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Mark as Read
                          </button>
                        )}
                        {notification.action_url && (
                          <a
                            href={notification.action_url}
                            class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details →
                          </a>
                        )}
                        <button
                          onClick$={() => handleDelete(notification.id)}
                          class="ml-auto text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Notifications',
  meta: [
    {
      name: 'description',
      content: 'View and manage your notifications',
    },
  ],
};
