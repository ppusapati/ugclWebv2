import { apiClient } from './api-client';

export interface ResourceAttributeAssignment {
  id: string;
  resource_type: string;
  resource_id: string;
  attribute_id: string;
  attribute_name: string;
  attribute_display_name: string;
  value: string;
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
  assigned_by: string;
  created_at: string;
  updated_at: string;
}

export interface AssignResourceAttributeRequest {
  resource_type: string;
  resource_id: string;
  attribute_id: string;
  value: string;
  valid_until?: string;
}

class ResourceAttributeService {
  /**
   * Get all attributes assigned to a resource
   */
  async getResourceAttributes(
    resourceType: string,
    resourceId: string
  ): Promise<Record<string, string>> {
    return apiClient.get<Record<string, string>>(
      `/resources/${resourceType}/${resourceId}/attributes`
    );
  }

  /**
   * Assign an attribute to a resource
   */
  async assignResourceAttribute(
    request: AssignResourceAttributeRequest
  ): Promise<void> {
    return apiClient.post(`/resources/attributes`, request);
  }

  /**
   * Remove an attribute from a resource
   */
  async removeResourceAttribute(
    resourceType: string,
    resourceId: string,
    attributeId: string
  ): Promise<void> {
    return apiClient.delete(
      `/resources/${resourceType}/${resourceId}/attributes/${attributeId}`
    );
  }
}

export const resourceAttributeService = new ResourceAttributeService();
