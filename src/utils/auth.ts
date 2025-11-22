export function getUser() {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("user");
  console.log("getUser", userStr);
  return userStr ? JSON.parse(userStr) : null;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function hasRole(role: string, businessId?: string) {
  const user = getUser();
  
  if (!user) return false;
  
  // Super admin has all roles
  if (user.is_super_admin) return true;
  
  // Check global role
  if (user.role?.includes(role)) return true;
  
  // Check business-specific role
  if (businessId && user.business_roles) {
    const businessAccess = user.business_roles.find(
      (access: any) => access.business_vertical_id === businessId
    );
    return businessAccess?.roles?.includes(role) || false;
  }
  
  return false;
}

export function hasPermission(permission: string, businessId?: string) {
  const user = getUser();
  
  if (!user) return false;
  
  // Super admin has all permissions
  if (user.is_super_admin || user.role == "super_admin") return true;
  
  // Check global permissions
  if (user.permissions?.includes(permission)) return true;
  
  // Check business-specific permissions
  if (businessId && user.business_roles) {
    const businessAccess = user.business_roles.find(
      (access: any) => access.business_vertical_id === businessId
    );
    return businessAccess?.permissions?.includes(permission) || false;
  }
  
  return false;
}

export function hasAnyRole(roles: string[], businessId?: string): boolean {
  return roles.some(role => hasRole(role, businessId));
}

export function hasAllRoles(roles: string[], businessId?: string): boolean {
  return roles.every(role => hasRole(role, businessId));
}

export function hasAnyPermission(permissions: string[], businessId?: string): boolean {
  return permissions.some(permission => hasPermission(permission, businessId));
}

export function hasAllPermissions(permissions: string[], businessId?: string): boolean {
  return permissions.every(permission => hasPermission(permission, businessId));
}

export function getUserBusinessAccess(businessId: string) {
  const user = getUser();
  
  if (!user) return null;
  
  if (user.is_super_admin || user.role == "super_admin") {
    return {
      business_vertical_id: businessId,
      roles: ['super_admin'],
      permissions: ['*'], // All permissions
      is_admin: true,
    };
  }
  
  return user.business_roles?.find(
    (access: any) => access.business_vertical_id === businessId
  ) || null;
}

export function isBusinessAdmin(businessId?: string): boolean {
  const user = getUser();
  
  if (!user) return false;
  
  if (user.is_super_admin) return true;
  
  if (!businessId) return false;
  
  const businessAccess = getUserBusinessAccess(businessId);
  return businessAccess?.is_admin || false;
}

export function canAccessBusiness(businessId: string): boolean {
  const user = getUser();
  
  if (!user) return false;
  
  if (user.is_super_admin) return true;
  
  return !!getUserBusinessAccess(businessId);
}
