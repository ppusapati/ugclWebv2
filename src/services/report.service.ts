// src/services/report.service.ts
/**
 * Report Management Service
 * Handles all 15 report types with generic CRUD operations
 */

import { apiClient } from './api-client';
import type {
  DprSiteReport,
  WaterTankerReport,
  WrappingReport,
  EwayBill,
  MaterialReport,
  PaymentReport,
  StockReport,
  DairySiteReport,
  MnrReport,
  NmrVehicleReport,
  ContractorReport,
  PaintingReport,
  DieselReport,
  Task,
  VehicleLog,
  PaginatedResponse,
  PaginationParams,
  FilterParams,
} from './types';

// Union type for all report types
export type ReportType =
  | DprSiteReport
  | WaterTankerReport
  | WrappingReport
  | EwayBill
  | MaterialReport
  | PaymentReport
  | StockReport
  | DairySiteReport
  | MnrReport
  | NmrVehicleReport
  | ContractorReport
  | PaintingReport
  | DieselReport
  | Task
  | VehicleLog;

// Report endpoint mapping
export const REPORT_ENDPOINTS = {
  dprsite: '/dprsite',
  water: '/water',
  wrapping: '/wrapping',
  eway: '/eway',
  material: '/material',
  payment: '/payment',
  stock: '/stock',
  dairysite: '/dairysite',
  mnr: '/mnr',
  nmr_vehicle: '/nmr_vehicle',
  contractor: '/contractor',
  painting: '/painting',
  diesel: '/diesel',
  tasks: '/tasks',
  vehiclelog: '/vehiclelog',
} as const;

export type ReportKey = keyof typeof REPORT_ENDPOINTS;

class ReportService {
  /**
   * Get all reports of a specific type
   */
  async getReports<T extends ReportType>(
    reportType: ReportKey,
    params?: PaginationParams & FilterParams
  ): Promise<PaginatedResponse<T>> {
    const endpoint = REPORT_ENDPOINTS[reportType];
    return apiClient.get<PaginatedResponse<T>>(endpoint, params);
  }

  /**
   * Get single report by ID
   */
  async getReportById<T extends ReportType>(
    reportType: ReportKey,
    reportId: string
  ): Promise<T> {
    const endpoint = REPORT_ENDPOINTS[reportType];
    return apiClient.get<T>(`${endpoint}/${reportId}`);
  }

  /**
   * Create new report
   */
  async createReport<T extends ReportType>(
    reportType: ReportKey,
    data: Partial<T>
  ): Promise<T> {
    const endpoint = REPORT_ENDPOINTS[reportType];
    return apiClient.post<T>(endpoint, data);
  }

  /**
   * Update report
   */
  async updateReport<T extends ReportType>(
    reportType: ReportKey,
    reportId: string,
    data: Partial<T>
  ): Promise<T> {
    const endpoint = REPORT_ENDPOINTS[reportType];
    return apiClient.put<T>(`${endpoint}/${reportId}`, data);
  }

  /**
   * Delete report
   */
  async deleteReport(
    reportType: ReportKey,
    reportId: string
  ): Promise<{ message: string }> {
    const endpoint = REPORT_ENDPOINTS[reportType];
    return apiClient.delete<{ message: string }>(`${endpoint}/${reportId}`);
  }

  /**
   * Batch create reports
   */
  async batchCreateReports<T extends ReportType>(
    reportType: ReportKey,
    data: Partial<T>[]
  ): Promise<{ created: number; reports: T[] }> {
    const endpoint = REPORT_ENDPOINTS[reportType];
    return apiClient.post<{ created: number; reports: T[] }>(`${endpoint}/batch`, {
      reports: data,
    });
  }

  /**
   * Bulk delete reports
   */
  async bulkDeleteReports(
    reportType: ReportKey,
    reportIds: string[]
  ): Promise<{ message: string; deleted: number }> {
    const endpoint = REPORT_ENDPOINTS[reportType];
    return apiClient.post<{ message: string; deleted: number }>(
      `${endpoint}/bulk-delete`,
      { ids: reportIds }
    );
  }

  /**
   * Export reports to CSV
   */
  async exportReports(
    reportType: ReportKey,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _filters?: FilterParams
  ): Promise<Blob> {
    const endpoint = REPORT_ENDPOINTS[reportType];
    const filename = `${reportType}-reports-${new Date().toISOString().split('T')[0]}.csv`;
    return apiClient.download(`${endpoint}/export`, filename);
  }

  /**
   * Get reports for specific business
   */
  async getBusinessReports<T extends ReportType>(
    businessCode: string,
    reportType: ReportKey,
    params?: PaginationParams & FilterParams
  ): Promise<PaginatedResponse<T>> {
    return apiClient.get<PaginatedResponse<T>>(
      `/business/${businessCode}/reports/${reportType}`,
      params
    );
  }

  /**
   * Create report for specific business
   */
  async createBusinessReport<T extends ReportType>(
    businessCode: string,
    reportType: ReportKey,
    data: Partial<T>
  ): Promise<T> {
    return apiClient.post<T>(`/business/${businessCode}/reports/${reportType}`, data);
  }

  // ============================================================================
  // REPORT-SPECIFIC HELPER METHODS
  // ============================================================================

  /**
   * Get DPR Site Reports
   */
  async getDprSiteReports(params?: PaginationParams & FilterParams) {
    return this.getReports<DprSiteReport>('dprsite', params);
  }

  /**
   * Get Water Tanker Reports
   */
  async getWaterReports(params?: PaginationParams & FilterParams) {
    return this.getReports<WaterTankerReport>('water', params);
  }

  /**
   * Get Wrapping Reports
   */
  async getWrappingReports(params?: PaginationParams & FilterParams) {
    return this.getReports<WrappingReport>('wrapping', params);
  }

  /**
   * Get E-way Bills
   */
  async getEwayBills(params?: PaginationParams & FilterParams) {
    return this.getReports<EwayBill>('eway', params);
  }

  /**
   * Get Material Reports
   */
  async getMaterialReports(params?: PaginationParams & FilterParams) {
    return this.getReports<MaterialReport>('material', params);
  }

  /**
   * Get Payment Reports
   */
  async getPaymentReports(params?: PaginationParams & FilterParams) {
    return this.getReports<PaymentReport>('payment', params);
  }

  /**
   * Get Stock Reports
   */
  async getStockReports(params?: PaginationParams & FilterParams) {
    return this.getReports<StockReport>('stock', params);
  }

  /**
   * Get Dairy Site Reports
   */
  async getDairySiteReports(params?: PaginationParams & FilterParams) {
    return this.getReports<DairySiteReport>('dairysite', params);
  }

  /**
   * Get MNR Reports
   */
  async getMnrReports(params?: PaginationParams & FilterParams) {
    return this.getReports<MnrReport>('mnr', params);
  }

  /**
   * Get NMR Vehicle Reports
   */
  async getNmrVehicleReports(params?: PaginationParams & FilterParams) {
    return this.getReports<NmrVehicleReport>('nmr_vehicle', params);
  }

  /**
   * Get Contractor Reports
   */
  async getContractorReports(params?: PaginationParams & FilterParams) {
    return this.getReports<ContractorReport>('contractor', params);
  }

  /**
   * Get Painting Reports
   */
  async getPaintingReports(params?: PaginationParams & FilterParams) {
    return this.getReports<PaintingReport>('painting', params);
  }

  /**
   * Get Diesel Reports
   */
  async getDieselReports(params?: PaginationParams & FilterParams) {
    return this.getReports<DieselReport>('diesel', params);
  }

  /**
   * Get Tasks
   */
  async getTasks(params?: PaginationParams & FilterParams) {
    return this.getReports<Task>('tasks', params);
  }

  /**
   * Get Vehicle Logs
   */
  async getVehicleLogs(params?: PaginationParams & FilterParams) {
    return this.getReports<VehicleLog>('vehiclelog', params);
  }

  /**
   * Get report type display name
   */
  getReportDisplayName(reportType: ReportKey): string {
    const names: Record<ReportKey, string> = {
      dprsite: 'DPR Site Reports',
      water: 'Water Tanker Reports',
      wrapping: 'Wrapping Reports',
      eway: 'E-way Bills',
      material: 'Material Reports',
      payment: 'Payment Records',
      stock: 'Stock Reports',
      dairysite: 'Dairy Site Reports',
      mnr: 'MNR Reports',
      nmr_vehicle: 'NMR Vehicle Reports',
      contractor: 'Contractor Reports',
      painting: 'Painting Reports',
      diesel: 'Diesel Reports',
      tasks: 'Tasks',
      vehiclelog: 'Vehicle Logs',
    };
    return names[reportType];
  }

  /**
   * Get all report types
   */
  getAllReportTypes(): { key: ReportKey; name: string; endpoint: string }[] {
    return Object.entries(REPORT_ENDPOINTS).map(([key, endpoint]) => ({
      key: key as ReportKey,
      name: this.getReportDisplayName(key as ReportKey),
      endpoint,
    }));
  }
}

export const reportService = new ReportService();
export { ReportService };
