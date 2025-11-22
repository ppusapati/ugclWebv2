// src/services/role.service.ts
/**
 * Role & Permission Management Service
 * Handles global roles, business roles, permissions, and role assignments
 */

import { apiClient } from './api-client';
import type {
  Role,
  Permission,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRoleRequest,
  PaginatedResponse,
  PaginationParams,
} from './types';

class RoleService {
  // ============================================================================
  // GLOBAL ROLE MANAGEMENT
  // ============================================================================

  /**
   * Get all global roles
   */
  async getGlobalRoles(params?: PaginationParams): Promise<PaginatedResponse<Role>> {
    return apiClient.get<PaginatedResponse<Role>>('/admin/roles', params);
  }

  /**
   * Create global role
   */
  async createGlobalRole(data: CreateRoleRequest): Promise<Role> {
    return apiClient.post<Role>('/admin/roles', data);
  }

  /**
   * Update global role
   */
  async updateGlobalRole(roleId: string, data: UpdateRoleRequest): Promise<Role> {
    return apiClient.put<Role>(`/admin/roles/${roleId}`, data);
  }

  /**
   * Delete global role
   */
  async deleteGlobalRole(roleId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/admin/roles/${roleId}`);
  }

  // ============================================================================
  // BUSINESS ROLE MANAGEMENT
  // ============================================================================

  /**
   * Get roles for a business vertical
   */
  async getBusinessRoles(businessCode: string): Promise<Role[]> {
    const response = await apiClient.get<{ roles: Role[] }>(
      `/business/${businessCode}/roles`
    );
    return response.roles;
  }

  /**
   * Create business-specific role
   */
  async createBusinessRole(businessCode: string, data: CreateRoleRequest): Promise<Role> {
    return apiClient.post<Role>(`/business/${businessCode}/roles`, data);
  }

  /**
   * Update business role
   */
  async updateBusinessRole(
    businessCode: string,
    roleId: string,
    data: UpdateRoleRequest
  ): Promise<Role> {
    return apiClient.put<Role>(`/business/${businessCode}/roles/${roleId}`, data);
  }

  /**
   * Delete business role
   */
  async deleteBusinessRole(businessCode: string, roleId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(
      `/business/${businessCode}/roles/${roleId}`
    );
  }

  /**
   * Get roles for a specific business vertical (alternate endpoint)
   */
  async getVerticalRoles(verticalId: string): Promise<Role[]> {
    const response = await apiClient.get<{ roles: Role[] }>(
      `/business-verticals/${verticalId}/roles`
    );
    return response.roles;
  }

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  /**
   * Get all permissions
   */
  async getPermissions(): Promise<Permission[]> {
    const response = await apiClient.get<{ permissions: Permission[] }>('/admin/permissions');
    return response.permissions;
  }

  /**
   * Create new permission
   */
  async createPermission(data: {
    name: string;
    resource: string;
    action: string;
    description?: string;
  }): Promise<Permission> {
    return apiClient.post<Permission>('/admin/permissions', data);
  }

  /**
   * Get permissions grouped by resource
   */
  async getPermissionsGrouped(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getPermissions();
    return permissions.reduce((acc, perm) => {
      const resource = perm.resource || 'general';
      if (!acc[resource]) acc[resource] = [];
      acc[resource].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  }

  // ============================================================================
  // USER ROLE ASSIGNMENT
  // ============================================================================

  /**
   * Get user's roles
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const response = await apiClient.get<{ roles: Role[] }>(`/users/${userId}/roles`);
    return response.roles;
  }

  /**
   * Get assignable roles for user
   */
  async getAssignableRoles(userId: string): Promise<Role[]> {
    const response = await apiClient.get<{ roles: Role[] }>(
      `/users/${userId}/assignable-roles`
    );
    return response.roles;
  }

  /**
   * Assign role to user
   */
  async assignRole(data: AssignRoleRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/users/${data.user_id}/roles/assign`, data);
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/users/${userId}/roles/${roleId}`);
  }

  /**
   * Assign user to business role
   */
  async assignBusinessRole(
    businessCode: string,
    data: { user_id: string; role_id: string }
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `/business/${businessCode}/users/assign`,
      data
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get role display name with level
   */
  getRoleDisplayName(role: Role): string {
    const levelNames = ['Super Admin', 'System Admin', 'Business Admin', 'Manager', 'Supervisor', 'Operator'];
    const levelName = levelNames[role.level] || `Level ${role.level}`;
    return `${role.display_name || role.name} (${levelName})`;
  }

  /**
   * Sort roles by level (highest first)
   */
  sortRolesByLevel(roles: Role[]): Role[] {
    return [...roles].sort((a, b) => a.level - b.level);
  }

  /**
   * Filter roles by minimum level
   */
  filterRolesByMinLevel(roles: Role[], minLevel: number): Role[] {
    return roles.filter(role => role.level >= minLevel);
  }
}

export const roleService = new RoleService();
export { RoleService };
