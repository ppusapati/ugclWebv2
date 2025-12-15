/**
 * RouteGuard Component
 * Protects entire routes based on permissions
 * Redirects to appropriate page if access denied
 *
 * Usage in route layouts:
 *
 * export default component$(() => {
 *   return (
 *     <RouteGuard
 *       permission="manage_users"
 *       redirectTo="/dashboard"
 *       loadingComponent={<LoadingSpinner />}
 *     >
 *       <Slot />
 *     </RouteGuard>
 *   );
 * });
 */

import { component$, Slot, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { authService } from '~/services/auth-enhanced.service';

interface RouteGuardProps {
  // Permission requirements (same as PermissionGuard)
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  role?: string;
  anyRoles?: string[];
  superAdminOnly?: boolean;
  businessId?: string;

  // Redirect behavior
  redirectTo?: string;
  redirectToLogin?: boolean;

  // Loading state
  loadingComponent?: any;

  // Unauthorized message
  showUnauthorizedMessage?: boolean;
  unauthorizedMessage?: string;
}

export const RouteGuard = component$<RouteGuardProps>((props) => {
  const nav = useNavigate();
  const hasAccess = useSignal<boolean | null>(null);
  const isChecking = useSignal(true);

  useVisibleTask$(async () => {
    const user = authService.getUser();

    // Not logged in
    if (!user) {
      hasAccess.value = false;
      isChecking.value = false;

      if (props.redirectToLogin) {
        await nav('/login');
      } else if (props.redirectTo) {
        await nav(props.redirectTo);
      }
      return;
    }

    let allowed = false;

    // Super admin - always allow (unless superAdminOnly is explicitly set)
    if (user.is_super_admin === true && !props.superAdminOnly) {
      allowed = true;
    } else if (props.superAdminOnly) {
      allowed = user.is_super_admin === true;
    } else {
      // Permission checks
      if (props.permission) {
        allowed = authService.hasPermission(props.permission, props.businessId);
      } else if (props.anyPermissions && props.anyPermissions.length > 0) {
        allowed = authService.hasAnyPermission(props.anyPermissions, props.businessId);
      } else if (props.allPermissions && props.allPermissions.length > 0) {
        allowed = authService.hasAllPermissions(props.allPermissions, props.businessId);
      } else if (props.role) {
        allowed = authService.hasRole(props.role, props.businessId);
      } else if (props.anyRoles && props.anyRoles.length > 0) {
        allowed = authService.hasAnyRole(props.anyRoles);
      } else {
        // No criteria - allow if authenticated
        allowed = true;
      }
    }

    hasAccess.value = allowed;
    isChecking.value = false;

    // Redirect if no access
    if (!allowed) {
      if (props.redirectTo) {
        await nav(props.redirectTo);
      } else {
        await nav('/dashboard');
      }
    }
  });

  // Loading state
  if (isChecking.value) {
    if (props.loadingComponent) {
      return <>{props.loadingComponent}</>;
    }

    return (
      <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <div class="text-center">
          <div class="text-4xl mb-4 animate-spin">⏳</div>
          <p class="text-gray-600 dark:text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (hasAccess.value === false) {
    if (props.showUnauthorizedMessage) {
      return (
        <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
          <div class="max-w-md w-full bg-white dark:bg-dark-800 rounded-lg shadow-lg p-8 text-center">
            <div class="text-6xl mb-4">🔒</div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              {props.unauthorizedMessage ||
                'You do not have permission to access this page.'}
            </p>
            <button
              onClick$={() => nav('/dashboard')}
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return null;
  }

  // Access granted
  return <Slot />;
});

export default RouteGuard;
