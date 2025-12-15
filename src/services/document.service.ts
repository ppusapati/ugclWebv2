// src/services/document.service.ts
/**
 * Document Management Service
 * Handles all document-related API calls
 */

import { apiClient } from './api-client';
import type {
  Document,
  DocumentVersion,
  DocumentCategory,
  DocumentTag,
  DocumentPermission,
  DocumentShare,
  DocumentAuditLog,
  DocumentStatistics,
  DocumentListParams,
  DocumentListResponse,
  DocumentUploadRequest,
  DocumentUpdateRequest,
  CreateShareRequest,
  CreatePermissionRequest,
  BulkUpdateRequest,
  BulkAddTagsRequest,
  VersionComparisonResponse,
  SharedDocumentAccessResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateTagRequest,
  UpdateTagRequest,
  FileValidationOptions,
  FileValidationResult,
} from '../types/document';

class DocumentService {
  // ============ Document CRUD Operations ============

  /**
   * Get list of documents with filtering and pagination
   */
  async getDocuments(params?: DocumentListParams): Promise<DocumentListResponse> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    return apiClient.get<DocumentListResponse>(`/documents?${queryParams.toString()}`);
  }

  /**
   * Get single document by ID
   */
  async getDocument(id: string): Promise<Document> {
    return apiClient.get<Document>(`/documents/${id}`);
  }

  /**
   * Upload a new document
   */
  async uploadDocument(request: DocumentUploadRequest, onProgress?: (progress: number) => void): Promise<Document> {
    const formData = new FormData();
    formData.append('file', request.file);

    const metadata = {
      title: request.title,
      description: request.description,
      category_id: request.category_id,
      tags: request.tags,
      metadata: request.metadata,
      business_vertical_id: request.business_vertical_id,
      workflow_id: request.workflow_id,
      is_public: request.is_public,
    };

    formData.append('metadata', JSON.stringify(metadata));
    if (onProgress) { /* progress callback not supported by apiClient.upload */ }

    const response = await apiClient.upload<{ document: Document }>(
      '/documents',
      formData
    );

    return response.document;
  }

  /**
   * Update document metadata
   */
  async updateDocument(id: string, updates: DocumentUpdateRequest): Promise<Document> {
    const response = await apiClient.put<{ document: Document }>(`/documents/${id}`, updates);
    return response.document;
  }

  /**
   * Delete a document (soft delete)
   */
  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  }

  /**
   * Download a document
   */
  async downloadDocument(id: string, filename?: string): Promise<Blob> {
    return apiClient.download(`/documents/${id}/download`, filename);
  }

  /**
   * Search documents
   */
  async searchDocuments(query: string): Promise<{ results: Document[]; count: number }> {
    return apiClient.get(`/documents/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Get document statistics
   */
  async getStatistics(businessVerticalId?: string): Promise<DocumentStatistics> {
    const params = businessVerticalId ? `?business_vertical_id=${businessVerticalId}` : '';
    return apiClient.get<DocumentStatistics>(`/documents/statistics${params}`);
  }

  // ============ Version Management ============

  /**
   * Get all versions of a document
   */
  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    return apiClient.get<DocumentVersion[]>(`/documents/${documentId}/versions`);
  }

  /**
   * Create a new version of a document
   */
  async createVersion(
    documentId: string,
    file: File,
    changeLog?: string,
    onProgress?: (progress: number) => void
  ): Promise<DocumentVersion> {
    const formData = new FormData();
    formData.append('file', file);
    if (changeLog) {
      formData.append('change_log', changeLog);
    }
    if (onProgress) { /* progress callback not supported by apiClient.upload */ }

    const response = await apiClient.upload<{ version: DocumentVersion }>(
      `/documents/${documentId}/versions`,
      formData
    );

    return response.version;
  }

  /**
   * Download a specific version
   */
  async downloadVersion(documentId: string, versionId: string, filename?: string): Promise<Blob> {
    return apiClient.download(`/documents/${documentId}/versions/${versionId}/download`, filename);
  }

  /**
   * Compare two versions
   */
  async compareVersions(documentId: string, version1Id: string, version2Id: string): Promise<VersionComparisonResponse> {
    return apiClient.get<VersionComparisonResponse>(
      `/documents/${documentId}/versions/compare?version1=${version1Id}&version2=${version2Id}`
    );
  }

  /**
   * Rollback to a specific version
   */
  async rollbackVersion(documentId: string, versionId: string): Promise<void> {
    await apiClient.post(`/documents/${documentId}/versions/${versionId}/rollback`, {});
  }

  // ============ Categories ============

  /**
   * Get all document categories
   */
  async getCategories(businessVerticalId?: string): Promise<DocumentCategory[]> {
    const params = businessVerticalId ? `?business_vertical_id=${businessVerticalId}` : '';
    return apiClient.get<DocumentCategory[]>(`/documents/categories${params}`);
  }

  /**
   * Get a single category
   */
  async getCategory(id: string): Promise<DocumentCategory> {
    return apiClient.get<DocumentCategory>(`/documents/categories/${id}`);
  }

  /**
   * Create a new category
   */
  async createCategory(request: CreateCategoryRequest): Promise<DocumentCategory> {
    const response = await apiClient.post<{ category: DocumentCategory }>('/documents/categories', request);
    return response.category;
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, updates: UpdateCategoryRequest): Promise<DocumentCategory> {
    const response = await apiClient.put<{ category: DocumentCategory }>(`/documents/categories/${id}`, updates);
    return response.category;
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/documents/categories/${id}`);
  }

  // ============ Tags ============

  /**
   * Get all document tags
   */
  async getTags(businessVerticalId?: string): Promise<DocumentTag[]> {
    const params = businessVerticalId ? `?business_vertical_id=${businessVerticalId}` : '';
    return apiClient.get<DocumentTag[]>(`/documents/tags${params}`);
  }

  /**
   * Create a new tag
   */
  async createTag(request: CreateTagRequest): Promise<DocumentTag> {
    const response = await apiClient.post<{ tag: DocumentTag }>('/documents/tags', request);
    return response.tag;
  }

  /**
   * Update a tag
   */
  async updateTag(id: string, updates: UpdateTagRequest): Promise<DocumentTag> {
    const response = await apiClient.put<{ tag: DocumentTag }>(`/documents/tags/${id}`, updates);
    return response.tag;
  }

  /**
   * Delete a tag
   */
  async deleteTag(id: string): Promise<void> {
    await apiClient.delete(`/documents/tags/${id}`);
  }

  // ============ Sharing ============

  /**
   * Create a shareable link for a document
   */
  async createShare(documentId: string, request: CreateShareRequest): Promise<{ share_url: string; share: DocumentShare }> {
    return apiClient.post(`/documents/${documentId}/shares`, request);
  }

  /**
   * Get all shares for a document
   */
  async getShares(documentId: string): Promise<DocumentShare[]> {
    return apiClient.get<DocumentShare[]>(`/documents/${documentId}/shares`);
  }

  /**
   * Revoke a share link
   */
  async revokeShare(shareId: string): Promise<void> {
    await apiClient.post(`/documents/shares/${shareId}/revoke`, {});
  }

  /**
   * Access a shared document (public, no auth required)
   */
  async accessSharedDocument(token: string, password?: string): Promise<SharedDocumentAccessResponse> {
    const params = password ? `?password=${encodeURIComponent(password)}` : '';
    return apiClient.get<SharedDocumentAccessResponse>(`/documents/shared/${token}${params}`);
  }

  /**
   * Download a shared document
   */
  async downloadSharedDocument(token: string, filename?: string): Promise<Blob> {
    return apiClient.download(`/documents/shared/${token}/download`, filename);
  }

  // ============ Permissions ============

  /**
   * Grant permission to a user or role
   */
  async grantPermission(documentId: string, request: CreatePermissionRequest): Promise<DocumentPermission> {
    const response = await apiClient.post<{ permission: DocumentPermission }>(
      `/documents/${documentId}/permissions`,
      request
    );
    return response.permission;
  }

  /**
   * Get all permissions for a document
   */
  async getPermissions(documentId: string): Promise<DocumentPermission[]> {
    return apiClient.get<DocumentPermission[]>(`/documents/${documentId}/permissions`);
  }

  /**
   * Revoke a permission
   */
  async revokePermission(permissionId: string): Promise<void> {
    await apiClient.delete(`/documents/permissions/${permissionId}/revoke`);
  }

  // ============ Audit Logs ============

  /**
   * Get audit logs for a document
   */
  async getAuditLogs(documentId: string): Promise<DocumentAuditLog[]> {
    return apiClient.get<DocumentAuditLog[]>(`/documents/${documentId}/audit`);
  }

  // ============ Bulk Operations ============

  /**
   * Bulk delete documents
   */
  async bulkDelete(documentIds: string[]): Promise<{ deleted: number; total: number }> {
    return apiClient.post('/documents/bulk/delete', { document_ids: documentIds });
  }

  /**
   * Bulk update documents
   */
  async bulkUpdate(request: BulkUpdateRequest): Promise<{ updated: number; total: number }> {
    return apiClient.post('/documents/bulk/update', request);
  }

  /**
   * Bulk download documents as zip
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async bulkDownload(documentIds: string[], _filename?: string): Promise<Blob> {
    const response = await apiClient.post<Blob>(
      '/documents/bulk/download',
      { document_ids: documentIds }
    );
    return response;
  }

  /**
   * Bulk add tags to documents
   */
  async bulkAddTags(request: BulkAddTagsRequest): Promise<{ updated: number; total: number }> {
    return apiClient.post('/documents/bulk/tags', request);
  }

  // ============ Utility Functions ============

  /**
   * Validate file before upload
   */
  validateFile(file: File, options?: FileValidationOptions): FileValidationResult {
    // Check file size
    if (options?.maxSize && file.size > options.maxSize) {
      const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB`,
      };
    }

    // Check MIME type
    if (options?.allowedTypes && !options.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }

    // Check file extension
    if (options?.allowedExtensions) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !options.allowedExtensions.includes(extension)) {
        return {
          valid: false,
          error: `File extension .${extension} is not allowed`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file icon based on extension
   */
  getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();

    const iconMap: Record<string, string> = {
      // Documents
      pdf: 'file-pdf',
      doc: 'file-word',
      docx: 'file-word',
      xls: 'file-excel',
      xlsx: 'file-excel',
      ppt: 'file-powerpoint',
      pptx: 'file-powerpoint',
      txt: 'file-text',

      // Images
      jpg: 'file-image',
      jpeg: 'file-image',
      png: 'file-image',
      gif: 'file-image',
      svg: 'file-image',
      webp: 'file-image',

      // Archives
      zip: 'file-archive',
      rar: 'file-archive',
      '7z': 'file-archive',
      tar: 'file-archive',
      gz: 'file-archive',

      // Code
      js: 'file-code',
      ts: 'file-code',
      jsx: 'file-code',
      tsx: 'file-code',
      html: 'file-code',
      css: 'file-code',
      json: 'file-code',
      xml: 'file-code',

      // Video
      mp4: 'file-video',
      avi: 'file-video',
      mov: 'file-video',
      wmv: 'file-video',

      // Audio
      mp3: 'file-audio',
      wav: 'file-audio',
      ogg: 'file-audio',
    };

    return iconMap[extension || ''] || 'file';
  }

  /**
   * Check if file is an image
   */
  isImage(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(extension || '');
  }

  /**
   * Check if file is a PDF
   */
  isPDF(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
  }

  /**
   * Check if file can be previewed
   */
  canPreview(filename: string): boolean {
    return this.isImage(filename) || this.isPDF(filename);
  }

  /**
   * Build document URL for preview
   */
  getDocumentUrl(documentId: string): string {
    return `/documents/${documentId}`;
  }

  /**
   * Build document download URL
   */
  getDownloadUrl(documentId: string): string {
    return `/api/v1/documents/${documentId}/download`;
  }
}

// Export singleton instance
export const documentService = new DocumentService();
