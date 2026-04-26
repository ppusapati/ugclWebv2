/**
 * Project Task List Page
 * Dedicated task board for a single project
 */

import { component$, useStore, $, type QRL } from '@builder.io/qwik';
import { useLocation, useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import { Alert, Badge, Btn, FormField, PageHeader } from '~/components/ds';
import { TaskCard } from '~/components/tasks/task-card';
import { createSSRApiClient } from '~/services/api-client';
import { taskService } from '~/services/task.service';
import type { Project, Task, TaskPriority, TaskStatus } from '~/types/project';

interface TaskLoaderData {
  project: Project | null;
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
}

export const useProjectTasksData = routeLoader$(async (requestEvent): Promise<TaskLoaderData> => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const projectId = requestEvent.params.projectId;
  const page = Number(requestEvent.url.searchParams.get('page') || '1') || 1;
  const pageSize = Number(requestEvent.url.searchParams.get('page_size') || '12') || 12;
  const status = requestEvent.url.searchParams.get('status') || undefined;
  const priority = requestEvent.url.searchParams.get('priority') || undefined;
  const sortBy = requestEvent.url.searchParams.get('sort_by') || 'created_at';
  const sortOrder = requestEvent.url.searchParams.get('sort_order') || 'desc';

  try {
    const [project, tasksResponse] = await Promise.all([
      ssrApiClient.get<Project>(`/projects/${projectId}`),
      ssrApiClient.get<{ tasks?: Task[]; count?: number; total?: number; page?: number; page_size?: number } | Task[]>(`/tasks`, {
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

  const clearFilters = $(async () => {
    state.filters.search = '';
    state.filters.status = '';
    state.filters.priority = '';
    state.filters.sortBy = 'created_at';
    state.filters.sortOrder = 'desc';
    state.page = 1;
    await loadTasks(1);
  });

  const previousPage = $(async () => {
    if (state.page > 1) {
      await loadTasks(state.page - 1);
    }
  });

  const nextPage = $(async () => {
    if (state.page < Math.ceil((state.total || 0) / state.pageSize)) {
      await loadTasks(state.page + 1);
    }
  });

  const handleViewTask = $((task: Task) => {
    nav(`/tasks/${task.id}`);
  });

  const handleCreateTask = $(() => {
    nav(`/projects/${projectId}/tasks/create`);
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
  const totalPages = Math.max(1, Math.ceil((state.total || 0) / state.pageSize));
  const startIndex = state.total === 0 ? 0 : ((state.page - 1) * state.pageSize) + 1;
  const endIndex = Math.min(state.page * state.pageSize, state.total || 0);

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
          <div class="project-grid">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onView$={handleViewTask} />
            ))}
          </div>

          <section class="project-surface p-3 md:p-4">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <p class="text-sm text-gray-600">
                Page {state.page} of {totalPages}
              </p>
              <div class="flex items-center gap-2">
                <Btn variant="secondary" size="sm" disabled={state.page <= 1 || state.loading} onClick$={previousPage}>
                  Previous
                </Btn>
                <Btn variant="secondary" size="sm" disabled={state.page >= totalPages || state.loading} onClick$={nextPage}>
                  Next
                </Btn>
              </div>
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
    </div>
  );
});
