// apps/shell/src/contexts/auth-context.tsx
import {
  $,
  component$,
  createContextId,
  Slot,
  useContext,
  useContextProvider,
  useStore,
  useVisibleTask$,
} from '@builder.io/qwik';
import { TenantDetectionService } from '~/types/multitenant';
import { authService } from '~/services';
import { STORAGE_KEYS } from '~/config/storage-keys';
import { safeStorage } from '~/utils/safe-storage';
import type {
  User,
  AuthContextType,
  AuthState,
  TenantAuthState
} from '~/types/auth';
import type { ProfileResponse } from '~/services/types';
import type { UserTenant } from '~/types/multitenant';

// Types are now imported from ~/types/auth.ts

const AuthContext = createContextId<AuthContextType>('auth-context');

export const AuthProvider = component$(() => {
  const authState = useStore<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const tenantState = useStore<TenantAuthState>({
    currentTenant: null,
    availableTenants: [],
    requiresTenantSelection: false,
    detectionStrategy: 'none',
    isLoadingTenant: false,
    tenantError: null,
  });

  // Create tenant detection service factory function for use in $ scopes

  // Enhanced login with tenant support
  const login = $(async (email: string, password: string, tenantHint?: string): Promise<void> => {
    authState.isLoading = true;
    tenantState.isLoadingTenant = true;

    try {
      // Authenticate user
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tenantHint }),
      });

      if (response.ok) {
        const userData = await response.json();
        authState.user = userData.user;
        authState.isAuthenticated = true;
        authService.persistSession(userData.token, userData.user);

        // Detect and set tenant after successful login
        await detectAndSetTenant(userData.user.tenants);
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      authState.isLoading = false;
      tenantState.isLoadingTenant = false;
    }
  });

  const logout = $(() => {
    authState.user = null;
    authState.isAuthenticated = false;
    tenantState.currentTenant = null;
    tenantState.availableTenants = [];
    tenantState.requiresTenantSelection = false;
    authService.clearSession();
  });

  // Tenant detection and management
  const detectAndSetTenant = $(async (userTenants: UserTenant[]) => {
    try {
      tenantState.isLoadingTenant = true;
      tenantState.tenantError = null;

      // Create service instance inside $ scope for serialization
      const tenantDetectionService = new TenantDetectionService();
      const result = await tenantDetectionService.detectTenant(userTenants);

      tenantState.currentTenant = result.tenant;
      tenantState.availableTenants = result.availableTenants;
      tenantState.requiresTenantSelection = result.requiresSelection;
      tenantState.detectionStrategy = result.strategy.type;

      // If tenant was detected but user doesn't have access, show error
      if (result.tenant && !result.userHasAccess) {
        tenantState.tenantError = `You don't have access to tenant '${result.tenant.name}'`;
        tenantState.currentTenant = null;
        tenantState.requiresTenantSelection = true;
      }

    } catch (error) {
      console.error('Tenant detection failed:', error);
      tenantState.tenantError = 'Failed to detect tenant';
    } finally {
      tenantState.isLoadingTenant = false;
    }
  });

  const switchTenant = $(async (tenantSlug: string, strategy: 'subdomain' | 'path' | 'session' = 'subdomain') => {
    if (!authState.user) {
      throw new Error('User must be authenticated to switch tenant');
    }

    const userTenant = authState.user.tenants.find(t => t.tenantSlug === tenantSlug);
    if (!userTenant) {
      throw new Error(`You don't have access to tenant '${tenantSlug}'`);
    }

    // Create service instance inside $ scope for serialization
    const tenantDetectionService = new TenantDetectionService();
    await tenantDetectionService.switchTenant(tenantSlug, { strategy });
  });

  const selectTenant = $(async (tenantId: string) => {
    if (!authState.user) {
      throw new Error('User must be authenticated to select tenant');
    }

    const userTenant = authState.user.tenants.find(t => t.tenantId === tenantId);
    if (!userTenant) {
      throw new Error(`You don't have access to tenant with ID '${tenantId}'`);
    }

    // Store tenant selection and update context
    safeStorage.setItem(STORAGE_KEYS.TENANT_ID, tenantId);

    // Find the tenant in available tenants
    const tenant = tenantState.availableTenants.find(t => t.id === tenantId);
    if (tenant) {
      tenantState.currentTenant = tenant;
      tenantState.requiresTenantSelection = false;
    }
  });

  const refreshTenants = $(async () => {
    if (!authState.user) return;
    await detectAndSetTenant(authState.user.tenants);
  });

  // Permission and role checks - using QRL for serialization
  const hasPermission = $((permission: string) => {
    if (!authState.user || !tenantState.currentTenant) return false;

    const userTenant = authState.user.tenants.find(
      t => t.tenantId === tenantState.currentTenant?.id
    );

    return userTenant?.permissions.includes(permission) || false;
  });

  const hasRole = $((role: string) => {
    if (!authState.user || !tenantState.currentTenant) return false;

    const userTenant = authState.user.tenants.find(
      t => t.tenantId === tenantState.currentTenant?.id
    );

    return userTenant?.role === role;
  });

  const hasAnyRole = $((roles: string[]) => {
    if (!authState.user || !tenantState.currentTenant) return false;

    const userTenant = authState.user.tenants.find(
      t => t.tenantId === tenantState.currentTenant?.id
    );

    return roles.includes(userTenant?.role || '');
  });

  const canAccessTenant = $((tenantId: string) => {
    if (!authState.user) return false;
    return authState.user.tenants.some(t => t.tenantId === tenantId);
  });

  // Business vertical switcher functionality
  const switchBusinessVertical = $(async (businessVerticalId: string) => {
    if (!authState.user) {
      throw new Error('User must be authenticated to switch business vertical');
    }

    const businessRole = authState.user.business_roles?.find(
      (br: any) => br.business_vertical_id === businessVerticalId
    );

    if (!businessRole) {
      throw new Error(`You don't have access to business vertical '${businessVerticalId}'`);
    }

    // Store the selected business vertical in localStorage
    safeStorage.setItem(STORAGE_KEYS.BUSINESS_VERTICAL_ID, businessVerticalId);

	    await authService.setActiveBusinessContextById(businessVerticalId);

    // Optionally reload the page or trigger re-render
    // window.location.reload(); // Uncomment if you want to reload
  });

  const getCurrentBusinessVertical = $(() => {
    if (!authState.user || !authState.user.business_roles) return null;

    const storedBusinessId = safeStorage.getItem(STORAGE_KEYS.BUSINESS_VERTICAL_ID);

    if (storedBusinessId) {
      const businessRole = authState.user.business_roles.find(
        (br: any) => br.business_vertical_id === storedBusinessId
      );
      if (businessRole) return businessRole;
    }

    // Return first business vertical if none is selected
    return authState.user.business_roles[0] || null;
  });

  const hasBusinessPermission = $((permission: string) => {
    if (!authState.user || !authState.user.business_roles) return false;

    const storedBusinessId = safeStorage.getItem(STORAGE_KEYS.BUSINESS_VERTICAL_ID);
    let currentBusiness = null;

    if (storedBusinessId) {
      currentBusiness = authState.user.business_roles.find(
          (br: any) => (br.vertical_id || br.business_vertical_id) === storedBusinessId
      );
    }

    if (!currentBusiness) {
      currentBusiness = authState.user.business_roles[0];
    }

    if (!currentBusiness) return false;

    return currentBusiness.permissions?.includes(permission) || false;
  });

  const isBusinessAdmin = $(() => {
    if (!authState.user || !authState.user.business_roles) return false;

    const storedBusinessId = safeStorage.getItem(STORAGE_KEYS.BUSINESS_VERTICAL_ID);
    let currentBusiness = null;

    if (storedBusinessId) {
      currentBusiness = authState.user.business_roles.find(
          (br: any) => (br.vertical_id || br.business_vertical_id) === storedBusinessId
      );
    }

    if (!currentBusiness) {
      currentBusiness = authState.user.business_roles[0];
    }

    return currentBusiness?.is_admin || false;
  });

  // Create the complete context value
  const contextValue: AuthContextType = {
    ...authState,
    ...tenantState,
    login,
    logout,
    switchTenant,
    selectTenant,
    refreshTenants,
    hasPermission,
    hasRole,
    hasAnyRole,
    canAccessTenant,
    switchBusinessVertical,
    getCurrentBusinessVertical,
    hasBusinessPermission,
    isBusinessAdmin,
  };

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    // Check for existing auth token on mount (client-side only)
    const token = safeStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      const verifyAuth = import.meta.env.PROD && import.meta.env.VITE_VERIFY_AUTH === 'true';

      const userStr = safeStorage.getItem(STORAGE_KEYS.USER);
      if (userStr) {
        try {
          authState.user = JSON.parse(userStr);
          authState.isAuthenticated = true;
        } catch {
          safeStorage.removeItem(STORAGE_KEYS.USER);
        }
      }

      // Do not block first paint on profile verification.
      authState.isLoading = false;

      if (verifyAuth) {
        try {
          const profile = await authService.getProfile();
          const existingUser = authState.user;
          const normalizedProfile = profile as ProfileResponse;
          const mergedUser: User = {
            id: String(normalizedProfile.id || normalizedProfile.userID || existingUser?.id || ''),
            name: normalizedProfile.name || existingUser?.name || '',
            email: normalizedProfile.email || existingUser?.email || '',
            phone: normalizedProfile.phone || existingUser?.phone,
            role: normalizedProfile.global_role || normalizedProfile.role || existingUser?.role || '',
            permissions: normalizedProfile.permissions || existingUser?.permissions || [],
            tenants: existingUser?.tenants || [],
            business_roles: normalizedProfile.business_roles as any || existingUser?.business_roles,
            is_super_admin: normalizedProfile.is_super_admin ?? existingUser?.is_super_admin,
            is_active: normalizedProfile.is_active ?? existingUser?.is_active,
          };

          authState.user = mergedUser;
          authState.isAuthenticated = true;
          safeStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mergedUser));
          if (mergedUser.tenants.length > 0) {
            await detectAndSetTenant(mergedUser.tenants);
          }
        } catch (error) {
          console.warn('Auth profile verification failed:', error);
          authState.user = null;
          authState.isAuthenticated = false;
          safeStorage.removeItem(STORAGE_KEYS.USER);
          safeStorage.removeItem(STORAGE_KEYS.TOKEN);
        }
      }
    } else {
      authState.isLoading = false;
    }
  });

  useContextProvider(AuthContext, contextValue);

  return <Slot />;
});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};