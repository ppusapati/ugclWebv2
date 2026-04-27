/**
 * Project Detail Page
 * Displays project information with map visualization and tabs
 */

import {
  component$,
  useStore,
  useSignal,
  useResource$,
  Resource,
  $,
  noSerialize,
  type NoSerialize,
} from '@builder.io/qwik';
import { routeLoader$, useLocation, useNavigate } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services/api-client';
import { Alert, Badge, Btn, TabBar } from '~/components/ds';
import { projectService } from '~/services/project.service';
import { taskService } from '~/services/task.service';
import { ProjectMap } from '~/components/maps/project-map';
import type { Project, Zone, Node, GeoJSONFeatureCollection, Task } from '~/types/project';

const normalizeGeoJSON = (payload: any): GeoJSONFeatureCollection | null => {
  if (!payload || typeof payload !== 'object') return null;

  const candidate = payload?.geojson || payload;
  if (candidate?.type === 'FeatureCollection' && Array.isArray(candidate?.features)) {
    return candidate as GeoJSONFeatureCollection;
  }

  return null;
};

const hasGeoJSONFeatures = (payload: GeoJSONFeatureCollection | null | undefined): boolean => {
  return !!payload && Array.isArray(payload.features) && payload.features.length > 0;
};

export const useProjectDetailData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const projectId = requestEvent.params.projectId;

  try {
    const project = await ssrApiClient.get<Project>(`/projects/${projectId}`);
    const [stats, zonesResponse, nodesResponse] = await Promise.all([
      ssrApiClient.get<any>(`/projects/${projectId}/stats`),
      ssrApiClient.get<{ zones: Zone[]; count: number }>(`/projects/${projectId}/zones`),
      ssrApiClient.get<{ nodes: Node[]; count: number }>(`/projects/${projectId}/nodes`),
    ]);

    let geojsonData: GeoJSONFeatureCollection | null = null;
    if (project.kmz_file_name) {
      try {
        const geojsonResponse = await ssrApiClient.get<any>(`/projects/${projectId}/geojson`);
        geojsonData = normalizeGeoJSON(geojsonResponse);
      } catch {
        geojsonData = null;
      }
    }

    return {
      project,
      stats,
      taskCount: Number(stats?.total_tasks || 0),
      zones: zonesResponse.zones || [],
      nodes: nodesResponse.nodes || [],
      geojsonData,
      error: '',
    };
  } catch (error: any) {
    return {
      project: null as Project | null,
      stats: null,
      taskCount: 0,
      zones: [] as Zone[],
      nodes: [] as Node[],
      geojsonData: null as GeoJSONFeatureCollection | null,
      error: error.message || 'Failed to load project',
    };
  }
});

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const projectId = loc.params.projectId;
  const initialData = useProjectDetailData();

  const activeTab = useSignal<'overview' | 'map' | 'tasks' | 'budget'>('overview');

  const state = useStore({
    project: initialData.value.project,
    stats: initialData.value.stats as any,
    zones: initialData.value.zones,
    nodes: initialData.value.nodes,
    tasks: [] as Task[],
    taskCount: initialData.value.taskCount || 0,
    geojsonData: initialData.value.geojsonData,
    loading: false,
    loadingTasks: false,
    error: initialData.value.error,
  });

  // KMZ upload local state
  const kmz = useStore({
    uploading: false,
    error: '',
    success: '',
  });
  const kmzFile = useSignal<NoSerialize<File> | null>(null);

  const budgetRemaining = Math.max((state.project?.total_budget || 0) - (state.project?.spent_budget || 0), 0);
  const budgetUtilization = state.project?.total_budget
    ? Math.min(((state.project.spent_budget || 0) / state.project.total_budget) * 100, 100)
    : 0;

  const statsCardComponent = useResource$(async () => {
    const mod = await import('~/components/projects/project-stats-card');
    return mod.ProjectStatsCard;
  });

  const taskCardComponent = useResource$(async ({ track }) => {
    track(() => activeTab.value);
    if (activeTab.value !== 'tasks') return null;
    const mod = await import('~/components/tasks/task-card');
    return mod.TaskCard;
  });

  // Load tasks when tasks tab is active
  const loadTasks = $(async () => {
    if (state.tasks.length > 0) return; // Already loaded

    try {
      state.loadingTasks = true;
      const response = await taskService.listTasks({ project_id: projectId });
      state.tasks = response.tasks || [];
      state.taskCount = response.total || response.count || state.tasks.length;
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
    nav(`/tasks/${task.id}`);
  });

  const handleCreateTask = $(() => {
    nav(`/projects/${projectId}/tasks/create`);
  });

  const onKmzFileChange = $((e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    kmzFile.value = null;
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
      kmzFile.value = noSerialize(file);
    }
  });

  const uploadKmz = $(async () => {
    if (!kmzFile.value) {
      kmz.error = 'Please choose a KMZ file first';
      return;
    }
    try {
      kmz.uploading = true;
      kmz.error = '';
      kmz.success = '';
      await projectService.uploadKMZ(projectId, kmzFile.value as unknown as File);
      kmz.success = 'KMZ uploaded successfully';
      // Refresh geojson, zones, and nodes
      try {
        const zonesResponse = await projectService.getProjectZones(projectId);
        state.zones = zonesResponse.zones || [];
        const nodesResponse = await projectService.getProjectNodes(projectId);
        state.nodes = nodesResponse.nodes || [];
        const geojson = await projectService.getProjectGeoJSON(projectId);
        state.geojsonData = normalizeGeoJSON(geojson);
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
      <div class="project-route-shell">
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
      <div class="project-route-shell">
        <Alert variant="error">
          <i class="i-heroicons-exclamation-circle-solid w-4 h-4 inline-block mr-2"></i>
          {state.error || 'Project not found'}
        </Alert>
      </div>
    );
  }

  const hasRenderableMapData =
    hasGeoJSONFeatures(state.geojsonData as GeoJSONFeatureCollection | null) ||
    state.zones.length > 0 ||
    state.nodes.length > 0;

  return (
    <div class="project-route-shell">
      {/* KMZ upload failure banner via query param */}
      {loc.url.searchParams.get('kmz') === 'failed' && (
        <Alert variant="error" class="mb-4 flex items-start gap-2 text-sm">
          <i class="i-heroicons-exclamation-triangle-solid w-4 h-4 inline-block mt-0.5"></i>
          <div>
            KMZ upload failed. Go to the Map tab to retry uploading the KMZ file.
          </div>
        </Alert>
      )}

      {loc.url.searchParams.get('task') === 'created' && (
        <Alert variant="success" class="mb-4 flex items-start gap-2 text-sm">
          <i class="i-heroicons-check-circle-solid w-4 h-4 inline-block mt-0.5"></i>
          <div>
            Task created successfully.
          </div>
        </Alert>
      )}

      {/* Header */}
      <div class="project-surface p-4">
        <button
          onClick$={() => nav('/projects')}
          class="text-sm text-gray-600 hover:text-gray-900 mb-3 flex items-center gap-1"
        >
          <i class="i-heroicons-arrow-left w-4 h-4 inline-block"></i>
          Back to Projects
        </button>

        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-bold text-gray-900">{state.project.name}</h1>
              <Badge
                variant={
                  state.project.status === 'active'
                    ? 'success'
                    : state.project.status === 'on-hold'
                      ? 'warning'
                      : state.project.status === 'completed'
                        ? 'info'
                        : 'neutral'
                }
                class="px-3 py-1 text-xs font-medium"
              >
                {state.project.status}
              </Badge>
            </div>
            <p class="text-sm text-gray-600 mb-2">Code: {state.project.code}</p>
            {state.project.description && (
              <p class="text-sm text-gray-700">{state.project.description}</p>
            )}

            <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="project-panel">
                <p class="text-xs text-gray-600 uppercase tracking-wide">Budget Utilization</p>
                <p class="text-xl font-semibold text-gray-900 mt-1">{budgetUtilization.toFixed(1)}%</p>
                <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    class="h-2 rounded-full bg-blue-600 w-[var(--project-budget-progress)]"
                    style={{ '--project-budget-progress': `${budgetUtilization}%` }}
                  ></div>
                </div>
              </div>
              <div class="project-panel">
                <p class="text-xs text-gray-600 uppercase tracking-wide">Remaining Budget</p>
                <p class="text-xl font-semibold text-emerald-700 mt-1">
                  ₹{(budgetRemaining / 100000).toFixed(2)}L
                </p>
                <p class="text-xs text-gray-500 mt-2">Based on recorded spend</p>
              </div>
              <div class="project-panel">
                <p class="text-xs text-gray-600 uppercase tracking-wide">Map Coverage</p>
                <p class="text-xl font-semibold text-gray-900 mt-1">{state.zones.length} Zones</p>
                <p class="text-xs text-gray-500 mt-2">{state.nodes.length} mapped nodes</p>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <Btn variant="secondary">
              <i class="i-heroicons-pencil-square-solid w-4 h-4 inline-block text-white mr-2"></i>
              Edit
            </Btn>
            <Btn onClick$={handleCreateTask}>
              <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-2"></i>
              New Task
            </Btn>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {state.stats && (
        <div>
          <Resource
            value={statsCardComponent}
            onPending={() => <div class="h-40 rounded-lg bg-gray-100 animate-pulse" />}
            onResolved={(ProjectStatsCardComponent) => <ProjectStatsCardComponent stats={state.stats} />}
          />
        </div>
      )}

      {/* Tabs */}
      <div class="project-surface">
        {/* Tab Navigation */}
        <div class="border-b border-gray-200 p-2">
          <TabBar
            items={[
              { key: 'overview', label: 'Overview' },
              { key: 'map', label: 'Map View' },
              { key: 'tasks', label: `Tasks (${state.taskCount || 0})` },
              { key: 'budget', label: 'Budget' },
            ]}
            activeKey={activeTab.value}
            onTabChange$={async (key) => {
              activeTab.value = key as 'overview' | 'map' | 'tasks' | 'budget';
              if (key === 'tasks') {
                await loadTasks();
              }
            }}
          />
        </div>

        {/* Tab Content */}
        <div class="p-4 md:p-6">
          {/* Overview Tab */}
          {activeTab.value === 'overview' && (
            <div class="space-y-6">
              <div class="project-detail-grid">
                {/* Project Info */}
                <div class="project-panel">
                  <h3 class="project-panel-title">Project Information</h3>
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
                <div class="project-panel">
                  <h3 class="project-panel-title">Budget Overview</h3>
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
              <div class="project-detail-grid">
                <div class="project-panel">
                  <h3 class="project-panel-title">
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

                <div class="project-panel">
                  <h3 class="project-panel-title">
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
                          <Badge
                            variant={
                              node.status === 'available'
                                ? 'success'
                                : node.status === 'in-progress'
                                  ? 'warning'
                                  : node.status === 'allocated'
                                    ? 'info'
                                    : 'neutral'
                            }
                            class="text-xs"
                          >
                            {node.status}
                          </Badge>
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
              {hasRenderableMapData ? (
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
                  <p class="text-sm text-gray-600 mb-4">
                    {state.project.kmz_file_name
                      ? 'KMZ uploaded, but no supported map features were detected. Try another KMZ export format or re-upload.'
                      : 'Upload a KMZ file to view the project on a map'}
                  </p>
                  <div class="project-map-upload text-left">
                    {kmz.error && (
                      <Alert variant="error" class="mb-3 px-2 py-2 text-xs">{kmz.error}</Alert>
                    )}
                    {kmz.success && (
                      <Alert variant="success" class="mb-3 px-2 py-2 text-xs">{kmz.success}</Alert>
                    )}
                    <label class="form-label text-xs">Select KMZ file</label>
                    <input
                      type="file"
                      accept=".kmz"
                      class="form-input w-full mb-3"
                      onChange$={onKmzFileChange}
                    />
                    <Btn
                      class="w-full"
                      disabled={kmz.uploading}
                      onClick$={uploadKmz}
                    >
                      {kmz.uploading ? 'Uploading...' : 'Upload KMZ'}
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab.value === 'tasks' && (
            <div>
              <div class="mb-4 flex justify-end">
                <Btn variant="secondary" onClick$={() => nav(`/projects/${projectId}/tasks`)}>
                  <i class="i-heroicons-queue-list-solid w-4 h-4 inline-block mr-1"></i>
                  Open Full Task Board
                </Btn>
              </div>

              {state.loadingTasks ? (
                <div class="project-grid">
                  {[1, 2, 3].map(i => (
                    <div key={i} class="bg-gray-100 rounded-lg p-4 animate-pulse h-64"></div>
                  ))}
                </div>
              ) : state.tasks.length > 0 ? (
                <div class="project-grid">
                  <Resource
                    value={taskCardComponent}
                    onPending={() => <div class="col-span-full h-64 rounded-lg bg-gray-100 animate-pulse" />}
                    onResolved={(TaskCardComponent) =>
                      TaskCardComponent
                        ? state.tasks.map(task => (
                            <TaskCardComponent
                              key={task.id}
                              task={task}
                              onView$={handleViewTask}
                            />
                          ))
                        : null
                    }
                  />
                </div>
              ) : (
                <div class="text-center py-12 bg-gray-50 rounded-lg">
                  <i class="i-heroicons-clipboard-document-list w-16 h-16 inline-block text-gray-400 mb-3"></i>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">No Tasks Yet</h3>
                  <p class="text-sm text-gray-600 mb-4">Create your first task to get started</p>
                  <Btn onClick$={handleCreateTask}>
                    <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-2"></i>
                    Create Task
                  </Btn>
                </div>
              )}
            </div>
          )}

          {/* Budget Tab */}
          {activeTab.value === 'budget' && (
            <div class="project-empty-state">
              <i class="i-heroicons-currency-dollar-solid w-16 h-16 inline-block text-gray-400 mb-3"></i>
              <h3>Budget Management</h3>
              <p>Budget allocation, RA billing progression, and spend trend visualizations will be shown here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
