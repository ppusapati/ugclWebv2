/**
 * Projects List Page
 * Displays all projects with filtering and search
 */

import { component$, useStore, $ } from '@builder.io/qwik';
import { useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import { ProjectCard } from '../../../components/projects/project-card';
import { createSSRApiClient, apiClient } from '../../../services/api-client';
import type { Project, ProjectListResponse } from '../../../types/project';

interface BusinessVertical {
  id: string;
  name: string;
  code: string;
}

// Load data with SSR support
export const useProjectsData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  console.log('🚀 [PROJECTS LOADER] Starting data fetch - NEW CODE v1.1');

  try {
    // Load projects and business verticals separately for better error tracking
    console.log('📡 [PROJECTS LOADER] Fetching from /admin/projects endpoint');

    let projectsResponse: any = { projects: [] };
    try {
      projectsResponse = await ssrApiClient.get<ProjectListResponse>('/admin/projects');
      console.log('✅ [PROJECTS LOADER] Projects fetched successfully');
    } catch (projError: any) {
      console.error('❌ [PROJECTS LOADER] Failed to fetch projects:', projError);
      // Don't throw - continue to load other data
    }

    let businessesData: any = {};
    try {
      businessesData = await ssrApiClient.get<any>('/admin/businesses');
      console.log('✅ [PROJECTS LOADER] Businesses fetched successfully');
    } catch (bizError: any) {
      console.error('❌ [PROJECTS LOADER] Failed to fetch businesses:', bizError);
      // Don't throw - continue with empty businesses
    }

    console.log('RAW businessesData response:', JSON.stringify(businessesData, null, 2));
    console.log('businessesData keys:', Object.keys(businessesData || {}));
    console.log('businessesData.businesses:', businessesData?.businesses);
    console.log('businessesData.data:', businessesData?.data);

    // Handle different response structures
    const projects = projectsResponse?.projects || projectsResponse || [];
    const businesses = businessesData?.businesses || businessesData?.data || businessesData || [];

    console.log('SSR Loaded Projects count:', projects.length);
    console.log('SSR Loaded Business Verticals count:', businesses.length);
    console.log('SSR Business Verticals:', businesses);

    return {
      projects: Array.isArray(projects) ? projects : [],
      businessVerticals: Array.isArray(businesses) ? businesses : [],
    };
  } catch (error: any) {
    console.error('💥 [PROJECTS LOADER] Failed to load projects data:', error);
    return {
      projects: [],
      businessVerticals: [],
      error: error.message || 'Failed to load data'
    };
  }
});

export default component$(() => {
  const nav = useNavigate();
  const initialData = useProjectsData();

  const state = useStore({
    projects: initialData.value.projects as Project[],
    businessVerticals: initialData.value.businessVerticals as BusinessVertical[],
    loading: false,
    error: (initialData.value as any).error || '',
    filters: {
      business_vertical_id: '',
      status: '',
      search: '',
    },
  });

  const loadProjects = $(async () => {
    try {
      state.loading = true;
      const params: any = {};

      if (state.filters.business_vertical_id) {
        params.business_vertical_id = state.filters.business_vertical_id;
      }
      if (state.filters.status) {
        params.status = state.filters.status;
      }

      const response = await apiClient.get<ProjectListResponse>('/admin/projects', params);
      state.projects = response.projects || [];
    } catch (error: any) {
      state.error = error.message || 'Failed to load projects';
    } finally {
      state.loading = false;
    }
  });

  const handleViewProject = $((project: Project) => {
    nav(`/admin/projects/${project.id}`);
  });

  const handleCreateProject = $(() => {
    nav('/admin/projects/create');
  });

  const filteredProjects = state.projects.filter(project => {
    if (state.filters.search) {
      const search = state.filters.search.toLowerCase();
      return (
        project.name.toLowerCase().includes(search) ||
        project.code.toLowerCase().includes(search) ||
        project.description?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div class="container mx-auto px-4 py-6">
      {/* Debug Info */}
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h3 class="font-semibold text-sm mb-2">Debug Info:</h3>
        <p class="text-xs">Business Verticals Count: {state.businessVerticals.length}</p>
        <p class="text-xs">Projects Count: {state.projects.length}</p>
        {state.businessVerticals.length > 0 && (
          <details class="text-xs mt-2">
            <summary class="cursor-pointer font-medium">View Business Verticals</summary>
            <pre class="mt-2 bg-white p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(state.businessVerticals, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* Header */}
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1">Projects</h1>
          <p class="text-sm text-gray-600">Manage your construction projects</p>
        </div>
        <button
          onClick$={handleCreateProject}
          class="btn btn-primary"
        >
          <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-2"></i>
          New Project
        </button>
      </div>

      {/* Filters */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div class="md:col-span-2">
            <label class="form-label text-xs mb-1">Search</label>
            <input
              type="text"
              class="form-input w-full"
              placeholder="Search by name, code, or description..."
              value={state.filters.search}
              onInput$={(e) => {
                state.filters.search = (e.target as HTMLInputElement).value;
              }}
            />
          </div>

          {/* Business Vertical Filter */}
          <div>
            <label class="form-label text-xs mb-1">Business Vertical</label>
            <select
              class="form-input w-full"
              value={state.filters.business_vertical_id}
              onChange$={(e) => {
                state.filters.business_vertical_id = (e.target as HTMLSelectElement).value;
                loadProjects();
              }}
            >
              <option value="">All Verticals</option>
              {state.businessVerticals.map(bv => (
                <option key={bv.id} value={bv.id}>{bv.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label class="form-label text-xs mb-1">Status</label>
            <select
              class="form-input w-full"
              value={state.filters.status}
              onChange$={(e) => {
                state.filters.status = (e.target as HTMLSelectElement).value;
                loadProjects();
              }}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {state.error && (
        <div class="alert-error mb-6 p-4 rounded-md">
          <i class="i-heroicons-exclamation-circle-solid w-4 h-4 inline-block mr-2"></i>
          {state.error}
        </div>
      )}

      {/* Loading State */}
      {state.loading && (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
              <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div class="h-20 bg-gray-200 rounded mb-4"></div>
              <div class="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Projects Grid */}
      {!state.loading && filteredProjects.length > 0 && (
        <>
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm text-gray-600">
              Showing {filteredProjects.length} of {state.projects.length} projects
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onView$={handleViewProject}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!state.loading && filteredProjects.length === 0 && (
        <div class="text-center py-12">
          <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <i class="i-heroicons-folder-open w-16 h-16 inline-block text-gray-400"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
          <p class="text-sm text-gray-600 mb-6">
            {state.projects.length === 0
              ? "Get started by creating your first project"
              : "Try adjusting your filters"
            }
          </p>
          {state.projects.length === 0 && (
            <button
              onClick$={handleCreateProject}
              class="btn btn-primary"
            >
              <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-2"></i>
              Create First Project
            </button>
          )}
        </div>
      )}
    </div>
  );
});
