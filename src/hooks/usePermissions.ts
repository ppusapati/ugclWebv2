/**
 * usePermissions Hook
 * Provides permission checking functionality for components
 *
 * Usage:
 * const { hasPermission, hasAnyPermission, hasAllPermissions, canAccess } = usePermissions();
 *
 * if (hasPermission('create_users')) {
 *   // Show create user button
 * }
 */

import { useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { authService } from '~/services/auth-enhanced.service';
import type { User } from '~/services/types';

export interface PermissionCheck {
  hasPermission: (permission: string, businessId?: string) => boolean;
  hasAnyPermission: (permissions: string[], businessId?: string) => boolean;
  hasAllPermissions: (permissions: string[], businessId?: string) => boolean;
  hasRole: (role: string, businessId?: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isSuperAdmin: () => boolean;
  canAccessBusiness: (businessId: string) => boolean;
  isBusinessAdmin: (businessId: string) => boolean;
  user: User | null;
}

export function usePermissions(): PermissionCheck {
  const user = useSignal<User | null>(null);

  useVisibleTask$(() => {
    user.value = authService.getUser();
  });

  const hasPermission = (permission: string, businessId?: string): boolean => {
    if (!user.value) return false;
    return authService.hasPermission(permission, businessId);
  };

  const hasAnyPermission = (permissions: string[], businessId?: string): boolean => {
    if (!user.value) return false;
    return authService.hasAnyPermission(permissions, businessId);
  };

  const hasAllPermissions = (permissions: string[], businessId?: string): boolean => {
    if (!user.value) return false;
    return authService.hasAllPermissions(permissions, businessId);
  };

  const hasRole = (role: string, businessId?: string): boolean => {
    if (!user.value) return false;
    return authService.hasRole(role, businessId);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user.value) return false;
    return authService.hasAnyRole(roles);
  };

  const isSuperAdmin = (): boolean => {
    return user.value?.is_super_admin === true;
  };

  const canAccessBusiness = (businessId: string): boolean => {
    if (!user.value) return false;
    return authService.canAccessBusiness(businessId);
  };

  const isBusinessAdmin = (businessId: string): boolean => {
    if (!user.value) return false;
    return authService.isBusinessAdmin(businessId);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    canAccessBusiness,
    isBusinessAdmin,
    user: user.value,
  };
}
