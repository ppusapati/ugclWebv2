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
  RoleAssignment,
  PaginatedResponse,
  PaginationParams,
} from './types';

class RoleService {
  async getRoles(params?: PaginationParams & {
    page?: number;
    limit?: number;
    scope_type?: 'global' | 'business_vertical';
    business_vertical_id?: string;
    include_inactive?: boolean;
  }): Promise<PaginatedResponse<Role>> {
    return apiClient.get<PaginatedResponse<Role>>('/admin/rbac/roles', params);
  }

  async createRole(data: CreateRoleRequest): Promise<Role> {
    return apiClient.post<Role>('/admin/rbac/roles', data);
  }

  async updateRole(roleId: string, data: UpdateRoleRequest): Promise<Role> {
    return apiClient.put<Role>(`/admin/rbac/roles/${roleId}`, data);
  }

  async deactivateRole(roleId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/admin/rbac/roles/${roleId}`);
  }

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  /**
   * Get all permissions
   */
  async getPermissions(): Promise<Permission[]> {
    const response = await apiClient.get<any>('/admin/permissions');
    // Handle different response structures from API
    return response.permissions || response.data || response || [];
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
  async getUserAssignments(userId: string): Promise<RoleAssignment[]> {
    return apiClient.get<RoleAssignment[]>(`/admin/rbac/users/${userId}/assignments`);
  }

  /**
   * Assign role to user
   */
  async assignRole(data: AssignRoleRequest): Promise<RoleAssignment> {
    return apiClient.post<RoleAssignment>(`/admin/rbac/users/${data.user_id}/assignments`, {
      role_id: data.role_id,
    });
  }

  /**
   * Remove role from user
   */
  async removeAssignment(userId: string, assignmentId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(
      `/admin/rbac/users/${userId}/assignments/${assignmentId}`
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
