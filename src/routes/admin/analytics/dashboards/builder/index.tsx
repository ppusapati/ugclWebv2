// Dashboard Builder with drag-and-drop widgets
import { component$, useStore, useSignal, $ } from '@builder.io/qwik';
import { useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '../../../../../services/api-client';
import { analyticsService } from '../../../../../services/analytics.service';
import type { Dashboard, DashboardWidget, WidgetType, ReportListResponse } from '../../../../../types/analytics';
import { authService } from '../../../../../services';
import { Alert, Badge, Btn, FormField, PageHeader, StatCard } from '../../../../../components/ds';

// Load available reports with SSR support
export const useAvailableReports = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    console.log('[DASHBOARD BUILDER] Fetching available reports');

    const response = await ssrApiClient.get<ReportListResponse>('/reports/definitions');

    console.log('[DASHBOARD BUILDER] Reports fetched:', response.reports?.length || 0);

    return {
      reports: response.reports || [],
    };
  } catch (error: any) {
    console.error('[DASHBOARD BUILDER] Failed to load reports:', error);
    return {
      reports: [],
      error: error.message || 'Failed to load reports',
    };
  }
});

// Widget templates
const WIDGET_TEMPLATES: Array<{
  type: WidgetType;
  icon: string;
  label: string;
  description: string;
  defaultSize: { w: number; h: number };
  color: string;
}> = [
  {
    type: 'chart',
    icon: 'i-heroicons-chart-bar-solid',
    label: 'Chart Widget',
    description: 'Visualize data with interactive charts',
    defaultSize: { w: 6, h: 4 },
    color: 'from-blue-500 to-cyan-500',
  },
  {
    type: 'kpi',
    icon: 'i-heroicons-presentation-chart-line-solid',
    label: 'KPI Widget',
    description: 'Display key performance indicators',
    defaultSize: { w: 3, h: 2 },
    color: 'from-green-500 to-emerald-500',
  },
  {
    type: 'table',
    icon: 'i-heroicons-clipboard-document-list-solid',
    label: 'Table Widget',
    description: 'Show data in tabular format',
    defaultSize: { w: 8, h: 5 },
    color: 'from-purple-500 to-pink-500',
  },
  {
    type: 'text',
    icon: 'i-heroicons-document-text-solid',
    label: 'Text Widget',
    description: 'Add text, notes, or descriptions',
    defaultSize: { w: 4, h: 2 },
    color: 'from-orange-500 to-red-500',
  },
  {
    type: 'iframe',
    icon: 'i-heroicons-globe-alt-solid',
    label: 'Embed Widget',
    description: 'Embed external content or URLs',
    defaultSize: { w: 6, h: 4 },
    color: 'from-indigo-500 to-purple-500',
  },
];

const DASHBOARD_GRID_COLS = 12;
const DASHBOARD_GRID_ROWS = 12;
const DASHBOARD_GRID_ROW_HEIGHT = 48;
const DASHBOARD_CANVAS_MIN_WIDTH = 840;
const DASHBOARD_CANVAS_MIN_HEIGHT = DASHBOARD_GRID_ROWS * DASHBOARD_GRID_ROW_HEIGHT;

export default component$(() => {
  const nav = useNavigate();
  const availableReportsData = useAvailableReports();

  const dashboardConfig = useStore<Partial<Dashboard>>({
    code: '',
    name: '',
    description: '',
    business_vertical_id: '',
    widgets: [],
    layout: {},
    is_default: false,
    is_public: false,
    tags: [],
  });

  const state = useStore({
    currentStep: 1,
    selectedWidget: null as DashboardWidget | null,
    draggedTemplate: null as string | null,
    showSaveModal: false,
    showWidgetConfig: false,
    gridCols: DASHBOARD_GRID_COLS,
    gridRows: DASHBOARD_GRID_ROWS,
    loading: false,
    error: '',
  });

  const fieldClass = 'w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-4 py-3 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none';
  const compactFieldClass = 'w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-3 py-2 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none';
  const textareaClass = `${fieldClass} min-h-24`;
  const compactTextareaClass = `${compactFieldClass} min-h-20`;

  const widgetIdCounter = useSignal(0);

  const getActiveBusinessId = $(() => {
    const keys = ['business_vertical_id', 'business_id', 'active_business_id', 'ugcl_current_business_vertical'];
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value && value !== 'null' && value !== 'undefined') {
        return value;
      }
    }
    return undefined;
  });

  const getUserBusinessId = $(() => {
    const user: any = authService.getUser();
    if (user?.business_vertical_id) {
      return user.business_vertical_id;
    }
    if (Array.isArray(user?.business_roles) && user.business_roles.length > 0) {
      const currentBusinessId = localStorage.getItem('ugcl_current_business_vertical');
      if (currentBusinessId) {
        const matchedRole = user.business_roles.find((br: any) => br.business_vertical_id === currentBusinessId);
        if (matchedRole?.business_vertical_id) {
          return matchedRole.business_vertical_id;
        }
      }
      return user.business_roles[0]?.business_vertical_id;
    }
    return undefined;
  });

  const buildUniqueDashboardCode = $((name: string) => {
    const base = (name || 'dashboard')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'dashboard';
    return `${base}_${Date.now()}`;
  });

  // Generate unique widget ID
  const generateWidgetId = $(() => {
    widgetIdCounter.value += 1;
    return `widget-${Date.now()}-${widgetIdCounter.value}`;
  });

  // Add widget to canvas
  const addWidget = $(async (template: typeof WIDGET_TEMPLATES[0]) => {
    const id = await generateWidgetId();

    // Find empty position in grid
    const occupiedPositions = new Set(
      dashboardConfig.widgets?.flatMap(w =>
        Array.from({ length: w.position.h }, (_, i) =>
          Array.from({ length: w.position.w }, (_, j) =>
            `${w.position.y + i}-${w.position.x + j}`
          )
        ).flat()
      )
    );

    let x = 0, y = 0;
    let found = false;

    for (let row = 0; row < state.gridRows && !found; row++) {
      for (let col = 0; col < state.gridCols - template.defaultSize.w + 1 && !found; col++) {
        const canPlace = Array.from({ length: template.defaultSize.h }, (_, i) =>
          Array.from({ length: template.defaultSize.w }, (_, j) =>
            !occupiedPositions.has(`${row + i}-${col + j}`)
          )
        ).flat().every(Boolean);

        if (canPlace) {
          x = col;
          y = row;
          found = true;
        }
      }
    }

    const newWidget: DashboardWidget = {
      id,
      type: template.type,
      title: `${template.label} ${(dashboardConfig.widgets?.length || 0) + 1}`,
      description: '',
      position: { x, y, w: template.defaultSize.w, h: template.defaultSize.h },
      config: {},
    };

    dashboardConfig.widgets = [...(dashboardConfig.widgets || []), newWidget];
    state.selectedWidget = newWidget;
    state.showWidgetConfig = true;
  });

  // Remove widget
  const removeWidget = $((widgetId: string) => {
    dashboardConfig.widgets = dashboardConfig.widgets?.filter(w => w.id !== widgetId) || [];
    if (state.selectedWidget?.id === widgetId) {
      state.selectedWidget = null;
      state.showWidgetConfig = false;
    }
  });

  // Handle drag start
  const handleDragStart = $((e: DragEvent, templateType: string) => {
    state.draggedTemplate = templateType;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy';
    }
  });

  // Handle drag over canvas
  const handleDragOver = $((e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  });

  // Handle drop on canvas
  const handleDrop = $(async (e: DragEvent) => {
    e.preventDefault();
    if (state.draggedTemplate) {
      const template = WIDGET_TEMPLATES.find(t => t.type === state.draggedTemplate);
      if (template) {
        await addWidget(template);
      }
      state.draggedTemplate = null;
    }
  });

  // Update widget configuration
  const updateWidgetConfig = $((key: string, value: any) => {
    if (state.selectedWidget) {
      const widgetIndex = dashboardConfig.widgets?.findIndex(w => w.id === state.selectedWidget?.id);
      if (widgetIndex !== undefined && widgetIndex >= 0 && dashboardConfig.widgets) {
        const updatedWidget = { ...dashboardConfig.widgets[widgetIndex], [key]: value };
        dashboardConfig.widgets = [
          ...dashboardConfig.widgets.slice(0, widgetIndex),
          updatedWidget,
          ...dashboardConfig.widgets.slice(widgetIndex + 1),
        ];
        state.selectedWidget = updatedWidget;
      }
    }
  });

  // Save dashboard
  const saveDashboard = $(async () => {
    try {
      state.loading = true;
      console.log('Saving dashboard:', dashboardConfig);

      // Validate required fields
      if (!dashboardConfig.name?.trim()) {
        alert('Please provide dashboard name');
        state.loading = false;
        return;
      }

      const dashboardCode = dashboardConfig.code?.trim() || await buildUniqueDashboardCode(dashboardConfig.name);
      dashboardConfig.code = dashboardCode;

      const businessVerticalId =
        dashboardConfig.business_vertical_id ||
        await getActiveBusinessId() ||
        await getUserBusinessId();

      // Call API to save dashboard
      const response = await analyticsService.createDashboard({
        code: dashboardCode,
        name: dashboardConfig.name,
        description: dashboardConfig.description,
        ...(businessVerticalId && { business_vertical_id: businessVerticalId }),
        layout: dashboardConfig.layout || {},
        is_default: dashboardConfig.is_default || false,
        is_public: false,
        tags: dashboardConfig.tags || [],
      });

      // Persist widgets using the dedicated widget endpoints.
      const createdDashboardId = response?.dashboard?.id;
      if (createdDashboardId && (dashboardConfig.widgets || []).length > 0) {
        for (const widget of dashboardConfig.widgets || []) {
          await analyticsService.addWidget(createdDashboardId, {
            type: widget.type,
            title: widget.title,
            description: widget.description,
            report_id: widget.report_id,
            position: widget.position,
            config: widget.config,
            refresh_interval: widget.refresh_interval,
          });
        }
      }

      console.log('Dashboard saved successfully:', response);
      state.showSaveModal = false;
      state.loading = false;

      // Navigate to dashboards list
      await nav('/admin/analytics/dashboards');
    } catch (error: any) {
      console.error('Failed to save dashboard:', error);
      alert(`Failed to save dashboard: ${error.message || 'Unknown error'}`);
      state.loading = false;
    }
  });

  const getWidgetTemplate = (type: WidgetType) => {
    return WIDGET_TEMPLATES.find(t => t.type === type) || WIDGET_TEMPLATES[0];
  };

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header with DS PageHeader */}
      <PageHeader
        title="Dashboard Builder"
        subtitle="Create interactive dashboards with drag-and-drop widgets"
      >
        <div q:slot="actions" class="flex items-center gap-3">
          <Btn
            onClick$={() => state.currentStep = Math.max(1, state.currentStep - 1)}
            disabled={state.currentStep === 1}
            variant="secondary"
            size="sm"
          >
            <i class="i-heroicons-arrow-left-solid h-4 w-4 inline-block" aria-hidden="true"></i>
            Previous
          </Btn>
          {state.currentStep < 3 ? (
            <Btn
              onClick$={() => state.currentStep = Math.min(3, state.currentStep + 1)}
              variant="primary"
              size="sm"
            >
              Next
              <i class="i-heroicons-arrow-right-solid h-4 w-4 inline-block" aria-hidden="true"></i>
            </Btn>
          ) : (
            <Btn
              onClick$={() => state.showSaveModal = true}
              variant="primary"
              size="sm"
            >
              <i class="i-heroicons-bookmark-square-solid h-4 w-4 inline-block" aria-hidden="true"></i>
              Save
            </Btn>
          )}
        </div>
      </PageHeader>

      {/* Progress Steps */}
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center gap-4">
          {['Info', 'Layout', 'Preview'].map((step, idx) => (
            <div key={step} class="flex items-center">
              <div class={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                state.currentStep === idx + 1
                  ? 'bg-interactive-primary text-white font-semibold scale-105'
                  : state.currentStep > idx + 1
                  ? 'bg-color-semantic-success-100 text-color-semantic-success-800'
                  : 'bg-color-neutral-100 text-color-neutral-700'
              }`}>
                <span class="text-lg">{idx + 1}</span>
                <span>{step}</span>
              </div>
              {idx < 2 && (
                <div class={`w-12 h-0.5 mx-2 ${
                  state.currentStep > idx + 1 ? 'bg-color-semantic-success-800' : 'bg-color-neutral-300'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div class="container mx-auto px-4 py-6">
        {/* Step 1: Dashboard Info */}
        {state.currentStep === 1 && (
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
              <div class="p-6">
                <h2 class="text-2xl font-bold mb-6 text-color-text-primary">
                  <i class="i-heroicons-document-text-solid h-6 w-6 inline-block text-orange-600" aria-hidden="true"></i>
                  Dashboard Information
                </h2>

                <div class="space-y-4">
                  <FormField id="dashboard-builder-code" label="Dashboard Code">
                    <input
                      id="dashboard-builder-code"
                      type="text"
                      value={dashboardConfig.code}
                      onInput$={(e) => dashboardConfig.code = (e.target as HTMLInputElement).value}
                      placeholder="Optional - auto-generated if empty"
                      class={fieldClass}
                    />
                  </FormField>

                  <FormField id="dashboard-builder-name" label="Dashboard Name" required>
                    <input
                      id="dashboard-builder-name"
                      type="text"
                      value={dashboardConfig.name}
                      onInput$={(e) => dashboardConfig.name = (e.target as HTMLInputElement).value}
                      placeholder="e.g., Sales Overview Dashboard"
                      class={fieldClass}
                      required
                      aria-required="true"
                    />
                  </FormField>

                  <FormField id="dashboard-builder-description" label="Description">
                    <textarea
                      id="dashboard-builder-description"
                      value={dashboardConfig.description}
                      onInput$={(e) => dashboardConfig.description = (e.target as HTMLTextAreaElement).value}
                      placeholder="Describe what this dashboard shows..."
                      class={textareaClass}
                    />
                  </FormField>

                  <FormField id="dashboard-builder-tags" label="Tags">
                    <input
                      id="dashboard-builder-tags"
                      type="text"
                      value={dashboardConfig.tags?.join(', ')}
                      onInput$={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        dashboardConfig.tags = value.split(',').map(t => t.trim()).filter(Boolean);
                      }}
                      placeholder="sales, revenue, monthly (comma-separated)"
                      class={fieldClass}
                    />
                  </FormField>

                  <div class="flex gap-4">
                    <label class="label cursor-pointer flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <span class="label-text">Set as Default Dashboard</span>
                      <input
                        type="checkbox"
                        checked={dashboardConfig.is_default}
                        onChange$={(e) => dashboardConfig.is_default = (e.target as HTMLInputElement).checked}
                        class="checkbox checkbox-primary"
                      />
                    </label>
                  </div>

                  <div class="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                    Dashboard visibility is private by default and only available to the creator.
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 shadow-lg">
              <div class="p-6">
                <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
                  <i class="i-heroicons-light-bulb-solid h-5 w-5 inline-block text-amber-500" aria-hidden="true"></i>
                  Dashboard Tips
                </h3>
                <ul class="space-y-3">
                  <li class="flex items-start gap-3">
                    <i class="i-heroicons-chart-bar-solid h-6 w-6 inline-block text-blue-600" aria-hidden="true"></i>
                    <div>
                      <p class="font-semibold">Choose Meaningful Names</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Use clear, descriptive names that explain the dashboard's purpose</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <i class="i-heroicons-swatch-solid h-6 w-6 inline-block text-pink-600" aria-hidden="true"></i>
                    <div>
                      <p class="font-semibold">Plan Your Layout</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Think about which widgets should be prominent and how to organize them</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <i class="i-heroicons-arrow-path-rounded-square-solid h-6 w-6 inline-block text-violet-600" aria-hidden="true"></i>
                    <div>
                      <p class="font-semibold">Real-time Updates</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Configure refresh intervals for widgets that need live data</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <i class="i-heroicons-user-group-solid h-6 w-6 inline-block text-green-600" aria-hidden="true"></i>
                    <div>
                      <p class="font-semibold">Set Permissions</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Control who can view or edit your dashboard</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Layout Builder */}
        {state.currentStep === 2 && (
          <div class="grid grid-cols-1 xl:grid-cols-[17rem_minmax(0,1fr)_22rem] gap-6 items-start">
            {/* Widget Library - Left Sidebar */}
            <div class="space-y-4 xl:sticky xl:top-4 self-start">
              <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                <div class="p-6">
                  <h3 class="text-xl font-bold mb-4 text-color-text-primary">
                    <i class="i-heroicons-squares-plus-solid h-6 w-6 inline-block text-indigo-600" aria-hidden="true"></i>
                    Widget Library
                  </h3>
                  <Alert variant="info" class="mb-4 text-xs">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Drag widgets to canvas. Connect data sources after adding.</span>
                  </Alert>

                  <div class="space-y-3">
                    {WIDGET_TEMPLATES.map((template) => {
                      const needsDataSource = template.type === 'chart' || template.type === 'kpi' || template.type === 'table';
                      return (
                        <div
                          key={template.type}
                          draggable
                          onDragStart$={(e) => handleDragStart(e, template.type)}
                          class="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 cursor-move transition-all hover:shadow-lg hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800"
                        >
                          <div class="flex items-start gap-3">
                            <div class={`w-12 h-12 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center text-2xl shadow-lg`}>
                                <i class={`${template.icon} h-6 w-6 inline-block text-white`} aria-hidden="true"></i>
                            </div>
                            <div class="flex-1">
                              <h4 class="font-semibold text-sm">{template.label}</h4>
                              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                              <div class="flex items-center gap-2 mt-2">
                                <span class="text-xs text-color-text-secondary">
                                  Size: {template.defaultSize.w}x{template.defaultSize.h}
                                </span>
                                {needsDataSource && (
                                  <Badge variant="info" class="gap-1">
                                    <i class="i-heroicons-chart-bar-solid h-3 w-3 inline-block" aria-hidden="true"></i>
                                    <span>Needs Data</span>
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas - Main Area */}
            <div class="min-w-0">
              <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                <div class="p-6">
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-color-text-primary">
                      <i class="i-heroicons-swatch-solid h-6 w-6 inline-block text-pink-600" aria-hidden="true"></i>
                      Dashboard Canvas
                    </h3>
                    <Badge variant="info" class="px-3 py-1">
                      {dashboardConfig.widgets?.length || 0} widgets
                    </Badge>
                  </div>

                  <div
                    onDragOver$={handleDragOver}
                    onDrop$={handleDrop}
                    class="border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-x-auto min-h-[var(--dashboard-canvas-min-height)]"
                    style={{ '--dashboard-canvas-min-height': `${DASHBOARD_CANVAS_MIN_HEIGHT}px` }}
                  >
                    <div
                      class="grid grid-cols-12 gap-4 min-w-[var(--dashboard-canvas-min-width)] min-h-[var(--dashboard-canvas-min-height)] auto-rows-[var(--dashboard-grid-row-height)]"
                      style={{
                        '--dashboard-canvas-min-width': `${DASHBOARD_CANVAS_MIN_WIDTH}px`,
                        '--dashboard-canvas-min-height': `${DASHBOARD_CANVAS_MIN_HEIGHT}px`,
                        '--dashboard-grid-row-height': `${DASHBOARD_GRID_ROW_HEIGHT}px`,
                      }}
                    >
                    {dashboardConfig.widgets?.length === 0 ? (
                      <div class="absolute inset-0 flex items-center justify-center">
                        <div class="text-center">
                          <i class="i-heroicons-swatch-solid mb-4 inline-block h-16 w-16 text-pink-500" aria-hidden="true"></i>
                          <p class="text-xl font-semibold text-gray-500 dark:text-gray-400">
                            Drag widgets here to start building
                          </p>
                          <p class="text-sm text-gray-400 dark:text-gray-500 mt-2">
                            Choose from the widget library on the left
                          </p>
                        </div>
                      </div>
                    ) : (
                      dashboardConfig.widgets?.map((widget) => {
                        const template = getWidgetTemplate(widget.type);

                        return (
                          <div
                            key={widget.id}
                            onClick$={() => {
                              state.selectedWidget = widget;
                              state.showWidgetConfig = true;
                            }}
                            class={`rounded-lg shadow-lg transition-all cursor-pointer group overflow-hidden ${
                              state.selectedWidget?.id === widget.id
                                ? 'ring-4 ring-purple-500 scale-105'
                                : 'hover:shadow-xl hover:scale-102'
                            } bg-gradient-to-br ${template.color} [grid-column:var(--widget-grid-column)] [grid-row:var(--widget-grid-row)]`}
                            style={{
                              '--widget-grid-column': `${widget.position.x + 1} / span ${Math.max(1, widget.position.w)}`,
                              '--widget-grid-row': `${widget.position.y + 1} / span ${Math.max(1, widget.position.h)}`,
                            }}
                          >
                            <div class="h-full p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg flex flex-col">
                              <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <i class={`${template.icon} h-6 w-6 inline-block`} aria-hidden="true"></i>
                                  <span class="font-semibold text-sm truncate">{widget.title}</span>
                                </div>
                                <Btn
                                  onClick$={(e) => {
                                    e.stopPropagation();
                                    removeWidget(widget.id);
                                  }}
                                  size="sm"
                                  variant="ghost"
                                  class="h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <i class="i-heroicons-x-mark-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                                </Btn>
                              </div>
                              {widget.description && (
                                <p class="text-xs text-gray-500 dark:text-gray-400">{widget.description}</p>
                              )}
                              <div class="flex-1 flex items-center justify-center text-gray-400 mt-2">
                                <span class="text-xs">{template.label}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget Configuration - Right Sidebar */}
            <div class="self-start 2xl:sticky 2xl:top-4 xl:col-span-full">
              {state.showWidgetConfig && state.selectedWidget ? (
                <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                  <div class="p-6">
                    <h3 class="text-xl font-bold mb-4 text-color-text-primary">
                      <i class="i-heroicons-cog-6-tooth-solid h-6 w-6 inline-block text-slate-600" aria-hidden="true"></i>
                      Widget Settings
                    </h3>

                    <div class="space-y-4">
                      <FormField id="dashboard-widget-title" label="Widget Title">
                        <input
                          id="dashboard-widget-title"
                          type="text"
                          value={state.selectedWidget.title}
                          onInput$={(e) => updateWidgetConfig('title', (e.target as HTMLInputElement).value)}
                          class={compactFieldClass}
                        />
                      </FormField>

                      <FormField id="dashboard-widget-description" label="Description">
                        <textarea
                          id="dashboard-widget-description"
                          value={state.selectedWidget.description}
                          onInput$={(e) => updateWidgetConfig('description', (e.target as HTMLTextAreaElement).value)}
                          class={compactTextareaClass}
                          rows={3}
                        />
                      </FormField>

                      {(state.selectedWidget.type === 'chart' || state.selectedWidget.type === 'kpi' || state.selectedWidget.type === 'table') && (
                        <FormField id="dashboard-widget-report" label="Data Source (Report/KPI)">
                          <div class="mb-1 flex items-center gap-1.5 text-xs text-color-text-secondary">
                              <i class="i-heroicons-chart-bar-solid h-4 w-4 inline-block text-blue-600" aria-hidden="true"></i>
                              <span>Connect a report or KPI source for this widget.</span>
                          </div>
                          <select
                            id="dashboard-widget-report"
                            value={state.selectedWidget.report_id || ''}
                            onChange$={(e) => updateWidgetConfig('report_id', (e.target as HTMLSelectElement).value)}
                            class={compactFieldClass}
                          >
                            <option value="">Select a data source...</option>
                            {availableReportsData.value.reports.map((report) => {
                              const iconLabel = report.report_type === 'kpi' ? '[KPI]' : report.report_type === 'chart' ? '[Chart]' : '[Table]';
                              return (
                                <option key={report.id} value={report.id}>
                                  {`${iconLabel} ${report.name}`}
                                </option>
                              );
                            })}
                          </select>
                          <p class="mt-1 text-xs text-color-text-tertiary">
                            {availableReportsData.value.reports.length === 0
                              ? 'No reports available. Create reports first.'
                              : `${availableReportsData.value.reports.length} reports available`}
                          </p>
                          {state.selectedWidget.report_id && (
                            <div class="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                              <div class="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                                <i class="i-heroicons-check-circle-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                                <span>Data source connected</span>
                              </div>
                            </div>
                          )}
                        </FormField>
                      )}

                      {state.selectedWidget.type === 'text' && (
                        <FormField id="dashboard-widget-content" label="Text Content">
                          <textarea
                            id="dashboard-widget-content"
                            value={state.selectedWidget.config?.content || ''}
                            onInput$={(e) => {
                              const newConfig = { ...state.selectedWidget!.config, content: (e.target as HTMLTextAreaElement).value };
                              updateWidgetConfig('config', newConfig);
                            }}
                            class={compactTextareaClass}
                            rows={4}
                            placeholder="Enter text content..."
                          />
                        </FormField>
                      )}

                      {state.selectedWidget.type === 'iframe' && (
                        <FormField id="dashboard-widget-url" label="Embed URL">
                          <input
                            id="dashboard-widget-url"
                            type="url"
                            value={state.selectedWidget.config?.url || ''}
                            onInput$={(e) => {
                              const newConfig = { ...state.selectedWidget!.config, url: (e.target as HTMLInputElement).value };
                              updateWidgetConfig('config', newConfig);
                            }}
                            class={compactFieldClass}
                            placeholder="https://example.com"
                          />
                        </FormField>
                      )}

                      <FormField id="dashboard-widget-refresh" label="Refresh Interval (seconds)" hint="0 = No auto-refresh">
                        <input
                          id="dashboard-widget-refresh"
                          type="number"
                          value={state.selectedWidget.refresh_interval || 0}
                          onInput$={(e) => updateWidgetConfig('refresh_interval', parseInt((e.target as HTMLInputElement).value) || 0)}
                          class={compactFieldClass}
                          min="0"
                          step="30"
                        />
                      </FormField>

                      <div class="divider">Position & Size</div>

                      <div class="grid grid-cols-2 gap-2">
                        <FormField id="dashboard-widget-width" label="Width">
                          <input
                            id="dashboard-widget-width"
                            type="number"
                            value={state.selectedWidget.position.w}
                            onInput$={(e) => {
                              const newPos = { ...state.selectedWidget!.position, w: parseInt((e.target as HTMLInputElement).value) || 1 };
                              updateWidgetConfig('position', newPos);
                            }}
                            class={compactFieldClass}
                            min="1"
                            max={state.gridCols}
                          />
                        </FormField>
                        <FormField id="dashboard-widget-height" label="Height">
                          <input
                            id="dashboard-widget-height"
                            type="number"
                            value={state.selectedWidget.position.h}
                            onInput$={(e) => {
                              const newPos = { ...state.selectedWidget!.position, h: parseInt((e.target as HTMLInputElement).value) || 1 };
                              updateWidgetConfig('position', newPos);
                            }}
                            class={compactFieldClass}
                            min="1"
                            max={state.gridRows}
                          />
                        </FormField>
                        <FormField id="dashboard-widget-x" label="X Position">
                          <input
                            id="dashboard-widget-x"
                            type="number"
                            value={state.selectedWidget.position.x}
                            onInput$={(e) => {
                              const newPos = { ...state.selectedWidget!.position, x: parseInt((e.target as HTMLInputElement).value) || 0 };
                              updateWidgetConfig('position', newPos);
                            }}
                            class={compactFieldClass}
                            min="0"
                            max={state.gridCols - 1}
                          />
                        </FormField>
                        <FormField id="dashboard-widget-y" label="Y Position">
                          <input
                            id="dashboard-widget-y"
                            type="number"
                            value={state.selectedWidget.position.y}
                            onInput$={(e) => {
                              const newPos = { ...state.selectedWidget!.position, y: parseInt((e.target as HTMLInputElement).value) || 0 };
                              updateWidgetConfig('position', newPos);
                            }}
                            class={compactFieldClass}
                            min="0"
                            max={state.gridRows - 1}
                          />
                        </FormField>
                      </div>

                      <Btn
                        onClick$={() => {
                          removeWidget(state.selectedWidget!.id);
                          state.showWidgetConfig = false;
                        }}
                        size="sm"
                        variant="danger"
                        class="w-full mt-4"
                      >
                        <i class="i-heroicons-trash-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                        Remove Widget
                      </Btn>
                    </div>
                  </div>
                </div>
              ) : (
                <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 shadow-lg">
                  <div class="p-8 flex flex-col items-center text-center">
                    <i class="i-heroicons-cog-6-tooth-solid mb-4 inline-block h-16 w-16 text-slate-600" aria-hidden="true"></i>
                    <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      No Widget Selected
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Click on a widget to configure its settings
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {state.currentStep === 3 && (
          <div class="space-y-6">
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
              <div class="p-6">
                <h2 class="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  <i class="i-heroicons-eye-solid h-6 w-6 inline-block text-indigo-600" aria-hidden="true"></i>
                  Dashboard Preview
                </h2>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <StatCard tone="info" class="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="text-sm text-color-text-secondary">Dashboard Name</div>
                        <div class="mt-2 text-lg font-semibold text-blue-600">{dashboardConfig.name || 'Untitled'}</div>
                      </div>
                      <div class="text-blue-600 text-3xl">
                        <i class="i-heroicons-chart-bar-solid h-8 w-8 inline-block" aria-hidden="true"></i>
                      </div>
                    </div>
                  </StatCard>

                  <StatCard tone="accent" class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="text-sm text-color-text-secondary">Total Widgets</div>
                        <div class="mt-2 text-lg font-semibold text-purple-600">{dashboardConfig.widgets?.length || 0}</div>
                      </div>
                      <div class="text-purple-600 text-3xl">
                        <i class="i-heroicons-squares-plus-solid h-8 w-8 inline-block" aria-hidden="true"></i>
                      </div>
                    </div>
                  </StatCard>

                  <StatCard tone="success" class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="text-sm text-color-text-secondary">Tags</div>
                        <div class="mt-2 text-lg font-semibold text-green-600">{dashboardConfig.tags?.length || 0}</div>
                      </div>
                      <div class="text-green-600 text-3xl">
                        <i class="i-heroicons-tag-solid h-8 w-8 inline-block" aria-hidden="true"></i>
                      </div>
                    </div>
                  </StatCard>
                </div>

                <div class="mb-6">
                  <h3 class="font-semibold mb-2">Description:</h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    {dashboardConfig.description || 'No description provided'}
                  </p>
                </div>

                {dashboardConfig.tags && dashboardConfig.tags.length > 0 && (
                  <div class="mb-6">
                    <h3 class="font-semibold mb-2">Tags:</h3>
                    <div class="flex flex-wrap gap-2">
                      {dashboardConfig.tags.map((tag) => (
                        <Badge key={tag} variant="info">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div class="flex gap-4 mb-6">
                  {dashboardConfig.is_default && (
                    <Badge variant="success" class="gap-1 px-3 py-1">
                      <i class="i-heroicons-star-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                      Default Dashboard
                    </Badge>
                  )}
                </div>

                <div class="divider">Layout Preview</div>

                <div class="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-x-auto">
                  <div
                    class="grid grid-cols-12 gap-4 min-w-[var(--dashboard-canvas-min-width)] min-h-[var(--dashboard-canvas-min-height)] auto-rows-[var(--dashboard-grid-row-height)]"
                    style={{
                      '--dashboard-canvas-min-width': `${DASHBOARD_CANVAS_MIN_WIDTH}px`,
                      '--dashboard-canvas-min-height': `${DASHBOARD_CANVAS_MIN_HEIGHT}px`,
                      '--dashboard-grid-row-height': `${DASHBOARD_GRID_ROW_HEIGHT}px`,
                    }}
                  >
                  {dashboardConfig.widgets?.map((widget) => {
                    const template = getWidgetTemplate(widget.type);
                    return (
                      <div
                        key={widget.id}
                        class={`rounded-lg shadow-lg bg-gradient-to-br ${template.color} overflow-hidden [grid-column:var(--widget-grid-column)] [grid-row:var(--widget-grid-row)]`}
                        style={{
                          '--widget-grid-column': `${widget.position.x + 1} / span ${Math.max(1, widget.position.w)}`,
                          '--widget-grid-row': `${widget.position.y + 1} / span ${Math.max(1, widget.position.h)}`,
                        }}
                      >
                        <div class="h-full p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg flex flex-col">
                          <div class="flex items-center gap-2 mb-2">
                            <i class={`${template.icon} h-6 w-6 inline-block`} aria-hidden="true"></i>
                            <span class="font-semibold text-sm">{widget.title}</span>
                          </div>
                          {widget.description && (
                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">{widget.description}</p>
                          )}
                          <div class="flex-1 flex items-center justify-center">
                            <span class="text-sm text-gray-400">{template.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Modal */}
      {state.showSaveModal && (
        <div class="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            class="absolute inset-0 bg-black/50"
            onClick$={() => state.showSaveModal = false}
          ></div>
          <div class="relative z-10 w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-6">
            <h3 class="font-bold text-2xl mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              <i class="i-heroicons-bookmark-square-solid h-6 w-6 inline-block text-indigo-600" aria-hidden="true"></i>
              Save Dashboard
            </h3>

            <div class="space-y-4 mb-6">
              <Alert variant="info">
                <span class="flex items-center gap-2">
                  <i class="i-heroicons-chart-bar-solid h-5 w-5 inline-block" aria-hidden="true"></i>
                  <strong>{dashboardConfig.name || 'Untitled Dashboard'}</strong>
                </span>
              </Alert>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <StatCard tone="info">
                  <div class="text-sm text-color-text-secondary">Widgets</div>
                  <div class="mt-2 text-lg font-semibold text-primary-600">{dashboardConfig.widgets?.length || 0}</div>
                </StatCard>
                <StatCard>
                  <div class="text-sm text-color-text-secondary">Dashboard Code</div>
                  <div class="mt-2 text-lg font-semibold text-color-text-primary">{dashboardConfig.code || 'Auto-generated on save'}</div>
                </StatCard>
              </div>

              {!dashboardConfig.name ? (
                <Alert variant="warning">
                  <span class="flex items-center gap-2">
                    <i class="i-heroicons-exclamation-triangle-solid h-5 w-5 inline-block" aria-hidden="true"></i>
                    Please provide dashboard name before saving
                  </span>
                </Alert>
              ) : null}
            </div>

            <div class="modal-action flex justify-end gap-3">
              <Btn
                onClick$={() => state.showSaveModal = false}
                variant="ghost"
              >
                Cancel
              </Btn>
              <Btn
                onClick$={saveDashboard}
                disabled={!dashboardConfig.name || state.loading}
              >
                {state.loading ? (
                  <>
                    <span class="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i class="i-heroicons-bookmark-square-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                    Save Dashboard
                  </>
                )}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Dashboard Builder - Analytics',
};
