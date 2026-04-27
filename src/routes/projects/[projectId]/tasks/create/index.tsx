/**
 * Task Creation Form
 * Professional form for creating new tasks within a project
 */

import { component$, useStore, useTask$, $, isServer } from '@builder.io/qwik';
import { useLocation, useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services/api-client';
import { Alert, Btn, FormField, SectionCard, StatCard } from '~/components/ds';
import { workflowService } from '~/services';
import { taskService } from '~/services/task.service';
import type { Project, Zone, Node, Task, TaskPriority } from '~/types/project';
import type { WorkflowDefinition } from '~/types/workflow';

const normalizeText = (value?: string) =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const verticalKeywordSets: Record<'road' | 'building' | 'solar' | 'water', string[]> = {
  road: ['road', 'highway', 'pavement', 'asphalt', 'bitumen', 'chainage', 'carriageway'],
  building: ['building', 'civil', 'structural', 'rcc', 'mep', 'architecture', 'tower'],
  solar: ['solar', 'pv', 'epc', 'inverter', 'string', 'dc', 'ac', 'commissioning'],
  water: ['water', 'pipeline', 'pump', 'hydr', 'sewage', 'stp', 'wtp', 'distribution'],
};

type WorkflowMatchResult = {
  workflows: WorkflowDefinition[];
  matchedCount: number;
  totalCount: number;
  usedFallback: boolean;
};

const getBusinessAwareWorkflows = (
  workflows: WorkflowDefinition[],
  project?: Project | null,
): WorkflowMatchResult => {
  if (!project || !project.business_vertical_id || workflows.length === 0) {
    return {
      workflows,
      matchedCount: workflows.length,
      totalCount: workflows.length,
      usedFallback: false,
    };
  }

  const verticalName = normalizeText(project.business_vertical?.name);
  const verticalCode = normalizeText(project.business_vertical?.code);
  const verticalId = project.business_vertical_id;
  const verticalContext = `${verticalName} ${verticalCode}`;

  const matched = workflows
    .map((workflow) => {
      const wf = workflow as WorkflowDefinition & {
        business_vertical_id?: string;
        business_vertical_ids?: string[];
        business_vertical_code?: string;
        business_vertical_codes?: string[];
        tags?: string[];
        metadata?: {
          business_vertical_id?: string;
          business_vertical_ids?: string[];
          business_vertical_code?: string;
          business_vertical_codes?: string[];
          tags?: string[];
        };
      };

      const explicitVerticalIds = [
        wf.business_vertical_id,
        ...(wf.business_vertical_ids || []),
        wf.metadata?.business_vertical_id,
        ...(wf.metadata?.business_vertical_ids || []),
      ].filter(Boolean) as string[];

      if (explicitVerticalIds.includes(verticalId)) {
        return { workflow, score: 1000 };
      }

      const explicitVerticalCodes = [
        wf.business_vertical_code,
        ...(wf.business_vertical_codes || []),
        wf.metadata?.business_vertical_code,
        ...(wf.metadata?.business_vertical_codes || []),
      ]
        .filter(Boolean)
        .map((code) => normalizeText(code));

      if (
        (verticalCode && explicitVerticalCodes.includes(verticalCode)) ||
        (verticalName && explicitVerticalCodes.includes(verticalName))
      ) {
        return { workflow, score: 900 };
      }

      const workflowSearchText = normalizeText(
        [
          workflow.name,
          workflow.code,
          workflow.description,
          ...(wf.tags || []),
          ...(wf.metadata?.tags || []),
        ]
          .filter(Boolean)
          .join(' '),
      );

      let score = 0;
      if (verticalCode && workflowSearchText.includes(verticalCode)) score += 20;
      if (verticalName && workflowSearchText.includes(verticalName)) score += 20;

      (Object.entries(verticalKeywordSets) as Array<[keyof typeof verticalKeywordSets, string[]]>).forEach(([, keywords]) => {
        const shouldUseSet = keywords.some((keyword) => verticalContext.includes(keyword));
        if (!shouldUseSet) return;
        keywords.forEach((keyword) => {
          if (workflowSearchText.includes(keyword)) {
            score += 5;
          }
        });
      });

      return { workflow, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matched.length === 0) {
    return {
      workflows,
      matchedCount: 0,
      totalCount: workflows.length,
      usedFallback: true,
    };
  }

  return {
    workflows: matched.map((item) => item.workflow),
    matchedCount: matched.length,
    totalCount: workflows.length,
    usedFallback: false,
  };
};

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
    workflows: [] as WorkflowDefinition[],
    selectedWorkflowId: '',
    workflowsLoading: false,
    loading: false,
    error: initialData.value.error || '',
    success: '',
    currentStep: 1,
    showSaveModal: false,
  });

  const fieldClass = 'w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-4 py-3 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none';
  const textareaClass = `${fieldClass} min-h-32`;

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
  useTask$(async () => {
    if (isServer) return;
    state.filteredNodes = state.nodes;

    state.workflowsLoading = true;
    state.workflows = await workflowService.getAllWorkflows();

    const workflowMatch = getBusinessAwareWorkflows(state.workflows, state.project);
    if (workflowMatch.workflows.length === 1) {
      state.selectedWorkflowId = workflowMatch.workflows[0].id;
    }

    state.workflowsLoading = false;
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
      state.success = '';

      // Validate required fields
      if (!taskForm.code || !taskForm.title || !taskForm.start_node_id || !taskForm.stop_node_id) {
        state.error = 'Please fill in all required fields: Code, Title, Start Node, and Stop Node.';
        state.loading = false;
        return;
      }

      if (workflowMatch.totalCount > 0 && !state.selectedWorkflowId) {
        state.error = 'Please select a workflow definition before creating the task.';
        state.loading = false;
        return;
      }

      if (taskForm.start_node_id === taskForm.stop_node_id) {
        state.error = 'Start node and stop node must be different.';
        state.loading = false;
        return;
      }

      // Calculate total cost
      await calculateTotalCost();

      const toRFC3339 = (dateValue?: string) => {
        if (!dateValue) return undefined;
        return `${dateValue}T00:00:00Z`;
      };

      const payload: any = {
        code: taskForm.code!,
        title: taskForm.title!,
        description: taskForm.description,
        project_id: projectId,
        start_node_id: taskForm.start_node_id!,
        stop_node_id: taskForm.stop_node_id!,
        allocated_budget: taskForm.allocated_budget || 0,
        priority: taskForm.priority || 'medium',
      };

      // Send optional fields only when present to avoid backend decode errors.
      if (taskForm.zone_id) {
        payload.zone_id = taskForm.zone_id;
      }
      if (taskForm.planned_start_date) {
        payload.planned_start_date = toRFC3339(taskForm.planned_start_date as string);
      }
      if (taskForm.planned_end_date) {
        payload.planned_end_date = toRFC3339(taskForm.planned_end_date as string);
      }

      // Create task
      const response = await taskService.createTask(payload);

      if (state.selectedWorkflowId && response.task?.id) {
        try {
          await taskService.assignWorkflow(response.task.id, state.selectedWorkflowId);
        } catch (workflowError: any) {
          state.error = `Task created, but workflow assignment failed: ${workflowError?.message || 'Unknown error'}`;
          state.showSaveModal = false;
          state.loading = false;
          await nav(`/tasks/${response.task.id}`);
          return;
        }
      }

      console.log('Task created successfully:', response);
      state.success = 'Task created successfully. Redirecting to project...';
      state.showSaveModal = false;
      state.loading = false;

      // Navigate back to project detail
      await nav(`/projects/${projectId}?task=created`);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      state.error = `Failed to create task: ${error.message || 'Unknown error'}`;
      state.loading = false;
    }
  });

  const totalCost =
    (taskForm.labor_cost || 0) +
    (taskForm.material_cost || 0) +
    (taskForm.equipment_cost || 0) +
    (taskForm.other_cost || 0);

  const workflowMatch = getBusinessAwareWorkflows(state.workflows, state.project);
  const verticalLabel = state.project?.business_vertical?.name || state.project?.business_vertical?.code || 'selected business vertical';
  const workflowHintText = state.workflowsLoading
    ? 'Loading workflows...'
    : workflowMatch.totalCount === 0
      ? '0 workflows available'
      : workflowMatch.usedFallback
        ? `No direct match for ${verticalLabel}. Showing all ${workflowMatch.totalCount} workflows.`
        : `Showing ${workflowMatch.matchedCount} workflows for ${verticalLabel}.`;

  const canSubmit =
    !!taskForm.code &&
    !!taskForm.title &&
    !!taskForm.start_node_id &&
    !!taskForm.stop_node_id &&
    (workflowMatch.totalCount === 0 || !!state.selectedWorkflowId) &&
    !state.loading;

  return (
    <div class="project-route-shell">
      {/* Header */}
      <section class="project-surface p-4 md:p-6">
          <div class="flex items-center justify-between mb-4 gap-3">
            <div class="flex items-center gap-4">
              <Btn
                onClick$={() => nav(`/projects/${projectId}`)}
                variant="secondary"
                size="sm"
              >
                <i class="i-heroicons-arrow-left-solid mr-1 h-4 w-4 inline-block" aria-hidden="true"></i>
                Back to Project
              </Btn>
              <div>
                <h1 class="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <i class="i-heroicons-clipboard-document-list-solid h-7 w-7 inline-block text-blue-700" aria-hidden="true"></i>
                  Create New Task
                </h1>
                <p class="text-gray-600 mt-1 text-sm">
                  {state.project?.name || 'Loading...'}
                </p>
              </div>
            </div>
            <div class="flex gap-3">
              <Btn
                onClick$={() => nav(`/projects/${projectId}`)}
                variant="secondary"
              >
                Cancel
              </Btn>
              <Btn
                onClick$={() => state.showSaveModal = true}
                disabled={state.loading}
              >
                {state.loading ? 'Creating...' : 'Create Task'}
              </Btn>
            </div>
          </div>

          {/* Progress Steps */}
          <div class="task-stepper">
            {['Basic Info', 'Nodes & Timeline', 'Budget'].map((step, idx) => (
              <div key={step} class="flex items-center">
                <div class={`task-step-chip ${
                  state.currentStep === idx + 1
                    ? 'task-step-chip-active'
                    : state.currentStep > idx + 1
                    ? 'task-step-chip-done'
                    : ''
                }`}>
                  <span class="text-sm font-semibold">{idx + 1}</span>
                  <span class="text-sm">{step}</span>
                </div>
                {idx < 2 && (
                  <div class={`w-12 h-0.5 mx-2 ${
                    state.currentStep > idx + 1 ? 'bg-blue-300' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
      </section>

      {/* Error Alert */}
      {state.error && (
        <Alert variant="error" class="mb-1">
            <span class="inline-flex items-center gap-2">
              <i class="i-heroicons-exclamation-triangle-solid h-4 w-4 inline-block" aria-hidden="true"></i>
              {state.error}
            </span>
          </Alert>
      )}

      {state.success && (
        <Alert variant="success" class="mb-1">
          <span class="inline-flex items-center gap-2">
            <i class="i-heroicons-check-circle-solid h-4 w-4 inline-block" aria-hidden="true"></i>
            {state.success}
          </span>
        </Alert>
      )}

      {/* Form Content */}
      <div>
        <div class="project-detail-grid">
          {/* Main Form - 2/3 width */}
          <div class="space-y-6">
            {/* Step 1: Basic Info */}
            {state.currentStep === 1 && (
              <SectionCard class="project-surface">
                <h2 class="mb-6 text-2xl font-semibold text-color-text-primary">Basic Information</h2>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField id="task-create-code" label="Task Code" required>
                      <input
                        id="task-create-code"
                        type="text"
                        value={taskForm.code}
                        onInput$={(e) => taskForm.code = (e.target as HTMLInputElement).value}
                        placeholder="e.g., TASK-001"
                        class={fieldClass}
                        required
                        aria-required="true"
                      />
                  </FormField>

                  <FormField id="task-create-priority" label="Priority">
                      <select
                        id="task-create-priority"
                        value={taskForm.priority}
                        onChange$={(e) => taskForm.priority = (e.target as HTMLSelectElement).value as TaskPriority}
                        class={fieldClass}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                  </FormField>
                </div>

                <FormField
                  id="task-create-workflow"
                  label="Workflow Definition"
                  required={workflowMatch.totalCount > 0}
                  hint={workflowHintText}
                >
                    <div class="flex items-center gap-2">
                      <div class="flex-1 min-w-0">
                        <select
                          id="task-create-workflow"
                          value={state.selectedWorkflowId}
                          onChange$={(e) => {
                            state.selectedWorkflowId = (e.target as HTMLSelectElement).value;
                          }}
                          class={fieldClass}
                          disabled={state.workflowsLoading}
                        >
                          <option value="">Select workflow definition...</option>
                          {workflowMatch.workflows.map((workflow) => (
                            <option key={workflow.id} value={workflow.id}>
                              {`${workflow.name} (${workflow.code})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Btn
                        size="sm"
                        variant="secondary"
                        class="shrink-0"
                        onClick$={() => nav('/workflows')}
                      >
                        <i class="i-heroicons-plus-circle-solid mr-1 h-4 w-4 inline-block" aria-hidden="true"></i>
                        New Workflow
                      </Btn>
                    </div>
                </FormField>

                {workflowMatch.totalCount === 0 && !state.workflowsLoading && (
                  <Alert variant="warning" class="mb-0">
                    No workflow definitions found. Create one in Workflow Management, then assign it during task creation.
                  </Alert>
                )}

                {workflowMatch.usedFallback && workflowMatch.totalCount > 0 && !state.workflowsLoading && (
                  <Alert variant="info" class="mb-0">
                    No workflow tagged specifically for {verticalLabel}. Showing all available workflows.
                  </Alert>
                )}

                <FormField id="task-create-title" label="Task Title" required>
                    <input
                      id="task-create-title"
                      type="text"
                      value={taskForm.title}
                      onInput$={(e) => taskForm.title = (e.target as HTMLInputElement).value}
                      placeholder="Enter task title"
                      class={fieldClass}
                      required
                      aria-required="true"
                    />
                </FormField>

                <FormField id="task-create-description" label="Description">
                    <textarea
                      id="task-create-description"
                      value={taskForm.description}
                      onInput$={(e) => taskForm.description = (e.target as HTMLTextAreaElement).value}
                      placeholder="Describe the task..."
                      class={textareaClass}
                    />
                </FormField>

                <FormField
                  id="task-create-zone"
                  label="Zone"
                  hint={state.zones.length === 0 ? 'No zones available' : `${state.zones.length} zones available`}
                >
                    <select
                      id="task-create-zone"
                      value={taskForm.zone_id}
                      onChange$={(e) => handleZoneChange((e.target as HTMLSelectElement).value)}
                      class={fieldClass}
                    >
                      <option value="">All Zones</option>
                      {state.zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                </FormField>

                <div class="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                  Tip: Use clear titles and descriptions so field engineers can execute without ambiguity.
                </div>

                <div class="mt-6 flex justify-end">
                  <Btn onClick$={() => state.currentStep = 2}>
                    Next: Nodes & Timeline
                    <i class="i-heroicons-arrow-right-solid ml-1 h-4 w-4 inline-block" aria-hidden="true"></i>
                  </Btn>
                </div>
              </SectionCard>
            )}

            {/* Step 2: Nodes & Timeline */}
            {state.currentStep === 2 && (
              <SectionCard class="project-surface">
                <h2 class="mb-6 text-2xl font-semibold text-color-text-primary">Nodes & Timeline</h2>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField id="task-create-start-node" label="Start Node" required hint={`${state.filteredNodes.length} nodes available`}>
                      <select
                        id="task-create-start-node"
                        value={taskForm.start_node_id}
                        onChange$={(e) => taskForm.start_node_id = (e.target as HTMLSelectElement).value}
                        class={fieldClass}
                        required
                        aria-required="true"
                      >
                        <option value="">Select start node...</option>
                        {state.filteredNodes.map((node) => (
                          <option key={node.id} value={node.id}>
                            {`${node.name} (${node.code})`}
                          </option>
                        ))}
                      </select>
                  </FormField>

                  <FormField id="task-create-stop-node" label="Stop Node" required>
                      <select
                        id="task-create-stop-node"
                        value={taskForm.stop_node_id}
                        onChange$={(e) => taskForm.stop_node_id = (e.target as HTMLSelectElement).value}
                        class={fieldClass}
                        required
                        aria-required="true"
                      >
                        <option value="">Select stop node...</option>
                        {state.filteredNodes.map((node) => (
                          <option key={node.id} value={node.id}>
                            {`${node.name} (${node.code})`}
                          </option>
                        ))}
                      </select>
                  </FormField>
                </div>

                <div class="my-4 border-t border-gray-200 pt-4 text-sm font-semibold text-gray-700">Timeline</div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField id="task-create-planned-start" label="Planned Start Date">
                      <input
                        id="task-create-planned-start"
                        type="date"
                        value={taskForm.planned_start_date}
                        onInput$={(e) => taskForm.planned_start_date = (e.target as HTMLInputElement).value}
                        class={fieldClass}
                      />
                  </FormField>

                  <FormField id="task-create-planned-end" label="Planned End Date">
                      <input
                        id="task-create-planned-end"
                        type="date"
                        value={taskForm.planned_end_date}
                        onInput$={(e) => taskForm.planned_end_date = (e.target as HTMLInputElement).value}
                        class={fieldClass}
                      />
                  </FormField>
                </div>

                <div class="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Ensure planned dates are realistic and aligned with dependency constraints.
                </div>

                <div class="mt-6 flex justify-between">
                  <Btn onClick$={() => state.currentStep = 1} variant="ghost">
                    <i class="i-heroicons-arrow-left-solid mr-1 h-4 w-4 inline-block" aria-hidden="true"></i>
                    Previous
                  </Btn>
                  <Btn onClick$={() => state.currentStep = 3}>
                    Next: Budget
                    <i class="i-heroicons-arrow-right-solid ml-1 h-4 w-4 inline-block" aria-hidden="true"></i>
                  </Btn>
                </div>
              </SectionCard>
            )}

            {/* Step 3: Budget */}
            {state.currentStep === 3 && (
              <SectionCard class="project-surface">
                <h2 class="mb-6 text-2xl font-semibold text-color-text-primary">Budget Allocation</h2>

                <FormField id="task-create-allocated-budget" label="Allocated Budget" class="mb-4">
                    <input
                      id="task-create-allocated-budget"
                      type="number"
                      value={taskForm.allocated_budget}
                      onInput$={(e) => taskForm.allocated_budget = parseFloat((e.target as HTMLInputElement).value) || 0}
                      placeholder="0.00"
                      class={fieldClass}
                      step="0.01"
                      min="0"
                    />
                </FormField>

                <div class="my-4 border-t border-gray-200 pt-4 text-sm font-semibold text-gray-700">Cost Breakdown</div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField id="task-create-labor-cost" label="Labor Cost">
                      <input
                        id="task-create-labor-cost"
                        type="number"
                        value={taskForm.labor_cost}
                        onInput$={(e) => {
                          taskForm.labor_cost = parseFloat((e.target as HTMLInputElement).value) || 0;
                          calculateTotalCost();
                        }}
                        placeholder="0.00"
                        class={fieldClass}
                        step="0.01"
                        min="0"
                      />
                  </FormField>

                  <FormField id="task-create-material-cost" label="Material Cost">
                      <input
                        id="task-create-material-cost"
                        type="number"
                        value={taskForm.material_cost}
                        onInput$={(e) => {
                          taskForm.material_cost = parseFloat((e.target as HTMLInputElement).value) || 0;
                          calculateTotalCost();
                        }}
                        placeholder="0.00"
                        class={fieldClass}
                        step="0.01"
                        min="0"
                      />
                  </FormField>

                  <FormField id="task-create-equipment-cost" label="Equipment Cost">
                      <input
                        id="task-create-equipment-cost"
                        type="number"
                        value={taskForm.equipment_cost}
                        onInput$={(e) => {
                          taskForm.equipment_cost = parseFloat((e.target as HTMLInputElement).value) || 0;
                          calculateTotalCost();
                        }}
                        placeholder="0.00"
                        class={fieldClass}
                        step="0.01"
                        min="0"
                      />
                  </FormField>

                  <FormField id="task-create-other-cost" label="Other Cost">
                      <input
                        id="task-create-other-cost"
                        type="number"
                        value={taskForm.other_cost}
                        onInput$={(e) => {
                          taskForm.other_cost = parseFloat((e.target as HTMLInputElement).value) || 0;
                          calculateTotalCost();
                        }}
                        placeholder="0.00"
                        class={fieldClass}
                        step="0.01"
                        min="0"
                      />
                  </FormField>
                </div>

                <Alert variant="info" class="mt-4">
                  <div class="flex w-full items-center justify-between">
                    <span class="font-semibold">Total Estimated Cost:</span>
                    <span class="text-xl font-bold">₹{totalCost.toFixed(2)}</span>
                  </div>
                </Alert>

                {taskForm.allocated_budget !== undefined && taskForm.allocated_budget > 0 && totalCost > taskForm.allocated_budget && (
                  <Alert variant="warning" class="mt-3">
                    Estimated cost exceeds allocated budget by ₹{(totalCost - taskForm.allocated_budget).toFixed(2)}.
                  </Alert>
                )}

                <div class="mt-6 flex justify-between">
                  <Btn onClick$={() => state.currentStep = 2} variant="ghost">
                    <i class="i-heroicons-arrow-left-solid mr-1 h-4 w-4 inline-block" aria-hidden="true"></i>
                    Previous
                  </Btn>
                  <Btn disabled={!canSubmit} onClick$={() => state.showSaveModal = true}>Create Task</Btn>
                </div>
              </SectionCard>
            )}
          </div>

          {/* Sidebar - 1/3 width */}
          <div>
            <SectionCard class="project-panel">
                <h3 class="text-xl font-semibold mb-4">Task Creation Tips</h3>
                <ul class="space-y-3">
                  <li class="flex items-start gap-3">
                    <i class="i-heroicons-clipboard-document-list-solid h-6 w-6 inline-block text-blue-600 mt-0.5" aria-hidden="true"></i>
                    <div>
                      <p class="font-semibold">Unique Task Codes</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Use clear, sequential codes like TASK-001</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <i class="i-heroicons-map-pin-solid h-6 w-6 inline-block text-blue-600 mt-0.5" aria-hidden="true"></i>
                    <div>
                      <p class="font-semibold">Select Correct Nodes</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Choose start and stop nodes carefully</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <i class="i-heroicons-calendar-days-solid h-6 w-6 inline-block text-blue-600 mt-0.5" aria-hidden="true"></i>
                    <div>
                      <p class="font-semibold">Set Realistic Dates</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Plan timeline considering dependencies</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <i class="i-heroicons-currency-rupee-solid h-6 w-6 inline-block text-blue-600 mt-0.5" aria-hidden="true"></i>
                    <div>
                      <p class="font-semibold">Accurate Budget</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Break down costs by category</p>
                    </div>
                  </li>
                </ul>

                <div class="my-4 border-t border-gray-200"></div>

                <StatCard class="bg-white">
                  <div class="text-sm text-color-text-secondary">Available Nodes</div>
                  <div class="mt-2 text-2xl font-bold text-primary-600">{state.nodes.length}</div>
                </StatCard>

                <StatCard class="bg-white mt-3">
                  <div class="text-sm text-color-text-secondary">Selected Zone Nodes</div>
                  <div class="mt-2 text-2xl font-bold text-primary-600">{state.filteredNodes.length}</div>
                </StatCard>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      {state.showSaveModal && (
        <div class="task-modal-overlay">
          <div class="task-modal-card">
            <h3 class="mb-6 text-2xl font-semibold text-color-text-primary">
              Create Task
            </h3>

            <div class="space-y-4 mb-6">
              <Alert variant="info">
                <span>
                  <strong>{taskForm.title || 'Untitled Task'}</strong>
                </span>
              </Alert>

              <div class="grid grid-cols-2 gap-4">
                <StatCard>
                  <div class="text-sm text-color-text-secondary">Task Code</div>
                  <div class="mt-2 text-lg font-semibold text-color-text-primary">{taskForm.code || 'N/A'}</div>
                </StatCard>

                <StatCard tone="info">
                  <div class="text-sm text-color-text-secondary">Total Cost</div>
                  <div class="mt-2 text-lg font-semibold text-primary-600">₹{totalCost.toFixed(2)}</div>
                </StatCard>
              </div>

              {(!taskForm.code || !taskForm.title || !taskForm.start_node_id || !taskForm.stop_node_id || (workflowMatch.totalCount > 0 && !state.selectedWorkflowId)) && (
                <Alert variant="warning">
                  Please fill in all required fields (Code, Title, Start Node, Stop Node, Workflow)
                </Alert>
              )}
            </div>

            <div class="task-modal-actions">
              <Btn
                onClick$={() => state.showSaveModal = false}
                variant="ghost"
                disabled={state.loading}
              >
                Cancel
              </Btn>
              <Btn
                onClick$={saveTask}
                disabled={!canSubmit}
              >
                {state.loading ? (
                  <>
                    <i class="i-heroicons-arrow-path-solid w-4 h-4 inline-block animate-spin mr-2"></i>
                    Creating...
                  </>
                ) : (
                  <>Create Task</>
                )}
              </Btn>
            </div>
          </div>
          <div class="task-modal-backdrop" onClick$={() => !state.loading && (state.showSaveModal = false)}></div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Create Task',
};
