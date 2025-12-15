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
  /**
   * Get all sites across all business verticals (Admin only)
   */
  async getAllSites(params?: PaginationParams): Promise<PaginatedResponse<Site>> {
    // Include business_vertical in the response
    const queryParams = { ...params, include: 'business_vertical' };
    return apiClient.get<PaginatedResponse<Site>>('/admin/sites', queryParams);
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
    const response = await apiClient.get<{ sites: Site[] }>(
      `/business/${businessCode}/sites/my-access`
    );
    return response.sites;
  }

  /**
   * Create new site
   */
  async createSite(businessCode: string, data: CreateSiteRequest): Promise<Site> {
    return apiClient.post<Site>(`/admin/sites`, data);
  }

  /**
   * Update site
   */
  async updateSite(businessCode: string, siteId: string, data: UpdateSiteRequest): Promise<Site> {
    return apiClient.put<Site>(`/business/${businessCode}/sites/${siteId}`, data);
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
    const response = await apiClient.get<{ users: UserSiteAccess[] }>(
      `/business/${businessCode}/sites/${siteId}/users`
    );
    return response.users;
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
