/**
 * Project Detail Page
 * Displays project information with map visualization and tabs
 */

import { component$, useStore, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { ProjectMap } from '../../../../components/maps/project-map';
import { ProjectStatsCard } from '../../../../components/projects/project-stats-card';
import { TaskCard } from '../../../../components/tasks/task-card';
import { projectService } from '../../../../services/project.service';
import { taskService } from '../../../../services/task.service';
import type { Project, Zone, Node, GeoJSONFeatureCollection, Task } from '../../../../types/project';

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const projectId = loc.params.projectId;

  const activeTab = useSignal<'overview' | 'map' | 'tasks' | 'budget'>('overview');

  const state = useStore({
    project: null as Project | null,
    stats: null as any,
    zones: [] as Zone[],
    nodes: [] as Node[],
    tasks: [] as Task[],
    geojsonData: null as GeoJSONFeatureCollection | null,
    loading: true,
    loadingTasks: false,
    error: '',
  });

  // KMZ upload local state
  const kmz = useStore({
    file: null as File | null,
    uploading: false,
    error: '',
    success: '',
  });

  // Load project data
  useVisibleTask$(async () => {
    try {
      // Load project details
      const project = await projectService.getProject(projectId);
      state.project = project;

      // Load project stats
      const stats = await projectService.getProjectStats(projectId);
      state.stats = stats;

      // Load zones
      const zonesResponse = await projectService.getProjectZones(projectId);
      state.zones = zonesResponse.zones || [];

      // Load nodes
      const nodesResponse = await projectService.getProjectNodes(projectId);
      state.nodes = nodesResponse.nodes || [];

      // Load GeoJSON for map
      if (project.kmz_file_name) {
        try {
          const geojson = await projectService.getProjectGeoJSON(projectId);
          state.geojsonData = geojson;
        } catch (err) {
          console.warn('Failed to load GeoJSON:', err);
        }
      }

    } catch (error: any) {
      state.error = error.message || 'Failed to load project';
    } finally {
      state.loading = false;
    }
  });

  // Load tasks when tasks tab is active
  const loadTasks = $(async () => {
    if (state.tasks.length > 0) return; // Already loaded

    try {
      state.loadingTasks = true;
      const response = await taskService.listTasks({ project_id: projectId });
      state.tasks = response.tasks || [];
    } catch (error: any) {
      console.error('Failed to load tasks:', error);
    } finally {
      state.loadingTasks = false;
    }
  });

  const handleNodeClick = $((node: Node) => {
    console.log('Node clicked:', node);
    // Could open a modal or navigate to node detail
  });

  const handleZoneClick = $((zone: Zone) => {
    console.log('Zone clicked:', zone);
    // Could open a modal or navigate to zone detail
  });

  const handleViewTask = $((task: Task) => {
    nav(`/admin/tasks/${task.id}`);
  });

  const handleCreateTask = $(() => {
    nav(`/admin/projects/${projectId}/tasks/create`);
  });

  const onKmzFileChange = $((e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    kmz.file = null;
    kmz.error = '';
    kmz.success = '';
    if (file) {
      if (!file.name.toLowerCase().endsWith('.kmz')) {
        kmz.error = 'Please select a .kmz file';
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        kmz.error = 'File must be less than 50MB';
        return;
      }
      kmz.file = file;
    }
  });

  const uploadKmz = $(async () => {
    if (!kmz.file) {
      kmz.error = 'Please choose a KMZ file first';
      return;
    }
    try {
      kmz.uploading = true;
      kmz.error = '';
      kmz.success = '';
      await projectService.uploadKMZ(projectId, kmz.file);
      kmz.success = 'KMZ uploaded successfully';
      // Refresh geojson, zones, and nodes
      try {
        const zonesResponse = await projectService.getProjectZones(projectId);
        state.zones = zonesResponse.zones || [];
        const nodesResponse = await projectService.getProjectNodes(projectId);
        state.nodes = nodesResponse.nodes || [];
        const geojson = await projectService.getProjectGeoJSON(projectId);
        state.geojsonData = geojson;
      } catch (refreshErr) {
        console.warn('KMZ uploaded but failed to refresh map data:', refreshErr);
      }
    } catch (err: any) {
      kmz.error = err?.message || 'Failed to upload KMZ';
    } finally {
      kmz.uploading = false;
    }
  });

  if (state.loading) {
    return (
      <div class="container mx-auto px-4 py-6">
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div class="h-64 bg-gray-200 rounded mb-6"></div>
          <div class="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} class="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state.error || !state.project) {
    return (
      <div class="container mx-auto px-4 py-6">
        <div class="alert-error p-4 rounded-md">
          <i class="i-heroicons-exclamation-circle-solid w-4 h-4 inline-block mr-2"></i>
          {state.error || 'Project not found'}
        </div>
      </div>
    );
  }

  return (
    <div class="container mx-auto px-4 py-6">
      {/* KMZ upload failure banner via query param */}
      {loc.url.searchParams.get('kmz') === 'failed' && (
        <div class="alert-error p-3 rounded-md mb-4 text-sm flex items-start gap-2">
          <i class="i-heroicons-exclamation-triangle-solid w-4 h-4 inline-block mt-0.5"></i>
          <div>
            KMZ upload failed. Go to the Map tab to retry uploading the KMZ file.
          </div>
        </div>
      )}

      {/* Header */}
      <div class="mb-6">
        <button
          onClick$={() => nav('/admin/projects')}
          class="text-sm text-gray-600 hover:text-gray-900 mb-3 flex items-center gap-1"
        >
          <i class="i-heroicons-arrow-left w-4 h-4 inline-block"></i>
          Back to Projects
        </button>

        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-bold text-gray-900">{state.project.name}</h1>
              <span class={`px-3 py-1 rounded-full text-xs font-medium ${
                state.project.status === 'active' ? 'bg-green-100 text-green-800' :
                state.project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                state.project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {state.project.status}
              </span>
            </div>
            <p class="text-sm text-gray-600 mb-2">Code: {state.project.code}</p>
            {state.project.description && (
              <p class="text-sm text-gray-700">{state.project.description}</p>
            )}
          </div>

          <div class="flex gap-2">
            <button class="btn btn-secondary">
              <i class="i-heroicons-pencil-square-solid w-4 h-4 inline-block text-white mr-2"></i>
              Edit
            </button>
            <button class="btn btn-primary" onClick$={handleCreateTask}>
              <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-2"></i>
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {state.stats && (
        <div class="mb-6">
          <ProjectStatsCard stats={state.stats} />
        </div>
      )}

      {/* Tabs */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div class="border-b border-gray-200">
          <div class="flex gap-1 p-2">
            <button
              onClick$={() => { activeTab.value = 'overview'; }}
              class={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab.value === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i class="i-heroicons-information-circle w-4 h-4 inline-block mr-2"></i>
              Overview
            </button>
            <button
              onClick$={() => { activeTab.value = 'map'; }}
              class={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab.value === 'map'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i class="i-heroicons-map-solid w-4 h-4 inline-block mr-2"></i>
              Map View
            </button>
            <button
              onClick$={() => {
                activeTab.value = 'tasks';
                loadTasks();
              }}
              class={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab.value === 'tasks'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i class="i-heroicons-clipboard-document-list-solid w-4 h-4 inline-block mr-2"></i>
              Tasks ({state.stats?.total_tasks || 0})
            </button>
            <button
              onClick$={() => { activeTab.value = 'budget'; }}
              class={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab.value === 'budget'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i class="i-heroicons-currency-dollar-solid w-4 h-4 inline-block mr-2"></i>
              Budget
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div class="p-6">
          {/* Overview Tab */}
          {activeTab.value === 'overview' && (
            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Info */}
                <div class="bg-gray-50 rounded-lg p-4">
                  <h3 class="text-sm font-semibold text-gray-900 mb-3">Project Information</h3>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Code:</span>
                      <span class="font-medium text-gray-900">{state.project.code}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Status:</span>
                      <span class="font-medium text-gray-900 capitalize">{state.project.status}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Progress:</span>
                      <span class="font-medium text-gray-900">{state.project.progress}%</span>
                    </div>
                    {state.project.created_at && (
                      <div class="flex justify-between">
                        <span class="text-gray-600">Created:</span>
                        <span class="font-medium text-gray-900">
                          {new Date(state.project.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Budget Info */}
                <div class="bg-gray-50 rounded-lg p-4">
                  <h3 class="text-sm font-semibold text-gray-900 mb-3">Budget Overview</h3>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Total Budget:</span>
                      <span class="font-medium text-gray-900">
                        ₹{(state.project.total_budget / 100000).toFixed(2)}L
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Allocated:</span>
                      <span class="font-medium text-gray-900">
                        ₹{(state.project.allocated_budget / 100000).toFixed(2)}L
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Spent:</span>
                      <span class="font-medium text-gray-900">
                        ₹{(state.project.spent_budget / 100000).toFixed(2)}L
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Remaining:</span>
                      <span class="font-medium text-green-700">
                        ₹{((state.project.total_budget - state.project.spent_budget) / 100000).toFixed(2)}L
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zones & Nodes Summary */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-blue-50 rounded-lg p-4">
                  <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="i-heroicons-map-solid w-5 h-5 inline-block text-blue-600"></i>
                    Zones ({state.zones.length})
                  </h3>
                  {state.zones.length > 0 ? (
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                      {state.zones.map(zone => (
                        <div key={zone.id} class="bg-white rounded p-2 text-sm">
                          <div class="font-medium text-gray-900">{zone.name}</div>
                          {zone.area && (
                            <div class="text-xs text-gray-600">Area: {zone.area.toFixed(2)} sq m</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p class="text-sm text-gray-600">No zones available</p>
                  )}
                </div>

                <div class="bg-green-50 rounded-lg p-4">
                  <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="i-heroicons-map-pin-solid w-5 h-5 inline-block text-green-600"></i>
                    Nodes ({state.nodes.length})
                  </h3>
                  {state.nodes.length > 0 ? (
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                      {state.nodes.slice(0, 10).map(node => (
                        <div key={node.id} class="bg-white rounded p-2 text-sm flex items-center justify-between">
                          <div>
                            <div class="font-medium text-gray-900">{node.name}</div>
                            <div class="text-xs text-gray-600 capitalize">{node.node_type}</div>
                          </div>
                          <span class={`text-xs px-2 py-1 rounded ${
                            node.status === 'available' ? 'bg-green-100 text-green-700' :
                            node.status === 'allocated' ? 'bg-blue-100 text-blue-700' :
                            node.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {node.status}
                          </span>
                        </div>
                      ))}
                      {state.nodes.length > 10 && (
                        <p class="text-xs text-gray-600 text-center pt-2">
                          +{state.nodes.length - 10} more nodes
                        </p>
                      )}
                    </div>
                  ) : (
                    <p class="text-sm text-gray-600">No nodes available</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Map Tab */}
          {activeTab.value === 'map' && (
            <div>
              {state.geojsonData || state.zones.length > 0 || state.nodes.length > 0 ? (
                <ProjectMap
                  geojsonData={state.geojsonData || undefined}
                  zones={state.zones}
                  nodes={state.nodes}
                  height="600px"
                  onNodeClick$={handleNodeClick}
                  onZoneClick$={handleZoneClick}
                />
              ) : (
                <div class="text-center py-12 bg-gray-50 rounded-lg">
                  <i class="i-heroicons-map w-16 h-16 inline-block text-gray-400 mb-3"></i>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">No Map Data Available</h3>
                  <p class="text-sm text-gray-600 mb-4">Upload a KMZ file to view the project on a map</p>
                  <div class="mx-auto max-w-md bg-white rounded-md border border-gray-200 p-4 text-left">
                    {kmz.error && (
                      <div class="alert-error p-2 rounded text-xs mb-3">{kmz.error}</div>
                    )}
                    {kmz.success && (
                      <div class="alert-success p-2 rounded text-xs mb-3">{kmz.success}</div>
                    )}
                    <label class="form-label text-xs">Select KMZ file</label>
                    <input
                      type="file"
                      accept=".kmz"
                      class="form-input w-full mb-3"
                      onChange$={onKmzFileChange}
                    />
                    <button
                      class="btn btn-primary w-full"
                      disabled={kmz.uploading}
                      onClick$={uploadKmz}
                    >
                      {kmz.uploading ? 'Uploading...' : 'Upload KMZ'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab.value === 'tasks' && (
            <div>
              {state.loadingTasks ? (
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} class="bg-gray-100 rounded-lg p-4 animate-pulse h-64"></div>
                  ))}
                </div>
              ) : state.tasks.length > 0 ? (
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.tasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onView$={handleViewTask}
                    />
                  ))}
                </div>
              ) : (
                <div class="text-center py-12 bg-gray-50 rounded-lg">
                  <i class="i-heroicons-clipboard-document-list w-16 h-16 inline-block text-gray-400 mb-3"></i>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">No Tasks Yet</h3>
                  <p class="text-sm text-gray-600 mb-4">Create your first task to get started</p>
                  <button onClick$={handleCreateTask} class="btn btn-primary">
                    <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-2"></i>
                    Create Task
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Budget Tab */}
          {activeTab.value === 'budget' && (
            <div class="text-center py-12 bg-gray-50 rounded-lg">
              <i class="i-heroicons-currency-dollar-solid w-16 h-16 inline-block text-gray-400 mb-3"></i>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Budget Management</h3>
              <p class="text-sm text-gray-600">Budget allocation and tracking will be shown here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
