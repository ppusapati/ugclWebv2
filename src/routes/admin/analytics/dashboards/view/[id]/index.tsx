import { component$, useSignal, $, useVisibleTask$, useResource$, Resource } from '@builder.io/qwik';
import { useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '../../../../../../services/api-client';
import { analyticsService } from '../../../../../../services/analytics.service';
import type { Dashboard, DashboardListResponse, ReportResult, ChartType } from '../../../../../../types/analytics';
import { P9ETable } from '../../../../../../components/table/table';
import { Alert, Badge, Btn } from '../../../../../../components/ds';

const DASHBOARD_GRID_COLS = 12;
const DASHBOARD_GRID_ROW_HEIGHT = 48;
const DASHBOARD_CANVAS_MIN_WIDTH = 840;

const transformToChartOption = (
  reportData: ReportResult,
  chartType: ChartType,
  reportName: string
): any => {
  if (!reportData.data || reportData.data.length === 0 || !reportData.headers || reportData.headers.length < 2) {
    return null;
  }

  const xField = reportData.headers[0];
  const yField = reportData.headers[1];

  const categories = reportData.data.map((row: any) => String(row[xField.key] || ''));
  const values = reportData.data.map((row: any) => Number(row[yField.key]) || 0);

  const baseOption = {
    title: {
      text: reportName,
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 'bold',
      },
    },
    tooltip: {
      trigger: chartType === 'pie' || chartType === 'doughnut' ? 'item' : 'axis',
    },
    legend: {
      show: true,
      bottom: 0,
    },
    grid: chartType !== 'pie' && chartType !== 'doughnut' ? {
      left: '3%',
      right: '4%',
      bottom: '12%',
      containLabel: true,
    } : undefined,
  };

  if (chartType === 'pie' || chartType === 'doughnut') {
    return {
      ...baseOption,
      series: [
        {
          name: yField.label,
          type: 'pie',
          radius: chartType === 'doughnut' ? ['40%', '70%'] : '70%',
          data: reportData.data.map((row: any) => ({
            name: String(row[xField.key] || ''),
            value: Number(row[yField.key]) || 0,
          })),
        },
      ],
    };
  }

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
        type: chartType === 'area' ? 'line' : chartType,
        data: values,
        smooth: chartType === 'line' || chartType === 'area',
        areaStyle: chartType === 'area' ? { opacity: 0.4 } : undefined,
      },
    ],
  };
};

export const useDashboardData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const dashboardId = requestEvent.params.id;

  try {
    let dashboard: any = null;

    // Try by-id endpoint first for full details.
    try {
      const byIdResponse = await ssrApiClient.get<any>(`/dashboards/${dashboardId}`);
      dashboard = byIdResponse?.dashboard || byIdResponse?.data || byIdResponse;

      // Some backends return a 200 payload containing a not-found message.
      if (!dashboard?.id || String(dashboard.id) !== String(dashboardId)) {
        dashboard = null;
      }
    } catch {
      // Fallback: resolve from list endpoint when by-id route is unavailable.
    }

    if (!dashboard) {
      const response = await ssrApiClient.get<DashboardListResponse | any>('/dashboards');
      const dashboards = response?.dashboards || response?.data || response || [];
      dashboard = Array.isArray(dashboards)
        ? dashboards.find((item: any) => item?.id === dashboardId)
        : null;
    }

    // Load widgets from dedicated endpoint when available.
    if (dashboard) {
      try {
        const widgetResponse = await ssrApiClient.get<any>(`/dashboards/${dashboardId}/widgets`);
        const widgets = widgetResponse?.widgets || widgetResponse?.data || widgetResponse || [];
        if (Array.isArray(widgets)) {
          dashboard.widgets = widgets;
        }
      } catch {
        // Keep existing widget data from dashboard payload/list fallback.
      }

      if (!Array.isArray(dashboard.widgets)) {
        dashboard.widgets = dashboard.layout?.widgets || dashboard.layout?.items || [];
      }
    }

    if (!dashboard) {
      return {
        dashboard: null,
        error: 'Dashboard not found or you do not have access to it',
      };
    }

    return { dashboard };
  } catch (error: any) {
    return {
      dashboard: null,
      error: error?.message || 'Failed to load dashboard',
    };
  }
});

export default component$(() => {
  const nav = useNavigate();
  const loaderData = useDashboardData();

  const dashboard = loaderData.value.dashboard as Dashboard | null;
  const error = (loaderData.value as any).error as string | undefined;

  const executionLoading = useSignal(false);
  const executionError = useSignal('');
  const widgetResults = useSignal<Record<string, any>>({});
  const autoLoadDone = useSignal(false);
  const chartComponent = useResource$(async () => {
    const mod = await import('../../../../../../components/echarts');
    return mod.EChart;
  });

  const executeWidgetsByReport = $(async () => {
    if (!dashboard?.widgets || dashboard.widgets.length === 0) {
      return {} as Record<string, any>;
    }

    const resultMap: Record<string, any> = {};
    const executableWidgets = dashboard.widgets.filter((widget) => !!widget.report_id);

    for (const widget of executableWidgets) {
      try {
        const reportResponse = await analyticsService.executeReport(String(widget.report_id));
        resultMap[widget.id] = reportResponse.result;
      } catch {
        // Continue collecting from other widgets even if one fails.
      }
    }

    return resultMap;
  });

  const executeDashboard = $(async () => {
    if (!dashboard) return;
    try {
      executionLoading.value = true;
      executionError.value = '';
      let results: Record<string, any> = {};

      try {
        const response = await analyticsService.executeDashboard(dashboard.id);
        results = response.results || {};
      } catch (dashboardExecError: any) {
        const message = String(dashboardExecError?.message || '').toLowerCase();
        const isNotFound = message.includes('404') || message.includes('not found');

        // Fallback: execute each widget's report directly when dashboard execute endpoint is unavailable.
        if (isNotFound) {
          results = await executeWidgetsByReport();
        } else {
          throw dashboardExecError;
        }
      }

      widgetResults.value = results;

      if (Object.keys(results).length === 0 && (dashboard.widgets || []).length > 0) {
        executionError.value = 'No widget data available yet. Link widgets to reports to auto-load data.';
      }
    } catch (err: any) {
      executionError.value = err?.message || 'Failed to execute dashboard widgets';
    } finally {
      executionLoading.value = false;
    }
  });

  const getNormalizedReportResult = (raw: any): ReportResult | null => {
    if (!raw) return null;
    if (raw?.headers && Array.isArray(raw?.data)) return raw as ReportResult;
    if (raw?.result?.headers && Array.isArray(raw?.result?.data)) return raw.result as ReportResult;
    if (raw?.data?.headers && Array.isArray(raw?.data?.data)) return raw.data as ReportResult;
    return null;
  };

  const getWidgetKpiValue = (result: ReportResult): string | null => {
    if (!result?.data || result.data.length === 0) return null;
    const firstRow = result.data[0];
    if (!firstRow || typeof firstRow !== 'object') return null;
    const firstKey = Object.keys(firstRow)[0];
    if (!firstKey) return null;
    const value = firstRow[firstKey];
    return value === null || value === undefined ? '-' : String(value);
  };

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    track(() => dashboard?.id);

    if (!dashboard?.id || autoLoadDone.value) {
      return;
    }

    autoLoadDone.value = true;
    if ((dashboard.widgets || []).length > 0) {
      await executeDashboard();
    }
  });

  return (
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div class="container mx-auto px-4 py-8">
        <div class="flex items-center justify-between mb-6">
          <Btn
            onClick$={() => nav('/admin/analytics/dashboards')}
            variant="ghost"
          >
            <i class="i-heroicons-arrow-left-solid mr-1 h-4 w-4 inline-block" aria-hidden="true"></i>
            Back to Dashboards
          </Btn>

          {dashboard && (
            <Btn
              onClick$={executeDashboard}
              disabled={executionLoading.value}
            >
              {executionLoading.value ? 'Running...' : 'Run Dashboard'}
            </Btn>
          )}
        </div>

        {error && (
          <Alert variant="error" class="mb-6">
            <span>{error}</span>
          </Alert>
        )}

        {executionError.value && (
          <Alert variant="warning" class="mb-6">
            <span>{executionError.value}</span>
          </Alert>
        )}

        {!dashboard && !error && (
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            <div class="p-8 text-center py-16">
              <h2 class="text-2xl font-semibold mb-2">Dashboard not found</h2>
              <p class="text-gray-500">The dashboard may have been removed or you may not have access.</p>
            </div>
          </div>
        )}

        {dashboard && (
          <div class="space-y-6">
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
              <div class="p-6">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{dashboard.name}</h1>
                    <p class="text-gray-600 dark:text-gray-300 mt-2">{dashboard.description || 'No description provided'}</p>
                  </div>
                  <div class="flex gap-2">
                    {dashboard.is_default && <Badge variant="success">Default</Badge>}
                    <Badge variant="neutral">Private</Badge>
                  </div>
                </div>

                {dashboard.tags && dashboard.tags.length > 0 && (
                  <div class="mt-4 flex flex-wrap gap-2">
                    {dashboard.tags.map((tag) => (
                      <Badge key={tag} variant="neutral">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
              <div class="p-6">
                <h2 class="text-xl font-bold mb-4">Widgets</h2>

                {!dashboard.widgets || dashboard.widgets.length === 0 ? (
                  <p class="text-gray-500">No widgets configured for this dashboard.</p>
                ) : (
                  <div class="overflow-x-auto">
                    <div
                      class="grid grid-cols-12 gap-4 min-w-[var(--dashboard-canvas-min-width)] auto-rows-[var(--dashboard-grid-row-height)]"
                      style={{
                        '--dashboard-canvas-min-width': `${DASHBOARD_CANVAS_MIN_WIDTH}px`,
                        '--dashboard-grid-row-height': `${DASHBOARD_GRID_ROW_HEIGHT}px`,
                      }}
                    >
                    {dashboard.widgets.map((widget) => {
                      const x = widget.position?.x ?? 0;
                      const y = widget.position?.y ?? 0;
                      const w = widget.position?.w ?? 4;
                      const h = widget.position?.h ?? 3;

                      const safeX = Math.max(0, Math.min(DASHBOARD_GRID_COLS - 1, x));
                      const safeW = Math.max(1, Math.min(DASHBOARD_GRID_COLS, w));
                      const clampedW = Math.min(safeW, DASHBOARD_GRID_COLS - safeX);
                      const safeY = Math.max(0, y);
                      const safeH = Math.max(1, h);

                      return (
                      <div
                        key={widget.id}
                        class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white overflow-hidden [grid-column:var(--widget-grid-column)] [grid-row:var(--widget-grid-row)] min-h-[var(--widget-min-height)]"
                        style={{
                          '--widget-grid-column': `${safeX + 1} / span ${clampedW}`,
                          '--widget-grid-row': `${safeY + 1} / span ${safeH}`,
                          '--widget-min-height': `${DASHBOARD_GRID_ROW_HEIGHT * safeH}px`,
                        }}
                      >
                        <div class="flex items-center justify-between mb-2">
                          <h3 class="font-semibold">{widget.title}</h3>
                          <Badge variant="neutral" class="capitalize">{widget.type}</Badge>
                        </div>
                        {widget.description && (
                          <p class="text-sm text-gray-500 mb-3">{widget.description}</p>
                        )}
                        <p class="text-xs text-gray-500 mb-3">
                          Position: x={widget.position.x}, y={widget.position.y}, w={widget.position.w}, h={widget.position.h}
                        </p>

                        {widgetResults.value[widget.id] ? (
                          (() => {
                            const reportResult = getNormalizedReportResult(widgetResults.value[widget.id]);
                            if (!reportResult) {
                              return (
                                <div class="text-xs bg-gray-50 dark:bg-gray-900 rounded p-2 max-h-28 overflow-auto">
                                  {JSON.stringify(widgetResults.value[widget.id])}
                                </div>
                              );
                            }

                            if (widget.type === 'kpi') {
                              const kpiValue = getWidgetKpiValue(reportResult);
                              return (
                                <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                  <div class="text-xs text-emerald-700 mb-1">Current Value</div>
                                  <div class="text-2xl font-bold text-emerald-800">{kpiValue || '-'}</div>
                                </div>
                              );
                            }

                            if (widget.type === 'chart') {
                              return (
                                <div class="h-72 bg-gray-50 rounded-lg p-3">
                                  <Resource
                                    value={chartComponent}
                                    onPending={() => <div class="h-full rounded-lg bg-gray-100 animate-pulse" />}
                                    onResolved={(EChartComponent) => (
                                      <EChartComponent
                                        option={transformToChartOption(
                                          reportResult,
                                          (widget.config?.chart_type as ChartType) || 'bar',
                                          widget.title
                                        )}
                                        class="w-full h-full"
                                      />
                                    )}
                                  />
                                </div>
                              );
                            }

                            if (widget.type === 'table') {
                              return (
                                <P9ETable
                                  title={widget.title}
                                  header={(reportResult.headers || []).map((h: any) => ({
                                    key: h.key.toLowerCase(),
                                    label: h.label,
                                    type: h.data_type,
                                  }))}
                                  data={(reportResult.data || []).map((row: any) => {
                                    const normalizedRow: any = {};
                                    Object.keys(row || {}).forEach((key) => {
                                      normalizedRow[key.toLowerCase()] = row[key];
                                    });
                                    return normalizedRow;
                                  })}
                                  defaultLimit={8}
                                  enableSearch={false}
                                  enableSort={true}
                                />
                              );
                            }

                            return (
                              <div class="overflow-auto rounded-lg border border-gray-200">
                                <table class="min-w-full text-xs">
                                  <thead class="bg-gray-100">
                                    <tr>
                                      {(reportResult.headers || []).slice(0, 8).map((header) => (
                                        <th key={header.key} class="px-2 py-1 text-left font-semibold text-gray-700 whitespace-nowrap">
                                          {header.label || header.key}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(reportResult.data || []).slice(0, 8).map((row: any, rowIndex: number) => (
                                      <tr key={`row-${rowIndex}`} class="border-t border-gray-100">
                                        {(reportResult.headers || []).slice(0, 8).map((header) => (
                                          <td key={`${rowIndex}-${header.key}`} class="px-2 py-1 text-gray-600 whitespace-nowrap">
                                            {row?.[header.key] === null || row?.[header.key] === undefined
                                              ? '-'
                                              : String(row[header.key])}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {(reportResult.data || []).length > 8 && (
                                  <div class="px-2 py-1 text-[11px] text-gray-500 bg-gray-50 border-t border-gray-200">
                                    Showing first 8 rows of {reportResult.data.length}
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <div class="text-xs text-gray-400">Widget has no live result yet.</div>
                        )}
                      </div>
                    );
                    })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Dashboard View - Analytics',
};
