// src/services/site.service.ts
/**
 * Site Management Service
 * Handles CRUD operations for sites and site access control
 */

import { apiClient } from './api-client';
import type {
  Site,
  CreateSiteRequest,
  UpdateSiteRequest,
  UserSiteAccess,
  AssignSiteAccessRequest,
  PaginatedResponse,
  PaginationParams,
} from './types';

class SiteService {
  private normalizeSitePayload(data: Record<string, any>): Record<string, any> {
    const payload: Record<string, any> = { ...data };

    if (payload.business_vertical_id !== undefined && payload.businessVerticalId === undefined) {
      payload.businessVerticalId = payload.business_vertical_id;
      delete payload.business_vertical_id;
    }

    if (payload.is_active !== undefined && payload.isActive === undefined) {
      payload.isActive = payload.is_active;
      delete payload.is_active;
    }

    if (payload.location && typeof payload.location !== 'string') {
      payload.location = JSON.stringify(payload.location);
    }

    if (payload.geofence && typeof payload.geofence !== 'string') {
      payload.geofence = JSON.stringify(payload.geofence);
    }

    return payload;
  }

  /**
   * Get all sites across all business verticals (Admin only)
   */
  async getAllSites(params?: PaginationParams): Promise<PaginatedResponse<Site>> {
    // Include business_vertical in the response
    const queryParams = { ...params, include: 'business_vertical' };
    const response = await apiClient.get<any>('/admin/sites', queryParams);

    // Backward compatibility: some deployments return `sites` instead of `data`
    if (Array.isArray(response?.sites) && !Array.isArray(response?.data)) {
      return {
        ...response,
        data: response.sites,
      } as PaginatedResponse<Site>;
    }

    return response as PaginatedResponse<Site>;
  }

  /**
   * Get site by ID
   */
  async getSitebyID(siteId: string): Promise<Site> {
    return apiClient.get<Site>(`/admin/sites/${siteId}`);
  }

  /**
   * Get user's accessible sites
   */
  async getMySites(businessCode: string): Promise<Site[]> {
    const response = await apiClient.get<{ data?: Site[]; sites?: Site[] }>(
      `/business/${businessCode}/sites/my-access`
    );
    return response.data || response.sites || [];
  }

  /**
   * Get all sites for a specific business vertical (requires site:view permission)
   */
  async getBusinessSites(
    businessCode: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Site>> {
    const response = await apiClient.get<any>(
      `/business/${businessCode}/sites`,
      params
    );

    if (Array.isArray(response?.sites) && !Array.isArray(response?.data)) {
      return {
        ...response,
        data: response.sites,
      } as PaginatedResponse<Site>;
    }

    return response as PaginatedResponse<Site>;
  }

  /**
   * Create new site
   */
  async createSite(businessCode: string, data: CreateSiteRequest): Promise<Site> {
    const payload = this.normalizeSitePayload(data as Record<string, any>);
    return apiClient.post<Site>(`/admin/sites`, payload);
  }

  /**
   * Update site
   */
  async updateSite(businessCode: string, siteId: string, data: UpdateSiteRequest): Promise<Site> {
    const payload = this.normalizeSitePayload(data as Record<string, any>);
    return apiClient.put<Site>(`/admin/sites/${siteId}`, payload);
  }

  /**
   * Delete site
   */
  async deleteSite(businessCode: string, siteId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/business/${businessCode}/sites/${siteId}`);
  }

  /**
   * Get users with access to a site
   */
  async getSiteUsers(businessCode: string, siteId: string): Promise<UserSiteAccess[]> {
    const response = await apiClient.get<{ users?: UserSiteAccess[]; data?: UserSiteAccess[] }>(
      `/business/${businessCode}/sites/${siteId}/users`
    );
    return response.users || response.data || [];
  }

  /**
   * Assign user access to a site
   */
  async assignSiteAccess(
    businessCode: string,
    data: AssignSiteAccessRequest
  ): Promise<UserSiteAccess> {
    return apiClient.post<UserSiteAccess>(`/business/${businessCode}/sites/access`, data);
  }

  /**
   * Revoke user's site access
   */
  async revokeSiteAccess(
    businessCode: string,
    accessId: string
  ): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(
      `/business/${businessCode}/sites/access/${accessId}`
    );
  }

  /**
   * Check if user has access to a site
   */
  hasSiteAccess(userSiteAccess: UserSiteAccess[], siteId: string, permission: 'read' | 'create' | 'update' | 'delete'): boolean {
    const access = userSiteAccess.find(usa => usa.site_id === siteId);
    return access?.permissions[permission] || false;
  }
}

export const siteService = new SiteService();
export { SiteService };
