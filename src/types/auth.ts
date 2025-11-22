import type { QRL } from '@builder.io/qwik';
import type { Tenant, UserTenant } from '~/types/multitenant';
import type { BusinessRole } from '~/services/types';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  permissions: string[];
  tenants: UserTenant[];
  business_roles?: BusinessRole[];
  is_super_admin?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenantHint?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface TenantAuthState {
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  requiresTenantSelection: boolean;
  detectionStrategy: 'subdomain' | 'path' | 'session' | 'none';
  isLoadingTenant: boolean;
  tenantError: string | null;
}

export interface AuthContextType extends AuthState, TenantAuthState {
  login: QRL<(email: string, password: string, tenantHint?: string) => Promise<void>>;
  logout: QRL<() => void>;
  switchTenant: QRL<(tenantSlug: string, strategy?: 'subdomain' | 'path' | 'session') => Promise<void>>;
  selectTenant: QRL<(tenantId: string) => Promise<void>>;
  refreshTenants: QRL<() => Promise<void>>;
  hasPermission: QRL<(permission: string) => boolean>;
  hasRole: QRL<(role: string) => boolean>;
  hasAnyRole: QRL<(roles: string[]) => boolean>;
  canAccessTenant: QRL<(tenantId: string) => boolean>;
  switchBusinessVertical: QRL<(businessVerticalId: string) => Promise<void>>;
  getCurrentBusinessVertical: QRL<() => BusinessRole | null>;
  hasBusinessPermission: QRL<(permission: string) => boolean>;
  isBusinessAdmin: QRL<() => boolean>;
}
