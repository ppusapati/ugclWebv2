// src/services/workflow.service.ts
/**
 * API service for workflow and form submission management
 */

import { apiClient } from './api-client';
import type {
  WorkflowDefinition,
  WorkflowResponse,
  FormSubmission,
  SubmissionResponse,
  SubmissionListResponse,
  SubmissionFilters,
  TransitionRequest,
  WorkflowHistoryResponse,
  WorkflowStats,
} from '../types/workflow';

export class WorkflowService {
  /**
   * Create a new form submission
   */
  async createSubmission(
    businessCode: string,
    formCode: string,
    formData: Record<string, any>,
    siteId?: string
  ): Promise<FormSubmission> {
    const response = await apiClient.post<SubmissionResponse>(
      `/business/${businessCode}/forms/${formCode}/submissions`,
      {
        form_data: formData,
        site_id: siteId,
      }
    );
    return response.submission;
  }

  /**
   * Get all submissions for a form
   */
  async getSubmissions(
    businessCode: string,
    formCode: string,
    filters?: SubmissionFilters
  ): Promise<FormSubmission[]> {
    const params: Record<string, string> = {};
    if (filters?.state) params.state = filters.state;
    if (filters?.site_id) params.site_id = filters.site_id;
    if (filters?.my_submissions) params.my_submissions = 'true';

    const response = await apiClient.get<SubmissionListResponse>(
      `/business/${businessCode}/forms/${formCode}/submissions`,
      params
    );
    return response.submissions;
  }

  /**
   * Get a single submission by ID
   */
  async getSubmission(
    businessCode: string,
    formCode: string,
    submissionId: string
  ): Promise<{ submission: FormSubmission; history: any[] }> {
    return await apiClient.get(
      `/business/${businessCode}/forms/${formCode}/submissions/${submissionId}`
    );
  }

  /**
   * Update a draft submission
   */
  async updateSubmission(
    businessCode: string,
    formCode: string,
    submissionId: string,
    formData: Record<string, any>
  ): Promise<FormSubmission> {
    const response = await apiClient.put<SubmissionResponse>(
      `/business/${businessCode}/forms/${formCode}/submissions/${submissionId}`,
      { form_data: formData }
    );
    return response.submission;
  }

  /**
   * Perform a workflow state transition
   */
  async transitionSubmission(
    businessCode: string,
    formCode: string,
    submissionId: string,
    request: TransitionRequest
  ): Promise<FormSubmission> {
    const response = await apiClient.post<SubmissionResponse>(
      `/business/${businessCode}/forms/${formCode}/submissions/${submissionId}/transition`,
      request
    );
    return response.submission;
  }

  /**
   * Get workflow transition history
   */
  async getWorkflowHistory(
    businessCode: string,
    formCode: string,
    submissionId: string
  ): Promise<WorkflowHistoryResponse> {
    return await apiClient.get(
      `/business/${businessCode}/forms/${formCode}/submissions/${submissionId}/history`
    );
  }

  /**
   * Get workflow statistics for a form
   */
  async getWorkflowStats(
    businessCode: string,
    formCode: string
  ): Promise<WorkflowStats> {
    return await apiClient.get(
      `/business/${businessCode}/forms/${formCode}/stats`
    );
  }

  // ========================================================================
  // Admin Workflow Management
  // ========================================================================

  /**
   * Get all workflow definitions (admin)
   */
  async getAllWorkflows(): Promise<WorkflowDefinition[]> {
    try {
      console.log('[WorkflowService] Fetching workflows from /admin/workflows');
      const response = await apiClient.get<{ workflows: WorkflowDefinition[]; count: number }>(
        '/admin/workflows'
      );
      console.log('[WorkflowService] Workflows response:', response);
      return response.workflows || [];
    } catch (error: any) {
      console.error('[WorkflowService] Error fetching workflows:', error);
      // Return empty array instead of throwing to not break form builder
      return [];
    }
  }

  /**
   * Create a new workflow definition (admin)
   */
  async createWorkflow(workflow: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    try {
      console.log('[WorkflowService] Creating workflow:', workflow);
      const response = await apiClient.post<WorkflowResponse>(
        '/admin/workflows',
        workflow
      );
      console.log('[WorkflowService] Create workflow response:', response);
      return response.workflow;
    } catch (error: any) {
      console.error('[WorkflowService] Error creating workflow:', error);
      throw error;
    }
  }

  /**
   * Update a workflow definition (admin)
   */
  async updateWorkflow(
    workflowId: string,
    workflow: Partial<WorkflowDefinition>
  ): Promise<WorkflowDefinition> {
    const response = await apiClient.put<WorkflowResponse>(
      `/admin/workflows/${workflowId}`,
      workflow
    );
    return response.workflow;
  }

  /**
   * Delete a workflow definition (admin)
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    await apiClient.delete(`/admin/workflows/${workflowId}`);
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
