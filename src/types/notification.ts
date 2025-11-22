// Notification system types for frontend

export type NotificationType =
  | 'workflow_transition'
  | 'form_submission'
  | 'form_assignment'
  | 'approval_required'
  | 'approval_approved'
  | 'approval_rejected'
  | 'task_assigned'
  | 'task_completed'
  | 'system_alert';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'web_push';

export type NotificationStatus = 'pending' | 'sent' | 'read' | 'failed' | 'archived';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export type RecipientType =
  | 'user'
  | 'role'
  | 'business_role'
  | 'permission'
  | 'attribute'
  | 'policy'
  | 'submitter'
  | 'approver'
  | 'field_value';

// Notification instance (what user receives)
export interface Notification {
  id: string;
  notification_rule_id?: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  action_url?: string;
  submission_id?: string;
  workflow_id?: string;
  transition_id?: string;
  form_code?: string;
  business_vertical_id?: string;
  metadata?: Record<string, any>;
  status: NotificationStatus;
  channel: NotificationChannel;
  sent_at?: string;
  read_at?: string;
  archived_at?: string;
  failed_reason?: string;
  group_key?: string;
  created_at: string;
  updated_at: string;
}

// Notification DTO for API responses
export interface NotificationDTO {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  action_url?: string;
  status: NotificationStatus;
  is_read: boolean;
  submission_id?: string;
  form_code?: string;
  metadata?: Record<string, any>;
  created_at: string;
  read_at?: string;
}

// Notification preferences
export interface NotificationPreference {
  id: string;
  user_id: string;
  enable_in_app: boolean;
  enable_email: boolean;
  enable_sms: boolean;
  enable_web_push: boolean;
  disabled_types: NotificationType[];
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string; // HH:MM
  quiet_hours_end?: string; // HH:MM
  digest_enabled: boolean;
  digest_frequency?: 'daily' | 'weekly';
  created_at: string;
  updated_at: string;
}

// Notification recipient definition (used in workflow config)
export interface NotificationRecipientDef {
  type: RecipientType;
  value?: string; // For user, permission, field_value
  role_id?: string;
  business_role_id?: string;
  permission_code?: string;
  attribute_query?: Record<string, any>;
  policy_id?: string;
}

// Transition notification configuration (embedded in workflow)
export interface TransitionNotification {
  recipients: NotificationRecipientDef[];
  title_template: string;
  body_template: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  condition?: Record<string, any>;
}

// Notification rule (admin configuration)
export interface NotificationRule {
  id: string;
  code: string;
  name: string;
  description?: string;
  workflow_id?: string;
  trigger_on_states: string[];
  trigger_on_actions: string[];
  priority: NotificationPriority;
  channels: NotificationChannel[];
  title_template: string;
  body_template: string;
  action_url?: string;
  email_subject?: string;
  email_template?: string;
  sms_template?: string;
  conditions?: Record<string, any>;
  is_active: boolean;
  batch_interval_minutes: number;
  deduplicate_key?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  recipients?: NotificationRecipient[];
}

// Notification recipient (part of notification rule)
export interface NotificationRecipient {
  id: string;
  notification_rule_id: string;
  user_id?: string;
  role_id?: string;
  business_role_id?: string;
  permission_code?: string;
  attribute_condition?: Record<string, any>;
  policy_id?: string;
  recipient_type: RecipientType;
  created_at: string;
  updated_at: string;
}

// API request types
export interface UpdatePreferencesRequest {
  enable_in_app?: boolean;
  enable_email?: boolean;
  enable_sms?: boolean;
  enable_web_push?: boolean;
  disabled_types?: NotificationType[];
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  digest_enabled?: boolean;
  digest_frequency?: 'daily' | 'weekly';
}

export interface CreateNotificationRuleRequest {
  code: string;
  name: string;
  description?: string;
  workflow_id?: string;
  trigger_on_states: string[];
  trigger_on_actions: string[];
  priority: NotificationPriority;
  channels: NotificationChannel[];
  title_template: string;
  body_template: string;
  action_url?: string;
  email_subject?: string;
  email_template?: string;
  sms_template?: string;
  conditions?: Record<string, any>;
  batch_interval_minutes?: number;
  deduplicate_key?: string;
  recipients: NotificationRecipientDef[];
}

// Notification list response
export interface NotificationListResponse {
  notifications: NotificationDTO[];
  count: number;
  unread_count: number;
  has_more: boolean;
}

// Notification stats
export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
  by_priority: Record<NotificationPriority, number>;
}

// Filter options for notifications list
export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  read?: boolean;
  form_code?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}
