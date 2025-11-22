// Document Management System types for frontend

export type DocumentStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'archived'
  | 'deleted';

export type DocumentAccessLevel =
  | 'none'
  | 'view'
  | 'comment'
  | 'edit'
  | 'manage';

export type DocumentAuditAction =
  | 'create'
  | 'view'
  | 'download'
  | 'edit'
  | 'delete'
  | 'share'
  | 'unshare'
  | 'version_create'
  | 'version_rollback'
  | 'permission_change'
  | 'status_change';

// Document Category
export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  parent?: DocumentCategory;
  color?: string;
  icon?: string;
  business_vertical_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Document Tag
export interface DocumentTag {
  id: string;
  name: string;
  color?: string;
  business_vertical_id?: string;
  created_at: string;
  updated_at: string;
}

// Document
export interface Document {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_extension: string;
  file_path: string;
  file_hash?: string;
  thumbnail_path?: string;
  preview_path?: string;
  status: DocumentStatus;
  version: number;
  category_id?: string;
  category?: DocumentCategory;
  tags?: DocumentTag[];
  metadata?: Record<string, any>;
  business_vertical_id?: string;
  uploaded_by_id: string;
  uploaded_by?: {
    id: string;
    name: string;
    email: string;
  };
  workflow_id?: string;
  current_state?: string;
  expires_at?: string;
  is_public: boolean;
  download_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// Document Version
export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  file_hash?: string;
  change_log?: string;
  created_by_id: string;
  created_by?: {
    id: string;
    name: string;
    email: string;
  };
  created_at: string;
  is_current_version: boolean;
}

// Document Permission
export interface DocumentPermission {
  id: string;
  document_id: string;
  user_id?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  role_id?: string;
  role?: {
    id: string;
    name: string;
  };
  business_role_id?: string;
  business_role?: {
    id: string;
    name: string;
  };
  access_level: DocumentAccessLevel;
  can_download: boolean;
  can_share: boolean;
  can_delete: boolean;
  expires_at?: string;
  granted_by_id: string;
  granted_by?: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

// Document Share
export interface DocumentShare {
  id: string;
  document_id: string;
  share_token: string;
  access_level: DocumentAccessLevel;
  can_download: boolean;
  max_access: number;
  access_count: number;
  expires_at?: string;
  created_by_id: string;
  created_by?: {
    id: string;
    name: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Document Audit Log
export interface DocumentAuditLog {
  id: string;
  document_id: string;
  user_id?: string;
  user?: {
    id: string;
    name: string;
  };
  action: DocumentAuditAction;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Document Retention Policy
export interface DocumentRetentionPolicy {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  business_vertical_id?: string;
  retention_days: number;
  auto_archive: boolean;
  auto_delete: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Request/Response types

export interface DocumentUploadRequest {
  title: string;
  description?: string;
  category_id?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  business_vertical_id?: string;
  workflow_id?: string;
  is_public?: boolean;
  file: File;
}

export interface DocumentUpdateRequest {
  title?: string;
  description?: string;
  category_id?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  status?: DocumentStatus;
}

export interface DocumentListParams {
  page?: number;
  limit?: number;
  category_id?: string;
  status?: DocumentStatus;
  search?: string;
  business_vertical_id?: string;
  tag?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateShareRequest {
  access_level: DocumentAccessLevel;
  can_download: boolean;
  password?: string;
  max_access?: number;
  expires_at?: string;
}

export interface CreatePermissionRequest {
  user_id?: string;
  role_id?: string;
  business_role_id?: string;
  access_level: DocumentAccessLevel;
  can_download: boolean;
  can_share: boolean;
  can_delete: boolean;
  expires_at?: string;
}

export interface BulkOperationRequest {
  document_ids: string[];
}

export interface BulkUpdateRequest extends BulkOperationRequest {
  updates: Partial<DocumentUpdateRequest>;
}

export interface BulkAddTagsRequest extends BulkOperationRequest {
  tag_names: string[];
}

export interface DocumentStatistics {
  total_documents: number;
  total_size: number;
  documents_by_status: Record<DocumentStatus, number>;
  documents_by_type: Record<string, number>;
  recent_uploads: Document[];
  top_categories: Array<{
    category_id: string;
    category_name: string;
    count: number;
  }>;
  total_downloads: number;
  total_views: number;
}

export interface VersionComparisonResponse {
  version1: DocumentVersion;
  version2: DocumentVersion;
  differences: {
    file_name_changed: boolean;
    file_size_delta: number;
    content_changed: boolean;
  };
}

export interface SharedDocumentAccessResponse {
  document: Document;
  access_level: DocumentAccessLevel;
  can_download: boolean;
  password_required?: boolean;
}

// Category operations
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  business_vertical_id?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
}

// Tag operations
export interface CreateTagRequest {
  name: string;
  color?: string;
  business_vertical_id?: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
}

// File validation
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // MIME types
  allowedExtensions?: string[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}
