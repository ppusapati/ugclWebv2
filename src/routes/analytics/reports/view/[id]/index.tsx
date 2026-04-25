// Report Viewer Screen
import { component$, isServer, useStore, useResource$, Resource, $, useTask$ } from '@builder.io/qwik';
import { useLocation, useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services/api-client';
import { analyticsService } from '~/services/analytics.service';
import type { ReportDefinition, ReportResult, ReportFilter, ChartType } from '~/types/analytics';
import { P9ETable } from '~/components/table/table';
import { useAuthContext } from '~/contexts/auth-context';
import { Badge, Btn } from '~/components/ds';

// Helper function to transform report data into ECharts option format
const transformToChartOption = (
  reportData: ReportResult,
  chartType: ChartType,
  reportName: string
): any => {
  if (!reportData.data || reportData.data.length === 0 || !reportData.headers || reportData.headers.length < 2) {
    return null;
  }
  // Get the first field as x-axis (category) and second as y-axis (value)
  const xField = reportData.headers[0];
  const yField = reportData.headers[1];

  const categories = reportData.data.map((row: any) => String(row[xField.key] || ''));
  const values = reportData.data.map((row: any) => Number(row[yField.key]) || 0);

  const baseOption = {
    title: {
      text: reportName,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    tooltip: {
      trigger: chartType === 'pie' || chartType === 'doughnut' ? 'item' : 'axis',
      axisPointer: chartType === 'line' || chartType === 'area' ? { type: 'cross' } : { type: 'shadow' },
    },
    legend: {
      show: true,
      bottom: 0,
    },
    grid: chartType !== 'pie' && chartType !== 'doughnut' ? {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true,
    } : undefined,
  };

  // Chart-specific configurations
  switch (chartType) {
    case 'bar':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: { rotate: categories.length > 10 ? 45 : 0, interval: 0 },
        },
        yAxis: {
          type: 'value',
          name: yField.label,
        },
        series: [
          {
            name: yField.label,
            type: 'bar',
            data: values,
            itemStyle: { color: '#3b82f6' },
            label: { show: false },
          },
        ],
      };

    case 'line':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: categories,
          boundaryGap: false,
        },
        yAxis: {
          type: 'value',
          name: yField.label,
        },
        series: [
          {
            name: yField.label,
            type: 'line',
            data: values,
            smooth: true,
            itemStyle: { color: '#8b5cf6' },
            areaStyle: undefined,
          },
        ],
      };

    case 'area':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: categories,
          boundaryGap: false,
        },
        yAxis: {
          type: 'value',
          name: yField.label,
        },
        series: [
          {
            name: yField.label,
            type: 'line',
            data: values,
            smooth: true,
            itemStyle: { color: '#10b981' },
            areaStyle: { opacity: 0.5 },
          },
        ],
      };

    case 'pie':
    case 'doughnut':
      return {
        ...baseOption,
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)',
        },
        series: [
          {
            name: yField.label,
            type: 'pie',
            radius: chartType === 'doughnut' ? ['40%', '70%'] : '70%',
            data: reportData.data.map((row: any) => ({
              name: String(row[xField.key] || ''),
              value: Number(row[yField.key]) || 0,
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
            label: {
              show: true,
              formatter: '{b}: {d}%',
            },
          },
        ],
      };

    case 'scatter':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: categories,
        },
        yAxis: {
          type: 'value',
          name: yField.label,
        },
        series: [
          {
            name: yField.label,
            type: 'scatter',
            data: values,
            symbolSize: 10,
            itemStyle: { color: '#f59e0b' },
          },
        ],
      };

    default:
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: categories,
        },
        yAxis: {
          type: 'value',
          name: yField.label,
        },
        series: [
          {
            name: yField.label,
            type: 'bar',
            data: values,
            itemStyle: { color: '#3b82f6' },
          },
        ],
      };
  }
};

// Load report definition and execute with SSR support
export const useReportViewData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const reportId = requestEvent.params.id;

  try {
    console.log('[REPORT VIEW LOADER] Fetching report:', reportId);

    // Execute report - this returns both report definition and result in one call
    const executeResponse = await ssrApiClient.post<{ report: ReportDefinition; result: ReportResult }>(
      `/reports/definitions/${reportId}/execute`,
      {}
    );

    console.log('[REPORT VIEW LOADER] Report loaded and executed successfully');
    console.log('[REPORT VIEW LOADER] Report data:', executeResponse);

    return {
      report: executeResponse.report,
      reportData: executeResponse.result,
    };
  } catch (error: any) {
    console.error('[REPORT VIEW LOADER] Failed to load report:', error);
    return {
      report: null,
      reportData: null,
      error: error.message || 'Failed to load report',
    };
  }
});

export default component$(() => {
  const auth = useAuthContext();
  const loc = useLocation();
  const nav = useNavigate();
  const reportId = loc.params.id;
  const initialData = useReportViewData();

  const state = useStore({
    report: initialData.value.report as ReportDefinition | null,
    reportData: initialData.value.reportData as ReportResult | null,
    loading: false,
    error: (initialData.value as any).error || '',
    runtimeFilters: [] as ReportFilter[],
  });
  const permissionState = useStore({
    canExport: false,
  });

  useTask$(({ track }) => {
    track(() => auth.user?.id);
    track(() => auth.user?.business_roles?.length || 0);

    if (isServer) {
      permissionState.canExport = false;
      return;
    }

    const activeBusinessId = window.localStorage.getItem('ugcl_current_business_vertical');
    const businessRole = activeBusinessId
      ? auth.user?.business_roles?.find((role) => role.business_vertical_id === activeBusinessId)
      : auth.user?.business_roles?.[0];

    const globalPermissions = auth.user?.permissions || [];
    const businessPermissions = businessRole?.permissions || [];
    const allPermissions = new Set([...globalPermissions, ...businessPermissions]);

    permissionState.canExport = allPermissions.has('report:export') || !!auth.user?.is_super_admin;
  });

  const chartComponent = useResource$(async () => {
    const mod = await import('~/components/echarts');
    return mod.EChart;
  });

  const executeReport = $(async () => {
    try {
      state.loading = true;
      state.error = '';

      const response = await analyticsService.executeReport(reportId, state.runtimeFilters);
      state.report = response.report;
      state.reportData = response.result;
    } catch (err: any) {
      state.error = err.message || 'Failed to execute report';
    } finally {
      state.loading = false;
    }
  });

  const exportToExcel = $(async () => {
    try {
      await analyticsService.exportReport(reportId, 'xlsx', state.runtimeFilters);
    } catch (err: any) {
      state.error = err.message || 'Failed to export report';
    }
  });

  const exportToCSV = $(async () => {
    try {
      await analyticsService.exportReport(reportId, 'csv', state.runtimeFilters);
    } catch (err: any) {
      state.error = err.message || 'Failed to export report';
    }
  });

  const exportToPDF = $(async () => {
    try {
      await analyticsService.exportReport(reportId, 'pdf', state.runtimeFilters);
    } catch (err: any) {
      state.error = err.message || 'Failed to export report';
    }
  });

  const reportConfig = state.report ? {
    table: { icon: 'i-heroicons-chart-bar-solid', gradient: 'from-blue-500 to-blue-600' },
    chart: { icon: 'i-heroicons-presentation-chart-line-solid', gradient: 'from-purple-500 to-purple-600' },
    kpi: { icon: 'i-heroicons-cursor-arrow-rays-solid', gradient: 'from-green-500 to-green-600' },
    pivot: { icon: 'i-heroicons-squares-2x2-solid', gradient: 'from-orange-500 to-orange-600' },
  }[state.report.report_type] || { icon: 'i-heroicons-chart-bar-solid', gradient: 'from-blue-500 to-blue-600' } : { icon: 'i-heroicons-chart-bar-solid', gradient: 'from-blue-500 to-blue-600' };

  return (
    <div class="space-y-6">
      {/* Access Denied State */}
      {state.error && (state.error.toLowerCase().includes('403') || state.error.toLowerCase().includes('access') || state.error.toLowerCase().includes('forbidden') || state.error.toLowerCase().includes('unauthorized')) && !state.report && (
        <div class="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div class="bg-red-50 border border-red-200 rounded-2xl p-10 max-w-md w-full">
            <div class="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-red-900 mb-2">Access Denied</h2>
            <p class="text-red-700 text-sm mb-6">You do not have permission to view this report. Contact the report creator or an administrator to request access.</p>
            <Btn
              onClick$={() => nav('/analytics/reports')}
              variant="danger"
            >
              Back to Reports
            </Btn>
          </div>
        </div>
      )}

      {/* Modern Header with Gradient */}
      <div class={`bg-gradient-to-r ${reportConfig.gradient} shadow-lg relative overflow-hidden`}>
        {/* Background decoration */}
        <div class="absolute inset-0 opacity-5">
          <div class="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48"></div>
          <div class="absolute bottom-0 left-0 w-80 h-80 bg-black rounded-full -ml-40 -mb-40"></div>
        </div>

        <div class="py-6 relative">
          <div class="flex items-center justify-between gap-4 mb-4">
            {/* Left Section */}
            <div class="flex items-center gap-4">
              <Btn
                onClick$={() => nav('/analytics/reports')}
                size="sm"
                variant="ghost"
                class="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                title="Back to Reports"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </Btn>

              <div class="flex items-center gap-4">
                <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <i class={`${reportConfig.icon} h-10 w-10 inline-block text-white`} aria-hidden="true"></i>
                </div>
                <div>
                  <h1 class="text-3xl font-bold text-white mb-1">
                    {state.report?.name || 'Loading...'}
                  </h1>
                  {state.report?.description && (
                    <p class="text-white/80 text-sm">{state.report.description}</p>
                  )}
                  <div class="flex items-center gap-2 mt-2">
                    {state.report?.category && (
                      <span class="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
                        {state.report.category}
                      </span>
                    )}
                    <span class="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs font-medium capitalize">
                      {state.report?.report_type}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Action Buttons */}
            <div class="flex flex-wrap gap-3">
              <Btn
                onClick$={executeReport}
                disabled={state.loading}
                size="sm"
                variant="ghost"
                class="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class={`w-5 h-5 ${state.loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
              </Btn>

              {permissionState.canExport && (
              <div class="dropdown dropdown-end">
                <label tabIndex={0} class="px-5 py-3 bg-white hover:bg-gray-50 text-purple-600 rounded-xl transition-all hover:scale-105 font-medium shadow-lg flex items-center gap-2 cursor-pointer">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Export
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </label>
                <ul tabIndex={0} class="dropdown-content z-20 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-xl text-sm text-gray-700">
                  <li>
                    <Btn size="sm" variant="ghost" onClick$={exportToExcel} class="w-full text-left rounded-lg">Export Excel</Btn>
                  </li>
                  <li>
                    <Btn size="sm" variant="ghost" onClick$={exportToCSV} class="w-full text-left rounded-lg">Export CSV</Btn>
                  </li>
                  <li>
                    <Btn size="sm" variant="ghost" onClick$={exportToPDF} class="w-full text-left rounded-lg">Export PDF</Btn>
                  </li>
                </ul>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {state.error && (
        <div class="container mx-auto px-4 py-4 animate-fade-in">
          <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-5 flex items-start gap-4 shadow-lg">
            <div class="bg-red-100 dark:bg-red-900/40 rounded-full p-2">
              <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-red-800 dark:text-red-300 text-lg">Error</h4>
              <p class="text-red-700 dark:text-red-400 mt-1">{state.error}</p>
            </div>
            <Btn
              onClick$={() => state.error = ''}
              size="sm"
              variant="ghost"
              class="text-red-500 hover:text-red-700"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </Btn>
          </div>
        </div>
      )}

      {/* Loading State */}
      {state.loading && (
        <div class="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div class="relative">
            <div class="w-20 h-20 border-4 border-purple-200 dark:border-purple-800 rounded-full"></div>
            <div class="w-20 h-20 border-4 border-purple-600 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p class="mt-6 text-gray-600 dark:text-gray-400 font-medium text-lg">Loading report data...</p>
        </div>
      )}

      {/* Report Content */}
      {!state.loading && state.reportData && (
        <div class="py-8 space-y-6">
          {/* Statistics Cards */}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-md">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-blue-100 text-sm font-medium mb-1">Total Rows</p>
                  <p class="text-3xl font-bold">{state.reportData.metadata.total_rows.toLocaleString()}</p>
                </div>
                <div class="bg-white/20 rounded-lg p-3">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-md">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-purple-100 text-sm font-medium mb-1">Execution Time</p>
                  <p class="text-3xl font-bold">{state.reportData.metadata.execution_time_ms}<span class="text-xl">ms</span></p>
                </div>
                <div class="bg-white/20 rounded-lg p-3">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-md">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-green-100 text-sm font-medium mb-1">Generated At</p>
                  <p class="text-lg font-semibold">
                    {new Date(state.reportData.metadata.generated_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div class="bg-white/20 rounded-lg p-3">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Table View */}
          {state.report?.report_type === 'table' && (
            <P9ETable
              title={state.report.name || 'Report'}
              header={state.reportData.headers.map((h: any) => ({
                key: h.key.toLowerCase(),
                label: h.label,
                type: h.data_type
              }))}
              data={state.reportData.data.map((row: any) => {
                const normalizedRow: any = {};
                Object.keys(row).forEach(key => {
                  normalizedRow[key.toLowerCase()] = row[key];
                });
                return normalizedRow;
              })}
              defaultLimit={20}
              enableSearch={true}
              enableSort={true}
            />
          )}

          {/* Chart View */}
          {state.report?.report_type === 'chart' && (
            <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden\">
              <div class="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200\">
                <div class="flex items-center justify-between\">
                  <h2 class="text-xl font-bold text-gray-900 flex items-center gap-3\">
                    <div class="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-lg\">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                      </svg>
                    </div>
                    Chart Visualization
                  </h2>
                  {state.report.chart_type && (
                    <div class="flex items-center gap-2">
                      <Badge variant="info" class="px-4 py-2 text-sm font-semibold capitalize">
                        {state.report.chart_type} Chart
                      </Badge>
                      <Badge variant="info" class="px-4 py-2 text-sm font-semibold">
                        {state.reportData?.data.length || 0} Data Points
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div class="p-8 bg-white">
                {state.report.chart_type && state.reportData ? (
                  <div class="h-[600px] bg-gray-50 rounded-xl p-6">
                    <Resource
                      value={chartComponent}
                      onPending={() => <div class="h-full rounded-lg bg-gray-100 animate-pulse" />}
                      onResolved={(EChartComponent) => (
                        <EChartComponent
                          option={transformToChartOption(
                            state.reportData!,
                            state.report!.chart_type || 'bar',
                            state.report!.name
                          )}
                          class="w-full h-full"
                        />
                      )}
                    />
                  </div>
                ) : (
                  <div class="text-center py-16">
                    <div class="bg-purple-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg class="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                      </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">
                      {!state.report.chart_type
                        ? 'No chart type configured'
                        : 'No data available'}
                    </h3>
                    <p class="text-gray-600">
                      {!state.report.chart_type
                        ? 'This report needs a chart type to be configured'
                        : 'There is no data available to display in the chart'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
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
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'View Report - Analytics Dashboard',
  meta: [
    {
      name: 'description',
      content: 'View and analyze your custom report with interactive charts and data tables',
    },
  ],
};
