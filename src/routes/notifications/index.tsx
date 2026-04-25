// src/routes/notifications/index.tsx
import { component$, useSignal, $, useStore } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services';
import { notificationService } from '~/services/notification.service';
import type { NotificationDTO, NotificationListResponse } from '~/types/notification';
import { Badge, Btn, FormField, PageHeader, SectionCard } from '~/components/ds';

export const useNotificationsData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const response = await ssrApiClient.get<NotificationListResponse>('/notifications', {
      limit: 50,
      offset: 0,
    });

    return {
      notifications: response.notifications || [],
      error: null as string | null,
    };
  } catch (err: any) {
    return {
      notifications: [] as NotificationDTO[],
      error: err.message || 'Failed to load notifications',
    };
  }
});

export default component$(() => {
  const initialData = useNotificationsData();
  const notifications = useSignal<NotificationDTO[]>(initialData.value.notifications || []);
  const loading = useSignal(false);
  const error = useSignal<string | null>(initialData.value.error || null);

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
        return 'error' as const;
      case 'high':
        return 'warning' as const;
      case 'normal':
        return 'info' as const;
      case 'low':
        return 'neutral' as const;
      default:
        return 'neutral' as const;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'workflow_transition':
        return 'i-heroicons-arrow-path-rounded-square-solid';
      case 'approval_required':
        return 'i-heroicons-clock-solid';
      case 'approval_approved':
        return 'i-heroicons-check-circle-solid';
      case 'approval_rejected':
        return 'i-heroicons-x-circle-solid';
      case 'task_assigned':
        return 'i-heroicons-clipboard-document-list-solid';
      case 'task_completed':
        return 'i-heroicons-check-badge-solid';
      case 'system_alert':
        return 'i-heroicons-exclamation-triangle-solid';
      default:
        return 'i-heroicons-inbox-solid';
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
    <div class="space-y-6">
      <PageHeader title="Notifications" subtitle="Manage your notifications and alerts">
        <Btn q:slot="actions" onClick$={handleMarkAllAsRead}>
          Mark All as Read
        </Btn>
        <a
          q:slot="actions"
          href="/notifications/preferences"
          class="inline-flex items-center justify-center rounded-lg border border-color-border-primary bg-color-surface-primary px-4 py-2 text-sm font-medium text-color-text-secondary transition-colors duration-200 hover:bg-color-surface-secondary"
        >
          Preferences
        </a>
      </PageHeader>

      {/* Filters */}
      <SectionCard title="Filters" subtitle="Filter notifications by type, priority, and read status.">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField id="notif-filter-type" label="Type">
            <select
              id="notif-filter-type"
              value={filters.type}
              onChange$={(e) => {
                filters.type = (e.target as HTMLSelectElement).value;
                loadNotifications();
              }}
              class="w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-3 py-2 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="workflow_transition">Workflow Transition</option>
              <option value="approval_required">Approval Required</option>
              <option value="approval_approved">Approval Approved</option>
              <option value="approval_rejected">Approval Rejected</option>
              <option value="task_assigned">Task Assigned</option>
              <option value="system_alert">System Alert</option>
            </select>
          </FormField>

          <FormField id="notif-filter-priority" label="Priority">
            <select
              id="notif-filter-priority"
              value={filters.priority}
              onChange$={(e) => {
                filters.priority = (e.target as HTMLSelectElement).value;
                loadNotifications();
              }}
              class="w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-3 py-2 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </FormField>

          <FormField id="notif-filter-status" label="Status">
            <select
              id="notif-filter-status"
              value={filters.read}
              onChange$={(e) => {
                filters.read = (e.target as HTMLSelectElement).value;
                loadNotifications();
              }}
              class="w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-3 py-2 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </FormField>
        </div>
      </SectionCard>

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
                    <i class={`${getTypeIcon(notification.type)} h-7 w-7 flex-shrink-0 text-slate-600`} aria-hidden="true"></i>

                    {/* Content */}
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between mb-2">
                        <h3 class="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span class="w-3 h-3 bg-interactive-primary rounded-full flex-shrink-0 ml-2"></span>
                        )}
                      </div>

                      <p class="text-gray-700 mb-3">{notification.body}</p>

                      <div class="flex items-center gap-3 flex-wrap mb-3">
                        {/* Priority Badge */}
                        <Badge variant={getPriorityClass(notification.priority)}>
                          {notification.priority}
                        </Badge>

                        {/* Type Badge */}
                        <Badge variant="neutral">
                          {notification.type.replace(/_/g, ' ')}
                        </Badge>

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
                          <Btn
                            size="sm"
                            variant="ghost"
                            onClick$={() => handleMarkAsRead(notification.id)}
                          >
                            Mark as Read
                          </Btn>
                        )}
                        {notification.action_url && (
                          <a
                            href={notification.action_url}
                            class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                            <i class="i-heroicons-arrow-right-solid ml-1 h-4 w-4 inline-block" aria-hidden="true"></i>
                          </a>
                        )}
                        <Btn
                          size="sm"
                          variant="danger"
                          onClick$={() => handleDelete(notification.id)}
                          class="ml-auto"
                        >
                          Delete
                        </Btn>
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
