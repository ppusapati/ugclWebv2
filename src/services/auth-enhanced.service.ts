// src/services/auth-enhanced.service.ts
/**
 * Enhanced Authentication Service
 * Handles user authentication, registration, password management, and profile
 */

import { apiClient } from './api-client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ChangePasswordRequest,
  ProfileUpdateRequest,
  User,
  BusinessVertical,
} from './types';

class AuthService {
  /**
   * Login user with phone and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/login', credentials);

    // Store token and user in localStorage
    if (typeof window !== 'undefined' && response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/register', data);

    // Auto-login after successful registration
    if (typeof window !== 'undefined' && response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    return apiClient.get<User>('/profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(data: ProfileUpdateRequest): Promise<User> {
    const updatedUser = await apiClient.put<User>('/profile', data);

    // Update stored user info
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }

    return updatedUser;
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/change-password', data);
  }

  /**
   * Verify token validity
   */
  async verifyToken(): Promise<{ valid: boolean; user?: User }> {
    try {
      return await apiClient.get<{ valid: boolean; user?: User }>('/token');
    } catch (error) {
      return { valid: false };
    }
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
   * Logout user
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedBusiness');
      window.location.href = '/login';
    }
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  /**
   * Get stored user
   */
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Check if user is super admin
   */
  isSuperAdmin(): boolean {
    const user = this.getUser();
    return user?.is_super_admin === true;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string, businessId?: string): boolean {
    const user = this.getUser();
    if (!user) return false;

    // Check global role
    if (user.role === role) return true;

    // Check business-specific role
    if (businessId && user.business_roles) {
      const businessRole = user.business_roles.find(
        br => br.business_vertical_id === businessId
      );
      return businessRole?.roles.includes(role) || false;
    }

    return false;
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string, businessId?: string): boolean {
    const user = this.getUser();
    if (!user) return false;

    // Super admins have all permissions
    if (user.is_super_admin) return true;

    // Check business-specific permission
    if (businessId && user.business_roles) {
      const businessRole = user.business_roles.find(
        br => br.business_vertical_id === businessId
      );
      return businessRole?.permissions.includes(permission) || false;
    }

    return false;
  }

  /**
   * Check if user can access business
   */
  canAccessBusiness(businessId: string): boolean {
    const user = this.getUser();
    if (!user) return false;

    // Super admins can access all businesses
    if (user.is_super_admin) return true;

    // Check if user has any business role for this business
    return user.business_roles?.some(
      br => br.business_vertical_id === businessId
    ) || false;
  }

  /**
   * Check if user is business admin
   */
  isBusinessAdmin(businessId?: string): boolean {
    const user = this.getUser();
    if (!user) return false;

    // Super admins are admins everywhere
    if (user.is_super_admin) return true;

    if (businessId && user.business_roles) {
      const businessRole = user.business_roles.find(
        br => br.business_vertical_id === businessId
      );
      return businessRole?.is_admin || false;
    }

    return false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[], businessId?: string): boolean {
    if (!permissions || permissions.length === 0) return false;
    return permissions.some(permission => this.hasPermission(permission, businessId));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[], businessId?: string): boolean {
    if (!permissions || permissions.length === 0) return false;
    return permissions.every(permission => this.hasPermission(permission, businessId));
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    if (!roles || roles.length === 0) return false;
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(roles: string[]): boolean {
    if (!roles || roles.length === 0) return false;
    return roles.every(role => this.hasRole(role));
  }

  /**
   * Get user's permissions for a business
   */
  getUserPermissions(businessId?: string): string[] {
    const user = this.getUser();
    if (!user) return [];

    // Super admins have all permissions (return common ones)
    if (user.is_super_admin) {
      return [
        'read_users', 'create_users', 'update_users', 'delete_users',
        'read_roles', 'create_roles', 'update_roles', 'delete_roles',
        'read_permissions', 'create_permissions',
        'manage_businesses', 'manage_sites',
        'read_reports', 'create_reports', 'update_reports', 'delete_reports',
        'read_materials', 'create_materials', 'update_materials', 'delete_materials',
        'read_payments', 'create_payments', 'update_payments', 'delete_payments',
        'read_kpis', 'business_view_analytics',
      ];
    }

    if (businessId && user.business_roles) {
      const businessRole = user.business_roles.find(
        br => br.business_vertical_id === businessId
      );
      return businessRole?.permissions || [];
    }

    return [];
  }

  /**
   * Get user's roles for a business
   */
  getUserRoles(businessId?: string): string[] {
    const user = this.getUser();
    if (!user) return [];

    if (user.is_super_admin) return ['super_admin'];

    const roles: string[] = [];

    // Add global role
    if (user.role) {
      roles.push(user.role);
    }

    // Add business-specific roles
    if (businessId && user.business_roles) {
      const businessRole = user.business_roles.find(
        br => br.business_vertical_id === businessId
      );
      if (businessRole?.roles) {
        roles.push(...businessRole.roles);
      }
    }

    return roles;
  }
}

export const authService = new AuthService();
export { AuthService };
