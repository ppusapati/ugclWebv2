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
import type {
  User,
  AuthContextType,
  AuthState,
  TenantAuthState
} from '~/types/auth';
import type { UserTenant } from '~/types/multitenant';

// Safe localStorage access that works in both browser and server environments
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage access failed:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage setItem failed:', error);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage removeItem failed:', error);
    }
  },
};

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
        safeLocalStorage.setItem('auth_token', userData.token);

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
    safeLocalStorage.removeItem('auth_token');
    safeLocalStorage.removeItem('ugcl_current_tenant_id');
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
    safeLocalStorage.setItem('ugcl_current_tenant_id', tenantId);

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
    safeLocalStorage.setItem('ugcl_current_business_vertical', businessVerticalId);

    // Optionally reload the page or trigger re-render
    // window.location.reload(); // Uncomment if you want to reload
  });

  const getCurrentBusinessVertical = $(() => {
    if (!authState.user || !authState.user.business_roles) return null;

    const storedBusinessId = safeLocalStorage.getItem('ugcl_current_business_vertical');

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

    const storedBusinessId = safeLocalStorage.getItem('ugcl_current_business_vertical');
    let currentBusiness = null;

    if (storedBusinessId) {
      currentBusiness = authState.user.business_roles.find(
        (br: any) => br.business_vertical_id === storedBusinessId
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

    const storedBusinessId = safeLocalStorage.getItem('ugcl_current_business_vertical');
    let currentBusiness = null;

    if (storedBusinessId) {
      currentBusiness = authState.user.business_roles.find(
        (br: any) => br.business_vertical_id === storedBusinessId
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
    const token = safeLocalStorage.getItem('auth_token');
    if (token) {
      try {
        const response = await fetch('/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const user = await response.json();
          authState.user = user;
          authState.isAuthenticated = true;
        } else {
          // Fallback to mock user for development
          const mockUser: User = {
            id: '1',
            name: 'System Administrator',
            email: 'admin@company.com',
            role: 'admin',
            permissions: ['read', 'write', 'admin'],
            tenants: [
              {
                tenantId: 'tenant-1',
                tenantName: 'UGCL Main',
                tenantSlug: 'ugcl-main',
                role: 'admin',
                permissions: ['read', 'write', 'admin'],
                isDefault: true,
                isOwner: true,
                joinedAt: new Date(),
                lastAccessedAt: new Date(),
              },
              {
                tenantId: 'tenant-2',
                tenantName: 'UGCL North',
                tenantSlug: 'ugcl-north',
                role: 'manager',
                permissions: ['read', 'write'],
                isDefault: false,
                isOwner: false,
                joinedAt: new Date(),
                lastAccessedAt: new Date(),
              },
            ],
          };
          authState.user = mockUser;
          authState.isAuthenticated = true;

          // Detect tenant after setting mock user
          await detectAndSetTenant(mockUser.tenants);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('auth_token');
        
        // For development, still set a mock user
        const mockUser: User = {
          id: '1',
          name: 'System Administrator',
          email: 'admin@company.com',
          role: 'admin',
          permissions: ['read', 'write', 'admin'],
          tenants: [
            {
              tenantId: 'tenant-1',
              tenantName: 'UGCL Main',
              tenantSlug: 'ugcl-main',
              role: 'admin',
              permissions: ['read', 'write', 'admin'],
              isDefault: true,
              isOwner: true,
              joinedAt: new Date(),
              lastAccessedAt: new Date(),
            },
            {
              tenantId: 'tenant-2',
              tenantName: 'UGCL North',
              tenantSlug: 'ugcl-north',
              role: 'manager',
              permissions: ['read', 'write'],
              isDefault: false,
              isOwner: false,
              joinedAt: new Date(),
              lastAccessedAt: new Date(),
            },
          ],
        };
        authState.user = mockUser;
        authState.isAuthenticated = true;

        // Detect tenant after setting mock user
        await detectAndSetTenant(mockUser.tenants);
      }
    }
    authState.isLoading = false;
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