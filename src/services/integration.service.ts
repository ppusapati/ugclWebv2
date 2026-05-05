import { apiClient } from './api-client';
import type {
  ThirdPartyIntegration,
  IntegrationListResponse,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  RegenerateKeyResponse,
} from '../types/integration';

const BASE = '/admin/integrations';

export class IntegrationService {
  async list(): Promise<IntegrationListResponse> {
    return apiClient.get<IntegrationListResponse>(BASE);
  }

  async get(id: string): Promise<ThirdPartyIntegration> {
    return apiClient.get<ThirdPartyIntegration>(`${BASE}/${id}`);
  }

  async create(data: CreateIntegrationRequest): Promise<ThirdPartyIntegration> {
    return apiClient.post<ThirdPartyIntegration>(BASE, data);
  }

  async update(id: string, data: UpdateIntegrationRequest): Promise<ThirdPartyIntegration> {
    return apiClient.patch<ThirdPartyIntegration>(`${BASE}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${id}`);
  }

  async regenerateKey(id: string): Promise<RegenerateKeyResponse> {
    return apiClient.post<RegenerateKeyResponse>(`${BASE}/${id}/regenerate-key`, {});
  }

  async toggleStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<ThirdPartyIntegration> {
    return apiClient.patch<ThirdPartyIntegration>(`${BASE}/${id}`, { status });
  }

  /** Forward a GET to the external API through the backend proxy.
   *  The backend appends the stored auth header (e.g. X-Api-Key) before forwarding. */
  async proxyGet<T = any>(integrationId: string, path: string): Promise<T> {
    const encodedPath = encodeURIComponent(path.startsWith('/') ? path : `/${path}`);
    return apiClient.get<T>(`${BASE}/${integrationId}/proxy?path=${encodedPath}`);
  }
}

export const integrationService = new IntegrationService();
