/**
 * PermissionGuard Component
 * Conditionally renders children based on user permissions
 *
 * Usage Examples:
 *
 * 1. Single permission:
 * <PermissionGuard permission="create_users">
 *   <button>Create User</button>
 * </PermissionGuard>
 *
 * 2. Any of multiple permissions:
 * <PermissionGuard anyPermissions={['create_users', 'update_users']}>
 *   <button>Manage Users</button>
 * </PermissionGuard>
 *
 * 3. All permissions required:
 * <PermissionGuard allPermissions={['read_reports', 'create_reports']}>
 *   <button>Create Report</button>
 * </PermissionGuard>
 *
 * 4. Role-based:
 * <PermissionGuard role="admin">
 *   <AdminPanel />
 * </PermissionGuard>
 *
 * 5. Super admin only:
 * <PermissionGuard superAdminOnly>
 *   <SystemSettings />
 * </PermissionGuard>
 *
 * 6. Show fallback if no permission:
 * <PermissionGuard permission="view_dashboard" fallback={<LoginPrompt />}>
 *   <Dashboard />
 * </PermissionGuard>
 */

import { component$, Slot, useSignal, useVisibleTask$, type QRL } from '@builder.io/qwik';
import { authService } from '~/services/auth-enhanced.service';

interface PermissionGuardProps {
  // Single permission check
  permission?: string;

  // Multiple permission checks (OR logic)
  anyPermissions?: string[];

  // Multiple permission checks (AND logic)
  allPermissions?: string[];

  // Role-based check
  role?: string;
  anyRoles?: string[];
  allRoles?: string[];

  // Super admin check
  superAdminOnly?: boolean;

  // Business context
  businessId?: string;

  // Fallback content when permission denied
  fallback?: any;

  // Custom permission check function
  customCheck$?: QRL<() => boolean>;

  // Hide instead of not rendering (for layout purposes)
  hideIfDenied?: boolean;
}

export const PermissionGuard = component$<PermissionGuardProps>((props) => {
  const hasAccess = useSignal(false);
  const isChecking = useSignal(true);

  useVisibleTask$(async () => {
    let user = authService.getUser();

    if (!user) {
      hasAccess.value = false;
      isChecking.value = false;
      return;
    }

    // If user doesn't have role info, try to fetch it from API
    if (user.role === undefined && user.is_super_admin === undefined) {
      try {
        const baseUrl = 'http://localhost:8080/api/v1';
        const response = await fetch(`${baseUrl}/profile`, {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`,
            'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const profile = await response.json();
          // Update stored user with role info
          const updatedUser = {
            ...user,
            role: profile.global_role,
            is_super_admin: profile.global_role === 'super_admin',
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          user = updatedUser;
        }
      } catch (e) {
        console.error('Failed to fetch user profile:', e);
      }
    }

    let allowed = false;

    // Super admin check - always allow
    if (props.superAdminOnly) {
      allowed = user.is_super_admin === true || user.role === "super_admin";
    } else if (user.is_super_admin === true || user.role === "super_admin") {
      allowed = true;
    } else {
      // Custom check
      if (props.customCheck$) {
        allowed = await props.customCheck$();
      }
      // Single permission
      else if (props.permission) {
        allowed = authService.hasPermission(props.permission, props.businessId);
      }
      // Any of permissions (OR)
      else if (props.anyPermissions && props.anyPermissions.length > 0) {
        allowed = authService.hasAnyPermission(props.anyPermissions, props.businessId);
      }
      // All permissions (AND)
      else if (props.allPermissions && props.allPermissions.length > 0) {
        allowed = authService.hasAllPermissions(props.allPermissions, props.businessId);
      }
      // Single role
      else if (props.role) {
        allowed = authService.hasRole(props.role, props.businessId);
      }
      // Any of roles
      else if (props.anyRoles && props.anyRoles.length > 0) {
        allowed = authService.hasAnyRole(props.anyRoles);
      }
      // All roles
      else if (props.allRoles && props.allRoles.length > 0) {
        allowed = authService.hasAllRoles(props.allRoles);
      }
      // No criteria specified - allow by default if authenticated
      else {
        allowed = true;
      }
    }

    hasAccess.value = allowed;
    isChecking.value = false;
  });

  // Show loading state while checking
  if (isChecking.value) {
    return (
      <div class="flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // No access
  if (!hasAccess.value) {
    if (props.fallback) {
      return <>{props.fallback}</>;
    }

    if (props.hideIfDenied) {
      return <div style={{ display: 'none' }}><Slot /></div>;
    }

    return null;
  }

  // Has access - render children
  return <Slot />;
});

export default PermissionGuard;
