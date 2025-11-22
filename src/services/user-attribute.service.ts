import { apiClient } from './api-client';

export interface UserAttributeAssignment {
  id: string;
  user_id: string;
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

export interface AssignUserAttributeRequest {
  attribute_id: string;
  value: string;
  valid_until?: string;
}

export interface BulkAssignUserAttributesRequest {
  attributes: {
    [attribute_name: string]: string;
  };
}

export interface UserAttributeHistoryEntry {
  id: string;
  user_id: string;
  attribute_id: string;
  value: string;
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
  assigned_by: string;
  created_at: string;
}

class UserAttributeService {
  /**
   * Get all attributes assigned to a user
   */
  async getUserAttributes(userId: string): Promise<Record<string, string>> {
    return apiClient.get<Record<string, string>>(`/users/${userId}/attributes`);
  }

  /**
   * Assign a single attribute to a user
   */
  async assignUserAttribute(
    userId: string,
    request: AssignUserAttributeRequest
  ): Promise<void> {
    return apiClient.post(`/users/${userId}/attributes`, request);
  }

  /**
   * Bulk assign multiple attributes to a user
   */
  async bulkAssignUserAttributes(
    userId: string,
    request: BulkAssignUserAttributesRequest
  ): Promise<void> {
    return apiClient.post(`/users/${userId}/attributes/bulk`, request);
  }

  /**
   * Remove an attribute from a user
   */
  async removeUserAttribute(userId: string, attributeId: string): Promise<void> {
    return apiClient.delete(`/users/${userId}/attributes/${attributeId}`);
  }

  /**
   * Get attribute assignment history for a user
   */
  async getUserAttributeHistory(
    userId: string,
    attributeId: string
  ): Promise<UserAttributeHistoryEntry[]> {
    return apiClient.get<UserAttributeHistoryEntry[]>(
      `/users/${userId}/attributes/${attributeId}/history`
    );
  }
}

export const userAttributeService = new UserAttributeService();
