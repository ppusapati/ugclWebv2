import { authService } from '~/services/auth-enhanced.service';

export function getUser() {
  return authService.getUser();
}

export function isSuperAdminUser(user: any): boolean {
  if (!user) return false;

  const roleCandidates = [
    user.role,
    user.global_role,
    user.globalRole,
    user.global_role_name,
    user.globalRoleName,
  ]
    .filter(Boolean)
    .map((value: unknown) => String(value).toLowerCase().trim());

  const roles = Array.isArray(user.roles)
    ? user.roles.map((value: unknown) => String(value).toLowerCase().trim())
    : [];

  const permissions = Array.isArray(user.permissions)
    ? user.permissions.map((value: unknown) => String(value).toLowerCase().trim())
    : [];

  return (
    user.is_super_admin === true ||
    user.isSuperAdmin === true ||
    roleCandidates.includes('super_admin') ||
    roles.includes('super_admin') ||
    permissions.includes('*:*:*') ||
    permissions.includes('super_admin')
  );
}

export function getToken() {
  return authService.getToken();
}

export function hasRole(role: string, businessId?: string): boolean {
  return authService.hasRole(role, businessId);
}

export function hasPermission(permission: string, businessId?: string): boolean {
  return authService.hasPermission(permission, businessId);
}

export function hasAnyRole(roles: string[], businessId?: string): boolean {
  return roles.some(role => hasRole(role, businessId));
}

export function hasAllRoles(roles: string[], businessId?: string): boolean {
  return roles.every(role => hasRole(role, businessId));
}

export function hasAnyPermission(permissions: string[], businessId?: string): boolean {
  return authService.hasAnyPermission(permissions, businessId);
}

export function hasAllPermissions(permissions: string[], businessId?: string): boolean {
  return authService.hasAllPermissions(permissions, businessId);
}

/**
 * Returns the user's roles/permissions for a business vertical in the legacy
 * BusinessRole shape, derived from canonical role_assignments, for callers
 * that still expect { roles, permissions, is_admin }.
 */
export function getUserBusinessAccess(businessId: string) {
  const user = getUser();

  if (!user) return null;

  if (user.is_super_admin) {
    return {
      business_vertical_id: businessId,
      roles: ['super_admin'],
      permissions: ['*'],
      is_admin: true,
    };
  }

  const roles = authService.getUserRoles(businessId);
  const permissions = authService.getUserPermissions(businessId);
  if (roles.length === 0 && permissions.length === 0) return null;

  return {
    business_vertical_id: businessId,
    roles,
    permissions,
    is_admin: isBusinessAdmin(businessId),
  };
}

export function isBusinessAdmin(businessId?: string): boolean {
  return authService.isBusinessAdmin(businessId);
}

export function canAccessBusiness(businessId: string): boolean {
  return authService.canAccessBusiness(businessId);
}
