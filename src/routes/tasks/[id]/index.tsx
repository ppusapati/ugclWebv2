import { component$, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { useLocation, useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { Alert, Badge, Btn, PageHeader, SectionCard } from '~/components/ds';
import { createSSRApiClient } from '~/services/api-client';
import { taskService } from '~/services/task.service';
import type { Task, TaskStatus } from '~/types/project';

interface TaskDetailLoaderData {
  task: Task | null;
  error?: string;
}

export const useTaskDetailData = routeLoader$(async (requestEvent): Promise<TaskDetailLoaderData> => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const taskId = requestEvent.params.id;

  try {
    const task = await ssrApiClient.get<Task>(`/project-tasks/${taskId}`);
    return { task };
  } catch (error: any) {
    return {
      task: null,
      error: error?.message || 'Failed to load task details',
    };
  }
});

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB');
};

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const toDateInputValue = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const toApiDateTime = (value?: string) => value ? `${value}T00:00:00Z` : undefined;

export default component$(() => {
  const nav = useNavigate();
  const loc = useLocation();
  const taskId = loc.params.id;
  const initialData = useTaskDetailData();

  const state = useStore({
    task: initialData.value.task as Task | null,
    loading: false,
    error: initialData.value.error || '',
    success: '',
    saving: false,
  });

  const editForm = useStore({
    status: (initialData.value.task?.status || 'pending') as TaskStatus,
    progress: initialData.value.task?.progress || 0,
    actual_start_date: toDateInputValue(initialData.value.task?.actual_start_date),
    actual_end_date: toDateInputValue(initialData.value.task?.actual_end_date),
    labor_cost: initialData.value.task?.labor_cost || 0,
    material_cost: initialData.value.task?.material_cost || 0,
    equipment_cost: initialData.value.task?.equipment_cost || 0,
    other_cost: initialData.value.task?.other_cost || 0,
  });

  const syncFormFromTask = (task: Task | null) => {
    editForm.status = (task?.status || 'pending') as TaskStatus;
    editForm.progress = task?.progress || 0;
    editForm.actual_start_date = toDateInputValue(task?.actual_start_date);
    editForm.actual_end_date = toDateInputValue(task?.actual_end_date);
    editForm.labor_cost = task?.labor_cost || 0;
    editForm.material_cost = task?.material_cost || 0;
    editForm.equipment_cost = task?.equipment_cost || 0;
    editForm.other_cost = task?.other_cost || 0;
  };

  const reloadTask = $(async () => {
    try {
      state.loading = true;
      state.error = '';
      state.task = await taskService.getTask(taskId);
      syncFormFromTask(state.task);
    } catch (error: any) {
      state.error = error?.message || 'Failed to load task details';
    } finally {
      state.loading = false;
    }
  });

  useVisibleTask$(async () => {
    if (!state.task) {
      await reloadTask();
    }
  }, { strategy: 'document-ready' });

  const task = state.task;
  const actualSpend = (task?.labor_cost || 0) + (task?.material_cost || 0) + (task?.equipment_cost || 0) + (task?.other_cost || 0);
  const budgetVariance = actualSpend - (task?.allocated_budget || 0);
  const plannedEnd = task?.planned_end_date ? new Date(task.planned_end_date) : null;
  const actualEnd = task?.actual_end_date ? new Date(task.actual_end_date) : null;
  const isOverdue = !!plannedEnd && !Number.isNaN(plannedEnd.getTime()) && plannedEnd.getTime() < Date.now() && task?.status !== 'completed' && task?.status !== 'cancelled';
  const scheduleVarianceDays = plannedEnd && actualEnd && !Number.isNaN(plannedEnd.getTime()) && !Number.isNaN(actualEnd.getTime())
    ? Math.round((actualEnd.getTime() - plannedEnd.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const saveExecutionUpdate = $(async () => {
    if (!task) return;

    try {
      state.saving = true;
      state.error = '';
      state.success = '';

      const updatePayload = {
        progress: Number(editForm.progress) || 0,
        labor_cost: Number(editForm.labor_cost) || 0,
        material_cost: Number(editForm.material_cost) || 0,
        equipment_cost: Number(editForm.equipment_cost) || 0,
        other_cost: Number(editForm.other_cost) || 0,
      };

      const needsTaskUpdate =
        updatePayload.progress !== (task.progress || 0) ||
        updatePayload.labor_cost !== (task.labor_cost || 0) ||
        updatePayload.material_cost !== (task.material_cost || 0) ||
        updatePayload.equipment_cost !== (task.equipment_cost || 0) ||
        updatePayload.other_cost !== (task.other_cost || 0);

      const needsStatusUpdate =
        editForm.status !== task.status ||
        editForm.actual_start_date !== toDateInputValue(task.actual_start_date) ||
        editForm.actual_end_date !== toDateInputValue(task.actual_end_date);

      let latestTask = task;

      if (needsTaskUpdate) {
        const updateResponse = await taskService.updateTask(task.id, updatePayload);
        latestTask = updateResponse.task;
      }

      if (needsStatusUpdate) {
        const statusResponse = await taskService.updateTaskStatus(task.id, {
          status: editForm.status,
          actual_start_date: toApiDateTime(editForm.actual_start_date),
          actual_end_date: toApiDateTime(editForm.actual_end_date),
        });
        latestTask = statusResponse.task;
      }

      state.task = latestTask;
      syncFormFromTask(latestTask);
      state.success = 'Task execution details updated.';
    } catch (error: any) {
      state.error = error?.message || 'Failed to update task execution details';
    } finally {
      state.saving = false;
    }
  });

  return (
    <div class="project-route-shell">
      <PageHeader
        title={task?.title || 'Task Details'}
        subtitle={task ? `Code: ${task.code}` : 'Task information'}
      >
        <div q:slot="actions" class="flex items-center gap-2">
          <Btn
            variant="secondary"
            onClick$={() => nav(task?.project_id ? `/projects/${task.project_id}/tasks` : '/projects')}
          >
            <i class="i-heroicons-arrow-left-solid w-4 h-4 inline-block mr-1"></i>
            Back to Tasks
          </Btn>
        </div>
      </PageHeader>

      {state.error && (
        <Alert variant="error">{state.error}</Alert>
      )}

      {!state.error && state.success && (
        <Alert variant="success">{state.success}</Alert>
      )}

      {!task && !state.loading && !state.error && (
        <Alert variant="warning">This task may have been removed or you may not have access.</Alert>
      )}

      {task && (
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Overview">
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Status</span>
                <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'info' : 'neutral'}>
                  {task.status}
                </Badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Priority</span>
                <span class="font-medium">{task.priority}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Progress</span>
                <span class="font-medium">{task.progress || 0}%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Created</span>
                <span class="font-medium">{formatDate(task.created_at)}</span>
              </div>
              <div class="flex flex-wrap gap-2 pt-2">
                <Badge variant={budgetVariance > 0 ? 'warning' : 'success'}>
                  {budgetVariance > 0 ? 'Over budget' : 'Within budget'}
                </Badge>
                {isOverdue && <Badge variant="error">Schedule overdue</Badge>}
                {scheduleVarianceDays !== null && (
                  <Badge variant={scheduleVarianceDays > 0 ? 'warning' : 'info'}>
                    {scheduleVarianceDays > 0 ? `+${scheduleVarianceDays}d delay` : `${scheduleVarianceDays}d variance`}
                  </Badge>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Work Scope">
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between gap-3">
                <span class="text-gray-600">Start Node</span>
                <span class="font-medium text-right">{task.start_node?.name || task.start_node_id}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-gray-600">Stop Node</span>
                <span class="font-medium text-right">{task.stop_node?.name || task.stop_node_id}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Start Date</span>
                <span class="font-medium">{formatDate(task.planned_start_date)}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">End Date</span>
                <span class="font-medium">{formatDate(task.planned_end_date)}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Actual Start</span>
                <span class="font-medium">{formatDate(task.actual_start_date)}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Actual End</span>
                <span class="font-medium">{formatDate(task.actual_end_date)}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Budget">
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Allocated</span>
                <span class="font-medium">{formatCurrency(task.allocated_budget)}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Labor</span>
                <span class="font-medium">{formatCurrency(task.labor_cost)}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Material</span>
                <span class="font-medium">{formatCurrency(task.material_cost)}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Equipment</span>
                <span class="font-medium">{formatCurrency(task.equipment_cost)}</span>
              </div>
              <div class="flex items-center justify-between border-t pt-2">
                <span class="text-gray-700 font-semibold">Total</span>
                <span class="font-semibold">{formatCurrency(task.total_cost || task.allocated_budget)}</span>
              </div>
              <div class="flex items-center justify-between border-t pt-2">
                <span class="text-gray-700 font-semibold">Variance</span>
                <span class={`font-semibold ${budgetVariance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {formatCurrency(budgetVariance)}
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Description">
            <p class="text-sm text-gray-700 whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
          </SectionCard>

          <SectionCard title="Execution Update" subtitle="Track live progress, actual dates, and actual spend.">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <label class="flex flex-col gap-1">
                <span class="text-gray-600">Status</span>
                <select
                  class="form-input w-full"
                  value={editForm.status}
                  onChange$={(event) => {
                    editForm.status = (event.target as HTMLSelectElement).value as TaskStatus;
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-gray-600">Progress (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  class="form-input w-full"
                  value={String(editForm.progress)}
                  onInput$={(event) => {
                    editForm.progress = Number((event.target as HTMLInputElement).value) || 0;
                  }}
                />
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-gray-600">Actual Start Date</span>
                <input
                  type="date"
                  class="form-input w-full"
                  value={editForm.actual_start_date}
                  onInput$={(event) => {
                    editForm.actual_start_date = (event.target as HTMLInputElement).value;
                  }}
                />
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-gray-600">Actual End Date</span>
                <input
                  type="date"
                  class="form-input w-full"
                  value={editForm.actual_end_date}
                  onInput$={(event) => {
                    editForm.actual_end_date = (event.target as HTMLInputElement).value;
                  }}
                />
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-gray-600">Labor Cost</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  class="form-input w-full"
                  value={String(editForm.labor_cost)}
                  onInput$={(event) => {
                    editForm.labor_cost = Number((event.target as HTMLInputElement).value) || 0;
                  }}
                />
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-gray-600">Material Cost</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  class="form-input w-full"
                  value={String(editForm.material_cost)}
                  onInput$={(event) => {
                    editForm.material_cost = Number((event.target as HTMLInputElement).value) || 0;
                  }}
                />
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-gray-600">Equipment Cost</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  class="form-input w-full"
                  value={String(editForm.equipment_cost)}
                  onInput$={(event) => {
                    editForm.equipment_cost = Number((event.target as HTMLInputElement).value) || 0;
                  }}
                />
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-gray-600">Other Cost</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  class="form-input w-full"
                  value={String(editForm.other_cost)}
                  onInput$={(event) => {
                    editForm.other_cost = Number((event.target as HTMLInputElement).value) || 0;
                  }}
                />
              </label>
            </div>

            <div class="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <div class="text-xs text-gray-500">
                Actual spend preview: {formatCurrency((editForm.labor_cost || 0) + (editForm.material_cost || 0) + (editForm.equipment_cost || 0) + (editForm.other_cost || 0))}
              </div>
              <Btn onClick$={saveExecutionUpdate} disabled={state.saving}>
                {state.saving ? 'Saving...' : 'Save Execution Update'}
              </Btn>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Task Details',
};
