/**
 * Create Project Page
 * Form page for creating new projects with KMZ upload
 */

import { component$, useStore, $ } from '@builder.io/qwik';
import { useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import { ProjectCreateForm } from '../../../../components/projects/project-create-form';
import { createSSRApiClient, apiClient } from '../../../../services/api-client';
import type { CreateProjectRequest } from '../../../../types/project';

interface BusinessVertical {
  id: string;
  name: string;
  code: string;
}

// Load data with SSR support
export const useCreateProjectData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const businessesData = await ssrApiClient.get<any>('/admin/businesses');
    const businesses = businessesData?.businesses || businessesData?.data || businessesData || [];

    return {
      businessVerticals: Array.isArray(businesses) ? businesses : [],
    };
  } catch (error: any) {
    console.error('Failed to load business verticals:', error);
    return {
      businessVerticals: [],
      error: error.message || 'Failed to load data'
    };
  }
});

export default component$(() => {
  const nav = useNavigate();
  const initialData = useCreateProjectData();

  const state = useStore({
    businessVerticals: initialData.value.businessVerticals as BusinessVertical[],
    loading: false,
    error: (initialData.value as any).error || '',
  });

  const handleSubmit = $(async (data: CreateProjectRequest, kmzFile?: File) => {
    console.debug('[CreateProject] Submitting payload:', data);
    
    // Transform dates to RFC3339 format for Go backend (or null if empty)
    const payload: any = {
      code: data.code,
      name: data.name,
      description: data.description || undefined,
      business_vertical_id: data.business_vertical_id,
      start_date: data.start_date ? `${data.start_date}T00:00:00Z` : undefined,
      end_date: data.end_date ? `${data.end_date}T23:59:59Z` : undefined,
      total_budget: data.total_budget,
      currency: data.currency || 'INR',
    };
    
    // Remove undefined fields so they're not sent as null
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    
    console.debug('[CreateProject] Transformed payload:', payload);
    
    let createResponse: any;
    try {
      // Post directly to /admin/projects with transformed payload
      createResponse = await apiClient.post('/admin/projects', payload);
    } catch (err: any) {
      console.error('[CreateProject] Submit failed:', err);
      // Pass through the actual error message from backend
      const errorMsg = err?.data?.raw || err?.message || 'Failed to create project';
      throw new Error(errorMsg);
    }

    console.debug('[CreateProject] Create response:', createResponse);

    // Accept multiple possible response shapes
    const projectId =
      createResponse?.project?.id ||
      createResponse?.data?.project?.id ||
      createResponse?.data?.id ||
      createResponse?.id;

    if (!projectId) {
      console.error('[CreateProject] Could not determine projectId from response');
      throw new Error('Project created, but no project ID returned by API');
    }

    // Upload KMZ file if provided
    if (kmzFile) {
      console.debug('[CreateProject] Uploading KMZ for project:', projectId, kmzFile?.name);
  const formData = new FormData();
  // Backend expects field name 'kmz_file'
  formData.append('kmz_file', kmzFile, kmzFile.name);
      let uploaded = false;
      try {
  await apiClient.upload(`/projects/${projectId}/kmz`, formData);
        uploaded = true;
      } catch (err: any) {
        console.warn('[CreateProject] Primary KMZ upload failed, trying admin endpoint...', err);
        // Fallback to admin endpoint if available
        try {
          await apiClient.upload(`/admin/projects/${projectId}/kmz`, formData);
          uploaded = true;
        } catch (err2: any) {
          console.error('[CreateProject] KMZ upload failed on both endpoints:', err2);
          // Don't block project creation on KMZ upload failure; navigate with query flag
          nav(`/admin/projects/${projectId}?kmz=failed`);
          return;
        }
      }
      if (uploaded) {
        console.debug('[CreateProject] KMZ upload successful');
      }
    }

    // Navigate to project detail page
    nav(`/admin/projects/${projectId}`);
  });

  const handleCancel = $(() => {
    nav('/admin/projects');
  });

  return (
    <div class="container mx-auto px-4 py-6">
      {/* Header */}
      <div class="mb-6">
        <button
          onClick$={handleCancel}
          class="text-sm text-gray-600 hover:text-gray-900 mb-3 flex items-center gap-1"
        >
          <i class="i-mdi-arrow-left"></i>
          Back to Projects
        </button>
        <h1 class="text-2xl font-bold text-gray-900 mb-1">Create New Project</h1>
        <p class="text-sm text-gray-600">Add a new project and optionally upload KMZ file</p>
      </div>

      {/* Error Message */}
      {state.error && (
        <div class="alert-error mb-6 p-4 rounded-md">
          <i class="i-mdi-alert-circle mr-2"></i>
          {state.error}
        </div>
      )}

      {/* Loading State */}
      {state.loading && (
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="animate-pulse space-y-4">
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
            <div class="h-10 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
            <div class="h-10 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
            <div class="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      )}

      {/* Form */}
      {!state.loading && (
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ProjectCreateForm
            businessVerticals={state.businessVerticals}
            onSubmit$={handleSubmit}
            onCancel$={handleCancel}
          />
        </div>
      )}
    </div>
  );
});
