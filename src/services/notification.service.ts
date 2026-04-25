import { apiClient } from './api-client';
import { resolveApiBaseUrl } from '~/config/api';
import type {
  NotificationDTO,
  NotificationPreference,
  NotificationRule,
  NotificationListResponse,
  NotificationStats,
  NotificationFilters,
  UpdatePreferencesRequest,
  CreateNotificationRuleRequest,
} from '../types/notification';

/**
 * Notification Service
 * Handles all notification-related API calls
 */
export class NotificationService {
  private baseUrl = '/notifications';
  private adminUrl = '/admin/notification-rules';

  private async getPushServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    const directMatch = await navigator.serviceWorker.getRegistration();
    if (directMatch && directMatch.active?.scriptURL?.includes('/push-sw.js')) {
      return directMatch;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.find((registration) => registration.active?.scriptURL?.includes('/push-sw.js')) || null;
  }

  async getWebPushStatus(): Promise<{
    supported: boolean;
    permission: NotificationPermission | 'unsupported';
    serviceWorkerRegistered: boolean;
    subscriptionActive: boolean;
    endpoint?: string;
  }> {
    if (typeof window === 'undefined') {
      return {
        supported: false,
        permission: 'unsupported',
        serviceWorkerRegistered: false,
        subscriptionActive: false,
      };
    }

    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    if (!supported) {
      return {
        supported: false,
        permission: 'unsupported',
        serviceWorkerRegistered: false,
        subscriptionActive: false,
      };
    }

    const registration = await this.getPushServiceWorkerRegistration();
    const serviceWorkerRegistered = !!registration;
    const subscription = registration ? await registration.pushManager.getSubscription() : null;

    return {
      supported,
      permission: Notification.permission,
      serviceWorkerRegistered,
      subscriptionActive: !!subscription,
      endpoint: subscription?.endpoint,
    };
  }

  private urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return buffer;
  }

  private async getWithFallback<T>(primary: string, fallback: string): Promise<T> {
    try {
      return await apiClient.get<T>(primary);
    } catch (error: any) {
      if (error?.status === 404 || error?.status === 405) {
        return apiClient.get<T>(fallback);
      }
      throw error;
    }
  }

  private async patchWithFallback(primary: string, fallback: string): Promise<void> {
    try {
      await apiClient.patch(primary);
    } catch (error: any) {
      if (error?.status === 404 || error?.status === 405) {
        await apiClient.patch(fallback);
        return;
      }
      throw error;
    }
  }

  private buildNotificationStreamUrl(): string {
    const base = resolveApiBaseUrl();
    const url = new URL(`${base}${this.baseUrl}/stream`);

    // EventSource does not support custom Authorization headers.
    // If backend accepts token query fallback, include it for token-auth environments.
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (token) {
        url.searchParams.set('token', token);
      }
    }

    return url.toString();
  }

  /**
   * Get user's notifications with optional filters
   */
  async getNotifications(
    filters?: NotificationFilters
  ): Promise<NotificationListResponse> {
    const params = new URLSearchParams();

    if (filters?.type) params.append('type', filters.type);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.read !== undefined)
      params.append('read', String(filters.read));
    if (filters?.form_code) params.append('form_code', filters.form_code);
    if (filters?.from_date) params.append('from_date', filters.from_date);
    if (filters?.to_date) params.append('to_date', filters.to_date);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    const response = await apiClient.get<NotificationListResponse>(url);
    return response;
  }

  /**
   * Get a specific notification by ID
   */
  async getNotification(id: string): Promise<NotificationDTO> {
    const response = await apiClient.get<{ notification: NotificationDTO }>(`${this.baseUrl}/${id}`);
    return response.notification;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/${id}/read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/read-all`);
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>(`${this.baseUrl}/unread-count`);
    return response.count;
  }

  /**
   * Get notification statistics (admin only)
   */
  async getStats(): Promise<NotificationStats> {
    const response = await this.getWithFallback<{ stats: NotificationStats }>(
      '/admin/notification-rules/stats',
      '/admin/notifications/stats'
    );
    return response.stats;
  }

  /**
   * Get user's notification preferences
   */
  async getPreferences(): Promise<NotificationPreference> {
    const response = await apiClient.get<{ preferences: NotificationPreference }>(`${this.baseUrl}/preferences`);
    return response.preferences;
  }

  /**
   * Update user's notification preferences
   */
  async updatePreferences(
    preferences: UpdatePreferencesRequest
  ): Promise<NotificationPreference> {
    const response = await apiClient.put<{ preferences: NotificationPreference }>(
      `${this.baseUrl}/preferences`,
      preferences
    );
    return response.preferences;
  }

  /**
   * Returns VAPID public key used by PushManager subscription.
   */
  async getWebPushPublicKey(): Promise<string> {
    const response = await apiClient.get<{ public_key: string }>(`${this.baseUrl}/push/public-key`);
    return response.public_key;
  }

  /**
   * Save browser push subscription on backend.
   */
  async saveWebPushSubscription(subscription: PushSubscription): Promise<void> {
    await apiClient.post(`${this.baseUrl}/push/subscriptions`, subscription.toJSON());
  }

  /**
   * Remove browser push subscription from backend.
   */
  async deleteWebPushSubscription(endpoint: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/push/subscriptions?endpoint=${encodeURIComponent(endpoint)}`);
  }

  async sendTestWebPush(payload?: { title?: string; body?: string; url?: string }): Promise<void> {
    await apiClient.post(`${this.baseUrl}/push/test`, payload || {});
  }

  /**
   * Register service worker + push subscription for background browser notifications.
   */
  async ensureWebPushSubscription(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!('Notification' in window)) return;

    if (Notification.permission !== 'granted') return;

    const publicKey = await this.getWebPushPublicKey();
    if (!publicKey) return;

    let registration = await this.getPushServiceWorkerRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/push-sw.js');
    }

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToArrayBuffer(publicKey),
      });
    }

    await this.saveWebPushSubscription(subscription);
  }

  async enableWebPush(): Promise<{
    status: 'enabled' | 'blocked' | 'unsupported';
    permission: NotificationPermission | 'unsupported';
  }> {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { status: 'unsupported', permission: 'unsupported' };
    }

    if (Notification.permission === 'denied') {
      return { status: 'blocked', permission: Notification.permission };
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          status: permission === 'denied' ? 'blocked' : 'unsupported',
          permission,
        };
      }
    }

    if (Notification.permission === 'granted') {
      await this.ensureWebPushSubscription();
      return { status: 'enabled', permission: Notification.permission };
    }

    return { status: 'unsupported', permission: Notification.permission };
  }

  /**
   * Subscribe to real-time notifications via WebSocket/SSE
   */
  subscribeToNotifications(
    onNotification: (notification: NotificationDTO) => void,
    onError?: (error: Error) => void
  ): () => void {
    // Using EventSource for Server-Sent Events
    const eventSource = new EventSource(this.buildNotificationStreamUrl(), {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as NotificationDTO;
        onNotification(notification);
      } catch (error) {
        console.error('Failed to parse notification:', error);
        onError?.(error as Error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Notification stream error:', error);
      onError?.(new Error('Connection error'));
    };

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  }

  // ========================================================================
  // ADMIN ENDPOINTS - Notification Rule Management
  // ========================================================================

  /**
   * Get all notification rules (admin only)
   */
  async getAllRules(): Promise<NotificationRule[]> {
    const response = await apiClient.get<{ rules: NotificationRule[] }>(this.adminUrl);
    return response.rules;
  }

  /**
   * Get a specific notification rule (admin only)
   */
  async getRule(id: string): Promise<NotificationRule> {
    const response = await apiClient.get<{ rule: NotificationRule }>(`${this.adminUrl}/${id}`);
    return response.rule;
  }

  /**
   * Create a new notification rule (admin only)
   */
  async createRule(
    rule: CreateNotificationRuleRequest
  ): Promise<NotificationRule> {
    const response = await apiClient.post<{ rule: NotificationRule }>(this.adminUrl, rule);
    return response.rule;
  }

  /**
   * Update a notification rule (admin only)
   */
  async updateRule(
    id: string,
    rule: Partial<CreateNotificationRuleRequest>
  ): Promise<NotificationRule> {
    const response = await apiClient.put<{ rule: NotificationRule }>(`${this.adminUrl}/${id}`, rule);
    return response.rule;
  }

  /**
   * Delete a notification rule (admin only)
   */
  async deleteRule(id: string): Promise<void> {
    await apiClient.delete(`${this.adminUrl}/${id}`);
  }

  /**
   * Toggle notification rule active status (admin only)
   */
  async toggleRuleStatus(id: string): Promise<void> {
    await this.patchWithFallback(
      `${this.adminUrl}/${id}/status`,
      `/admin/notifications/rules/${id}/toggle`
    );
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
