/**
 * Budget Management Service
 * Handles all API calls for budget allocations and tracking
 */

import { apiClient } from './api-client';
import type {
  BudgetAllocation,
  CreateBudgetAllocationRequest,
  BudgetSummary,
} from '../types/project';

class BudgetService {
  private readonly basePath = '/budget';

  /**
   * Create a new budget allocation
   */
  async createBudgetAllocation(
    data: CreateBudgetAllocationRequest
  ): Promise<{ message: string; allocation: BudgetAllocation }> {
    return apiClient.post<{ message: string; allocation: BudgetAllocation }>(
      `${this.basePath}/allocations`,
      data
    );
  }

  /**
   * Get a budget allocation by ID
   */
  async getBudgetAllocation(id: string): Promise<BudgetAllocation> {
    return apiClient.get<BudgetAllocation>(`${this.basePath}/allocations/${id}`);
  }

  /**
   * List budget allocations with filters
   */
  async listBudgetAllocations(params?: {
    project_id?: string;
    task_id?: string;
    category?: string;
    status?: string;
  }): Promise<{ allocations: BudgetAllocation[]; count: number }> {
    return apiClient.get<{ allocations: BudgetAllocation[]; count: number }>(
      `${this.basePath}/allocations`,
      params
    );
  }

  /**
   * Update a budget allocation
   */
  async updateBudgetAllocation(
    id: string,
    data: {
      planned_amount?: number;
      actual_amount?: number;
      status?: string;
      notes?: string;
    }
  ): Promise<{ message: string; allocation: BudgetAllocation }> {
    return apiClient.put<{ message: string; allocation: BudgetAllocation }>(
      `${this.basePath}/allocations/${id}`,
      data
    );
  }

  /**
   * Approve a budget allocation
   */
  async approveBudgetAllocation(
    id: string,
    data: { approval_comment?: string }
  ): Promise<{ message: string; allocation: BudgetAllocation }> {
    return apiClient.post<{ message: string; allocation: BudgetAllocation }>(
      `${this.basePath}/allocations/${id}/approve`,
      data
    );
  }

  /**
   * Delete a budget allocation
   */
  async deleteBudgetAllocation(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${this.basePath}/allocations/${id}`);
  }

  /**
   * Get budget summary for a project
   */
  async getProjectBudgetSummary(projectId: string): Promise<BudgetSummary> {
    return apiClient.get<BudgetSummary>(`${this.basePath}/projects/${projectId}/summary`);
  }

  /**
   * Get budget summary for a task
   */
  async getTaskBudgetSummary(taskId: string): Promise<BudgetSummary> {
    return apiClient.get<BudgetSummary>(`${this.basePath}/tasks/${taskId}/summary`);
  }
}

export const budgetService = new BudgetService();
