/**
 * Project Management Type Definitions
 * Matches backend models from models/project.go
 */

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  business_vertical_id: string;
  business_vertical?: BusinessVertical;

  // File information
  kmz_file_name?: string;
  kmz_file_path?: string;
  kmz_uploaded_at?: string;

  // GeoJSON data
  geojson_data?: any;

  // Timeline
  start_date?: string;
  end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;

  // Budget
  total_budget: number;
  allocated_budget: number;
  spent_budget: number;
  currency: string;

  // Status
  status: ProjectStatus;
  progress: number;

  // Workflow
  workflow_id?: string;

  // Metadata
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relationships
  zones?: Zone[];
  tasks?: Task[];
  budget_allocations?: BudgetAllocation[];
}

export type ProjectStatus = 'draft' | 'active' | 'on-hold' | 'completed' | 'cancelled';

export interface Zone {
  id: string;
  project_id: string;
  project?: Project;

  name: string;
  code?: string;
  description?: string;
  label?: string;

  // Geometry (PostGIS)
  geometry?: string;
  centroid?: string;
  area?: number;

  // GeoJSON representation
  geojson?: any;
  properties?: any;

  // Metadata
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relationships
  nodes?: Node[];
}

export interface Node {
  id: string;
  zone_id: string;
  zone?: Zone;
  project_id: string;
  project?: Project;

  name: string;
  code?: string;
  description?: string;
  label?: string;
  node_type: NodeType;

  // Location
  location: string;
  latitude: number;
  longitude: number;
  elevation?: number;

  // GeoJSON representation
  geojson?: any;
  properties?: any;

  // Status
  status: NodeStatus;

  // Metadata
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export type NodeType = 'start' | 'stop' | 'waypoint';
export type NodeStatus = 'available' | 'allocated' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  code: string;
  title: string;
  description?: string;

  // Project context
  project_id: string;
  project?: Project;
  zone_id?: string;
  zone?: Zone;

  // Node references
  start_node_id: string;
  start_node?: Node;
  stop_node_id: string;
  stop_node?: Node;

  // Timeline
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;

  // Budget
  allocated_budget: number;
  labor_cost: number;
  material_cost: number;
  equipment_cost: number;
  other_cost: number;
  total_cost: number;

  // Status and progress
  status: TaskStatus;
  progress: number;
  priority: TaskPriority;

  // Workflow
  workflow_id?: string;
  current_state?: string;

  // Form submission
  form_submission_id?: string;

  // Additional data
  metadata?: any;

  // Metadata
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relationships
  assignments?: TaskAssignment[];
  audit_logs?: TaskAuditLog[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
}

export type TaskStatus = 'pending' | 'assigned' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskAssignment {
  id: string;
  task_id: string;
  task?: Task;

  // User assignment
  user_id: string;
  user_name?: string;
  user_type: UserType;
  role: AssignmentRole;

  // Assignment details
  assigned_by: string;
  assigned_at: string;
  start_date?: string;
  end_date?: string;

  // Status
  status: AssignmentStatus;
  is_active: boolean;

  // Permissions
  can_edit: boolean;
  can_approve: boolean;

  // Metadata
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export type UserType = 'employee' | 'contractor' | 'supervisor';
export type AssignmentRole = 'worker' | 'supervisor' | 'manager' | 'approver';
export type AssignmentStatus = 'active' | 'inactive' | 'completed';

export interface BudgetAllocation {
  id: string;

  // Project or Task reference
  project_id?: string;
  project?: Project;
  task_id?: string;
  task?: Task;

  // Budget details
  category: BudgetCategory;
  description?: string;
  planned_amount: number;
  actual_amount: number;
  currency: string;

  // Timeline
  allocation_date: string;
  start_date?: string;
  end_date?: string;

  // Status
  status: BudgetStatus;

  // Approval
  approved_by?: string;
  approved_at?: string;

  // Metadata
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export type BudgetCategory = 'labor' | 'material' | 'equipment' | 'overhead' | 'contingency';
export type BudgetStatus = 'allocated' | 'in-use' | 'spent' | 'cancelled';

export interface TaskAuditLog {
  id: string;
  task_id: string;
  task?: Task;

  // Change details
  action: AuditAction;
  field?: string;
  old_value?: string;
  new_value?: string;

  // Actor information
  performed_by: string;
  performed_by_name?: string;
  role?: string;

  // Additional context
  comment?: string;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;

  // Timestamp
  performed_at: string;
  created_at: string;
}

export type AuditAction = 'created' | 'updated' | 'status_changed' | 'assigned' | 'approved' | 'rejected';

export interface TaskComment {
  id: string;
  task_id: string;
  task?: Task;

  // Comment details
  comment: string;
  comment_type: CommentType;

  // Author
  author_id: string;
  author_name?: string;

  // Parent comment (for replies)
  parent_id?: string;
  parent?: TaskComment;

  // Metadata
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export type CommentType = 'general' | 'update' | 'issue' | 'resolution';

export interface TaskAttachment {
  id: string;
  task_id: string;
  task?: Task;

  // File details
  file_name: string;
  file_path: string;
  file_size: number;
  file_type?: string;
  mime_type?: string;

  // Attachment metadata
  attachment_type: AttachmentType;
  description?: string;

  // Uploader
  uploaded_by: string;
  uploaded_by_name?: string;

  // Metadata
  created_at: string;
  deleted_at?: string;
}

export type AttachmentType = 'document' | 'image' | 'video' | 'other';

export interface BusinessVertical {
  id: string;
  name: string;
  code: string;
  description?: string;
}

// API Request/Response Types
export interface CreateProjectRequest {
  code: string;
  name: string;
  description?: string;
  business_vertical_id: string;
  start_date?: string;
  end_date?: string;
  total_budget?: number;
  currency?: string;
}

export interface UploadKMZRequest {
  project_id: string;
  file: File;
}

export interface CreateTaskRequest {
  code: string;
  title: string;
  description?: string;
  project_id: string;
  zone_id?: string;
  start_node_id: string;
  stop_node_id: string;
  planned_start_date?: string;
  planned_end_date?: string;
  allocated_budget?: number;
  priority?: TaskPriority;
}

export interface AssignTaskRequest {
  user_id: string;
  user_type: UserType;
  role: AssignmentRole;
  start_date?: string;
  end_date?: string;
  can_edit?: boolean;
  can_approve?: boolean;
  notes?: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
  progress?: number;
  comment?: string;
}

export interface CreateBudgetAllocationRequest {
  project_id?: string;
  task_id?: string;
  category: BudgetCategory;
  description?: string;
  planned_amount: number;
  currency?: string;
  allocation_date?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface ProjectStats {
  total_zones: number;
  total_nodes: number;
  total_tasks: number;
  tasks_by_status: Record<TaskStatus, number>;
  total_budget: number;
  allocated_budget: number;
  spent_budget: number;
  budget_utilization: number;
  completion_percentage: number;
}

export interface ProjectListResponse {
  projects: Project[];
  count: number;
  total?: number;
  page?: number;
  page_size?: number;
}

export interface TaskListResponse {
  tasks: Task[];
  count: number;
  total?: number;
}

export interface BudgetSummary {
  project_id?: string;
  task_id?: string;
  total_budget: number;
  allocated_budget: number;
  spent_budget: number;
  remaining_budget: number;
  budget_utilization: number;
  category_breakdown: CategoryBreakdown[];
  task_budgets?: TaskBudget[];
  total_planned: number;
  total_actual: number;
  variance: number;
}

export interface CategoryBreakdown {
  category: BudgetCategory;
  planned_amount: number;
  actual_amount: number;
}

export interface TaskBudget {
  task_id: string;
  task_title: string;
  allocated_budget: number;
  total_cost: number;
}

// GeoJSON Types for map visualization
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    name?: string;
    label?: string;
    type?: string;
    [key: string]: any;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}
