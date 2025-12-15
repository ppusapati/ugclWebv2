// Dashboard Builder with drag-and-drop widgets
import { component$, useStore, useSignal, $ } from '@builder.io/qwik';
import { useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '../../../../../services/api-client';
import { analyticsService } from '../../../../../services/analytics.service';
import type { Dashboard, DashboardWidget, WidgetType, ReportListResponse } from '../../../../../types/analytics';

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
    icon: '📊',
    label: 'Chart Widget',
    description: 'Visualize data with interactive charts',
    defaultSize: { w: 6, h: 4 },
    color: 'from-blue-500 to-cyan-500',
  },
  {
    type: 'kpi',
    icon: '📈',
    label: 'KPI Widget',
    description: 'Display key performance indicators',
    defaultSize: { w: 3, h: 2 },
    color: 'from-green-500 to-emerald-500',
  },
  {
    type: 'table',
    icon: '📋',
    label: 'Table Widget',
    description: 'Show data in tabular format',
    defaultSize: { w: 8, h: 5 },
    color: 'from-purple-500 to-pink-500',
  },
  {
    type: 'text',
    icon: '📝',
    label: 'Text Widget',
    description: 'Add text, notes, or descriptions',
    defaultSize: { w: 4, h: 2 },
    color: 'from-orange-500 to-red-500',
  },
  {
    type: 'iframe',
    icon: '🌐',
    label: 'Embed Widget',
    description: 'Embed external content or URLs',
    defaultSize: { w: 6, h: 4 },
    color: 'from-indigo-500 to-purple-500',
  },
];

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
    gridCols: 12,
    gridRows: 12,
    loading: false,
    error: '',
  });

  const widgetIdCounter = useSignal(0);

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
      if (!dashboardConfig.code || !dashboardConfig.name) {
        alert('Please provide both dashboard code and name');
        state.loading = false;
        return;
      }

      // Call API to save dashboard
      const response = await analyticsService.createDashboard({
        code: dashboardConfig.code,
        name: dashboardConfig.name,
        description: dashboardConfig.description,
        business_vertical_id: dashboardConfig.business_vertical_id || 'default',
        widgets: dashboardConfig.widgets || [],
        layout: dashboardConfig.layout || {},
        is_default: dashboardConfig.is_default || false,
        is_public: dashboardConfig.is_public || false,
        tags: dashboardConfig.tags || [],
      });

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
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl">
        <div class="max-w-screen-2xl mx-auto px-6 py-8">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-4">
              <button
                onClick$={() => nav('/admin/analytics/dashboards')}
                class="btn btn-ghost btn-sm text-white hover:bg-white/20"
              >
                ← Back
              </button>
              <div>
                <h1 class="text-4xl font-bold flex items-center gap-3">
                  📊 Dashboard Builder
                </h1>
                <p class="text-purple-100 mt-2">Create interactive dashboards with drag-and-drop widgets</p>
              </div>
            </div>
            <div class="flex gap-3">
              <button
                onClick$={() => state.currentStep = Math.max(1, state.currentStep - 1)}
                disabled={state.currentStep === 1}
                class="btn btn-ghost text-white hover:bg-white/20 disabled:opacity-50"
              >
                ← Previous
              </button>
              {state.currentStep < 3 ? (
                <button
                  onClick$={() => state.currentStep = Math.min(3, state.currentStep + 1)}
                  class="btn bg-white text-purple-600 hover:bg-purple-50"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick$={() => state.showSaveModal = true}
                  class="btn bg-white text-purple-600 hover:bg-purple-50"
                >
                  💾 Save Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div class="flex items-center gap-4">
            {['Info', 'Layout', 'Preview'].map((step, idx) => (
              <div key={step} class="flex items-center">
                <div class={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  state.currentStep === idx + 1
                    ? 'bg-white text-purple-600 font-semibold scale-105'
                    : state.currentStep > idx + 1
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/20 text-purple-100'
                }`}>
                  <span class="text-lg">{idx + 1}</span>
                  <span>{step}</span>
                </div>
                {idx < 2 && (
                  <div class={`w-12 h-0.5 mx-2 ${
                    state.currentStep > idx + 1 ? 'bg-purple-300' : 'bg-white/30'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div class="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Step 1: Dashboard Info */}
        {state.currentStep === 1 && (
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="card bg-white dark:bg-gray-800 shadow-xl">
              <div class="card-body">
                <h2 class="card-title text-2xl mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  📝 Dashboard Information
                </h2>

                <div class="space-y-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Dashboard Code *</span>
                    </label>
                    <input
                      type="text"
                      value={dashboardConfig.code}
                      onInput$={(e) => dashboardConfig.code = (e.target as HTMLInputElement).value}
                      placeholder="e.g., SALES_OVERVIEW"
                      class="input input-bordered w-full"
                    />
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Dashboard Name *</span>
                    </label>
                    <input
                      type="text"
                      value={dashboardConfig.name}
                      onInput$={(e) => dashboardConfig.name = (e.target as HTMLInputElement).value}
                      placeholder="e.g., Sales Overview Dashboard"
                      class="input input-bordered w-full"
                    />
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Description</span>
                    </label>
                    <textarea
                      value={dashboardConfig.description}
                      onInput$={(e) => dashboardConfig.description = (e.target as HTMLTextAreaElement).value}
                      placeholder="Describe what this dashboard shows..."
                      class="textarea textarea-bordered h-24"
                    />
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Tags</span>
                    </label>
                    <input
                      type="text"
                      value={dashboardConfig.tags?.join(', ')}
                      onInput$={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        dashboardConfig.tags = value.split(',').map(t => t.trim()).filter(Boolean);
                      }}
                      placeholder="sales, revenue, monthly (comma-separated)"
                      class="input input-bordered w-full"
                    />
                  </div>

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

                    <label class="label cursor-pointer flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <span class="label-text">Public Dashboard</span>
                      <input
                        type="checkbox"
                        checked={dashboardConfig.is_public}
                        onChange$={(e) => dashboardConfig.is_public = (e.target as HTMLInputElement).checked}
                        class="checkbox checkbox-primary"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="card bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 shadow-xl">
              <div class="card-body">
                <h3 class="text-xl font-semibold mb-4">💡 Dashboard Tips</h3>
                <ul class="space-y-3">
                  <li class="flex items-start gap-3">
                    <span class="text-2xl">📊</span>
                    <div>
                      <p class="font-semibold">Choose Meaningful Names</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Use clear, descriptive names that explain the dashboard's purpose</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-2xl">🎨</span>
                    <div>
                      <p class="font-semibold">Plan Your Layout</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Think about which widgets should be prominent and how to organize them</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-2xl">🔄</span>
                    <div>
                      <p class="font-semibold">Real-time Updates</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Configure refresh intervals for widgets that need live data</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-2xl">👥</span>
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
          <div class="grid grid-cols-12 gap-6">
            {/* Widget Library - Left Sidebar */}
            <div class="col-span-12 lg:col-span-3 space-y-4">
              <div class="card bg-white dark:bg-gray-800 shadow-xl sticky top-4">
                <div class="card-body">
                  <h3 class="text-xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    🧩 Widget Library
                  </h3>
                  <div class="alert alert-info text-xs mb-4">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Drag widgets to canvas. Connect data sources after adding.</span>
                  </div>

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
                              {template.icon}
                            </div>
                            <div class="flex-1">
                              <h4 class="font-semibold text-sm">{template.label}</h4>
                              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                              <div class="flex items-center gap-2 mt-2">
                                <span class="text-xs text-purple-600 dark:text-purple-400">
                                  Size: {template.defaultSize.w}x{template.defaultSize.h}
                                </span>
                                {needsDataSource && (
                                  <span class="badge badge-xs badge-info gap-1">
                                    <span>📊</span>
                                    <span>Needs Data</span>
                                  </span>
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
            <div class="col-span-12 lg:col-span-6">
              <div class="card bg-white dark:bg-gray-800 shadow-xl">
                <div class="card-body">
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      🎨 Dashboard Canvas
                    </h3>
                    <div class="badge badge-lg badge-primary">
                      {dashboardConfig.widgets?.length || 0} widgets
                    </div>
                  </div>

                  <div
                    onDragOver$={handleDragOver}
                    onDrop$={handleDrop}
                    class="min-h-[600px] border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${state.gridCols}, 1fr)`,
                      gridTemplateRows: `repeat(${state.gridRows}, 50px)`,
                      gap: '1rem',
                    }}
                  >
                    {dashboardConfig.widgets?.length === 0 ? (
                      <div class="absolute inset-0 flex items-center justify-center">
                        <div class="text-center">
                          <div class="text-6xl mb-4">🎨</div>
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
                            class={`rounded-lg shadow-lg transition-all cursor-pointer group ${
                              state.selectedWidget?.id === widget.id
                                ? 'ring-4 ring-purple-500 scale-105'
                                : 'hover:shadow-xl hover:scale-102'
                            } bg-gradient-to-br ${template.color}`}
                            style={{
                              gridColumn: `${widget.position.x + 1} / span ${widget.position.w}`,
                              gridRow: `${widget.position.y + 1} / span ${widget.position.h}`,
                            }}
                          >
                            <div class="h-full p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg flex flex-col">
                              <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                  <span class="text-2xl">{template.icon}</span>
                                  <span class="font-semibold text-sm truncate">{widget.title}</span>
                                </div>
                                <button
                                  onClick$={(e) => {
                                    e.stopPropagation();
                                    removeWidget(widget.id);
                                  }}
                                  class="btn btn-xs btn-circle btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ✕
                                </button>
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

            {/* Widget Configuration - Right Sidebar */}
            <div class="col-span-12 lg:col-span-3">
              {state.showWidgetConfig && state.selectedWidget ? (
                <div class="card bg-white dark:bg-gray-800 shadow-xl sticky top-4">
                  <div class="card-body">
                    <h3 class="text-xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      ⚙️ Widget Settings
                    </h3>

                    <div class="space-y-4">
                      <div class="form-control">
                        <label class="label">
                          <span class="label-text font-semibold">Widget Title</span>
                        </label>
                        <input
                          type="text"
                          value={state.selectedWidget.title}
                          onInput$={(e) => updateWidgetConfig('title', (e.target as HTMLInputElement).value)}
                          class="input input-bordered input-sm"
                        />
                      </div>

                      <div class="form-control">
                        <label class="label">
                          <span class="label-text font-semibold">Description</span>
                        </label>
                        <textarea
                          value={state.selectedWidget.description}
                          onInput$={(e) => updateWidgetConfig('description', (e.target as HTMLTextAreaElement).value)}
                          class="textarea textarea-bordered textarea-sm"
                          rows={3}
                        />
                      </div>

                      {(state.selectedWidget.type === 'chart' || state.selectedWidget.type === 'kpi' || state.selectedWidget.type === 'table') && (
                        <div class="form-control">
                          <label class="label">
                            <span class="label-text font-semibold">📊 Data Source (Report/KPI)</span>
                          </label>
                          <select
                            value={state.selectedWidget.report_id || ''}
                            onChange$={(e) => updateWidgetConfig('report_id', (e.target as HTMLSelectElement).value)}
                            class="select select-bordered select-sm"
                          >
                            <option value="">Select a data source...</option>
                            {availableReportsData.value.reports.map((report) => {
                              const icon = report.report_type === 'kpi' ? '🎯' : report.report_type === 'chart' ? '📈' : '📊';
                              return (
                                <option key={report.id} value={report.id}>
                                  {`${icon} ${report.name}`}
                                </option>
                              );
                            })}
                          </select>
                          <label class="label">
                            <span class="label-text-alt">
                              {availableReportsData.value.reports.length === 0
                                ? 'No reports available. Create reports first.'
                                : `${availableReportsData.value.reports.length} reports available`}
                            </span>
                          </label>
                          {state.selectedWidget.report_id && (
                            <div class="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                              <div class="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                                <span>✓</span>
                                <span>Data source connected</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {state.selectedWidget.type === 'text' && (
                        <div class="form-control">
                          <label class="label">
                            <span class="label-text font-semibold">Text Content</span>
                          </label>
                          <textarea
                            value={state.selectedWidget.config?.content || ''}
                            onInput$={(e) => {
                              const newConfig = { ...state.selectedWidget!.config, content: (e.target as HTMLTextAreaElement).value };
                              updateWidgetConfig('config', newConfig);
                            }}
                            class="textarea textarea-bordered textarea-sm"
                            rows={4}
                            placeholder="Enter text content..."
                          />
                        </div>
                      )}

                      {state.selectedWidget.type === 'iframe' && (
                        <div class="form-control">
                          <label class="label">
                            <span class="label-text font-semibold">Embed URL</span>
                          </label>
                          <input
                            type="url"
                            value={state.selectedWidget.config?.url || ''}
                            onInput$={(e) => {
                              const newConfig = { ...state.selectedWidget!.config, url: (e.target as HTMLInputElement).value };
                              updateWidgetConfig('config', newConfig);
                            }}
                            class="input input-bordered input-sm"
                            placeholder="https://example.com"
                          />
                        </div>
                      )}

                      <div class="form-control">
                        <label class="label">
                          <span class="label-text font-semibold">Refresh Interval (seconds)</span>
                        </label>
                        <input
                          type="number"
                          value={state.selectedWidget.refresh_interval || 0}
                          onInput$={(e) => updateWidgetConfig('refresh_interval', parseInt((e.target as HTMLInputElement).value) || 0)}
                          class="input input-bordered input-sm"
                          min="0"
                          step="30"
                        />
                        <label class="label">
                          <span class="label-text-alt">0 = No auto-refresh</span>
                        </label>
                      </div>

                      <div class="divider">Position & Size</div>

                      <div class="grid grid-cols-2 gap-2">
                        <div class="form-control">
                          <label class="label py-1">
                            <span class="label-text text-xs">Width</span>
                          </label>
                          <input
                            type="number"
                            value={state.selectedWidget.position.w}
                            onInput$={(e) => {
                              const newPos = { ...state.selectedWidget!.position, w: parseInt((e.target as HTMLInputElement).value) || 1 };
                              updateWidgetConfig('position', newPos);
                            }}
                            class="input input-bordered input-sm"
                            min="1"
                            max={state.gridCols}
                          />
                        </div>
                        <div class="form-control">
                          <label class="label py-1">
                            <span class="label-text text-xs">Height</span>
                          </label>
                          <input
                            type="number"
                            value={state.selectedWidget.position.h}
                            onInput$={(e) => {
                              const newPos = { ...state.selectedWidget!.position, h: parseInt((e.target as HTMLInputElement).value) || 1 };
                              updateWidgetConfig('position', newPos);
                            }}
                            class="input input-bordered input-sm"
                            min="1"
                            max={state.gridRows}
                          />
                        </div>
                        <div class="form-control">
                          <label class="label py-1">
                            <span class="label-text text-xs">X Position</span>
                          </label>
                          <input
                            type="number"
                            value={state.selectedWidget.position.x}
                            onInput$={(e) => {
                              const newPos = { ...state.selectedWidget!.position, x: parseInt((e.target as HTMLInputElement).value) || 0 };
                              updateWidgetConfig('position', newPos);
                            }}
                            class="input input-bordered input-sm"
                            min="0"
                            max={state.gridCols - 1}
                          />
                        </div>
                        <div class="form-control">
                          <label class="label py-1">
                            <span class="label-text text-xs">Y Position</span>
                          </label>
                          <input
                            type="number"
                            value={state.selectedWidget.position.y}
                            onInput$={(e) => {
                              const newPos = { ...state.selectedWidget!.position, y: parseInt((e.target as HTMLInputElement).value) || 0 };
                              updateWidgetConfig('position', newPos);
                            }}
                            class="input input-bordered input-sm"
                            min="0"
                            max={state.gridRows - 1}
                          />
                        </div>
                      </div>

                      <button
                        onClick$={() => {
                          removeWidget(state.selectedWidget!.id);
                          state.showWidgetConfig = false;
                        }}
                        class="btn btn-error btn-sm w-full mt-4"
                      >
                        🗑️ Remove Widget
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div class="card bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 shadow-xl sticky top-4">
                  <div class="card-body items-center text-center">
                    <div class="text-6xl mb-4">⚙️</div>
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
            <div class="card bg-white dark:bg-gray-800 shadow-xl">
              <div class="card-body">
                <h2 class="card-title text-2xl mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  👀 Dashboard Preview
                </h2>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div class="stats shadow bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                    <div class="stat">
                      <div class="stat-figure text-blue-600 text-3xl">📊</div>
                      <div class="stat-title">Dashboard Name</div>
                      <div class="stat-value text-lg text-blue-600">{dashboardConfig.name || 'Untitled'}</div>
                    </div>
                  </div>

                  <div class="stats shadow bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <div class="stat">
                      <div class="stat-figure text-purple-600 text-3xl">🧩</div>
                      <div class="stat-title">Total Widgets</div>
                      <div class="stat-value text-lg text-purple-600">{dashboardConfig.widgets?.length || 0}</div>
                    </div>
                  </div>

                  <div class="stats shadow bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <div class="stat">
                      <div class="stat-figure text-green-600 text-3xl">🏷️</div>
                      <div class="stat-title">Tags</div>
                      <div class="stat-value text-lg text-green-600">{dashboardConfig.tags?.length || 0}</div>
                    </div>
                  </div>
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
                        <span key={tag} class="badge badge-primary">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div class="flex gap-4 mb-6">
                  {dashboardConfig.is_default && (
                    <div class="badge badge-success badge-lg">⭐ Default Dashboard</div>
                  )}
                  {dashboardConfig.is_public && (
                    <div class="badge badge-info badge-lg">🌐 Public</div>
                  )}
                </div>

                <div class="divider">Layout Preview</div>

                <div
                  class="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${state.gridCols}, 1fr)`,
                    gridTemplateRows: `repeat(${state.gridRows}, 50px)`,
                    gap: '1rem',
                    minHeight: '600px',
                  }}
                >
                  {dashboardConfig.widgets?.map((widget) => {
                    const template = getWidgetTemplate(widget.type);
                    return (
                      <div
                        key={widget.id}
                        class={`rounded-lg shadow-lg bg-gradient-to-br ${template.color}`}
                        style={{
                          gridColumn: `${widget.position.x + 1} / span ${widget.position.w}`,
                          gridRow: `${widget.position.y + 1} / span ${widget.position.h}`,
                        }}
                      >
                        <div class="h-full p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg flex flex-col">
                          <div class="flex items-center gap-2 mb-2">
                            <span class="text-2xl">{template.icon}</span>
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
        )}
      </div>

      {/* Save Modal */}
      {state.showSaveModal && (
        <div class="modal modal-open">
          <div class="modal-box max-w-2xl bg-white dark:bg-gray-800">
            <h3 class="font-bold text-2xl mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              💾 Save Dashboard
            </h3>

            <div class="space-y-4 mb-6">
              <div class="alert alert-info">
                <span>
                  📊 <strong>{dashboardConfig.name || 'Untitled Dashboard'}</strong>
                </span>
              </div>

              <div class="stats stats-vertical w-full shadow">
                <div class="stat">
                  <div class="stat-title">Widgets</div>
                  <div class="stat-value text-primary">{dashboardConfig.widgets?.length || 0}</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Dashboard Code</div>
                  <div class="stat-value text-lg">{dashboardConfig.code || 'N/A'}</div>
                </div>
              </div>

              {!dashboardConfig.code || !dashboardConfig.name ? (
                <div class="alert alert-warning">
                  ⚠️ Please provide both dashboard code and name before saving
                </div>
              ) : null}
            </div>

            <div class="modal-action">
              <button
                onClick$={() => state.showSaveModal = false}
                class="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick$={saveDashboard}
                disabled={!dashboardConfig.code || !dashboardConfig.name || state.loading}
                class="btn btn-primary"
              >
                {state.loading ? (
                  <>
                    <span class="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>💾 Save Dashboard</>
                )}
              </button>
            </div>
          </div>
          <div class="modal-backdrop" onClick$={() => state.showSaveModal = false}></div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Dashboard Builder - Analytics',
};
