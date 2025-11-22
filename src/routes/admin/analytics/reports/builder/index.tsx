// Analytics Report Builder - Professional UI
import { component$, useSignal, useStore, $ } from '@builder.io/qwik';
import { useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '../../../../../services/api-client';
import { analyticsService } from '../../../../../services/analytics.service';
import type { ReportDefinition, FormTablesResponse, FilterOperator, LogicalOperator, ChartType } from '../../../../../types/analytics';

// Load available form tables with SSR support
export const useFormTablesData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    console.log('[REPORT BUILDER LOADER] Fetching form tables');

    const response = await ssrApiClient.get<FormTablesResponse>('/reports/forms/tables');

    console.log('[REPORT BUILDER LOADER] Form tables fetched:', response.tables?.length || 0);

    return {
      tables: response.tables || [],
    };
  } catch (error: any) {
    console.error('[REPORT BUILDER LOADER] Failed to load form tables:', error);
    return {
      tables: [],
      error: error.message || 'Failed to load form tables',
    };
  }
});

export default component$(() => {
  const nav = useNavigate();
  const initialData = useFormTablesData();

  const reportConfig = useStore<Partial<ReportDefinition>>({
    name: '',
    description: '',
    category: '',
    report_type: 'table',
    data_sources: [],
    fields: [],
    filters: [],
    sorting: [],
    chart_type: 'bar',
  });

  const availableTables = useSignal(initialData.value.tables);
  const tableFields = useSignal<any[]>([]);
  const selectedTable = useSignal('');
  const previewData = useSignal<any>(null);
  const loading = useSignal(false);
  const error = useSignal((initialData.value as any).error || '');
  const showSaveModal = useSignal(false);
  const currentStep = useSignal(1);
  const draggedFieldIndex = useSignal<number | null>(null);

  // Load fields when table is selected
  const loadTableFields = $(async (tableName: string) => {
    try {
      const response = await analyticsService.getTableFields(tableName);
      tableFields.value = response.fields || [];
    } catch (err: any) {
      error.value = err.message || 'Failed to load fields';
    }
  });

  const handleTableSelect = $((tableName: string, formCode: string, formId: string) => {
    selectedTable.value = tableName;
    reportConfig.data_sources = [{
      alias: 'data',
      table_name: tableName,
      form_code: formCode,
      form_id: formId
    }];
    loadTableFields(tableName);
    currentStep.value = 2;
  });

  const addField = $((field: any) => {
    const exists = reportConfig.fields?.some(f => f.field_name === field.name);
    if (!exists) {
      reportConfig.fields = [...(reportConfig.fields || []), {
        field_name: field.name,
        alias: field.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        data_source: 'data',
        data_type: field.type,
        is_visible: true,
        order: (reportConfig.fields?.length || 0) + 1
      }];
    }
  });

  const removeField = $((index: number) => {
    reportConfig.fields = (reportConfig.fields || []).filter((_, i) => i !== index);
  });

  const moveField = $((fromIndex: number, toIndex: number) => {
    const fields = [...(reportConfig.fields || [])];
    const [movedField] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, movedField);
    fields.forEach((f, i) => f.order = i + 1);
    reportConfig.fields = fields;
  });

  const addFilter = $((fieldName: string, operator: FilterOperator, value: any) => {
    reportConfig.filters = [...(reportConfig.filters || []), {
      field_name: fieldName,
      data_source: 'data',
      operator,
      value,
      logical_op: 'AND' as LogicalOperator
    }];
  });

  const removeFilter = $((index: number) => {
    reportConfig.filters = (reportConfig.filters || []).filter((_, i) => i !== index);
  });

  const handlePreview = $(async () => {
    if (!reportConfig.fields || reportConfig.fields.length === 0) {
      error.value = 'Please select at least one field';
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const tempReport = {
        ...reportConfig,
        code: `preview_${Date.now()}`,
        business_vertical_id: localStorage.getItem('business_vertical_id') || undefined
      };

      const createResponse = await analyticsService.createReport(tempReport);
      const reportId = createResponse.report.id;

      const executeResponse = await analyticsService.executeReport(reportId);
      previewData.value = executeResponse.result;
      currentStep.value = 4;
    } catch (err: any) {
      error.value = err.message || 'Failed to preview report';
    } finally {
      loading.value = false;
    }
  });

  const handleSave = $(async () => {
    if (!reportConfig.name) {
      error.value = 'Please enter a report name';
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const finalReport = {
        ...reportConfig,
        code: reportConfig.name.toLowerCase().replace(/\s+/g, '_'),
        business_vertical_id: localStorage.getItem('business_vertical_id') || undefined
      };

      const response = await analyticsService.createReport(finalReport);
      showSaveModal.value = false;
      nav(`/admin/analytics/reports/view/${response.report.id}`);
    } catch (err: any) {
      error.value = err.message || 'Failed to save report';
    } finally {
      loading.value = false;
    }
  });

  const fieldTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      text: '📝',
      string: '📝',
      number: '🔢',
      integer: '🔢',
      float: '🔢',
      date: '📅',
      datetime: '📅',
      boolean: '✓',
      json: '{}',
    };
    return icons[type.toLowerCase()] || '📋';
  };

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Modern Header */}
      <div class="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-screen-2xl mx-auto px-6 py-6">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div class="flex items-center gap-4">
              <button
                onClick$={() => nav('/admin/analytics/reports')}
                class="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors text-gray-700 dark:text-gray-300"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>

              <div class="flex items-center gap-4">
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                  <svg class="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path>
                  </svg>
                </div>
                <div>
                  <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-1">Report Builder</h1>
                  <p class="text-gray-600 dark:text-gray-400 text-sm">Design and build custom analytics reports</p>
                </div>
              </div>
            </div>

            <div class="flex gap-3">
              <button
                onClick$={handlePreview}
                disabled={loading.value || (reportConfig.fields || []).length === 0}
                class="px-5 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                {loading.value ? 'Loading...' : 'Preview'}
              </button>
              <button
                onClick$={() => showSaveModal.value = true}
                disabled={loading.value || (reportConfig.fields || []).length === 0}
                class="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                </svg>
                Save Report
              </button>
            </div>
          </div>

          {/* Progress Steps */}
          <div class="mt-6">
            <div class="flex items-center justify-center gap-2">
              {[
                { num: 1, label: 'Data Source' },
                { num: 2, label: 'Fields' },
                { num: 3, label: 'Configuration' },
                { num: 4, label: 'Preview' }
              ].map((step) => (
                <div key={step.num} class="flex items-center">
                  <div class={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    currentStep.value >= step.num
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-gray-900 dark:text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    <div class={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep.value >= step.num ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}>
                      {step.num}
                    </div>
                    <span class="text-sm font-medium hidden md:inline">{step.label}</span>
                  </div>
                  {step.num < 4 && (
                    <svg class="w-4 h-4 mx-2 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error.value && (
        <div class="max-w-screen-2xl mx-auto px-6 py-4 animate-fade-in">
          <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-5 flex items-start gap-4 shadow-lg">
            <div class="bg-red-100 dark:bg-red-900/40 rounded-full p-2">
              <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-red-800 dark:text-red-300 text-lg">Error</h4>
              <p class="text-red-700 dark:text-red-400 mt-1">{error.value}</p>
            </div>
            <button onClick$={() => error.value = ''} class="text-red-500 hover:text-red-700">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div class="max-w-screen-2xl mx-auto px-6 py-8">
        <div class="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Configuration Panel */}
          <div class="col-span-4 space-y-6">
            {/* Step 1: Data Source Selector */}
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div class="bg-blue-600 p-2 rounded-xl">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                    </svg>
                  </div>
                  Data Source
                </h3>
              </div>
              <div class="p-6">
                <select
                  class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                  onChange$={(e: any) => {
                    const table = availableTables.value.find((t: any) => t.table_name === e.target.value);
                    if (table) {
                      handleTableSelect(table.table_name, table.form_code, table.form_id);
                    }
                  }}
                >
                  <option value="">Select a data source...</option>
                  {availableTables.value.map((table: any) => (
                    <option key={table.table_name} value={table.table_name}>
                      {table.form_title}
                    </option>
                  ))}
                </select>
                {selectedTable.value && (
                  <div class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <p class="text-sm text-green-800 dark:text-green-300 flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Connected: {selectedTable.value}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Available Fields */}
            {selectedTable.value && (
              <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="p-6 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
                  <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div class="bg-purple-600 p-2 rounded-xl">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                    </div>
                    Available Fields
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Click to add fields to your report</p>
                </div>
                <div class="p-4 space-y-2 overflow-y-auto">
                  {tableFields.value.map((field: any) => (
                    <button
                      key={field.name}
                      onClick$={() => addField(field)}
                      class="w-full text-left p-3 transition-all"
                    >
                      <div class="flex items-center gap-3">
                        <span class="">{fieldTypeIcon(field.type)}</span>
                        <div class="flex-1 min-w-0">
                          <div class="text-gray-900 dark:text-white truncate transition-colors">
                            {field.name}
                          </div>
                          <div class="text-xs dark:text-gray-400 mt-0.5">
                            {field.type}
                          </div>
                        </div>
                        <svg class="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Report Type & Chart Configuration */}
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="p-6 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div class="bg-green-600 p-2 rounded-xl">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  Visualization
                </h3>
              </div>
              <div class="p-6 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Report Type</label>
                  <select
                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    value={reportConfig.report_type}
                    onChange$={(e: any) => {
                      reportConfig.report_type = e.target.value;
                      currentStep.value = 3;
                    }}
                  >
                    <option value="table">📊 Table Report</option>
                    <option value="chart">📈 Chart Visualization</option>
                    <option value="kpi">🎯 KPI Dashboard</option>
                  </select>
                </div>

                {reportConfig.report_type === 'chart' && (
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chart Type</label>
                    <div class="grid grid-cols-2 gap-2">
                      {[
                        { value: 'bar', label: 'Bar', icon: '📊' },
                        { value: 'line', label: 'Line', icon: '📈' },
                        { value: 'pie', label: 'Pie', icon: '🥧' },
                        { value: 'doughnut', label: 'Doughnut', icon: '🍩' },
                        { value: 'area', label: 'Area', icon: '📉' },
                        { value: 'scatter', label: 'Scatter', icon: '⚡' },
                      ].map((chart) => (
                        <button
                          key={chart.value}
                          onClick$={() => reportConfig.chart_type = chart.value as ChartType}
                          class={`px-3 py-2 rounded-lg border-2 transition-all ${
                            reportConfig.chart_type === chart.value
                              ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600 text-gray-900 dark:text-white'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span class="text-lg">{chart.icon}</span>
                          <div class="text-xs font-medium mt-1">{chart.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Canvas - Report Design Area */}
          <div class="col-span-12 lg:col-span-8 space-y-6">
            {/* Selected Fields */}
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="p-6 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800">
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div class="bg-indigo-600 p-2 rounded-xl">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                      </svg>
                    </div>
                    Selected Fields
                  </h3>
                  <span class="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-semibold">
                    {(reportConfig.fields || []).length} fields
                  </span>
                </div>
              </div>
              <div class="p-6">
                {(reportConfig.fields || []).length === 0 ? (
                  <div class="text-center py-16">
                    <div class="bg-gray-100 dark:bg-gray-700 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg class="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                    </div>
                    <h4 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No fields selected</h4>
                    <p class="text-gray-500 dark:text-gray-400 mb-6">Select a data source and add fields from the sidebar</p>
                    <div class="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                      </svg>
                      Select fields from the left sidebar
                    </div>
                  </div>
                ) : (
                  <div class="space-y-3">
                    {(reportConfig.fields || []).map((field: any, index: number) => (
                      <div
                        key={index}
                        draggable
                        onDragStart$={() => draggedFieldIndex.value = index}
                        onDragOver$={(e: DragEvent) => e.preventDefault()}
                        onDrop$={() => {
                          if (draggedFieldIndex.value !== null && draggedFieldIndex.value !== index) {
                            moveField(draggedFieldIndex.value, index);
                            draggedFieldIndex.value = null;
                          }
                        }}
                        class={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-move ${
                          draggedFieldIndex.value === index
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 opacity-50'
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                      >
                        <svg class="w-5 h-5 text-gray-400 cursor-move" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                        </svg>

                        <div class="flex-1 grid grid-cols-2 gap-4">
                          <div>
                            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Display Name</label>
                            <input
                              type="text"
                              value={field.alias}
                              onInput$={(e: any) => {
                                (reportConfig.fields || [])[index].alias = e.target.value;
                              }}
                              class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              placeholder="Field alias"
                            />
                          </div>
                          <div>
                            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Field Name</label>
                            <div class="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <span>{fieldTypeIcon(field.data_type || 'text')}</span>
                              <span class="truncate">{field.field_name}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick$={() => removeField(index)}
                          class="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
                          title="Remove field"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filters Section */}
            {(reportConfig.fields || []).length > 0 && (
              <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="p-6 bg-cyan-50 dark:bg-cyan-900/20 border-b border-cyan-200 dark:border-cyan-800">
                  <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div class="bg-cyan-600 p-2 rounded-xl">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                      </svg>
                    </div>
                    Filters
                    <span class="text-sm font-normal text-gray-600 dark:text-gray-400">(Optional)</span>
                  </h3>
                </div>
                <div class="p-6 space-y-4">
                  {(reportConfig.filters || []).map((filter: any, index: number) => (
                    <div key={index} class="flex items-center gap-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl">
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        {filter.field_name} <span class="text-cyan-600 dark:text-cyan-400">{filter.operator}</span> {filter.value}
                      </span>
                      <button
                        onClick$={() => removeFilter(index)}
                        class="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))}

                  <div class="flex gap-2">
                    <select class="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm" id="filter-field">
                      <option value="">Select field...</option>
                      {(reportConfig.fields || []).map((field: any) => (
                        <option key={field.field_name} value={field.field_name}>
                          {field.alias}
                        </option>
                      ))}
                    </select>
                    <select class="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm" id="filter-operator">
                      <option value="eq">Equals</option>
                      <option value="gt">Greater Than</option>
                      <option value="lt">Less Than</option>
                      <option value="like">Contains</option>
                      <option value="this_month">This Month</option>
                      <option value="this_week">This Week</option>
                    </select>
                    <input type="text" class="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm" id="filter-value" placeholder="Value" />
                    <button
                      onClick$={() => {
                        const field = (document.getElementById('filter-field') as HTMLSelectElement)?.value;
                        const operator = (document.getElementById('filter-operator') as HTMLSelectElement)?.value as FilterOperator;
                        const value = (document.getElementById('filter-value') as HTMLInputElement)?.value;
                        if (field && operator) {
                          addFilter(field, operator, value);
                        }
                      }}
                      class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Section */}
            {previewData.value && (
              <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="p-6 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <div class="bg-emerald-600 p-2 rounded-xl">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </div>
                      Preview
                    </h3>
                    <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        {previewData.value.metadata.total_rows} rows
                      </span>
                      <span class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {previewData.value.metadata.execution_time_ms}ms
                      </span>
                    </div>
                  </div>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="bg-gray-50 dark:bg-gray-700/50">
                        {previewData.value.headers.map((header: any) => (
                          <th key={header.key} class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            {header.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                      {previewData.value.data.slice(0, 10).map((row: any, i: number) => (
                        <tr key={i} class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          {previewData.value.headers.map((header: any) => (
                            <td key={header.key} class="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                              {row[header.key] !== null && row[header.key] !== undefined ? String(row[header.key]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.value.data.length > 10 && (
                  <div class="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
                    Showing 10 of {previewData.value.data.length} rows
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal.value && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-scale-in">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div class="bg-blue-600 p-2 rounded-xl">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                  </svg>
                </div>
                Save Report
              </h3>
              <button
                onClick$={() => showSaveModal.value = false}
                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Report Name *</label>
                <input
                  type="text"
                  class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  value={reportConfig.name}
                  onInput$={(e: any) => reportConfig.name = e.target.value}
                  placeholder="Enter a descriptive report name"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                  value={reportConfig.description}
                  onInput$={(e: any) => reportConfig.description = e.target.value}
                  placeholder="Add a description to help others understand this report"
                  rows={3}
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <input
                  type="text"
                  class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  value={reportConfig.category}
                  onInput$={(e: any) => reportConfig.category = e.target.value}
                  placeholder="e.g., Analytics, Operations, Finance"
                />
              </div>

              <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-blue-900 dark:text-blue-300">Report Summary</p>
                    <ul class="mt-2 text-xs text-blue-800 dark:text-blue-400 space-y-1">
                      <li>• {(reportConfig.fields || []).length} fields selected</li>
                      <li>• {(reportConfig.filters || []).length} filters applied</li>
                      <li>• Type: {reportConfig.report_type === 'chart' ? `${reportConfig.chart_type} chart` : reportConfig.report_type}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-3 mt-8">
              <button
                onClick$={() => showSaveModal.value = false}
                class="flex-1 px-6 py-3 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick$={handleSave}
                disabled={loading.value || !reportConfig.name}
                class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading.value ? (
                  <>
                    <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Save Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Report Builder - Analytics Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Build custom analytics reports with an intuitive drag-and-drop interface',
    },
  ],
};
