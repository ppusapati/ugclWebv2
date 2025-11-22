// src/services/form-builder.service.ts
/**
 * API service for form builder and app form management
 */

import { apiClient } from './api-client';
import type {
  AppForm,
  AppFormDTO,
  FormBuilderResponse,
  FormsListResponse,
  Module,
  ModulesResponse,
  FormDefinition,
} from '../types/workflow';

export class FormBuilderService {
  /**
   * Get forms available for a business vertical
   */
  async getFormsForBusiness(businessCode: string): Promise<AppFormDTO[]> {
    const response = await apiClient.get<FormsListResponse>(
      `/business/${businessCode}/forms`
    );
    return response.forms;
  }

  /**
   * Get a specific form by code
   */
  async getFormByCode(formCode: string): Promise<any> {
    return await apiClient.get(
      `/admin/forms/${formCode}`
    );
  }

  /**
   * Get all modules
   */
  async getModules(): Promise<Module[]> {
    const response = await apiClient.get<ModulesResponse>('/modules');
    return response.modules;
  }

  // ========================================================================
  // Admin Form Management
  // ========================================================================

  /**
   * Get all app forms (admin)
   */
  async getAllForms(): Promise<AppForm[]> {
    const response = await apiClient.get<{ forms: AppFormDTO[]; count: number }>(
      '/admin/app-forms'
    );
    return response.forms as any;
  }

  /**
   * Create a new app form (admin)
   */
  async createForm(form: Partial<AppForm>): Promise<AppForm> {
    const response = await apiClient.post<FormBuilderResponse>(
      '/admin/app-forms',
      form
    );
    return response.form;
  }

  /**
   * Update an existing app form (admin)
   */
  async updateForm(formCode: string, form: Partial<AppForm>): Promise<AppForm> {
    const response = await apiClient.put<FormBuilderResponse>(
      `/admin/app-forms/${formCode}`,
      form
    );
    return response.form;
  }

  /**
   * Delete an app form (admin)
   */
  async deleteForm(formCode: string): Promise<void> {
    await apiClient.delete(`/admin/app-forms/${formCode}`);
  }

  /**
   * Update form vertical access (admin)
   */
  async updateFormVerticalAccess(
    formCode: string,
    verticalCodes: string[]
  ): Promise<void> {
    await apiClient.post(`/admin/app-forms/${formCode}/verticals`, {
      vertical_codes: verticalCodes,
    });
  }

  /**
   * Import form definition from JSON
   */
  async importFormDefinition(formDefinition: FormDefinition): Promise<AppForm> {
    // Convert form definition to AppForm structure for API
    const appForm: any = {
      code: formDefinition.form_code,
      title: formDefinition.title,
      description: formDefinition.description,
      version: formDefinition.version,
      module_id: formDefinition.module, // Backend expects module_id as UUID string
      accessible_verticals: formDefinition.accessible_verticals || [],
      route: `/forms/${formDefinition.form_code}`,
      db_table_name: formDefinition.form_code, // Set table name same as form code
      steps: formDefinition.steps,
      validations: formDefinition.validations,
      initial_state: formDefinition.workflow?.initial_state || 'draft',
      is_active: true,
    };

    return await this.createForm(appForm);
  }

  /**
   * Export form definition to JSON
   */
  exportFormDefinition(form: AppForm): FormDefinition {
    return {
      form_code: form.code,
      title: form.title,
      description: form.description,
      version: form.version,
      module: form.module_id || form.module?.id || '', // Use module_id or fallback to module.id
      accessible_verticals: form.accessible_verticals || [],
      type: form.steps && form.steps.length > 1 ? 'multi_step' : 'single_page',
      steps: form.steps || [],
      validations: form.validations as any,
      workflow: form.workflow_id
        ? {
            initial_state: form.initial_state || 'draft',
            states: [],
            transitions: [],
          }
        : undefined,
      permissions: {
        create: form.required_permission,
      },
      ui_config: {},
    };
  }

  /**
   * Validate form definition JSON
   */
  validateFormDefinition(json: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const definition = JSON.parse(json) as FormDefinition;

      // Required fields
      if (!definition.form_code) errors.push('form_code is required');
      if (!definition.title) errors.push('title is required');
      if (!definition.module) errors.push('module is required');
      if (!definition.steps || definition.steps.length === 0) {
        errors.push('At least one step is required');
      }

      // Validate steps
      definition.steps?.forEach((step, index) => {
        if (!step.id) errors.push(`Step ${index + 1}: id is required`);
        if (!step.title) errors.push(`Step ${index + 1}: title is required`);
        if (!step.fields || step.fields.length === 0) {
          errors.push(`Step ${index + 1}: At least one field is required`);
        }

        // Validate fields
        step.fields?.forEach((field, fieldIndex) => {
          if (!field.id) {
            errors.push(`Step ${index + 1}, Field ${fieldIndex + 1}: id is required`);
          }
          if (!field.type) {
            errors.push(`Step ${index + 1}, Field ${fieldIndex + 1}: type is required`);
          }
          if (!field.label) {
            errors.push(`Step ${index + 1}, Field ${fieldIndex + 1}: label is required`);
          }
        });
      });

      return { valid: errors.length === 0, errors };
    } catch (error: any) {
      return {
        valid: false,
        errors: [`Invalid JSON: ${error.message}`],
      };
    }
  }
}

// Export singleton instance
export const formBuilderService = new FormBuilderService();
