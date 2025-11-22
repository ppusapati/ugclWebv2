// src/services/file.service.ts
/**
 * File Upload & Management Service
 * Handles file uploads, downloads, and file management
 */

import { apiClient } from './api-client';
import type { FileUploadResponse } from './types';

class FileService {
  /**
   * Upload single file
   */
  async uploadFile(file: File, folder?: string): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    return apiClient.upload<FileUploadResponse>('/files/upload', formData);
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files: File[], folder?: string): Promise<FileUploadResponse[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await apiClient.upload<{ files: FileUploadResponse[] }>(
      '/files/upload',
      formData
    );
    return response.files;
  }

  /**
   * Download file
   */
  async downloadFile(fileUrl: string, filename?: string): Promise<Blob> {
    return apiClient.download(fileUrl, filename);
  }

  /**
   * Get file URL
   */
  getFileUrl(filename: string): string {
    // Check if it's already a full URL
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }

    // Otherwise, construct URL
    const baseUrl = apiClient['baseUrl'] || 'http://localhost:8080/api/v1';
    return `${baseUrl}/uploads/${filename}`;
  }

  /**
   * Validate file before upload
   */
  validateFile(
    file: File,
    options?: {
      maxSize?: number; // in bytes
      allowedTypes?: string[]; // MIME types
      allowedExtensions?: string[]; // e.g., ['jpg', 'png', 'pdf']
    }
  ): { valid: boolean; error?: string } {
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
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file extension
   */
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if file is an image
   */
  isImage(filename: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    return imageExtensions.includes(this.getFileExtension(filename));
  }

  /**
   * Check if file is a PDF
   */
  isPdf(filename: string): boolean {
    return this.getFileExtension(filename) === 'pdf';
  }

  /**
   * Check if file is an Excel file
   */
  isExcel(filename: string): boolean {
    const excelExtensions = ['xls', 'xlsx', 'xlsm', 'xlsb'];
    return excelExtensions.includes(this.getFileExtension(filename));
  }

  /**
   * Create a preview URL for a file
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke preview URL to free memory
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const fileService = new FileService();
export { FileService };
