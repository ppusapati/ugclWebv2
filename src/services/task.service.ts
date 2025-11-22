/**
 * Task Management Service
 * Handles all API calls for task management
 */

import { apiClient } from './api-client';
import type {
  Task,
  TaskListResponse,
  CreateTaskRequest,
  AssignTaskRequest,
  UpdateTaskStatusRequest,
  TaskAssignment,
  TaskAuditLog,
  TaskComment,
  TaskAttachment,
} from '../types/project';

class TaskService {
  private readonly basePath = '/tasks';

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskRequest): Promise<{ message: string; task: Task }> {
    return apiClient.post<{ message: string; task: Task }>(this.basePath, data);
  }

  /**
   * Get a single task by ID
   */
  async getTask(id: string): Promise<Task> {
    return apiClient.get<Task>(`${this.basePath}/${id}`);
  }

  /**
   * List tasks with filters
   */
  async listTasks(params?: {
    project_id?: string;
    zone_id?: string;
    status?: string;
    priority?: string;
    assigned_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<TaskListResponse> {
    return apiClient.get<TaskListResponse>(this.basePath, params);
  }

  /**
   * Update a task
   */
  async updateTask(
    id: string,
    data: Partial<CreateTaskRequest>
  ): Promise<{ message: string; task: Task }> {
    return apiClient.put<{ message: string; task: Task }>(`${this.basePath}/${id}`, data);
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    id: string,
    data: UpdateTaskStatusRequest
  ): Promise<{ message: string; task: Task }> {
    return apiClient.put<{ message: string; task: Task }>(
      `${this.basePath}/${id}/status`,
      data
    );
  }

  /**
   * Assign a user to a task
   */
  async assignTask(
    taskId: string,
    data: AssignTaskRequest
  ): Promise<{ message: string; assignment: TaskAssignment }> {
    return apiClient.post<{ message: string; assignment: TaskAssignment }>(
      `${this.basePath}/${taskId}/assign`,
      data
    );
  }

  /**
   * Get task audit log
   */
  async getTaskAuditLog(taskId: string): Promise<{ logs: TaskAuditLog[]; count: number }> {
    return apiClient.get<{ logs: TaskAuditLog[]; count: number }>(
      `${this.basePath}/${taskId}/audit-log`
    );
  }

  /**
   * Add a comment to a task
   */
  async addTaskComment(
    taskId: string,
    data: { comment: string; comment_type?: string; parent_id?: string }
  ): Promise<{ message: string; comment: TaskComment }> {
    return apiClient.post<{ message: string; comment: TaskComment }>(
      `${this.basePath}/${taskId}/comments`,
      data
    );
  }

  /**
   * Get task comments
   */
  async getTaskComments(taskId: string): Promise<{ comments: TaskComment[]; count: number }> {
    return apiClient.get<{ comments: TaskComment[]; count: number }>(
      `${this.basePath}/${taskId}/comments`
    );
  }

  /**
   * Upload attachment to a task
   */
  async uploadTaskAttachment(
    taskId: string,
    file: File,
    description?: string
  ): Promise<{ message: string; attachment: TaskAttachment }> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    return apiClient.upload<{ message: string; attachment: TaskAttachment }>(
      `${this.basePath}/${taskId}/attachments`,
      formData
    );
  }

  /**
   * Get task attachments
   */
  async getTaskAttachments(
    taskId: string
  ): Promise<{ attachments: TaskAttachment[]; count: number }> {
    return apiClient.get<{ attachments: TaskAttachment[]; count: number }>(
      `${this.basePath}/${taskId}/attachments`
    );
  }
}

export const taskService = new TaskService();
