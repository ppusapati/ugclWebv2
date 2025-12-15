/**
 * Analytics Service
 * Handles all analytics-related API operations including reports and dashboards
 */

import { apiClient } from './api-client';
import type {
  ReportDefinition,
  ReportListResponse,
  ReportResult,
  Dashboard,
  DashboardListResponse,
  FormTablesResponse,
  TableFieldsResponse,
  ReportSchedule,
  PaginationParams,
  AnalyticsFilterParams,
  ReportFilter,
  ExportFormat,
} from '../types/analytics';

class AnalyticsService {
  // ============================================================================
  // REPORT DEFINITIONS
  // ============================================================================

  /**
   * Get all report definitions with optional filters
   */
  async getReports(params?: PaginationParams & AnalyticsFilterParams): Promise<ReportListResponse> {
    return apiClient.get<ReportListResponse>('/reports/definitions', params);
  }

  /**
   * Get single report definition by ID
   */
  async getReportById(reportId: string): Promise<ReportDefinition> {
    return apiClient.get<ReportDefinition>(`/reports/definitions/${reportId}`);
  }

  /**
   * Create new report definition
   */
  async createReport(data: Partial<ReportDefinition>): Promise<{ report: ReportDefinition; message: string }> {
    return apiClient.post<{ report: ReportDefinition; message: string }>('/reports/definitions', data);
  }

  /**
   * Update report definition
   */
  async updateReport(reportId: string, data: Partial<ReportDefinition>): Promise<{ report: ReportDefinition; message: string }> {
    return apiClient.put<{ report: ReportDefinition; message: string }>(`/reports/definitions/${reportId}`, data);
  }

  /**
   * Delete report definition
   */
  async deleteReport(reportId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/reports/definitions/${reportId}`);
  }

  /**
   * Clone report definition
   */
  async cloneReport(reportId: string, newName?: string): Promise<{ report: ReportDefinition; message: string }> {
    return apiClient.post<{ report: ReportDefinition; message: string }>(`/reports/definitions/${reportId}/clone`, {
      name: newName,
    });
  }

  /**
   * Toggle report favorite status
   */
  async toggleFavorite(reportId: string): Promise<{ report: ReportDefinition; message: string }> {
    return apiClient.post<{ report: ReportDefinition; message: string }>(`/reports/definitions/${reportId}/favorite`);
  }

  // ============================================================================
  // REPORT EXECUTION
  // ============================================================================

  /**
   * Execute report and get results
   */
  async executeReport(
    reportId: string,
    filters?: ReportFilter[],
    params?: PaginationParams
  ): Promise<{ report: ReportDefinition; result: ReportResult; message?: string }> {
    return apiClient.post<{ report: ReportDefinition; result: ReportResult; message?: string }>(
      `/reports/definitions/${reportId}/execute`,
      {
        filters,
        ...params,
      }
    );
  }

  /**
   * Preview report with temporary configuration
   */
  async previewReport(reportConfig: Partial<ReportDefinition>): Promise<{ result: ReportResult; message: string }> {
    return apiClient.post<{ result: ReportResult; message: string }>('/reports/preview', reportConfig);
  }

  // ============================================================================
  // REPORT EXPORT
  // ============================================================================

  /**
   * Export report to specified format
   */
  async exportReport(
    reportId: string,
    format: ExportFormat,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _filters?: ReportFilter[]
  ): Promise<Blob> {
    const filename = `report-${reportId}-${new Date().toISOString().split('T')[0]}.${format}`;
    return apiClient.download(`/reports/definitions/${reportId}/export?format=${format}`, filename);
  }

  /**
   * Email report to recipients
   */
  async emailReport(reportId: string, recipients: string[], format: ExportFormat): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/reports/definitions/${reportId}/email`, {
      recipients,
      format,
    });
  }

  // ============================================================================
  // REPORT SCHEDULES
  // ============================================================================

  /**
   * Get report schedules
   */
  async getReportSchedules(reportId?: string): Promise<{ schedules: ReportSchedule[] }> {
    const endpoint = reportId ? `/reports/schedules?report_id=${reportId}` : '/reports/schedules';
    return apiClient.get<{ schedules: ReportSchedule[] }>(endpoint);
  }

  /**
   * Create report schedule
   */
  async createReportSchedule(data: Partial<ReportSchedule>): Promise<{ schedule: ReportSchedule; message: string }> {
    return apiClient.post<{ schedule: ReportSchedule; message: string }>('/reports/schedules', data);
  }

  /**
   * Update report schedule
   */
  async updateReportSchedule(
    scheduleId: string,
    data: Partial<ReportSchedule>
  ): Promise<{ schedule: ReportSchedule; message: string }> {
    return apiClient.put<{ schedule: ReportSchedule; message: string }>(`/reports/schedules/${scheduleId}`, data);
  }

  /**
   * Delete report schedule
   */
  async deleteReportSchedule(scheduleId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/reports/schedules/${scheduleId}`);
  }

  // ============================================================================
  // FORM TABLES (for Report Builder)
  // ============================================================================

  /**
   * Get available form tables for report building
   */
  async getFormTables(): Promise<FormTablesResponse> {
    return apiClient.get<FormTablesResponse>('/reports/forms/tables');
  }

  /**
   * Get fields for a specific form table
   */
  async getTableFields(tableName: string): Promise<TableFieldsResponse> {
    return apiClient.get<TableFieldsResponse>(`/reports/forms/tables/${tableName}/fields`);
  }

  // ============================================================================
  // DASHBOARDS
  // ============================================================================

  /**
   * Get all dashboards with optional filters
   */
  async getDashboards(params?: PaginationParams & AnalyticsFilterParams): Promise<DashboardListResponse> {
    return apiClient.get<DashboardListResponse>('/dashboards', params);
  }

  /**
   * Get single dashboard by ID
   */
  async getDashboardById(dashboardId: string): Promise<Dashboard> {
    return apiClient.get<Dashboard>(`/dashboards/${dashboardId}`);
  }

  /**
   * Create new dashboard
   */
  async createDashboard(data: Partial<Dashboard>): Promise<{ dashboard: Dashboard; message: string }> {
    return apiClient.post<{ dashboard: Dashboard; message: string }>('/dashboards', data);
  }

  /**
   * Update dashboard
   */
  async updateDashboard(dashboardId: string, data: Partial<Dashboard>): Promise<{ dashboard: Dashboard; message: string }> {
    return apiClient.put<{ dashboard: Dashboard; message: string }>(`/dashboards/${dashboardId}`, data);
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(dashboardId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/dashboards/${dashboardId}`);
  }

  /**
   * Clone dashboard
   */
  async cloneDashboard(dashboardId: string, newName?: string): Promise<{ dashboard: Dashboard; message: string }> {
    return apiClient.post<{ dashboard: Dashboard; message: string }>(`/dashboards/${dashboardId}/clone`, {
      name: newName,
    });
  }

  /**
   * Set dashboard as default
   */
  async setDefaultDashboard(dashboardId: string): Promise<{ dashboard: Dashboard; message: string }> {
    return apiClient.post<{ dashboard: Dashboard; message: string }>(`/dashboards/${dashboardId}/set-default`);
  }

  /**
   * Execute all widgets in a dashboard
   */
  async executeDashboard(dashboardId: string): Promise<{ results: Record<string, ReportResult>; message: string }> {
    return apiClient.post<{ results: Record<string, ReportResult>; message: string }>(
      `/dashboards/${dashboardId}/execute`
    );
  }

  // ============================================================================
  // DASHBOARD WIDGETS
  // ============================================================================

  /**
   * Add widget to dashboard
   */
  async addWidget(
    dashboardId: string,
    widget: Partial<Dashboard['widgets'][0]>
  ): Promise<{ dashboard: Dashboard; message: string }> {
    return apiClient.post<{ dashboard: Dashboard; message: string }>(`/dashboards/${dashboardId}/widgets`, widget);
  }

  /**
   * Update widget in dashboard
   */
  async updateWidget(
    dashboardId: string,
    widgetId: string,
    widget: Partial<Dashboard['widgets'][0]>
  ): Promise<{ dashboard: Dashboard; message: string }> {
    return apiClient.put<{ dashboard: Dashboard; message: string }>(
      `/dashboards/${dashboardId}/widgets/${widgetId}`,
      widget
    );
  }

  /**
   * Remove widget from dashboard
   */
  async removeWidget(dashboardId: string, widgetId: string): Promise<{ dashboard: Dashboard; message: string }> {
    return apiClient.delete<{ dashboard: Dashboard; message: string }>(
      `/dashboards/${dashboardId}/widgets/${widgetId}`
    );
  }

  /**
   * Update dashboard layout (widget positions)
   */
  async updateDashboardLayout(
    dashboardId: string,
    layout: Dashboard['widgets']
  ): Promise<{ dashboard: Dashboard; message: string }> {
    return apiClient.put<{ dashboard: Dashboard; message: string }>(`/dashboards/${dashboardId}/layout`, { layout });
  }

  // ============================================================================
  // CATEGORIES & TAGS
  // ============================================================================

  /**
   * Get all report categories
   */
  async getReportCategories(): Promise<{ categories: string[] }> {
    return apiClient.get<{ categories: string[] }>('/reports/categories');
  }

  /**
   * Get all report tags
   */
  async getReportTags(): Promise<{ tags: string[] }> {
    return apiClient.get<{ tags: string[] }>('/reports/tags');
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get report type display name
   */
  getReportTypeDisplay(reportType: string): string {
    const types: Record<string, string> = {
      table: 'Table Report',
      chart: 'Chart Report',
      kpi: 'KPI Dashboard',
      pivot: 'Pivot Table',
    };
    return types[reportType] || reportType;
  }

  /**
   * Get chart type display name
   */
  getChartTypeDisplay(chartType: string): string {
    const types: Record<string, string> = {
      bar: 'Bar Chart',
      line: 'Line Chart',
      pie: 'Pie Chart',
      doughnut: 'Doughnut Chart',
      area: 'Area Chart',
      scatter: 'Scatter Plot',
    };
    return types[chartType] || chartType;
  }

  /**
   * Format report filter for display
   */
  formatFilterDisplay(filter: ReportFilter): string {
    const operators: Record<string, string> = {
      eq: '=',
      ne: '≠',
      gt: '>',
      gte: '≥',
      lt: '<',
      lte: '≤',
      like: 'contains',
      in: 'in',
      between: 'between',
      this_month: 'this month',
      this_week: 'this week',
      this_year: 'this year',
      last_month: 'last month',
      last_week: 'last week',
      last_year: 'last year',
    };

    const op = operators[filter.operator] || filter.operator;
    return `${filter.field_name} ${op} ${filter.value}`;
  }
}

export const analyticsService = new AnalyticsService();
export { AnalyticsService };
