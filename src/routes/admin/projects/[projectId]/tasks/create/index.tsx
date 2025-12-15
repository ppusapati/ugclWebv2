/**
 * Task Creation Form
 * Professional form for creating new tasks within a project
 */

import { component$, useStore, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useLocation, useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '../../../../../../services/api-client';
import { projectService } from '../../../../../../services/project.service';
import { taskService } from '../../../../../../services/task.service';
import type { Project, Zone, Node, Task, TaskPriority, TaskStatus } from '../../../../../../types/project';

// Load project data with SSR
export const useProjectData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const projectId = requestEvent.params.projectId;

  try {
    const [projectResponse, zonesResponse, nodesResponse] = await Promise.all([
      ssrApiClient.get<Project>(`/projects/${projectId}`),
      ssrApiClient.get<{ zones: Zone[] }>(`/projects/${projectId}/zones`),
      ssrApiClient.get<{ nodes: Node[] }>(`/projects/${projectId}/nodes`),
    ]);

    return {
      project: projectResponse,
      zones: zonesResponse.zones || [],
      nodes: nodesResponse.nodes || [],
    };
  } catch (error: any) {
    console.error('[TASK CREATE] Failed to load data:', error);
    return {
      project: null,
      zones: [],
      nodes: [],
      error: error.message || 'Failed to load project data',
    };
  }
});

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const projectId = loc.params.projectId;
  const initialData = useProjectData();

  const taskForm = useStore<Partial<Task>>({
    code: '',
    title: '',
    description: '',
    project_id: projectId,
    zone_id: '',
    start_node_id: '',
    stop_node_id: '',
    planned_start_date: '',
    planned_end_date: '',
    allocated_budget: 0,
    labor_cost: 0,
    material_cost: 0,
    equipment_cost: 0,
    other_cost: 0,
    status: 'pending',
    priority: 'medium',
  });

  const state = useStore({
    project: initialData.value.project,
    zones: initialData.value.zones,
    nodes: initialData.value.nodes,
    filteredNodes: [] as Node[],
    loading: false,
    error: initialData.value.error || '',
    currentStep: 1,
    showSaveModal: false,
  });

  // Calculate total cost
  const calculateTotalCost = $(() => {
    taskForm.total_cost =
      (taskForm.labor_cost || 0) +
      (taskForm.material_cost || 0) +
      (taskForm.equipment_cost || 0) +
      (taskForm.other_cost || 0);
  });

  // Filter nodes by selected zone
  const filterNodesByZone = $((zoneId: string) => {
    if (!zoneId) {
      state.filteredNodes = state.nodes;
    } else {
      state.filteredNodes = state.nodes.filter(node => node.zone_id === zoneId);
    }
  });

  // Initialize filtered nodes
  useVisibleTask$(() => {
    state.filteredNodes = state.nodes;
  });

  // Handle zone change
  const handleZoneChange = $((zoneId: string) => {
    taskForm.zone_id = zoneId;
    taskForm.start_node_id = '';
    taskForm.stop_node_id = '';
    filterNodesByZone(zoneId);
  });

  // Save task
  const saveTask = $(async () => {
    try {
      state.loading = true;
      state.error = '';

      // Validate required fields
      if (!taskForm.code || !taskForm.title || !taskForm.start_node_id || !taskForm.stop_node_id) {
        alert('Please fill in all required fields');
        state.loading = false;
        return;
      }

      // Calculate total cost
      await calculateTotalCost();

      // Create task
      const response = await taskService.createTask({
        code: taskForm.code!,
        title: taskForm.title!,
        description: taskForm.description,
        project_id: projectId,
        zone_id: taskForm.zone_id,
        start_node_id: taskForm.start_node_id!,
        stop_node_id: taskForm.stop_node_id!,
        planned_start_date: taskForm.planned_start_date,
        planned_end_date: taskForm.planned_end_date,
        allocated_budget: taskForm.allocated_budget || 0,
        priority: taskForm.priority || 'medium',
      });

      console.log('Task created successfully:', response);
      state.showSaveModal = false;
      state.loading = false;

      // Navigate back to project detail
      await nav(`/admin/projects/${projectId}`);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      alert(`Failed to create task: ${error.message || 'Unknown error'}`);
      state.loading = false;
    }
  });

  const totalCost =
    (taskForm.labor_cost || 0) +
    (taskForm.material_cost || 0) +
    (taskForm.equipment_cost || 0) +
    (taskForm.other_cost || 0);

  return (
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl">
        <div class="max-w-screen-xl mx-auto px-6 py-8">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-4">
              <button
                onClick$={() => nav(`/admin/projects/${projectId}`)}
                class="btn btn-ghost btn-sm text-white hover:bg-white/20"
              >
                ← Back to Project
              </button>
              <div>
                <h1 class="text-4xl font-bold flex items-center gap-3">
                  📋 Create New Task
                </h1>
                <p class="text-blue-100 mt-2">
                  {state.project?.name || 'Loading...'}
                </p>
              </div>
            </div>
            <div class="flex gap-3">
              <button
                onClick$={() => nav(`/admin/projects/${projectId}`)}
                class="btn bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
              >
                Cancel
              </button>
              <button
                onClick$={() => state.showSaveModal = true}
                disabled={state.loading}
                class="btn bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
              >
                {state.loading ? 'Creating...' : '💾 Create Task'}
              </button>
            </div>
          </div>

          {/* Progress Steps */}
          <div class="flex items-center gap-4">
            {['Basic Info', 'Nodes & Timeline', 'Budget'].map((step, idx) => (
              <div key={step} class="flex items-center">
                <div class={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  state.currentStep === idx + 1
                    ? 'bg-white text-blue-600 font-semibold scale-105'
                    : state.currentStep > idx + 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/20 text-blue-100'
                }`}>
                  <span class="text-lg">{idx + 1}</span>
                  <span>{step}</span>
                </div>
                {idx < 2 && (
                  <div class={`w-12 h-0.5 mx-2 ${
                    state.currentStep > idx + 1 ? 'bg-blue-300' : 'bg-white/30'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {state.error && (
        <div class="max-w-screen-xl mx-auto px-6 py-4">
          <div class="alert alert-error shadow-lg">
            <span>⚠️ {state.error}</span>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div class="max-w-screen-xl mx-auto px-6 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - 2/3 width */}
          <div class="lg:col-span-2 space-y-6">
            {/* Step 1: Basic Info */}
            {state.currentStep === 1 && (
              <div class="card bg-white dark:bg-gray-800 shadow-xl">
                <div class="card-body">
                  <h2 class="card-title text-2xl mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    📝 Basic Information
                  </h2>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Task Code *</span>
                      </label>
                      <input
                        type="text"
                        value={taskForm.code}
                        onInput$={(e) => taskForm.code = (e.target as HTMLInputElement).value}
                        placeholder="e.g., TASK-001"
                        class="input input-bordered w-full"
                        required
                      />
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Priority</span>
                      </label>
                      <select
                        value={taskForm.priority}
                        onChange$={(e) => taskForm.priority = (e.target as HTMLSelectElement).value as TaskPriority}
                        class="select select-bordered w-full"
                      >
                        <option value="low">🟢 Low</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="high">🟠 High</option>
                        <option value="critical">🔴 Critical</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Task Title *</span>
                    </label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onInput$={(e) => taskForm.title = (e.target as HTMLInputElement).value}
                      placeholder="Enter task title"
                      class="input input-bordered w-full"
                      required
                    />
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Description</span>
                    </label>
                    <textarea
                      value={taskForm.description}
                      onInput$={(e) => taskForm.description = (e.target as HTMLTextAreaElement).value}
                      placeholder="Describe the task..."
                      class="textarea textarea-bordered h-32"
                    />
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Zone</span>
                    </label>
                    <select
                      value={taskForm.zone_id}
                      onChange$={(e) => handleZoneChange((e.target as HTMLSelectElement).value)}
                      class="select select-bordered w-full"
                    >
                      <option value="">All Zones</option>
                      {state.zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                    <label class="label">
                      <span class="label-text-alt">
                        {state.zones.length === 0 ? 'No zones available' : `${state.zones.length} zones available`}
                      </span>
                    </label>
                  </div>

                  <div class="flex justify-end mt-6">
                    <button
                      onClick$={() => state.currentStep = 2}
                      class="btn btn-primary"
                    >
                      Next: Nodes & Timeline →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Nodes & Timeline */}
            {state.currentStep === 2 && (
              <div class="card bg-white dark:bg-gray-800 shadow-xl">
                <div class="card-body">
                  <h2 class="card-title text-2xl mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    🎯 Nodes & Timeline
                  </h2>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Start Node *</span>
                      </label>
                      <select
                        value={taskForm.start_node_id}
                        onChange$={(e) => taskForm.start_node_id = (e.target as HTMLSelectElement).value}
                        class="select select-bordered w-full"
                        required
                      >
                        <option value="">Select start node...</option>
                        {state.filteredNodes.map((node) => (
                          <option key={node.id} value={node.id}>
                            {`${node.name} (${node.code})`}
                          </option>
                        ))}
                      </select>
                      <label class="label">
                        <span class="label-text-alt">
                          {state.filteredNodes.length} nodes available
                        </span>
                      </label>
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Stop Node *</span>
                      </label>
                      <select
                        value={taskForm.stop_node_id}
                        onChange$={(e) => taskForm.stop_node_id = (e.target as HTMLSelectElement).value}
                        class="select select-bordered w-full"
                        required
                      >
                        <option value="">Select stop node...</option>
                        {state.filteredNodes.map((node) => (
                          <option key={node.id} value={node.id}>
                            {`${node.name} (${node.code})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div class="divider">Timeline</div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Planned Start Date</span>
                      </label>
                      <input
                        type="date"
                        value={taskForm.planned_start_date}
                        onInput$={(e) => taskForm.planned_start_date = (e.target as HTMLInputElement).value}
                        class="input input-bordered w-full"
                      />
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Planned End Date</span>
                      </label>
                      <input
                        type="date"
                        value={taskForm.planned_end_date}
                        onInput$={(e) => taskForm.planned_end_date = (e.target as HTMLInputElement).value}
                        class="input input-bordered w-full"
                      />
                    </div>
                  </div>

                  <div class="flex justify-between mt-6">
                    <button
                      onClick$={() => state.currentStep = 1}
                      class="btn btn-ghost"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick$={() => state.currentStep = 3}
                      class="btn btn-primary"
                    >
                      Next: Budget →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Budget */}
            {state.currentStep === 3 && (
              <div class="card bg-white dark:bg-gray-800 shadow-xl">
                <div class="card-body">
                  <h2 class="card-title text-2xl mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    💰 Budget Allocation
                  </h2>

                  <div class="form-control mb-4">
                    <label class="label">
                      <span class="label-text font-semibold">Allocated Budget</span>
                    </label>
                    <input
                      type="number"
                      value={taskForm.allocated_budget}
                      onInput$={(e) => taskForm.allocated_budget = parseFloat((e.target as HTMLInputElement).value) || 0}
                      placeholder="0.00"
                      class="input input-bordered w-full"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div class="divider">Cost Breakdown</div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">👷 Labor Cost</span>
                      </label>
                      <input
                        type="number"
                        value={taskForm.labor_cost}
                        onInput$={(e) => {
                          taskForm.labor_cost = parseFloat((e.target as HTMLInputElement).value) || 0;
                          calculateTotalCost();
                        }}
                        placeholder="0.00"
                        class="input input-bordered w-full"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">🧱 Material Cost</span>
                      </label>
                      <input
                        type="number"
                        value={taskForm.material_cost}
                        onInput$={(e) => {
                          taskForm.material_cost = parseFloat((e.target as HTMLInputElement).value) || 0;
                          calculateTotalCost();
                        }}
                        placeholder="0.00"
                        class="input input-bordered w-full"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">🚜 Equipment Cost</span>
                      </label>
                      <input
                        type="number"
                        value={taskForm.equipment_cost}
                        onInput$={(e) => {
                          taskForm.equipment_cost = parseFloat((e.target as HTMLInputElement).value) || 0;
                          calculateTotalCost();
                        }}
                        placeholder="0.00"
                        class="input input-bordered w-full"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">📦 Other Cost</span>
                      </label>
                      <input
                        type="number"
                        value={taskForm.other_cost}
                        onInput$={(e) => {
                          taskForm.other_cost = parseFloat((e.target as HTMLInputElement).value) || 0;
                          calculateTotalCost();
                        }}
                        placeholder="0.00"
                        class="input input-bordered w-full"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <div class="alert alert-info mt-4">
                    <div class="flex items-center justify-between w-full">
                      <span class="font-semibold">Total Estimated Cost:</span>
                      <span class="text-xl font-bold">₹{totalCost.toFixed(2)}</span>
                    </div>
                  </div>

                  <div class="flex justify-between mt-6">
                    <button
                      onClick$={() => state.currentStep = 2}
                      class="btn btn-ghost"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick$={() => state.showSaveModal = true}
                      class="btn btn-primary"
                    >
                      💾 Create Task
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - 1/3 width */}
          <div class="lg:col-span-1">
            <div class="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 shadow-xl sticky top-4">
              <div class="card-body">
                <h3 class="text-xl font-semibold mb-4">💡 Task Creation Tips</h3>
                <ul class="space-y-3">
                  <li class="flex items-start gap-3">
                    <span class="text-2xl">📋</span>
                    <div>
                      <p class="font-semibold">Unique Task Codes</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Use clear, sequential codes like TASK-001</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-2xl">🎯</span>
                    <div>
                      <p class="font-semibold">Select Correct Nodes</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Choose start and stop nodes carefully</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-2xl">📅</span>
                    <div>
                      <p class="font-semibold">Set Realistic Dates</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Plan timeline considering dependencies</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-2xl">💰</span>
                    <div>
                      <p class="font-semibold">Accurate Budget</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Break down costs by category</p>
                    </div>
                  </li>
                </ul>

                <div class="divider"></div>

                <div class="stats shadow bg-white dark:bg-gray-700">
                  <div class="stat">
                    <div class="stat-title">Available Nodes</div>
                    <div class="stat-value text-primary text-2xl">{state.nodes.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      {state.showSaveModal && (
        <div class="modal modal-open">
          <div class="modal-box max-w-2xl bg-white dark:bg-gray-800">
            <h3 class="font-bold text-2xl mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              💾 Create Task
            </h3>

            <div class="space-y-4 mb-6">
              <div class="alert alert-info">
                <span>
                  📋 <strong>{taskForm.title || 'Untitled Task'}</strong>
                </span>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="stats shadow">
                  <div class="stat">
                    <div class="stat-title">Task Code</div>
                    <div class="stat-value text-lg">{taskForm.code || 'N/A'}</div>
                  </div>
                </div>

                <div class="stats shadow">
                  <div class="stat">
                    <div class="stat-title">Total Cost</div>
                    <div class="stat-value text-lg text-primary">₹{totalCost.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {(!taskForm.code || !taskForm.title || !taskForm.start_node_id || !taskForm.stop_node_id) && (
                <div class="alert alert-warning">
                  ⚠️ Please fill in all required fields (Code, Title, Start Node, Stop Node)
                </div>
              )}
            </div>

            <div class="modal-action">
              <button
                onClick$={() => state.showSaveModal = false}
                class="btn btn-ghost"
                disabled={state.loading}
              >
                Cancel
              </button>
              <button
                onClick$={saveTask}
                disabled={!taskForm.code || !taskForm.title || !taskForm.start_node_id || !taskForm.stop_node_id || state.loading}
                class="btn btn-primary"
              >
                {state.loading ? (
                  <>
                    <span class="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  <>💾 Create Task</>
                )}
              </button>
            </div>
          </div>
          <div class="modal-backdrop" onClick$={() => !state.loading && (state.showSaveModal = false)}></div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Create Task',
};
