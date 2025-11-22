// src/types/abac.ts
/**
 * Shared TypeScript interfaces for ABAC (Attribute-Based Access Control)
 */

// ============================================================================
// Policy Types
// ============================================================================

export type PolicyEffect = 'ALLOW' | 'DENY';
export type PolicyStatus = 'active' | 'inactive' | 'draft' | 'archived';

export interface Policy {
  id: string;
  name: string;
  display_name: string;
  description: string;
  effect: PolicyEffect;
  priority: number;
  status: PolicyStatus;
  business_vertical_id?: string;
  business_vertical?: {
    id: string;
    name: string;
    code: string;
  };
  resources: string[];
  actions: string[];
  conditions: PolicyCondition[];
  subjects: PolicySubject[];
  context?: Record<string, any>;
  version: number;
  created_at: string;
  updated_at: string;
  created_by?: User;
  updated_by?: User;
}

export interface PolicyCondition {
  attribute: string;
  operator: ConditionOperator;
  value: any;
  logical_operator?: 'AND' | 'OR';
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'in'
  | 'not_in'
  | 'between'
  | 'matches_regex';

export interface PolicySubject {
  type: 'user' | 'group' | 'role' | 'service';
  id?: string;
  attributes?: Record<string, any>;
}

export interface PolicyStats {
  by_status: Array<{ status: string; count: number }>;
  by_effect: Array<{ effect: string; count: number }>;
  total_evaluations: number;
  evaluations_last_24h: number;
}

// ============================================================================
// Policy Evaluation Types
// ============================================================================

export interface PolicyEvaluationRequest {
  subject: {
    id?: string;
    type?: string;
    attributes?: Record<string, any>;
  };
  action: string;
  resource: string;
  context?: Record<string, any>;
}

export interface PolicyEvaluationResult {
  result: PolicyEffect;
  matched_policies: Array<{
    id: string;
    name: string;
    effect: PolicyEffect;
    priority: number;
  }>;
  evaluation_time_ms: number;
  timestamp: string;
  details?: {
    conditions_evaluated?: number;
    conditions_passed?: number;
    reason?: string;
  };
}

export interface PolicyEvaluation {
  id: string;
  result: PolicyEffect;
  executed_at: string;
  execution_time_ms: number;
  subject: any;
  action: string;
  resource: string;
}

// ============================================================================
// Attribute Types
// ============================================================================

export type AttributeDataType = 'string' | 'number' | 'boolean' | 'date' | 'json';

export interface Attribute {
  id: string;
  name: string;
  display_name: string;
  description: string;
  data_type: AttributeDataType;
  category: string;
  is_required: boolean;
  is_system: boolean;
  default_value?: any;
  validation_rules?: AttributeValidationRules;
  created_at: string;
  updated_at: string;
}

export interface AttributeValidationRules {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
  custom?: string;
}

export interface UserAttribute {
  attribute_id: string;
  attribute: Attribute;
  value: any;
  assigned_at: string;
  assigned_by?: User;
}

// ============================================================================
// Approval Types
// ============================================================================

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ApprovalRequestType = 'policy_create' | 'policy_update' | 'policy_delete' | 'attribute_assign' | 'role_assign';

export interface ApprovalRequest {
  id: string;
  type: ApprovalRequestType;
  status: ApprovalStatus;
  requested_by: User;
  requested_at: string;
  reviewed_by?: User;
  reviewed_at?: string;
  review_comment?: string;
  resource_type: string;
  resource_id: string;
  changes: any;
  metadata?: Record<string, any>;
}

// ============================================================================
// Audit Types
// ============================================================================

export type AuditAction = 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'evaluate' | 'assign' | 'revoke';

export interface AuditLog {
  id: string;
  action: AuditAction;
  resource_type: string;
  resource_id: string;
  user: User;
  changes?: {
    before?: any;
    after?: any;
  };
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface PolicyAnalytics {
  total_policies: number;
  active_policies: number;
  total_evaluations: number;
  evaluations_by_result: {
    allow: number;
    deny: number;
  };
  avg_evaluation_time_ms: number;
  most_used_policies: Array<{
    policy_id: string;
    policy_name: string;
    evaluation_count: number;
  }>;
  evaluation_trends: Array<{
    date: string;
    allow_count: number;
    deny_count: number;
  }>;
}

// ============================================================================
// Version History Types
// ============================================================================

export interface PolicyVersion {
  id: string;
  policy_id: string;
  version: number;
  changes: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  changed_by: User;
  changed_at: string;
  comment?: string;
}

// ============================================================================
// Common User Type (reused across interfaces)
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

// ============================================================================
// Form Types
// ============================================================================

export interface PolicyFormData {
  name: string;
  display_name: string;
  description: string;
  effect: PolicyEffect;
  priority: number;
  status: PolicyStatus;
  business_vertical_id?: string;
  resources: string[];
  actions: string[];
  conditions: PolicyCondition[];
  subjects: PolicySubject[];
  context?: Record<string, any>;
}

export interface AttributeFormData {
  name: string;
  display_name: string;
  description: string;
  data_type: AttributeDataType;
  category: string;
  is_required: boolean;
  default_value?: any;
  validation_rules?: AttributeValidationRules;
}
