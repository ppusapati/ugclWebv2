import { component$, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { useLocation, useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { Alert, Badge, Btn, PageHeader, SectionCard } from '~/components/ds';
import { createSSRApiClient } from '~/services/api-client';
import { taskService } from '~/services/task.service';
import { DocumentUpload } from '~/components/documents/DocumentUpload';
import { DocumentList } from '~/components/documents/DocumentList';
import type { Task, TaskStatus, WorkflowAction, WorkflowHistoryEntry, TaskComment, CommentType } from '~/types/project';

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

const syncTaskEditForm = (
  editForm: {
    status: TaskStatus;
    progress: number;
    actual_start_date: string;
    actual_end_date: string;
    labor_cost: number;
    material_cost: number;
    equipment_cost: number;
    other_cost: number;
  },
  task: Task | null,
) => {
  editForm.status = (task?.status || 'pending') as TaskStatus;
  editForm.progress = task?.progress || 0;
  editForm.actual_start_date = toDateInputValue(task?.actual_start_date);
  editForm.actual_end_date = toDateInputValue(task?.actual_end_date);
  editForm.labor_cost = task?.labor_cost || 0;
  editForm.material_cost = task?.material_cost || 0;
  editForm.equipment_cost = task?.equipment_cost || 0;
  editForm.other_cost = task?.other_cost || 0;
};

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
    // Workflow
    workflowActions: [] as WorkflowAction[],
    workflowHistory: [] as WorkflowHistoryEntry[],
    workflowCurrentState: initialData.value.task?.current_state || '',
    workflowLoading: false,
    workflowError: '',
    workflowSuccess: '',
    activeAction: '',
    actionComment: '',
    // Comments
    comments: (initialData.value.task?.comments || []) as TaskComment[],
    commentText: '',
    commentType: 'general' as CommentType,
    commentSaving: false,
    showTaskDocUpload: false,
    taskDocsRefreshKey: 0,
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

  const reloadTask = $(async () => {
    try {
      state.loading = true;
      state.error = '';
      state.task = await taskService.getTask(taskId);
      syncTaskEditForm(editForm, state.task);
    } catch (error: any) {
      state.error = error?.message || 'Failed to load task details';
    } finally {
      state.loading = false;
    }
  });

  const loadWorkflow = $(async () => {
    try {
      state.workflowLoading = true;
      const [actionsRes, historyRes] = await Promise.all([
        taskService.getWorkflowActions(taskId),
        taskService.getWorkflowHistory(taskId),
      ]);
      state.workflowActions = actionsRes.actions || [];
      state.workflowCurrentState = actionsRes.current_state || state.workflowCurrentState;
      state.workflowHistory = historyRes.history || [];
    } catch {
      // workflow may not be configured — silently ignore
    } finally {
      state.workflowLoading = false;
    }
  });

  const loadComments = $(async () => {
    try {
      const res = await taskService.getTaskComments(taskId);
      state.comments = res.comments || [];
    } catch {
      // silently ignore
    }
  });

  const performWorkflowAction = $(async (action: string, requiresComment: boolean) => {
    if (requiresComment && !state.actionComment.trim()) {
      state.workflowError = 'A comment is required for this action.';
      return;
    }
    try {
      state.workflowLoading = true;
      state.workflowError = '';
      state.workflowSuccess = '';

      if (action === 'submit') {
        await taskService.submitForApproval(taskId, state.actionComment);
      } else if (action === 'approve') {
        await taskService.approveTask(taskId, state.actionComment);
      } else if (action === 'reject') {
        await taskService.rejectTask(taskId, state.actionComment);
      } else if (action === 'complete') {
        await taskService.completeTask(taskId, state.actionComment);
      } else {
        state.workflowError = `Action "${action}" is not yet supported in the UI.`;
        return;
      }

      state.actionComment = '';
      state.activeAction = '';
      state.workflowSuccess = 'Workflow action completed successfully.';

      // Refresh task + workflow state
      state.task = await taskService.getTask(taskId);
      syncTaskEditForm(editForm, state.task);
      state.workflowCurrentState = state.task?.current_state || '';
      await loadWorkflow();
    } catch (error: any) {
      state.workflowError = error?.message || 'Action failed. Check permissions or workflow configuration.';
    } finally {
      state.workflowLoading = false;
    }
  });

  const addComment = $(async () => {
    if (!state.commentText.trim()) return;
    try {
      state.commentSaving = true;
      await taskService.addTaskComment(taskId, {
        comment: state.commentText.trim(),
        comment_type: state.commentType,
      });
      state.commentText = '';
      await loadComments();
    } catch (error: any) {
      state.error = error?.message || 'Failed to add comment';
    } finally {
      state.commentSaving = false;
    }
  });

  const handleTaskDocumentUploaded = $(async () => {
    state.showTaskDocUpload = false;
    state.taskDocsRefreshKey++;
    await loadWorkflow();
  });

  useVisibleTask$(async () => {
    if (!state.task) {
      await reloadTask();
    }
    await loadWorkflow();
    await loadComments();
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
      syncTaskEditForm(editForm, latestTask);
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
        <>
          {/* Top row: Overview + Work Scope + Progress strip */}
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
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
                  <span class="font-medium capitalize">{task.priority}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Progress</span>
                  <span class="font-medium">{task.progress || 0}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class={`h-2 rounded-full transition-all ${
                      (task.progress || 0) === 100 ? 'bg-green-500' :
                      (task.progress || 0) >= 50 ? 'bg-blue-500' : 'bg-orange-400'
                    }`}
                    style={{ width: `${task.progress || 0}%` }}
                  ></div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Created</span>
                  <span class="font-medium">{formatDate(task.created_at)}</span>
                </div>
                <div class="flex flex-wrap gap-2 pt-1">
                  <Badge variant={budgetVariance > 0 ? 'warning' : 'success'}>
                    {budgetVariance > 0 ? 'Over budget' : 'Within budget'}
                  </Badge>
                  {isOverdue && <Badge variant="error">Schedule overdue</Badge>}
                  {scheduleVarianceDays !== null && (
                    <Badge variant={scheduleVarianceDays > 0 ? 'warning' : 'info'}>
                      {scheduleVarianceDays > 0 ? `+${scheduleVarianceDays}d delay` : `${scheduleVarianceDays}d ahead`}
                    </Badge>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Work Scope">
              <div class="space-y-3 text-sm">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-gray-600">Start Node</span>
                  <span class="font-medium text-right text-green-700">{task.start_node?.name || task.start_node_id}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-gray-600">Stop Node</span>
                  <span class="font-medium text-right text-red-700">{task.stop_node?.name || task.stop_node_id}</span>
                </div>
                <hr class="border-gray-100" />
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Planned Start</span>
                  <span class="font-medium">{formatDate(task.planned_start_date)}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Planned End</span>
                  <span class={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>{formatDate(task.planned_end_date)}</span>
                </div>
                <hr class="border-gray-100" />
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
                <hr class="border-gray-100" />
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Labor</span>
                  <span>{formatCurrency(task.labor_cost)}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Material</span>
                  <span>{formatCurrency(task.material_cost)}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Equipment</span>
                  <span>{formatCurrency(task.equipment_cost)}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Other</span>
                  <span>{formatCurrency(task.other_cost)}</span>
                </div>
                <hr class="border-gray-100" />
                <div class="flex items-center justify-between font-semibold">
                  <span>Total Spend</span>
                  <span>{formatCurrency(task.total_cost || actualSpend)}</span>
                </div>
                <div class="flex items-center justify-between font-semibold">
                  <span>Variance</span>
                  <span class={budgetVariance > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                    {formatCurrency(budgetVariance)}
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Description + Assignments row */}
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <SectionCard title="Description">
              <p class="text-sm text-gray-700 whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
            </SectionCard>

            <SectionCard title="Assignments">
              {task.assignments && task.assignments.length > 0 ? (
                <div class="space-y-2">
                  {task.assignments.map((a) => (
                    <div key={a.id} class="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                      <div>
                        <span class="font-medium">{a.user_name || a.user_id}</span>
                        <span class="ml-2 text-xs text-gray-500 capitalize">{a.user_type}</span>
                      </div>
                      <Badge variant="info">{a.role}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p class="text-sm text-gray-500">No users assigned yet. Drag this task to the Assigned column in the Kanban board.</p>
              )}
            </SectionCard>
          </div>

          {/* Execution Update — full width */}
          <SectionCard title="Execution Update" subtitle="Track live progress, actual dates, and actual spend.">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
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
                <span class="text-gray-600">Labor Cost (₹)</span>
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
                <span class="text-gray-600">Material Cost (₹)</span>
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
                <span class="text-gray-600">Equipment Cost (₹)</span>
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
                <span class="text-gray-600">Other Cost (₹)</span>
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

            <div class="mt-4 flex items-center justify-between gap-3 flex-wrap border-t pt-4">
              <div class="text-sm text-gray-600">
                <span class="mr-1">Actual spend preview:</span>
                <span class="font-semibold text-gray-900">{formatCurrency((editForm.labor_cost || 0) + (editForm.material_cost || 0) + (editForm.equipment_cost || 0) + (editForm.other_cost || 0))}</span>
              </div>
              <Btn onClick$={saveExecutionUpdate} disabled={state.saving}>
                {state.saving ? 'Saving...' : 'Save Execution Update'}
              </Btn>
            </div>
          </SectionCard>

          {/* Workflow Panel + Comments row */}
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* ── Approval Workflow ── */}
            <SectionCard title="Approval Workflow" subtitle="Submit, approve, or track workflow progress for this task.">
              {state.workflowError && <Alert variant="error">{state.workflowError}</Alert>}
              {state.workflowSuccess && <Alert variant="success">{state.workflowSuccess}</Alert>}

              {!task.workflow_id ? (
                <div class="text-sm text-gray-500 py-2">
                  <i class="i-heroicons-information-circle-solid w-4 h-4 inline-block mr-1 text-gray-400"></i>
                  No workflow is assigned to this task. Workflow assignment is handled during task creation.
                </div>
              ) : (
                <div class="space-y-4">
                  {/* Current state badge */}
                  <div class="flex items-center gap-3">
                    <span class="text-sm text-gray-500">Current State</span>
                    <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      state.workflowCurrentState === 'approved' ? 'bg-green-100 text-green-800' :
                      state.workflowCurrentState === 'rejected' ? 'bg-red-100 text-red-800' :
                      state.workflowCurrentState === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      state.workflowCurrentState === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                      state.workflowCurrentState === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                      state.workflowCurrentState === 'verified' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {state.workflowCurrentState || 'draft'}
                    </span>
                  </div>

                  {/* Available actions */}
                  {state.workflowLoading ? (
                    <div class="text-sm text-gray-400">Loading workflow state…</div>
                  ) : state.workflowActions.length === 0 ? (
                    <div class="text-sm text-gray-400">No actions available at this state, or workflow not yet started (Submit to begin).</div>
                  ) : (
                    <div class="flex flex-wrap gap-2">
                      {state.workflowActions.map((wa) => (
                        <Btn
                          key={wa.action}
                          variant={wa.action === 'approve' || wa.action === 'verify' ? 'primary' : wa.action === 'reject' ? 'danger' : 'secondary'}
                          disabled={state.workflowLoading || wa.document_ready === false}
                          title={wa.document_ready === false ? (wa.document_message || 'Required documents are missing for this workflow action') : wa.label || wa.action}
                          onClick$={() => {
                            if (wa.document_ready === false) {
                              state.workflowError = wa.document_message || 'Required documents are missing for this workflow action.';
                              return;
                            }
                            if (state.activeAction === wa.action) {
                              state.activeAction = '';
                            } else {
                              state.activeAction = wa.action;
                              state.actionComment = '';
                              state.workflowError = '';
                            }
                          }}
                        >
                          {wa.label || wa.action}
                        </Btn>
                      ))}
                    </div>
                  )}

                  {state.workflowActions.some((wa) => wa.document_ready === false) && (
                    <div class="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-2">
                      <p class="text-xs font-semibold uppercase tracking-wide text-amber-800">Document requirements</p>
                      {state.workflowActions
                        .filter((wa) => wa.document_ready === false)
                        .map((wa) => (
                          <p key={`doc-req-${wa.action}`} class="text-xs text-amber-800">
                            {wa.label || wa.action}: {wa.document_message || 'Required task documents are missing.'}
                            {(wa.document_required?.min_documents || wa.document_required?.min_approved_documents) ? (
                              <span class="ml-1 text-amber-900/90">
                                (required: {wa.document_required?.min_documents || 0} linked, {wa.document_required?.min_approved_documents || 0} approved; current: {wa.document_counts?.total || 0} linked, {wa.document_counts?.approved || 0} approved)
                              </span>
                            ) : null}
                          </p>
                        ))}
                    </div>
                  )}

                  {/* Comment input for selected action */}
                  {state.activeAction && (
                    <div class="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
                      <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        Action: {state.workflowActions.find((a) => a.action === state.activeAction)?.label || state.activeAction}
                        {state.workflowActions.find((a) => a.action === state.activeAction)?.requires_comment && (
                          <span class="ml-1 text-red-500">* comment required</span>
                        )}
                      </p>
                      <textarea
                        class="form-input w-full text-sm"
                        rows={3}
                        placeholder="Add a comment (optional unless marked required)…"
                        value={state.actionComment}
                        onInput$={(e) => { state.actionComment = (e.target as HTMLTextAreaElement).value; }}
                      />
                      <div class="flex gap-2 justify-end">
                        <Btn variant="secondary" onClick$={() => { state.activeAction = ''; state.actionComment = ''; }}>
                          Cancel
                        </Btn>
                        <Btn
                          onClick$={() => performWorkflowAction(state.activeAction, state.workflowActions.find((a) => a.action === state.activeAction)?.requires_comment ?? false)}
                          disabled={state.workflowLoading}
                        >
                          {state.workflowLoading ? 'Processing…' : 'Confirm'}
                        </Btn>
                      </div>
                    </div>
                  )}

                  {/* Workflow history timeline */}
                  {state.workflowHistory.length > 0 && (
                    <div class="space-y-2 border-t pt-3">
                      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">History</p>
                      <ol class="relative border-l border-gray-200 pl-4 space-y-3">
                        {state.workflowHistory.map((h) => (
                          <li key={h.id} class="text-xs">
                            <div class="flex items-center gap-1 font-medium text-gray-700">
                              <span class="text-gray-500">{h.from_state}</span>
                              <i class="i-heroicons-arrow-right-solid w-3 h-3"></i>
                              <span class={h.to_state === 'rejected' ? 'text-red-600' : h.to_state === 'approved' ? 'text-green-600' : 'text-gray-700'}>{h.to_state}</span>
                              <span class="ml-auto text-gray-400">{formatDate(h.created_at)}</span>
                            </div>
                            <div class="text-gray-500">
                              by <span class="font-medium">{h.performed_by_name || h.performed_by}</span>
                              {h.comment && <span class="ml-1 italic">"{h.comment}"</span>}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* ── Comments ── */}
            <SectionCard title="Comments" subtitle="Team discussions and status updates for this task.">
              <div class="space-y-3">
                {/* Existing comments */}
                {state.comments.length > 0 ? (
                  <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {state.comments.map((c) => (
                      <div key={c.id} class="p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                        <div class="flex items-center justify-between mb-0.5">
                          <span class="font-medium text-gray-800">{c.author_name || c.author_id}</span>
                          <span class="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                        </div>
                        <p class="text-gray-700">{c.comment}</p>
                        {c.comment_type !== 'general' && (
                          <span class={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            c.comment_type === 'issue' ? 'bg-red-100 text-red-700' :
                            c.comment_type === 'resolution' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>{c.comment_type}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p class="text-sm text-gray-400">No comments yet.</p>
                )}

                {/* New comment form */}
                <div class="border-t pt-3 space-y-2">
                  <div class="flex gap-2">
                    <select
                      class="form-input text-sm w-36"
                      value={state.commentType}
                      onChange$={(e) => { state.commentType = (e.target as HTMLSelectElement).value as CommentType; }}
                    >
                      <option value="general">General</option>
                      <option value="update">Update</option>
                      <option value="issue">Issue</option>
                      <option value="resolution">Resolution</option>
                    </select>
                    <textarea
                      class="form-input flex-1 text-sm"
                      rows={2}
                      placeholder="Add a comment…"
                      value={state.commentText}
                      onInput$={(e) => { state.commentText = (e.target as HTMLTextAreaElement).value; }}
                    />
                  </div>
                  <div class="flex justify-end">
                    <Btn onClick$={addComment} disabled={state.commentSaving || !state.commentText.trim()}>
                      {state.commentSaving ? 'Posting…' : 'Add Comment'}
                    </Btn>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Task Documents */}
          <SectionCard
            title="Task Documents"
            subtitle="Upload and track task evidence such as inspection reports, photos, test certificates, and closure docs."
            class="mt-4"
          >
            <div class="space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="text-sm text-gray-600">
                  Documents uploaded here are tagged with task and project context for traceability.
                </div>
                <div class="flex items-center gap-2">
                  <Btn
                    variant={state.showTaskDocUpload ? 'secondary' : 'primary'}
                    onClick$={() => {
                      state.showTaskDocUpload = !state.showTaskDocUpload;
                    }}
                  >
                    <i class="i-heroicons-arrow-up-tray-solid w-4 h-4 inline-block mr-1"></i>
                    {state.showTaskDocUpload ? 'Hide Upload' : 'Upload Task Document'}
                  </Btn>
                  <a
                    href={`/documents?context=task&task_id=${task.id}`}
                    class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 px-4 py-2 text-sm btn-secondary"
                  >
                    <i class="i-heroicons-arrow-top-right-on-square-solid w-4 h-4"></i>
                    Open DMS Workspace
                  </a>
                </div>
              </div>

              {state.showTaskDocUpload && (
                <DocumentUpload
                  onUploadComplete={handleTaskDocumentUploaded}
                  projectId={task.project_id}
                  taskId={task.id}
                  workflowId={task.workflow_id}
                  contextMetadata={{
                    context: 'task',
                    task_id: task.id,
                    task_code: task.code,
                    project_id: task.project_id,
                  }}
                />
              )}

              <DocumentList
                key={state.taskDocsRefreshKey}
                contextFilter={{
                  context: 'task',
                  project_id: task.project_id,
                  task_id: task.id,
                }}
                allowSelection={false}
                onDocumentClick={$((document: any) => nav(`/documents/view/${document.id}`))}
              />
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Task Details',
};
