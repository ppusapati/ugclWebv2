// src/services/auth-enhanced.service.ts
/**
 * Enhanced Authentication Service
 * Handles user authentication, registration, password management, and profile
 */

import { apiClient } from './api-client';
import { safeStorage } from '~/utils/safe-storage';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ChangePasswordRequest,
  ProfileUpdateRequest,
  User,
  ProfileResponse,
  BusinessVertical,
  RoleAssignment,
} from './types';

class AuthService {
  private readonly sessionMaxAgeSeconds = 30 * 24 * 60 * 60;

  persistSession(token: string, user: User): void {
    if (typeof window === 'undefined' || !token) return;

    safeStorage.setItem('token', token);
    safeStorage.setItem('user', JSON.stringify(user));

    const firstBusinessAssignment = user.role_assignments?.find(
      assignment => assignment.is_active && assignment.role.scope_type === 'business_vertical'
    );
    const roleRecord = (firstBusinessAssignment?.role || {}) as Record<string, unknown>;
    const verticalCode = String(
      firstBusinessAssignment?.role.business_vertical?.code ||
      ''
    );
    const verticalId = String(
      roleRecord.business_vertical_id ||
      ''
    );

    if (verticalCode) {
      safeStorage.setItem('business_code', verticalCode);
    }
    if (verticalId) {
      safeStorage.setItem('ugcl_current_business_vertical', verticalId);
    }

    safeStorage.setCookie('token', token, {
      maxAge: this.sessionMaxAgeSeconds,
      sameSite: 'Lax',
    });
    safeStorage.setCookie('user', JSON.stringify(user), {
      maxAge: this.sessionMaxAgeSeconds,
      sameSite: 'Lax',
    });
  }

  clearSession(): void {
    if (typeof window === 'undefined') return;

    safeStorage.clear();

    safeStorage.clearAllCookies();
  }

  /**
   * Login user with phone and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/login', credentials);

    if (response.token) {
      this.persistSession(response.token, response.user);
      const profile = await apiClient.get<User>('/token');
      response.user = profile;
      this.persistSession(response.token, profile);
    }

    return response;
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/register', data);

    if (response.token) {
      this.persistSession(response.token, response.user);
    }

    return response;
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ProfileResponse> {
    return apiClient.get<ProfileResponse>('/profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(data: ProfileUpdateRequest): Promise<User> {
    const updatedUser = await apiClient.put<User>('/profile', data);

    // Update stored user info
    if (typeof window !== 'undefined') {
      safeStorage.setItem('user', JSON.stringify(updatedUser));
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
    } catch {
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

  async setActiveBusinessContextById(businessId: string): Promise<void> {
    await apiClient.put('/context/business', { business_id: businessId });
    if (typeof window !== 'undefined') {
      safeStorage.setItem('ugcl_current_business_vertical', businessId);
    }
  }

  async setActiveBusinessContextByCode(businessCode: string): Promise<void> {
    await apiClient.put('/context/business', { business_code: businessCode });
  }

  /**
   * Logout user - clear both localStorage and cookies
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      this.clearSession();

      window.location.href = '/login/';
    }
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return safeStorage.getItem('token');
  }

  /**
   * Get stored user
   */
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = safeStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      safeStorage.removeItem('user');
      return null;
    }
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

    const activeBusinessId = businessId || safeStorage.getItem('ugcl_current_business_vertical') || undefined;
    return this.assignmentsForContext(user.role_assignments || [], activeBusinessId)
      .some(assignment => assignment.role.name === role);
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string, businessId?: string): boolean {
    const user = this.getUser();
    if (!user) return false;

    // Super admins have all permissions
    if (user.is_super_admin) return true;

    const activeBusinessId = businessId || safeStorage.getItem('ugcl_current_business_vertical') || undefined;
    return this.assignmentsForContext(user.role_assignments || [], activeBusinessId)
      .some(assignment => assignment.role.permissions?.some(granted => this.permissionMatches(granted.name, permission)));
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
    return user.role_assignments?.some(assignment =>
      assignment.is_active && assignment.role.is_active &&
      assignment.role.scope_type === 'business_vertical' &&
      assignment.role.business_vertical_id === businessId
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

    const permissions = this.getUserPermissions(businessId);
    return permissions.some(permission => this.permissionMatches(permission, 'business_admin'));
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

    if (user.is_super_admin) return ['*:*:*'];
    const activeBusinessId = businessId || safeStorage.getItem('ugcl_current_business_vertical') || undefined;
    return [...new Set(this.assignmentsForContext(user.role_assignments || [], activeBusinessId)
      .flatMap(assignment => assignment.role.permissions?.map(permission => permission.name) || []))];
  }

  /**
   * Get user's roles for a business
   */
  getUserRoles(businessId?: string): string[] {
    const user = this.getUser();
    if (!user) return [];

    if (user.is_super_admin) return ['super_admin'];

    const roles: string[] = [];

    const activeBusinessId = businessId || safeStorage.getItem('ugcl_current_business_vertical') || undefined;
    roles.push(...this.assignmentsForContext(user.role_assignments || [], activeBusinessId)
      .map(assignment => assignment.role.name));

    return roles;
  }

  private assignmentsForContext(assignments: RoleAssignment[], businessId?: string): RoleAssignment[] {
    return assignments.filter(assignment => {
      if (!assignment.is_active || !assignment.role.is_active) return false;
      if (assignment.role.scope_type === 'global') return true;
      return !!businessId && assignment.role.business_vertical_id === businessId;
    });
  }

  private permissionMatches(granted: string, required: string): boolean {
    if (granted === required || granted === '*:*:*' || granted === '*') return true;
    const escaped = granted.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`).test(required);
  }
}

export const authService = new AuthService();
export { AuthService };
