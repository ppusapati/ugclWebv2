import { apiClient } from './api-client';
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
  private adminUrl = '/admin/notifications/rules';

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
    const response = await apiClient.get<{ stats: NotificationStats }>('/admin/notifications/stats');
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
   * Subscribe to real-time notifications via WebSocket/SSE
   */
  subscribeToNotifications(
    onNotification: (notification: NotificationDTO) => void,
    onError?: (error: Error) => void
  ): () => void {
    // Using EventSource for Server-Sent Events
    const eventSource = new EventSource(`${this.baseUrl}/stream`);

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
    await apiClient.patch(`${this.adminUrl}/${id}/toggle`);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
