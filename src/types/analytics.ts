/**
 * Analytics Types
 * Types for reports, dashboards, and analytics data structures
 */

// Base types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Report Types
export type ReportType = 'table' | 'chart' | 'kpi' | 'pivot';
export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter';
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between' | 'this_month' | 'this_week' | 'this_year' | 'last_month' | 'last_week' | 'last_year';
export type LogicalOperator = 'AND' | 'OR';
export type AggregateFunction = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
export type SortDirection = 'ASC' | 'DESC';

export interface ChartAxisConfig {
  field?: string;
  label?: string;
  date_grouping?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface ChartSeriesConfig {
  field: string;
  label?: string;
  aggregate: AggregateFunction;
  color?: string;
}

export interface ChartAppearanceConfig {
  show_legend: boolean;
  legend_position: 'top' | 'bottom' | 'left' | 'right';
  show_data_labels: boolean;
  show_grid_lines: boolean;
  color_palette: string;
  stacked: boolean;
  stacked_100: boolean;
}

export interface ChartConfig {
  x_axis?: ChartAxisConfig;
  y_axis?: ChartAxisConfig;
  series?: ChartSeriesConfig[];
  group_by?: string;
  appearance?: ChartAppearanceConfig;
  title?: string;
  subtitle?: string;
  kpi?: {
    metric_field: string;
    aggregation: string;
    breakout_field?: string;
    target?: number;
    comparison_mode?: string;
  };
}

export interface DataSource {
  alias: string;
  table_name: string;
  form_code?: string;
  form_id?: string;
  join_type?: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  join_on?: string;
}

export interface ReportField {
  field_name: string;
  alias: string;
  data_source: string;
  data_type?: string;
  aggregate?: AggregateFunction;
  aggregation?: AggregateFunction;
  is_visible: boolean;
  order: number;
  format?: string;
  options_source?: string;
}

export interface ReportFilter {
  field_name: string;
  data_source: string;
  operator: FilterOperator;
  value: any;
  logical_op: LogicalOperator;
  group?: number;
}

export interface ReportSort {
  field_name: string;
  data_source: string;
  direction: SortDirection;
  order: number;
}

export interface ReportGrouping {
  field_name: string;
  data_source: string;
  order: number;
}

export interface ReportAggregation {
  field_name: string;
  data_source: string;
  function: AggregateFunction;
  alias?: string;
}

export interface ReportDefinition extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  business_vertical_id: string;
  report_type: ReportType;
  data_sources: DataSource[];
  fields: ReportField[];
  filters: ReportFilter[];
  sorting: ReportSort[];
  groupings?: ReportGrouping[];
  aggregations?: ReportAggregation[];
  chart_type?: ChartType;
  chart_config?: ChartConfig;
  is_favorite?: boolean;
  category?: string;
  tags?: string[];
  is_public?: boolean;
  allowed_roles?: string[];
  permissions?: Record<string, any>;
}

export interface ReportHeader {
  key: string;
  label: string;
  data_type?: string;
  format?: string;
}

export interface ReportMetadata {
  total_rows: number;
  execution_time_ms: number;
  generated_at: string;
  filters_applied?: ReportFilter[];
  page?: number;
  page_size?: number;
}

export interface ReportResult {
  headers: ReportHeader[];
  data: any[];
  metadata: ReportMetadata;
  chart_data?: any;
}

export interface ReportListResponse {
  reports: ReportDefinition[];
  total?: number;
  page?: number;
  page_size?: number;
}

export interface ReportTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  template?: Record<string, any>;
  usage_count?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReportTemplateListResponse {
  templates: ReportTemplate[];
  count?: number;
}

export interface CreateReportTemplateRequest {
  report_id?: string;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  icon?: string;
  template?: Record<string, any>;
}

export interface UpdateReportTemplateRequest {
  name?: string;
  code?: string;
  description?: string;
  category?: string;
  icon?: string;
  is_active?: boolean;
  template?: Record<string, any>;
}

// Dashboard Types
export type WidgetType = 'chart' | 'table' | 'kpi' | 'text' | 'iframe';
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  report_id?: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config?: Record<string, any>;
  refresh_interval?: number;
}

export interface Dashboard extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  business_vertical_id: string;
  widgets: DashboardWidget[];
  layout?: Record<string, any>;
  is_default?: boolean;
  is_public?: boolean;
  permissions?: Record<string, any>;
  tags?: string[];
}

export interface DashboardListResponse {
  dashboards: Dashboard[];
  total?: number;
  page?: number;
  page_size?: number;
}

// Form Table Types (for report builder)
export interface FormTable {
  table_name: string;
  form_code: string;
  form_id: string;
  form_title: string;
  record_count?: number;
}

export interface TableField {
  name: string;
  type: string;
  label?: string;
  is_required?: boolean;
  is_unique?: boolean;
}

export interface FormTablesResponse {
  tables: FormTable[];
}

export interface TableFieldsResponse {
  fields: TableField[];
}

// Export & Scheduling Types
export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json';
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface ReportExportRequest {
  report_id: string;
  format: ExportFormat;
  filters?: ReportFilter[];
  email?: string;
}

export interface ReportSchedule extends BaseEntity {
  report_id: string;
  name: string;
  frequency: ScheduleFrequency;
  cron_expression?: string;
  format: ExportFormat;
  recipients: string[];
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
}

// Query Builder Types
export interface QueryBuilderState {
  dataSources: DataSource[];
  selectedFields: ReportField[];
  filters: ReportFilter[];
  sorting: ReportSort[];
  groupBy: string[];
  having: ReportFilter[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination & Filters
export interface PaginationParams {
  page?: number;
  page_size?: number;
  limit?: number;
  offset?: number;
}

export interface AnalyticsFilterParams {
  business_vertical_id?: string;
  category?: string;
  report_type?: ReportType;
  is_favorite?: boolean;
  is_public?: boolean;
  tags?: string[];
  search?: string;
}
