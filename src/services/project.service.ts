/**
 * Project Management Service
 * Handles all API calls for project management features
 */

import { apiClient } from './api-client';
import type {
  Project,
  ProjectListResponse,
  CreateProjectRequest,
  ProjectStats,
  Zone,
  Node,
  GeoJSONFeatureCollection,
} from '../types/project';

class ProjectService {
  private readonly basePath = '/projects';

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectRequest): Promise<{ message: string; project: Project }> {
    return apiClient.post<{ message: string; project: Project }>('/admin/projects', data);
  }

  /**
   * Upload KMZ file for a project
   */
  async uploadKMZ(projectId: string, file: File): Promise<{ message: string; project: Project }> {
    const formData = new FormData();
    // Backend expects field name 'kmz_file'
    formData.append('kmz_file', file, file.name);

    return apiClient.upload<{ message: string; project: Project }>(
      `${this.basePath}/${projectId}/kmz`,
      formData
    );
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<Project> {
    return apiClient.get<Project>(`${this.basePath}/${id}`);
  }

  /**
   * List all projects with optional filters
   */
  async listProjects(params?: {
    business_vertical_id?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<ProjectListResponse> {
    return apiClient.get<ProjectListResponse>(this.basePath, params);
  }

  /**
   * Update a project
   */
  async updateProject(
    id: string,
    data: Partial<CreateProjectRequest>
  ): Promise<{ message: string; project: Project }> {
    return apiClient.put<{ message: string; project: Project }>(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete a project (soft delete)
   */
  async deleteProject(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${this.basePath}/${id}`);
  }

  /**
   * Get zones for a project
   */
  async getProjectZones(projectId: string): Promise<{ zones: Zone[]; count: number }> {
    return apiClient.get<{ zones: Zone[]; count: number }>(
      `${this.basePath}/${projectId}/zones`
    );
  }

  /**
   * Get nodes for a project
   */
  async getProjectNodes(projectId: string, params?: {
    zone_id?: string;
    node_type?: string;
  }): Promise<{ nodes: Node[]; count: number }> {
    return apiClient.get<{ nodes: Node[]; count: number }>(
      `${this.basePath}/${projectId}/nodes`,
      params
    );
  }

  /**
   * Get GeoJSON data for map visualization
   */
  async getProjectGeoJSON(projectId: string): Promise<GeoJSONFeatureCollection> {
    return apiClient.get<GeoJSONFeatureCollection>(
      `${this.basePath}/${projectId}/geojson`
    );
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string): Promise<ProjectStats> {
    return apiClient.get<ProjectStats>(`${this.basePath}/${projectId}/stats`);
  }
}

export const projectService = new ProjectService();
