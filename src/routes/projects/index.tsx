/**
 * Projects List Page
 * Displays all projects with filtering and search
 */

import { component$, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import { ProjectCard } from '~/components/projects/project-card';
import { Alert, Btn, FormField, PageHeader } from '~/components/ds';
import { createSSRApiClient, apiClient } from '~/services/api-client';
import type { Project, ProjectListResponse } from '~/types/project';

interface BusinessVertical {
  id: string;
  name: string;
  code: string;
}

const extractProjects = (payload: any): Project[] => {
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload?.projects,
    payload?.data?.projects,
    payload?.data?.data?.projects,
    payload?.result?.projects,
    payload?.items,
    payload?.data,
  ];

  for (const item of candidates) {
    if (Array.isArray(item)) return item;
  }

  return [];
};

const extractBusinessVerticals = (payload: any): BusinessVertical[] => {
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload?.businesses,
    payload?.data?.businesses,
    payload?.data?.data?.businesses,
    payload?.data,
    payload?.items,
  ];

  for (const item of candidates) {
    if (Array.isArray(item)) return item;
  }

  return [];
};

// Load data with SSR support
export const useProjectsData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    // Load projects and business verticals separately for better error tracking
    let projectsResponse: any = { projects: [] };
    try {
      projectsResponse = await ssrApiClient.get<ProjectListResponse>('/projects');
    } catch (projError: any) {
      // Don't throw - continue to load other data
    }

    let businessesData: any = {};
    try {
      businessesData = await ssrApiClient.get<any>('/admin/businesses');
    } catch (bizError: any) {
      // Don't throw - continue with empty businesses
    }

    return {
      projects: extractProjects(projectsResponse),
      businessVerticals: extractBusinessVerticals(businessesData),
    };
  } catch (error: any) {
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

      const response = await apiClient.get<ProjectListResponse>('/projects', params);
      state.projects = extractProjects(response);
      state.error = '';
    } catch (error: any) {
      state.error = error.message || 'Failed to load projects';
    } finally {
      state.loading = false;
    }
  });

  useVisibleTask$(async () => {
    if (state.projects.length === 0) {
      await loadProjects();
    }
  });

  const handleViewProject = $((project: Project) => {
    nav(`/projects/${project.id}`);
  });

  const handleCreateProject = $(() => {
    nav('/projects/create');
  });

  const clearFilters = $(() => {
    state.filters.business_vertical_id = '';
    state.filters.status = '';
    state.filters.search = '';
    loadProjects();
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

  const totalProjects = state.projects.length;
  const activeProjects = state.projects.filter((project) => project.status === 'active').length;
  const completedProjects = state.projects.filter((project) => project.status === 'completed').length;
  const mappedProjects = state.projects.filter((project) => !!project.kmz_file_name).length;
  const hasActiveFilters =
    !!state.filters.business_vertical_id ||
    !!state.filters.status ||
    !!state.filters.search;

  return (
    <div class="project-route-shell">
      <PageHeader title="Projects" subtitle="Manage your construction projects">
        <Btn
          q:slot="actions"
          onClick$={handleCreateProject}
        >
          <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-2"></i>
          New Project
        </Btn>
      </PageHeader>

      <section class="project-kpi-grid">
        <article class="project-kpi-card">
          <span class="project-kpi-label">Total Projects</span>
          <span class="project-kpi-value">{totalProjects}</span>
          <span class="project-kpi-footnote">Across all business verticals</span>
        </article>
        <article class="project-kpi-card">
          <span class="project-kpi-label">Active</span>
          <span class="project-kpi-value">{activeProjects}</span>
          <span class="project-kpi-footnote">Currently running</span>
        </article>
        <article class="project-kpi-card">
          <span class="project-kpi-label">Completed</span>
          <span class="project-kpi-value">{completedProjects}</span>
          <span class="project-kpi-footnote">Delivered projects</span>
        </article>
        <article class="project-kpi-card">
          <span class="project-kpi-label">Mapped</span>
          <span class="project-kpi-value">{mappedProjects}</span>
          <span class="project-kpi-footnote">KMZ data available</span>
        </article>
      </section>

      {/* Filters */}
      <section class="project-surface project-toolbar">
        <div class="project-toolbar-grid">
          {/* Search */}
          <FormField label="Search">
            <input
              type="text"
              class="form-input w-full"
              placeholder="Search by name, code, or description"
              value={state.filters.search}
              onInput$={(e) => {
                state.filters.search = (e.target as HTMLInputElement).value;
              }}
            />
          </FormField>

          {/* Business Vertical Filter */}
          <FormField id="project-business-vertical" label="Business Vertical">
            <select
              id="project-business-vertical"
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
          </FormField>

          {/* Status Filter */}
          <FormField id="project-status-filter" label="Status">
            <select
              id="project-status-filter"
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
          </FormField>
        </div>

        <div class="project-toolbar-actions">
          <span class="project-toolbar-meta">
            Showing {filteredProjects.length} of {state.projects.length} projects
          </span>
          {hasActiveFilters && (
            <Btn variant="secondary" size="sm" onClick$={clearFilters}>
              Clear Filters
            </Btn>
          )}
        </div>
      </section>

      {/* Error Message */}
      {state.error && (
        <Alert variant="error" class="mb-6">
          <i class="i-heroicons-exclamation-circle-solid w-4 h-4 inline-block mr-2"></i>
          {state.error}
        </Alert>
      )}

      {/* Loading State */}
      {state.loading && (
        <div class="project-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} class="project-panel animate-pulse">
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
        <div class="project-grid">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onView$={handleViewProject}
              />
            ))}
        </div>
      )}

      {/* Empty State */}
      {!state.loading && filteredProjects.length === 0 && (
        <div class="project-empty-state">
          <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <i class="i-heroicons-folder-open w-16 h-16 inline-block text-gray-400"></i>
          </div>
          <h3>No projects found</h3>
          <p>
            {state.projects.length === 0
              ? "Get started by creating your first project"
              : "Try adjusting your filters"
            }
          </p>

          {state.projects.length > 0 && hasActiveFilters && (
            <Btn variant="secondary" onClick$={clearFilters} class="mr-2">
              Reset Filters
            </Btn>
          )}

          {state.projects.length === 0 && (
            <Btn
              onClick$={handleCreateProject}
            >
              <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-2"></i>
              Create First Project
            </Btn>
          )}
        </div>
      )}
    </div>
  );
});
