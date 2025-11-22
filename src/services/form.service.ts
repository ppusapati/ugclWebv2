// src/services/form.service.ts
/**
 * Form Management Service
 * Handles dynamic forms, modules, and form configurations
 */

import { apiClient } from './api-client';
import type {
  AppForm,
  Module,
  CreateFormRequest,
  UpdateFormAccessRequest,
  PaginatedResponse,
} from './types';

class FormService {
  /**
   * Get all modules
   */
  async getModules(): Promise<Module[]> {
    const response = await apiClient.get<{ modules: Module[] }>('/modules');
    return response.modules;
  }

  /**
   * Get forms for a business vertical
   */
  async getBusinessForms(businessCode: string): Promise<AppForm[]> {
    const response = await apiClient.get<{ forms: AppForm[] }>(
      `/business/${businessCode}/forms`
    );
    return response.forms;
  }

  /**
   * Get specific form by code
   */
  async getFormByCode(businessCode: string, formCode: string): Promise<AppForm> {
    return apiClient.get<AppForm>(`/business/${businessCode}/forms/${formCode}`);
  }

  /**
   * Get all forms (admin only)
   */
  async getAllForms(): Promise<PaginatedResponse<AppForm>> {
    return apiClient.get<PaginatedResponse<AppForm>>('/admin/app-forms');
  }

  /**
   * Create new form (admin only)
   */
  async createForm(data: CreateFormRequest): Promise<AppForm> {
    return apiClient.post<AppForm>('/admin/app-forms', data);
  }

  /**
   * Update form (admin only)
   */
  async updateForm(formId: string, data: Partial<CreateFormRequest>): Promise<AppForm> {
    return apiClient.put<AppForm>(`/admin/app-forms/${formId}`, data);
  }

  /**
   * Delete form (admin only)
   */
  async deleteForm(formId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/admin/app-forms/${formId}`);
  }

  /**
   * Update form vertical access (admin only)
   */
  async updateFormAccess(
    formCode: string,
    data: UpdateFormAccessRequest
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `/admin/app-forms/${formCode}/verticals`,
      data
    );
  }

  /**
   * Get forms grouped by module
   */
  async getFormsGroupedByModule(businessCode: string): Promise<Record<string, AppForm[]>> {
    const forms = await this.getBusinessForms(businessCode);
    return forms.reduce((acc, form) => {
      const moduleCode = form.module?.code || 'other';
      if (!acc[moduleCode]) acc[moduleCode] = [];
      acc[moduleCode].push(form);
      return acc;
    }, {} as Record<string, AppForm[]>);
  }

  /**
   * Validate form schema
   */
  validateFormSchema(schema: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if schema is an object
    if (typeof schema !== 'object' || schema === null) {
      errors.push('Schema must be an object');
      return { valid: false, errors };
    }

    // Check for required fields
    if (!schema.fields || !Array.isArray(schema.fields)) {
      errors.push('Schema must have a fields array');
    }

    // Validate each field
    if (schema.fields) {
      schema.fields.forEach((field: any, index: number) => {
        if (!field.name) {
          errors.push(`Field at index ${index} is missing name`);
        }
        if (!field.type) {
          errors.push(`Field at index ${index} is missing type`);
        }
        if (!field.label) {
          errors.push(`Field at index ${index} is missing label`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }
}

export const formService = new FormService();
export { FormService };
