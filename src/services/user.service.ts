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
    return apiClient.get('/admin/users/stats');
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
    return apiClient.post<{ message: string }>('/admin/users/bulk-delete', {
      user_ids: userIds,
    });
  }

  /**
   * Export users to CSV
   */
  async exportUsers(filters?: FilterParams): Promise<Blob> {
    return apiClient.download('/admin/users/export', 'users.csv');
  }
}

export const userService = new UserService();
export { UserService };
