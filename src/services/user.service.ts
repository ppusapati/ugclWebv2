// src/services/user.service.ts
/**
 * User Management Service
 * Handles user CRUD operations and user-related queries
 */

import { apiClient } from './api-client';
import type {
  User,
  RegisterRequest,
  PaginatedResponse,
  PaginationParams,
  FilterParams,
} from './types';

class UserService {
  /**
   * Get all users (paginated, admin only)
   */
  async getUsers(
    params?: PaginationParams & FilterParams
  ): Promise<PaginatedResponse<User>> {
    return apiClient.get<PaginatedResponse<User>>('/admin/users', params);
  }

  /**
   * Get users for a specific business
   */
  async getBusinessUsers(
    businessCode: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<User>> {
    return apiClient.get<PaginatedResponse<User>>(
      `/business/${businessCode}/users`,
      params
    );
  }

  /**
   * Get single user by ID
   */
  async getUserById(userId: string): Promise<User> {
    return apiClient.get<User>(`/admin/users/${userId}`);
  }

  /**
   * Create new user
   */
  async createUser(data: RegisterRequest): Promise<User> {
    return apiClient.post<User>('/admin/users', data);
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    data: Partial<RegisterRequest>
  ): Promise<User> {
    return apiClient.put<User>(`/admin/users/${userId}`, data);
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/admin/users/${userId}`);
  }

  /**
   * Search users by name, email, or phone
   */
  async searchUsers(query: string): Promise<User[]> {
    const response = await apiClient.get<PaginatedResponse<User>>('/admin/users', {
      search: query,
      page_size: 50,
    });
    return response.data;
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    by_role: Record<string, number>;
  }> {
    const response = await this.getUsers({ page: 1, limit: 1000 } as any);
    const users = response.data || [];

    const byRole = users.reduce<Record<string, number>>((acc, user) => {
      const role = (user as any).global_role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const active = users.filter((u) => u.is_active !== false).length;
    const inactive = users.length - active;

    return {
      total: users.length,
      active,
      inactive,
      by_role: byRole,
    };
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(
    userId: string,
    isActive: boolean
  ): Promise<User> {
    return apiClient.put<User>(`/admin/users/${userId}`, {
      is_active: isActive,
    });
  }

  /**
   * Bulk delete users
   */
  async bulkDeleteUsers(userIds: string[]): Promise<{ message: string }> {
    await Promise.all(userIds.map((id) => this.deleteUser(id)));
    return {
      message: `${userIds.length} users deleted successfully`,
    };
  }

  /**
   * Export users to CSV
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async exportUsers(_filters?: FilterParams): Promise<Blob> {
    const response = await this.getUsers({ page: 1, limit: 1000 } as any);
    const users = response.data || [];

    const headers = ['id', 'name', 'email', 'phone', 'global_role', 'is_active'];
    const rows = users.map((u: any) => [
      u.id,
      u.name,
      u.email,
      u.phone,
      u.global_role,
      u.is_active,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }
}

export const userService = new UserService();
export { UserService };
