// src/services/types.ts
/**
 * Common types used across all services
 */

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_super_admin?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  business_roles?: BusinessRole[];
  permissions?: string[];
  tenants?: any[]; // For multi-tenant support
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
}

// ============================================================================
// BUSINESS VERTICAL TYPES
// ============================================================================

export interface BusinessVertical {
  id: string;
  name: string;
  code: string;
  description?: string;
  settings?: Record<string, any>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  access_type?: string;
  roles?: string[];
  permissions?: string[];
  user_count?: number;
  role_count?: number;
}

export interface CreateBusinessRequest {
  name: string;
  code: string;
  description?: string;
  settings?: Record<string, any>;
  is_active?: boolean;
}

export interface UpdateBusinessRequest {
  name?: string;
  description?: string;
  settings?: Record<string, any>;
  is_active?: boolean;
}

export interface BusinessContext {
  business: BusinessVertical;
  user_role: string;
  permissions: string[];
  is_admin: boolean;
}

// ============================================================================
// SITE TYPES
// ============================================================================

export interface Site {
  id: string;
  name: string;
  code: string;
  description?: string;
  business_vertical_id: string;
  business_vertical?: BusinessVertical;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSiteRequest {
  name: string;
  code: string;
  description?: string;
  business_vertical_id: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  is_active?: boolean;
}

export interface UpdateSiteRequest {
  name?: string;
  description?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  is_active?: boolean;
}

export interface SiteAccessPermission {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface UserSiteAccess {
  id: string;
  user_id: string;
  site_id: string;
  user?: User;
  site?: Site;
  permissions: SiteAccessPermission;
  granted_by?: string;
  granted_at?: string;
}

export interface AssignSiteAccessRequest {
  user_id: string;
  site_id: string;
  permissions: SiteAccessPermission;
}

// ============================================================================
// ROLE & PERMISSION TYPES
// ============================================================================

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  created_at?: string;
}

export interface Role {
  id: string;
  name: string;
  display_name?: string;
  description?: string;
  level: number;
  is_global: boolean;
  business_vertical_id?: string;
  permissions?: Permission[];
  user_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRoleRequest {
  name: string;
  display_name?: string;
  description?: string;
  level: number;
  is_global: boolean;
  business_vertical_id?: string;
  permission_ids?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  display_name?: string;
  description?: string;
  level?: number;
  permission_ids?: string[];
}

export interface BusinessRole {
  business_vertical_id: string;
  business_vertical?: BusinessVertical;
  roles: string[];
  permissions: string[];
  is_admin: boolean;
}

export interface AssignRoleRequest {
  user_id: string;
  role_id: string;
  business_vertical_id?: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface Module {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface AppForm {
  id: string;
  code: string;
  title: string;
  description?: string;
  module_id: string;
  module?: Module;
  schema: Record<string, any>;
  version: number;
  route?: string;
  icon?: string;
  required_permission?: string;
  accessible_verticals?: string[];
  display_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFormRequest {
  code: string;
  title: string;
  description?: string;
  module_id: string;
  schema: Record<string, any>;
  route?: string;
  icon?: string;
  required_permission?: string;
  accessible_verticals?: string[];
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateFormAccessRequest {
  vertical_ids: string[];
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface BaseReport {
  id: string;
  business_vertical_id?: string;
  site_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DprSiteReport extends BaseReport {
  date: string;
  shift?: string;
  supervisor?: string;
  workers_count?: number;
  work_description?: string;
  photos?: string[];
  remarks?: string;
}

export interface WaterTankerReport extends BaseReport {
  date: string;
  tanker_number: string;
  capacity: number;
  quantity_delivered: number;
  source?: string;
  destination?: string;
  driver_name?: string;
  delivery_time?: string;
}

export interface WrappingReport extends BaseReport {
  date: string;
  material_type: string;
  quantity: number;
  wrapped_by?: string;
  quality_check?: string;
  remarks?: string;
}

export interface EwayBill extends BaseReport {
  bill_number: string;
  date: string;
  from_location: string;
  to_location: string;
  vehicle_number: string;
  material_type: string;
  quantity: number;
  value: number;
  document_url?: string;
}

export interface MaterialReport extends BaseReport {
  date: string;
  material_name: string;
  material_type: string;
  quantity: number;
  unit: string;
  supplier?: string;
  rate?: number;
  total_amount?: number;
  remarks?: string;
}

export interface PaymentReport extends BaseReport {
  date: string;
  payment_type: string;
  amount: number;
  paid_to: string;
  payment_method: string;
  reference_number?: string;
  description?: string;
  receipt_url?: string;
}

export interface StockReport extends BaseReport {
  date: string;
  material_name: string;
  opening_stock: number;
  received: number;
  consumed: number;
  closing_stock: number;
  unit: string;
  remarks?: string;
}

export interface DairySiteReport extends BaseReport {
  date: string;
  milk_collection: number;
  quality_parameters?: Record<string, any>;
  temperature?: number;
  storage_status?: string;
  remarks?: string;
}

export interface MnrReport extends BaseReport {
  date: string;
  report_type: string;
  description: string;
  quantity?: number;
  value?: number;
  status?: string;
  remarks?: string;
}

export interface NmrVehicleReport extends BaseReport {
  date: string;
  vehicle_number: string;
  route: string;
  start_km: number;
  end_km: number;
  distance: number;
  fuel_consumed?: number;
  driver_name?: string;
  remarks?: string;
}

export interface ContractorReport extends BaseReport {
  date: string;
  contractor_name: string;
  work_type: string;
  work_description: string;
  workers_deployed?: number;
  completion_percentage?: number;
  amount_paid?: number;
  status?: string;
  remarks?: string;
}

export interface PaintingReport extends BaseReport {
  date: string;
  area_painted: number;
  paint_type: string;
  color: string;
  coats_applied: number;
  painter_name?: string;
  quality_check?: string;
  remarks?: string;
}

export interface DieselReport extends BaseReport {
  date: string;
  vehicle_number: string;
  quantity: number;
  rate: number;
  total_amount: number;
  odometer_reading?: number;
  pump_name?: string;
  bill_number?: string;
  remarks?: string;
}

export interface Task extends BaseReport {
  title: string;
  description: string;
  assigned_to?: string;
  priority: string;
  status: string;
  due_date?: string;
  completed_at?: string;
  attachments?: string[];
}

export interface VehicleLog extends BaseReport {
  date: string;
  vehicle_number: string;
  driver_name: string;
  start_time: string;
  end_time: string;
  start_km: number;
  end_km: number;
  purpose: string;
  fuel_consumed?: number;
  remarks?: string;
}

// ============================================================================
// KPI TYPES
// ============================================================================

export interface StockKPI {
  total_materials: number;
  low_stock_items: number;
  stock_value: number;
  movement_rate: number;
  trends?: Array<{ date: string; value: number }>;
}

export interface ContractorKPI {
  active_contractors: number;
  total_projects: number;
  completion_rate: number;
  average_performance: number;
  monthly_spending: number;
}

export interface DairySiteKPI {
  total_collection: number;
  average_quality: number;
  active_sites: number;
  quality_issues: number;
  trends?: Array<{ date: string; value: number }>;
}

export interface DieselKPI {
  total_consumption: number;
  total_cost: number;
  average_rate: number;
  vehicles_count: number;
  efficiency_score: number;
  trends?: Array<{ date: string; value: number }>;
}

// ============================================================================
// PAGINATION & FILTERING TYPES
// ============================================================================

export interface PaginationParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface FilterParams {
  search?: string;
  date_from?: string;
  date_to?: string;
  business_vertical_id?: string;
  site_id?: string;
  status?: string;
  [key: string]: any;
}

// ============================================================================
// FILE UPLOAD TYPES
// ============================================================================

export interface FileUploadResponse {
  file_url: string;
  filename: string;
  size: number;
  content_type: string;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface SuperAdminDashboard {
  total_businesses: number;
  total_users: number;
  active_users: number;
  total_roles: number;
  recent_activities?: Array<{
    id: string;
    user: string;
    action: string;
    timestamp: string;
  }>;
  business_stats?: Array<{
    business: BusinessVertical;
    user_count: number;
    report_count: number;
  }>;
}

export interface BusinessAnalytics {
  report_counts: Record<string, number>;
  user_activity: Array<{ date: string; count: number }>;
  site_distribution: Record<string, number>;
  timeline_data: Array<{ date: string; reports: number; users: number }>;
}
