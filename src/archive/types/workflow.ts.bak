// src/types/workflow.ts
/**
 * Type definitions for workflow and form builder system
 */

// ============================================================================
// Form Builder Types
// ============================================================================

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'datetime'
  | 'time'
  | 'radio'
  | 'checkbox'
  | 'dropdown'
  | 'file_upload'
  | 'signature'
  | 'select'
  | 'location';

export interface FieldOption {
  label: string;
  value: string | number;
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minDate?: string;
  maxDate?: string;
  message?: string;
}

export interface VisibilityCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
  hint?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
  visible?: VisibilityCondition;

  // For API-driven dropdowns
  dataSource?: 'static' | 'api';
  apiEndpoint?: string;
  displayField?: string;
  valueField?: string;

  // For file uploads
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizePerFile?: number;

  // For number fields
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  prefix?: string;

  // For text fields
  rows?: number;
  maxLength?: number;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface CrossFieldValidation {
  rule: string;
  fields: string[];
  condition: string;
  message: string;
}

export interface FormValidations {
  cross_field?: CrossFieldValidation[];
}

export interface WorkflowConfig {
  initial_state: string;
  states: string[];
  transitions: WorkflowTransitionDef[];
}

export interface FormPermissions {
  create?: string;
  read?: string;
  update?: string;
  delete?: string;
  approve?: string;
}

export interface UIConfig {
  show_progress?: boolean;
  allow_save_draft?: boolean;
  submit_button_text?: string;
  success_message?: string;
  error_message?: string;
}

export interface FormDefinition {
  form_code: string;
  title: string;
  description?: string;
  version: string;
  module: string; // Module ID (UUID)
  accessible_verticals?: string[]; // Array of business vertical IDs
  type: 'single_page' | 'multi_step';
  steps: FormStep[];
  validations?: FormValidations;
  workflow?: WorkflowConfig;
  permissions?: FormPermissions;
  ui_config?: UIConfig;
}

// ============================================================================
// Workflow Types
// ============================================================================

export interface WorkflowState {
  code: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_final?: boolean;
}

export interface WorkflowTransitionDef {
  from: string;
  to: string;
  action: string;
  label?: string;
  permission?: string;
  requires_comment?: boolean;
  notifications?: TransitionNotification[];
}

// Import notification types
import type { NotificationRecipientDef, TransitionNotification } from './notification';

export interface WorkflowDefinition {
  id: string;
  code: string;
  name: string;
  description?: string;
  version: string;
  initial_state: string;
  states: WorkflowState[];
  transitions: WorkflowTransitionDef[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowAction {
  action: string;
  label: string;
  to_state: string;
  requires_comment: boolean;
  permission?: string;
}

// ============================================================================
// Form Submission Types
// ============================================================================

export interface FormSubmission {
  id: string;
  form_code: string;
  form_title?: string;
  business_vertical_id: string;
  site_id?: string;
  current_state: string;
  form_data: Record<string, any>;
  submitted_by: string;
  submitted_at: string;
  last_modified_by?: string;
  last_modified_at?: string;
  available_actions?: WorkflowAction[];
}

export interface WorkflowTransition {
  id: string;
  submission_id: string;
  from_state: string;
  to_state: string;
  action: string;
  actor_id: string;
  actor_name?: string;
  actor_role?: string;
  comment?: string;
  metadata?: Record<string, any>;
  transitioned_at: string;
  created_at: string;
}

export interface TransitionRequest {
  action: string;
  comment?: string;
  metadata?: Record<string, any>;
}

export interface SubmissionFilters {
  state?: string;
  site_id?: string;
  my_submissions?: boolean;
}

export interface WorkflowStats {
  form_code: string;
  stats: Record<string, number>;
}

// ============================================================================
// App Form (Backend Model)
// ============================================================================

export interface Module {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  route?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppForm {
  id: string;
  code: string;
  title: string;
  description?: string;
  version: string;
  module_id: string; // UUID of the module
  module?: Module; // Populated by backend when fetching
  route: string;
  icon?: string;
  display_order: number;
  required_permission?: string;
  allowed_roles?: string[];
  accessible_verticals: string[];
  form_schema?: Record<string, any>;
  steps?: FormStep[];
  core_fields?: any[];
  validations?: Record<string, any>;
  dependencies?: any[];
  workflow_id?: string;
  initial_state?: string;
  table_name?: string;
  schema_version: number;
  is_active: boolean;
  audit: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AppFormDTO {
  code: string;
  title: string;
  description?: string;
  module: string;
  route: string;
  icon?: string;
  required_permission?: string;
  accessible_verticals: string[];
  display_order: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface FormBuilderResponse {
  message: string;
  form: AppForm;
}

export interface WorkflowResponse {
  message: string;
  workflow: WorkflowDefinition;
}

export interface SubmissionResponse {
  message: string;
  submission: FormSubmission;
}

export interface SubmissionListResponse {
  submissions: FormSubmission[];
  count: number;
}

export interface WorkflowHistoryResponse {
  history: WorkflowTransition[];
  count: number;
}

export interface FormsListResponse {
  forms: AppFormDTO[];
  modules?: Record<string, AppFormDTO[]>;
}

export interface ModulesResponse {
  modules: Module[];
  count: number;
}
