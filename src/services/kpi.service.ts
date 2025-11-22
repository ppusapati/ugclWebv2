// src/services/kpi.service.ts
/**
 * KPI & Analytics Service
 * Handles KPI data fetching for dashboards
 */

import { apiClient } from './api-client';
import type { StockKPI, ContractorKPI, DairySiteKPI, DieselKPI } from './types';

class KpiService {
  /**
   * Get Stock KPIs
   */
  async getStockKPIs(params?: {
    business_vertical_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<StockKPI> {
    return apiClient.get<StockKPI>('/kpi/stock', params);
  }

  /**
   * Get Contractor KPIs
   */
  async getContractorKPIs(params?: {
    business_vertical_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ContractorKPI> {
    return apiClient.get<ContractorKPI>('/kpi/contractor', params);
  }

  /**
   * Get Dairy Site KPIs
   */
  async getDairySiteKPIs(params?: {
    business_vertical_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<DairySiteKPI> {
    return apiClient.get<DairySiteKPI>('/kpi/dairysite', params);
  }

  /**
   * Get Diesel KPIs
   */
  async getDieselKPIs(params?: {
    business_vertical_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<DieselKPI> {
    return apiClient.get<DieselKPI>('/kpi/diesel', params);
  }

  /**
   * Get all KPIs for a business
   */
  async getAllKPIs(businessVerticalId: string, dateRange?: { from: string; to: string }) {
    const params = {
      business_vertical_id: businessVerticalId,
      ...(dateRange && { date_from: dateRange.from, date_to: dateRange.to }),
    };

    const [stock, contractor, dairySite, diesel] = await Promise.all([
      this.getStockKPIs(params).catch(() => null),
      this.getContractorKPIs(params).catch(() => null),
      this.getDairySiteKPIs(params).catch(() => null),
      this.getDieselKPIs(params).catch(() => null),
    ]);

    return { stock, contractor, dairySite, diesel };
  }
}

export const kpiService = new KpiService();
export { KpiService };
