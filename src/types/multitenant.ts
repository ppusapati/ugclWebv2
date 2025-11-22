// Stub types for multi-tenant functionality
// TODO: Replace with actual @p9e.in/plugins/multitenant when available

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  settings?: Record<string, any>;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserTenant {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: string;
  permissions: string[];
  isDefault: boolean;
  isOwner: boolean;
  joinedAt: Date;
  lastAccessedAt: Date;
}

export interface TenantDetectionResult {
  tenant: Tenant | null;
  availableTenants: Tenant[];
  requiresSelection: boolean;
  userHasAccess: boolean;
  strategy: {
    type: 'subdomain' | 'path' | 'session' | 'none';
    value?: string;
  };
}

export interface TenantSwitchOptions {
  strategy: 'subdomain' | 'path' | 'session';
}

export class TenantDetectionService {
  async detectTenant(userTenants: UserTenant[]): Promise<TenantDetectionResult> {
    // Mock implementation for development
    // In production, this should detect tenant from URL, headers, etc.

    const availableTenants: Tenant[] = userTenants.map(ut => ({
      id: ut.tenantId,
      name: ut.tenantName,
      slug: ut.tenantSlug,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const currentTenant = availableTenants.find(t => t.id === userTenants[0]?.tenantId) || null;

    return {
      tenant: currentTenant,
      availableTenants,
      requiresSelection: availableTenants.length > 1 && !currentTenant,
      userHasAccess: !!currentTenant,
      strategy: {
        type: 'session',
      },
    };
  }

  async switchTenant(tenantSlug: string, options: TenantSwitchOptions): Promise<void> {
    // Mock implementation for development
    console.log('Switching tenant to:', tenantSlug, 'with strategy:', options.strategy);

    // Store in localStorage for session strategy
    if (options.strategy === 'session') {
      localStorage.setItem('ugcl_current_tenant_slug', tenantSlug);
    }

    // For subdomain strategy, would redirect to new subdomain
    // For path strategy, would update the URL path
  }
}
