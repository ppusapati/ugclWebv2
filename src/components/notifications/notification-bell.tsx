import { component$, useSignal, useVisibleTask$, $, type PropFunction } from '@builder.io/qwik';
import { notificationService } from '~/services/notification.service';
import type { NotificationDTO } from '~/types/notification';

interface NotificationBellProps {
  onNotificationClick$?: PropFunction<(notification: NotificationDTO) => void>;
}

/**
 * Notification Bell Component
 * Displays notification icon with unread count badge
 * Shows dropdown list of recent notifications
 */
export const NotificationBell = component$<NotificationBellProps>(
  ({ onNotificationClick$ }) => {
    const unreadCount = useSignal(0);
    const notifications = useSignal<NotificationDTO[]>([]);
    const isOpen = useSignal(false);
    const isLoading = useSignal(false);

    // Load initial data
    useVisibleTask$(async () => {
      try {
        // Get unread count
        const count = await notificationService.getUnreadCount();
        unreadCount.value = count;

        // Get recent notifications
        const response = await notificationService.getNotifications({
          limit: 10,
          read: false,
        });
        notifications.value = response.notifications;

        // Subscribe to real-time notifications
        const unsubscribe = notificationService.subscribeToNotifications(
          (notification) => {
            // Add new notification to the list
            notifications.value = [notification, ...notifications.value].slice(
              0,
              10
            );
            unreadCount.value = unreadCount.value + 1;

            // Show browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(notification.title, {
                body: notification.body,
                icon: '/icon-notification.png',
                badge: '/badge.png',
                tag: notification.id,
              });
            }
          }
        );

        // Cleanup on unmount
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    });

    const handleToggleDropdown = $(() => {
      isOpen.value = !isOpen.value;
    });

    const handleNotificationClick = $(async (notification: NotificationDTO) => {
      // Mark as read
      if (!notification.is_read) {
        try {
          await notificationService.markAsRead(notification.id);
          notification.is_read = true;
          unreadCount.value = Math.max(0, unreadCount.value - 1);
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
        }
      }

      // Close dropdown
      isOpen.value = false;

      // Trigger callback
      if (onNotificationClick$) {
        await onNotificationClick$(notification);
      }

      // Navigate to action URL if provided
      if (notification.action_url) {
        window.location.href = notification.action_url;
      }
    });

    const handleMarkAllAsRead = $(async () => {
      isLoading.value = true;
      try {
        await notificationService.markAllAsRead();
        notifications.value = notifications.value.map((n) => ({
          ...n,
          is_read: true,
        }));
        unreadCount.value = 0;
      } catch (error) {
        console.error('Failed to mark all as read:', error);
      } finally {
        isLoading.value = false;
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
      <div class="relative">
        {/* Bell Icon */}
        <button
          onClick$={handleToggleDropdown}
          class="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>

          {/* Unread Badge */}
          {unreadCount.value > 0 && (
            <span class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount.value > 99 ? '99+' : unreadCount.value}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen.value && (
          <div class="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div class="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount.value > 0 && (
                <button
                  onClick$={handleMarkAllAsRead}
                  disabled={isLoading.value}
                  class="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div class="overflow-y-auto flex-1">
              {notifications.value.length === 0 ? (
                <div class="px-4 py-8 text-center text-gray-500">
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
                  <p class="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.value.map((notification) => (
                  <button
                    key={notification.id}
                    onClick$={() => handleNotificationClick(notification)}
                    class={`w-full px-4 py-3 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div class="flex items-start gap-3">
                      {/* Type Icon */}
                      <span class="text-2xl flex-shrink-0">
                        {getTypeIcon(notification.type)}
                      </span>

                      {/* Content */}
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                          <h4 class="text-sm font-semibold text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <span class="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2"></span>
                          )}
                        </div>

                        <p class="text-sm text-gray-600 line-clamp-2 mb-2">
                          {notification.body}
                        </p>

                        <div class="flex items-center gap-2 flex-wrap">
                          {/* Priority Badge */}
                          <span
                            class={`text-xs px-2 py-1 rounded border ${getPriorityClass(
                              notification.priority
                            )}`}
                          >
                            {notification.priority}
                          </span>

                          {/* Time */}
                          <span class="text-xs text-gray-500">
                            {formatTime(notification.created_at)}
                          </span>

                          {/* Form Code */}
                          {notification.form_code && (
                            <span class="text-xs text-gray-500">
                              {notification.form_code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.value.length > 0 && (
              <div class="px-4 py-3 border-t border-gray-200">
                <a
                  href="/notifications"
                  class="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all notifications →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);
