/**
 * Project Task List Page
 * Dedicated task board for a single project
 */

import { component$, useStore, useVisibleTask$, $, type QRL } from '@builder.io/qwik';
import { useLocation, useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import { Alert, Badge, Btn, FormField, PageHeader } from '~/components/ds';
import { createSSRApiClient } from '~/services/api-client';
import { taskService } from '~/services/task.service';
import type { AssignmentRole, Project, Task, TaskPriority, TaskStatus, UserType } from '~/types/project';

interface TaskLoaderData {
  project: Project | null;
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
}

const normalizeOptionalQueryParam = (value: string | null): string | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === '' || normalized === 'undefined' || normalized === 'null') {
    return undefined;
  }
  return value;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const safeDate = (value?: string): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const fmtDate = (value: Date): string => value.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

export const useProjectTasksData = routeLoader$(async (requestEvent): Promise<TaskLoaderData> => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const projectId = requestEvent.params.projectId;
  const page = Number(requestEvent.url.searchParams.get('page') || '1') || 1;
  const pageSize = Number(requestEvent.url.searchParams.get('page_size') || '12') || 12;
  const status = normalizeOptionalQueryParam(requestEvent.url.searchParams.get('status'));
  const priority = normalizeOptionalQueryParam(requestEvent.url.searchParams.get('priority'));
  const sortBy = requestEvent.url.searchParams.get('sort_by') || 'created_at';
  const sortOrder = requestEvent.url.searchParams.get('sort_order') || 'desc';

  try {
    const [project, tasksResponse] = await Promise.all([
      ssrApiClient.get<Project>(`/projects/${projectId}`),
      ssrApiClient.get<{ tasks?: Task[]; count?: number; total?: number; page?: number; page_size?: number } | Task[]>(`/project-tasks`, {
        project_id: projectId,
        status,
        priority,
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
    ]);

    const tasks = Array.isArray(tasksResponse) ? tasksResponse : (tasksResponse?.tasks || []);
    const total = Array.isArray(tasksResponse)
      ? tasks.length
      : (tasksResponse?.total || tasksResponse?.count || tasks.length);

    return {
      project,
      tasks,
      total,
      page,
      pageSize,
    };
  } catch (error: any) {
    return {
      project: null,
      tasks: [],
      total: 0,
      page: 1,
      pageSize: 12,
      error: error?.message || 'Failed to load project tasks',
    };
  }
});

export default component$(() => {
  const nav = useNavigate();
  const loc = useLocation();
  const projectId = loc.params.projectId;
  const initialData = useProjectTasksData();

  const state = useStore({
    project: initialData.value.project,
    tasks: initialData.value.tasks,
    total: initialData.value.total,
    page: initialData.value.page,
    pageSize: initialData.value.pageSize,
    loading: false,
    error: initialData.value.error || '',
    actionMessage: '',
    updatingTaskId: '',
    dragTaskId: '',
    dragOverColumn: '',
    assignModal: { open: false, taskId: '', taskTitle: '' },
    assignForm: {
      user_id: '',
      user_type: 'employee' as UserType,
      role: 'worker' as AssignmentRole,
      notes: '',
      can_edit: false,
      can_approve: false,
    },
    filters: {
      search: '',
      status: '',
      priority: '',
      sortBy: 'created_at' as 'status' | 'priority' | 'planned_end_date' | 'progress' | 'created_at',
      sortOrder: 'desc' as 'asc' | 'desc',
    },
  });

  const loadTasks: QRL<(requestedPage?: number) => Promise<void>> = $(async (requestedPage?: number) => {
    try {
      state.loading = true;
      state.error = '';

      if (requestedPage && requestedPage > 0) {
        state.page = requestedPage;
      }

      const response = await taskService.listTasks({
        project_id: projectId,
        status: state.filters.status || undefined,
        priority: state.filters.priority || undefined,
        page: state.page,
        page_size: state.pageSize,
        sort_by: state.filters.sortBy,
        sort_order: state.filters.sortOrder,
      });

      state.tasks = response.tasks || [];
      state.total = response.total || response.count || state.tasks.length;
      state.page = response.page || state.page;
      state.pageSize = response.page_size || state.pageSize;
    } catch (error: any) {
      state.error = error?.message || 'Failed to fetch tasks';
    } finally {
      state.loading = false;
    }
  });

  // Re-fetch on client after hydration to ensure fresh data
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    await loadTasks();
  }, { strategy: 'document-ready' });

  const clearFilters = $(async () => {
    state.filters.search = '';
    state.filters.status = '';
    state.filters.priority = '';
    state.filters.sortBy = 'created_at';
    state.filters.sortOrder = 'desc';
    state.page = 1;
    await loadTasks(1);
  });

  const handleViewTask = $((task: Task) => {
    nav(`/tasks/${task.id}`);
  });

  const handleCreateTask = $(() => {
    nav(`/projects/${projectId}/tasks/create`);
  });

  const handleDrop$: QRL<(targetStatus: TaskStatus) => Promise<void>> = $(async (targetStatus) => {
    const taskId = state.dragTaskId;
    state.dragTaskId = '';
    state.dragOverColumn = '';
    if (!taskId) return;
    const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex < 0) return;
    if (state.tasks[taskIndex].status === targetStatus) return;
    // Dropping into 'assigned' opens the assignment modal instead of a blind status update
    if (targetStatus === 'assigned') {
      const task = state.tasks[taskIndex];
      state.assignModal.open = true;
      state.assignModal.taskId = task.id;
      state.assignModal.taskTitle = task.title;
      state.assignForm.user_id = '';
      state.assignForm.user_type = 'employee';
      state.assignForm.role = 'worker';
      state.assignForm.notes = '';
      state.assignForm.can_edit = false;
      state.assignForm.can_approve = false;
      return;
    }
    try {
      state.updatingTaskId = taskId;
      state.actionMessage = '';
      const response = await taskService.updateTaskStatus(taskId, { status: targetStatus });
      state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...response.task };
      state.actionMessage = `Task moved to ${targetStatus}.`;
    } catch (err: any) {
      state.error = err?.message || 'Failed to update task status';
    } finally {
      state.updatingTaskId = '';
    }
  });

  const handleAssignSubmit$: QRL<() => Promise<void>> = $(async () => {
    if (!state.assignForm.user_id.trim()) {
      state.error = 'User ID is required';
      return;
    }
    const taskTitle = state.assignModal.taskTitle;
    try {
      state.loading = true;
      await taskService.assignTask(state.assignModal.taskId, {
        user_id: state.assignForm.user_id.trim(),
        user_type: state.assignForm.user_type,
        role: state.assignForm.role,
        notes: state.assignForm.notes || undefined,
        can_edit: state.assignForm.can_edit,
        can_approve: state.assignForm.can_approve,
      });
      state.assignModal.open = false;
      state.assignModal.taskId = '';
      state.assignModal.taskTitle = '';
      state.actionMessage = `User assigned to "${taskTitle}" successfully.`;
      await loadTasks();
    } catch (err: any) {
      state.error = err?.message || 'Failed to assign user';
    } finally {
      state.loading = false;
    }
  });

  const filteredTasks = state.tasks.filter((task) => {
    const search = state.filters.search.trim().toLowerCase();
    if (!search) return true;

    const title = (task.title || '').toLowerCase();
    const code = (task.code || '').toLowerCase();
    const description = (task.description || '').toLowerCase();
    return title.includes(search) || code.includes(search) || description.includes(search);
  });

  const totalTasks = state.total || state.tasks.length;
  const completedTasks = state.tasks.filter((task) => task.status === 'completed').length;
  const inProgressTasks = state.tasks.filter((task) => task.status === 'in-progress').length;
  const highPriorityTasks = state.tasks.filter((task) => task.priority === 'high' || task.priority === 'critical').length;
  const hasFilters =
    !!state.filters.search ||
    !!state.filters.status ||
    !!state.filters.priority ||
    state.filters.sortBy !== 'created_at' ||
    state.filters.sortOrder !== 'desc';
  const startIndex = state.total === 0 ? 0 : ((state.page - 1) * state.pageSize) + 1;
  const endIndex = Math.min(state.page * state.pageSize, state.total || 0);

  const timelineSource = filteredTasks
    .map((task) => {
      const start = safeDate(task.planned_start_date) || safeDate(task.created_at);
      const end = safeDate(task.planned_end_date) || start;
      if (!start || !end) return null;

      const safeEnd = end.getTime() < start.getTime() ? new Date(start.getTime()) : end;
      return { task, start, end: safeEnd };
    })
    .filter((item): item is { task: Task; start: Date; end: Date } => item !== null);

  const timelineBounds = timelineSource.length > 0
    ? timelineSource.reduce((acc, item) => {
      const startTime = item.start.getTime();
      const endTime = item.end.getTime();
      return {
        min: Math.min(acc.min, startTime),
        max: Math.max(acc.max, endTime),
      };
    }, { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY })
    : null;

  const totalTimelineSpan = timelineBounds
    ? Math.max(timelineBounds.max - timelineBounds.min, ONE_DAY_MS)
    : ONE_DAY_MS;

  const ganttRows = timelineSource.slice(0, 12).map((item) => {
    const startMs = item.start.getTime();
    const endMs = item.end.getTime();
    const offsetPct = timelineBounds ? ((startMs - timelineBounds.min) / totalTimelineSpan) * 100 : 0;
    const widthPct = timelineBounds
      ? (Math.max(endMs - startMs, ONE_DAY_MS) / totalTimelineSpan) * 100
      : 100;

    return {
      task: item.task,
      startLabel: fmtDate(item.start),
      endLabel: fmtDate(item.end),
      offsetPct: Math.max(0, Math.min(offsetPct, 100)),
      widthPct: Math.max(2, Math.min(widthPct, 100)),
      progressPct: Math.max(0, Math.min(item.task.progress || 0, 100)),
    };
  });

  const taskBuckets: Record<TaskStatus, Task[]> = {
    pending: filteredTasks.filter((task) => task.status === 'pending'),
    assigned: filteredTasks.filter((task) => task.status === 'assigned'),
    'in-progress': filteredTasks.filter((task) => task.status === 'in-progress'),
    'on-hold': filteredTasks.filter((task) => task.status === 'on-hold'),
    completed: filteredTasks.filter((task) => task.status === 'completed'),
    cancelled: filteredTasks.filter((task) => task.status === 'cancelled'),
  };

  const plannedBudget = filteredTasks.reduce((sum, task) => sum + (task.allocated_budget || 0), 0);
  const actualBudget = filteredTasks.reduce(
    (sum, task) => sum + (task.labor_cost || 0) + (task.material_cost || 0) + (task.equipment_cost || 0) + (task.other_cost || 0),
    0
  );
  const budgetVariance = actualBudget - plannedBudget;
  const overdueTasks = filteredTasks.filter((task) => {
    const plannedEnd = safeDate(task.planned_end_date);
    return !!plannedEnd && plannedEnd.getTime() < Date.now() && task.status !== 'completed' && task.status !== 'cancelled';
  }).length;
  const avgProgress = filteredTasks.length > 0
    ? filteredTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / filteredTasks.length
    : 0;

  return (
    <div class="project-route-shell">
      <PageHeader
        title="Project Tasks"
        subtitle={state.project ? `${state.project.name} (${state.project.code})` : 'Task board'}
      >
        <div q:slot="actions" class="flex items-center gap-2">
          <Btn variant="secondary" onClick$={() => nav(`/projects/${projectId}`)}>
            <i class="i-heroicons-arrow-left-solid w-4 h-4 inline-block mr-1"></i>
            Back to Project
          </Btn>
          <Btn onClick$={handleCreateTask}>
            <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-1"></i>
            New Task
          </Btn>
        </div>
      </PageHeader>

      <section class="project-kpi-grid">
        <article class="project-kpi-card">
          <span class="project-kpi-label">Total Tasks</span>
          <span class="project-kpi-value">{totalTasks}</span>
          <span class="project-kpi-footnote">All project work items</span>
        </article>
        <article class="project-kpi-card">
          <span class="project-kpi-label">In Progress</span>
          <span class="project-kpi-value">{inProgressTasks}</span>
          <span class="project-kpi-footnote">Currently active execution</span>
        </article>
        <article class="project-kpi-card">
          <span class="project-kpi-label">Completed</span>
          <span class="project-kpi-value">{completedTasks}</span>
          <span class="project-kpi-footnote">Finished tasks</span>
        </article>
        <article class="project-kpi-card">
          <span class="project-kpi-label">High Risk</span>
          <span class="project-kpi-value">{highPriorityTasks}</span>
          <span class="project-kpi-footnote">High and critical priority</span>
        </article>
      </section>

      <section class="project-surface project-toolbar">
        <div class="project-toolbar-grid">
          <FormField label="Search">
            <input
              type="text"
              class="form-input w-full"
              placeholder="Search by task title, code, or description"
              value={state.filters.search}
              onInput$={(e) => {
                state.filters.search = (e.target as HTMLInputElement).value;
              }}
            />
          </FormField>

          <FormField id="project-task-status-filter" label="Status">
            <select
              id="project-task-status-filter"
              class="form-input w-full"
              value={state.filters.status}
              onChange$={async (e) => {
                state.filters.status = (e.target as HTMLSelectElement).value as TaskStatus | '';
                await loadTasks();
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </FormField>

          <FormField id="project-task-priority-filter" label="Priority">
            <select
              id="project-task-priority-filter"
              class="form-input w-full"
              value={state.filters.priority}
              onChange$={async (e) => {
                state.filters.priority = (e.target as HTMLSelectElement).value as TaskPriority | '';
                state.page = 1;
                await loadTasks(1);
              }}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </FormField>

          <FormField id="project-task-sort-by" label="Sort By">
            <select
              id="project-task-sort-by"
              class="form-input w-full"
              value={state.filters.sortBy}
              onChange$={async (e) => {
                state.filters.sortBy = (e.target as HTMLSelectElement).value as typeof state.filters.sortBy;
                state.page = 1;
                await loadTasks(1);
              }}
            >
              <option value="created_at">Created Date</option>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
              <option value="planned_end_date">Due Date</option>
              <option value="progress">Progress</option>
            </select>
          </FormField>

          <FormField id="project-task-sort-order" label="Order">
            <select
              id="project-task-sort-order"
              class="form-input w-full"
              value={state.filters.sortOrder}
              onChange$={async (e) => {
                state.filters.sortOrder = (e.target as HTMLSelectElement).value as typeof state.filters.sortOrder;
                state.page = 1;
                await loadTasks(1);
              }}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </FormField>

          <FormField id="project-task-page-size" label="Page Size">
            <select
              id="project-task-page-size"
              class="form-input w-full"
              value={String(state.pageSize)}
              onChange$={async (e) => {
                state.pageSize = Number((e.target as HTMLSelectElement).value);
                state.page = 1;
                await loadTasks(1);
              }}
            >
              <option value="6">6</option>
              <option value="12">12</option>
              <option value="18">18</option>
              <option value="24">24</option>
            </select>
          </FormField>
        </div>

        <div class="project-toolbar-actions">
          <span class="project-toolbar-meta">
            Showing {startIndex}-{endIndex} of {state.total} tasks
          </span>
          <div class="flex items-center gap-2">
            {hasFilters && (
              <Btn variant="secondary" size="sm" onClick$={clearFilters}>
                Reset Filters
              </Btn>
            )}
            <Badge variant="info" class="text-xs">
              Project ID: {projectId}
            </Badge>
          </div>
        </div>
      </section>

      {state.error && (
        <Alert variant="error">
          <i class="i-heroicons-exclamation-circle-solid w-4 h-4 inline-block mr-2"></i>
          {state.error}
        </Alert>
      )}

      {!state.error && state.actionMessage && (
        <Alert variant="success">
          <i class="i-heroicons-check-circle-solid w-4 h-4 inline-block mr-2"></i>
          {state.actionMessage}
        </Alert>
      )}

      {state.loading && (
        <div class="project-grid">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} class="project-panel animate-pulse h-72">
              <div class="h-4 bg-gray-200 rounded w-3/5 mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-2/5 mb-4"></div>
              <div class="h-24 bg-gray-200 rounded mb-3"></div>
              <div class="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {!state.loading && filteredTasks.length > 0 && (
        <>
          {timelineBounds && ganttRows.length > 0 && (
            <section class="project-surface gantt-board">
              <div class="gantt-board-head">
                <div>
                  <h3 class="gantt-board-title">Execution Timeline</h3>
                  <p class="gantt-board-subtitle">Gantt-style view using planned start/end dates and live progress.</p>
                </div>
                <Badge variant="neutral" class="text-xs">Showing {ganttRows.length} tasks</Badge>
              </div>

              <div class="gantt-scale">
                <span>{fmtDate(new Date(timelineBounds.min))}</span>
                <span>{fmtDate(new Date(timelineBounds.max))}</span>
              </div>

              <div class="gantt-rows">
                {ganttRows.map((row) => (
                  <article key={`gantt-${row.task.id}`} class="gantt-row">
                    <div class="gantt-row-meta">
                      <strong>{row.task.title}</strong>
                      <span>{row.task.code} | {row.startLabel} - {row.endLabel}</span>
                    </div>
                    <div class="gantt-row-track">
                      <div
                        class="gantt-row-bar"
                        style={{ left: `${row.offsetPct}%`, width: `${row.widthPct}%` }}
                        aria-label={`${row.task.title} timeline`}
                      >
                        <div class="gantt-row-progress" style={{ width: `${row.progressPct}%` }}></div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section class="project-surface project-kpi-grid task-metrics-strip">
            <article class="project-kpi-card">
              <span class="project-kpi-label">Average Progress</span>
              <span class="project-kpi-value">{avgProgress.toFixed(0)}%</span>
              <span class="project-kpi-footnote">Derived from task progress values</span>
            </article>
            <article class="project-kpi-card">
              <span class="project-kpi-label">Planned Budget</span>
              <span class="project-kpi-value">₹{(plannedBudget / 100000).toFixed(2)}L</span>
              <span class="project-kpi-footnote">Sum of allocated task budgets</span>
            </article>
            <article class="project-kpi-card">
              <span class="project-kpi-label">Actual Spend</span>
              <span class="project-kpi-value">₹{(actualBudget / 100000).toFixed(2)}L</span>
              <span class="project-kpi-footnote">Labor + material + equipment + other</span>
            </article>
            <article class="project-kpi-card">
              <span class="project-kpi-label">Overdue Tasks</span>
              <span class="project-kpi-value">{overdueTasks}</span>
              <span class="project-kpi-footnote">Planned end date passed and not completed</span>
            </article>
          </section>

          <section class="project-surface kanban-board">
            <div class="gantt-board-head">
              <div>
                <h3 class="gantt-board-title">Kanban Workflow</h3>
                <p class="gantt-board-subtitle">Drag cards to change status — drop into <strong>Assigned</strong> to set a user. Click any card to open details.</p>
              </div>
              <Badge variant={budgetVariance > 0 ? 'warning' : 'success'} class="text-xs">
                Budget variance: ₹{(budgetVariance / 100000).toFixed(2)}L
              </Badge>
            </div>

            <div class="kanban-grid">
              {([
                ['pending', 'Pending'],
                ['assigned', 'Assigned'],
                ['in-progress', 'In Progress'],
                ['completed', 'Completed'],
              ] as Array<[TaskStatus, string]>).map(([statusKey, label]) => (
                <section
                  key={statusKey}
                  class={`kanban-column ${state.dragOverColumn === statusKey && state.dragTaskId ? 'kanban-column--drop-target' : ''}`}
                  onDragOver$={(e) => { e.preventDefault(); state.dragOverColumn = statusKey; }}
                  onDragLeave$={() => { state.dragOverColumn = ''; }}
                  onDrop$={async (e) => { e.preventDefault(); await handleDrop$(statusKey); }}
                >
                  <header class="kanban-column-head">
                    <h4>{label}</h4>
                    <Badge variant="neutral">{taskBuckets[statusKey].length}</Badge>
                  </header>
                  <div class="kanban-column-body">
                    {taskBuckets[statusKey].length > 0 ? taskBuckets[statusKey].slice(0, 6).map((task) => {
                      const plannedEnd = task.planned_end_date ? new Date(task.planned_end_date) : null;
                      const isOverdue = !!plannedEnd && !Number.isNaN(plannedEnd.getTime()) && plannedEnd.getTime() < Date.now() && task.status !== 'completed' && task.status !== 'cancelled';
                      const budgetVarianceCard = (task.total_cost || 0) - (task.allocated_budget || 0);
                      return (
                        <div
                          key={`kanban-${task.id}`}
                          class={`kanban-card ${state.dragTaskId === task.id ? 'kanban-card--dragging' : ''}`}
                          draggable={true}
                          onClick$={() => handleViewTask(task)}
                          onDragStart$={(e) => { e.stopPropagation(); state.dragTaskId = task.id; }}
                          onDragEnd$={() => { state.dragTaskId = ''; state.dragOverColumn = ''; }}
                        >
                          {/* Title row */}
                          <div class="kanban-card-header">
                            <span class="kanban-drag-handle" aria-hidden="true" onClick$={(e) => e.stopPropagation()}>⠿</span>
                            <strong class="kanban-card-title">{task.title}</strong>
                            <i class={`i-heroicons-flag-solid w-3 h-3 inline-block flex-shrink-0 ${task.priority === 'critical' ? 'text-red-500' : task.priority === 'high' ? 'text-orange-500' : task.priority === 'medium' ? 'text-yellow-500' : 'text-gray-400'}`}></i>
                          </div>
                          <span class="kanban-card-code">{task.code}</span>

                          {/* Overdue / budget flags */}
                          {(isOverdue || (task.allocated_budget > 0 && budgetVarianceCard > 0)) && (
                            <div class="kanban-card-flags">
                              {isOverdue && <span class="kanban-flag kanban-flag--overdue">Overdue</span>}
                              {task.allocated_budget > 0 && budgetVarianceCard > 0 && <span class="kanban-flag kanban-flag--budget">Over budget</span>}
                            </div>
                          )}

                          {/* Start / Stop nodes */}
                          <div class="kanban-nodes">
                            <div class="kanban-node kanban-node--start">
                              <i class="i-heroicons-map-pin-solid w-3 h-3 inline-block"></i>
                              <span>{task.start_node?.name || task.start_node_id || '—'}</span>
                            </div>
                            <div class="kanban-node kanban-node--stop">
                              <i class="i-heroicons-map-pin w-3 h-3 inline-block"></i>
                              <span>{task.stop_node?.name || task.stop_node_id || '—'}</span>
                            </div>
                          </div>

                          {/* Progress */}
                          <div class="kanban-progress-row">
                            <span>Progress</span>
                            <span class="kanban-progress-label">{task.progress || 0}%</span>
                          </div>
                          <div class="kanban-progress-track">
                            <div class="kanban-progress-fill" style={{ width: `${task.progress || 0}%` }}></div>
                          </div>

                          {/* Budget */}
                          {task.allocated_budget > 0 && (
                            <div class="kanban-budget-row">
                              <span>Budget</span>
                              <span>₹{(task.allocated_budget / 1000).toFixed(1)}K</span>
                            </div>
                          )}

                          {/* Dates */}
                          {(task.planned_start_date || task.planned_end_date) && (
                            <div class="kanban-dates-row">
                              <i class="i-heroicons-calendar-solid w-3 h-3 inline-block text-gray-400"></i>
                              <span>{task.planned_start_date ? fmtDate(new Date(task.planned_start_date)) : '—'}</span>
                              <span class="kanban-dates-arrow">→</span>
                              <span class={isOverdue ? 'text-red-600 font-semibold' : ''}>{task.planned_end_date ? fmtDate(new Date(task.planned_end_date)) : '—'}</span>
                            </div>
                          )}

                          {/* Assignments */}
                          {task.assignments && task.assignments.length > 0 && (
                            <div class="kanban-assignments">
                              {task.assignments.slice(0, 2).map((a) => (
                                <span key={a.id} class="kanban-assignee">{a.user_name || a.user_id} <em>{a.role}</em></span>
                              ))}
                              {task.assignments.length > 2 && <span class="kanban-assignee">+{task.assignments.length - 2}</span>}
                            </div>
                          )}

                          {state.updatingTaskId === task.id && (
                            <div class="kanban-card-updating">Updating…</div>
                          )}
                        </div>
                      );
                    }) : (
                      <div class="kanban-empty">Drop tasks here</div>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </section>


        </>
      )}

      {!state.loading && filteredTasks.length === 0 && (
        <div class="project-empty-state">
          <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <i class="i-heroicons-clipboard-document-list-solid w-16 h-16 inline-block text-gray-400"></i>
          </div>
          <h3>No tasks found</h3>
          <p>
            {totalTasks === 0
              ? 'Create the first task to begin project execution tracking.'
              : 'Try adjusting your filters to find matching tasks.'}
          </p>

          <div class="flex items-center justify-center gap-2">
            {hasFilters && (
              <Btn variant="secondary" onClick$={clearFilters}>
                Clear Filters
              </Btn>
            )}
            <Btn onClick$={handleCreateTask}>
              <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-1"></i>
              Create Task
            </Btn>
          </div>
        </div>
      )}

      {state.assignModal.open && (
        <div
          class="modal-overlay"
          onClick$={(e) => {
            if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
              state.assignModal.open = false;
            }
          }}
        >
          <div class="modal-panel">
            <header class="modal-header">
              <h3>Assign User</h3>
              <span class="modal-subtitle">{state.assignModal.taskTitle}</span>
              <button class="modal-close" onClick$={() => { state.assignModal.open = false; }}>✕</button>
            </header>
            <div class="modal-body">
              <FormField label="User ID *">
                <input
                  type="text"
                  class="form-input w-full"
                  placeholder="Enter user ID"
                  value={state.assignForm.user_id}
                  onInput$={(e) => { state.assignForm.user_id = (e.target as HTMLInputElement).value; }}
                />
              </FormField>
              <FormField id="assign-user-type" label="User Type">
                <select
                  id="assign-user-type"
                  class="form-input w-full"
                  value={state.assignForm.user_type}
                  onChange$={(e) => { state.assignForm.user_type = (e.target as HTMLSelectElement).value as UserType; }}
                >
                  <option value="employee">Employee</option>
                  <option value="contractor">Contractor</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </FormField>
              <FormField id="assign-role" label="Role">
                <select
                  id="assign-role"
                  class="form-input w-full"
                  value={state.assignForm.role}
                  onChange$={(e) => { state.assignForm.role = (e.target as HTMLSelectElement).value as AssignmentRole; }}
                >
                  <option value="worker">Worker</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Manager</option>
                  <option value="approver">Approver</option>
                </select>
              </FormField>
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.assignForm.can_edit}
                    onChange$={(e) => { state.assignForm.can_edit = (e.target as HTMLInputElement).checked; }}
                  />
                  <span class="text-sm">Can Edit</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.assignForm.can_approve}
                    onChange$={(e) => { state.assignForm.can_approve = (e.target as HTMLInputElement).checked; }}
                  />
                  <span class="text-sm">Can Approve</span>
                </label>
              </div>
              <FormField label="Notes">
                <textarea
                  class="form-input w-full"
                  rows={3}
                  placeholder="Optional notes about this assignment"
                  value={state.assignForm.notes}
                  onInput$={(e) => { state.assignForm.notes = (e.target as HTMLTextAreaElement).value; }}
                />
              </FormField>
            </div>
            <footer class="modal-footer">
              <Btn variant="secondary" onClick$={() => { state.assignModal.open = false; }}>Cancel</Btn>
              <Btn onClick$={handleAssignSubmit$} disabled={state.loading}>
                {state.loading ? 'Assigning…' : 'Assign User'}
              </Btn>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
});
