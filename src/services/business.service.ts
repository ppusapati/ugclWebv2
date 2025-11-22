// src/services/business.service.ts
/**
 * Business Vertical Management Service
 * Handles CRUD operations for business verticals, context, and analytics
 */

import { apiClient } from './api-client';
import type {
  BusinessVertical,
  CreateBusinessRequest,
  UpdateBusinessRequest,
  BusinessContext,
  BusinessAnalytics,
  SuperAdminDashboard,
  PaginatedResponse,
  PaginationParams,
} from './types';

class BusinessService {
  /**
   * Get all businesses (admin only)
   */
  async getAllBusinesses(params?: PaginationParams): Promise<PaginatedResponse<BusinessVertical>> {
    return apiClient.get<PaginatedResponse<BusinessVertical>>('/admin/businesses', params);
  }

  /**
   * Create new business vertical (admin only)
   */
  async createBusiness(data: CreateBusinessRequest): Promise<BusinessVertical> {
    return apiClient.post<BusinessVertical>('/admin/businesses', data);
  }

  /**
   * Update business vertical (admin only)
   */
  async updateBusiness(id: string, data: UpdateBusinessRequest): Promise<BusinessVertical> {
    return apiClient.put<BusinessVertical>(`/admin/businesses/${id}`, data);
  }

  /**
   * Delete business vertical (admin only)
   */
  async deleteBusiness(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/admin/businesses/${id}`);
  }

  /**
   * Get user's accessible businesses
   */
  async getMyBusinesses(): Promise<BusinessVertical[]> {
    const response = await apiClient.get<{ accessible_businesses: BusinessVertical[] }>(
      '/my-businesses'
    );
    return response.accessible_businesses;
  }

  /**
   * Get business context for specific business
   */
  async getBusinessContext(businessCode: string): Promise<BusinessContext> {
    return apiClient.get<BusinessContext>(`/business/${businessCode}/context`);
  }

  /**
   * Get business information
   */
  async getBusinessInfo(businessCode: string): Promise<BusinessVertical> {
    return apiClient.get<BusinessVertical>(`/business/${businessCode}/info`);
  }

  /**
   * Get business analytics
   */
  async getBusinessAnalytics(
    businessCode: string,
    params?: { date_from?: string; date_to?: string }
  ): Promise<BusinessAnalytics> {
    return apiClient.get<BusinessAnalytics>(`/business/${businessCode}/analytics`, params);
  }

  /**
   * Get super admin dashboard data
   */
  async getSuperAdminDashboard(): Promise<SuperAdminDashboard> {
    return apiClient.get<SuperAdminDashboard>('/admin/dashboard');
  }

  /**
   * Store selected business in localStorage
   */
  setSelectedBusiness(business: BusinessVertical): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedBusiness', JSON.stringify(business));
    }
  }

  /**
   * Get selected business from localStorage
   */
  getSelectedBusiness(): BusinessVertical | null {
    if (typeof window === 'undefined') return null;
    const businessStr = localStorage.getItem('selectedBusiness');
    return businessStr ? JSON.parse(businessStr) : null;
  }

  /**
   * Clear selected business
   */
  clearSelectedBusiness(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedBusiness');
    }
  }
}

export const businessService = new BusinessService();
export { BusinessService };
