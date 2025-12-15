// src/services/index.ts
/**
 * Central export for all services
 * Import services from this file throughout the application
 */

// API Client
export { apiClient, createSSRApiClient } from './api-client';
export type { ApiError } from './api-client';

// Types
export * from './types';

// Services
export { authService, AuthService } from './auth-enhanced.service';
export { businessService, BusinessService } from './business.service';
export { siteService, SiteService } from './site.service';
export { roleService, RoleService } from './role.service';
export { userService, UserService } from './user.service';
export { reportService, ReportService, REPORT_ENDPOINTS } from './report.service';
export type { ReportType, ReportKey } from './report.service';
export { fileService, FileService } from './file.service';
export { kpiService, KpiService } from './kpi.service';
export { formService, FormService } from './form.service';
export { workflowService, WorkflowService } from './workflow.service';
export { formBuilderService, FormBuilderService } from './form-builder.service';
export { userAttributeService } from './user-attribute.service';
export { resourceAttributeService } from './resource-attribute.service';
export { chatService, ChatService } from './chat.service';

// Legacy auth service (for backward compatibility)
export { authService as authServiceLegacy } from './auth.service';

// Report configurations
export { REPORT_CONFIGS, getReportConfig } from '../config/report-types';
export type { ReportConfig, ReportFieldConfig } from '../config/report-types';
