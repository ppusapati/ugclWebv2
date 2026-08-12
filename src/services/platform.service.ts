// src/services/platform.service.ts
/**
 * Platform Admin Service
 * Cross-tenant operator auth and tenant-creation calls.
 *
 * Deliberately separate from api-client.ts / auth-enhanced.service.ts:
 * platform admins are a distinct identity from tenant users (see backend
 * models.PlatformAdmin), with their own token stored under its own storage
 * key so a platform session never collides with a tenant-user session in
 * the same browser. Requests here must NOT carry the tenant x-api-key
 * header or the tenant token — the backend's /api/v1/platform/* routes
 * aren't behind SecurityMiddleware/JWTMiddleware/TenantResolutionMiddleware
 * at all, only PlatformAdminMiddleware.
 */

import { buildApiUrl } from '~/config/api';
import { STORAGE_KEYS } from '~/config/storage-keys';
import { safeStorage } from '~/utils/safe-storage';

export interface PlatformAdmin {
  id: string;
  name: string;
  email: string;
}

export interface PlatformTenant {
  id: string;
  name: string;
  slug: string;
  schema_name: string;
  status: 'provisioning' | 'active' | 'failed' | 'inactive';
  is_active: boolean;
}

export class PlatformApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getPlatformToken(): string | null {
  return safeStorage.getItem(STORAGE_KEYS.PLATFORM_TOKEN);
}

function persistPlatformSession(token: string, admin: PlatformAdmin): void {
  safeStorage.setItem(STORAGE_KEYS.PLATFORM_TOKEN, token);
  safeStorage.setItem(STORAGE_KEYS.PLATFORM_ADMIN, JSON.stringify(admin));
}

function clearPlatformSession(): void {
  safeStorage.removeItem(STORAGE_KEYS.PLATFORM_TOKEN);
  safeStorage.removeItem(STORAGE_KEYS.PLATFORM_ADMIN);
}

function getStoredPlatformAdmin(): PlatformAdmin | null {
  const raw = safeStorage.getItem(STORAGE_KEYS.PLATFORM_ADMIN);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlatformAdmin;
  } catch {
    return null;
  }
}

async function parseJsonSafe(resp: Response): Promise<any> {
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return resp.json().catch(() => null);
  }
  const text = await resp.text().catch(() => '');
  return text ? { message: text } : null;
}

async function platformFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getPlatformToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resp = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  const body = await parseJsonSafe(resp);
  if (!resp.ok) {
    const message =
      (body && (body.message || body.error)) ||
      `Request failed (${resp.status})`;
    throw new PlatformApiError(message, resp.status);
  }
  return body as T;
}

export const platformService = {
  async login(email: string, password: string): Promise<PlatformAdmin> {
    const data = await platformFetch<{ token: string; admin: PlatformAdmin }>(
      '/platform/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    persistPlatformSession(data.token, data.admin);
    return data.admin;
  },

  logout(): void {
    clearPlatformSession();
  },

  isAuthenticated(): boolean {
    return !!getPlatformToken();
  },

  currentAdmin(): PlatformAdmin | null {
    return getStoredPlatformAdmin();
  },

  async listTenants(): Promise<PlatformTenant[]> {
    const data = await platformFetch<{ tenants: PlatformTenant[] }>(
      '/platform/tenants'
    );
    return data.tenants;
  },

  async createTenant(input: {
    name: string;
    slug: string;
    schema_name?: string;
  }): Promise<PlatformTenant> {
    const data = await platformFetch<{ tenant: PlatformTenant }>(
      '/platform/tenants',
      { method: 'POST', body: JSON.stringify(input) }
    );
    return data.tenant;
  },

  async provisionTenant(tenantId: string): Promise<PlatformTenant> {
    const data = await platformFetch<{ tenant: PlatformTenant }>(
      `/platform/tenants/${tenantId}/provision`,
      { method: 'POST' }
    );
    return data.tenant;
  },

  async seedTenantAdmin(
    tenantId: string,
    input: {
      admin_name: string;
      admin_email?: string;
      admin_phone: string;
      admin_password: string;
    }
  ): Promise<PlatformTenant> {
    const data = await platformFetch<{ tenant: PlatformTenant }>(
      `/platform/tenants/${tenantId}/seed-admin`,
      { method: 'POST', body: JSON.stringify(input) }
    );
    return data.tenant;
  },
};
