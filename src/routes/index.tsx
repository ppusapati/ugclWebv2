import { component$, useSignal, $, useVisibleTask$, useResource$, Resource } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services/api-client';
import { analyticsService } from '~/services/analytics.service';
import type { Dashboard, DashboardListResponse, ReportResult, ChartType } from '~/types/analytics';
import { getWidgetExecutionErrorMessage, getWidgetResult, groupWidgetExecutionErrors, hasWidgetResult, normalizeDashboardWidgetResults } from '~/utils/dashboard-results';
import { P9ETable } from '~/components/table/table';
import { Alert, Btn } from '~/components/ds';

export const useRootAuthGuard = routeLoader$(({ cookie, redirect }) => {
  const token = cookie.get('token')?.value || '';
  const rawUser = cookie.get('user')?.value || '';

  if (!token || !rawUser) {
    throw redirect(302, '/login/');
  }

  return null;
});

const DASHBOARD_GRID_COLS = 12;

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
    grid: chartType !== 'pie' && chartType !== 'doughnut'
      ? {
          left: '3%',
          right: '4%',
          bottom: '12%',
          containLabel: true,
        }
      : undefined,
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

export const useHomeDashboardData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const response = await ssrApiClient.get<DashboardListResponse | any>('/dashboards');
    const dashboards = response?.dashboards || response?.data || response || [];

    const selectedDashboard = Array.isArray(dashboards)
      ? dashboards.find((item: any) => item?.is_default) || dashboards[0]
      : null;

    if (selectedDashboard) {
      try {
        const widgetResponse = await ssrApiClient.get<any>(`/dashboards/${selectedDashboard.id}/widgets`);
        const widgets = widgetResponse?.widgets || widgetResponse?.data || widgetResponse || [];
        if (Array.isArray(widgets)) {
          selectedDashboard.widgets = widgets;
        }
      } catch {
        // Keep existing widget data from dashboard payload/list fallback.
      }

      if (!Array.isArray(selectedDashboard.widgets)) {
        selectedDashboard.widgets = selectedDashboard.layout?.widgets || selectedDashboard.layout?.items || [];
      }
    }

    if (!selectedDashboard) {
      return {
        dashboard: null,
        error: 'No dashboard found for this user',
      };
    }

    return { dashboard: selectedDashboard };
  } catch (error: any) {
    return {
      dashboard: null,
      error: error?.message || 'Failed to load dashboard',
    };
  }
});

export default component$(() => {
  useRootAuthGuard();
  const loaderData = useHomeDashboardData();

  const dashboard = loaderData.value.dashboard as Dashboard | null;
  const error = (loaderData.value as any).error as string | undefined;

  const executionLoading = useSignal(false);
  const executionError = useSignal('');
  const widgetResults = useSignal<Record<string, any>>({});
  const autoLoadDone = useSignal(false);
  const chartComponent = useResource$(async () => {
    const mod = await import('~/components/echarts');
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
        results = normalizeDashboardWidgetResults(response, dashboard.widgets || []);
      } catch (dashboardExecError: any) {
        const message = String(dashboardExecError?.message || '').toLowerCase();
        const isNotFound = message.includes('404') || message.includes('not found');

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

  const getGroupedWidgetErrors = () => {
    if (!dashboard?.widgets || dashboard.widgets.length === 0) {
      return [];
    }

    return groupWidgetExecutionErrors(widgetResults.value, dashboard.widgets);
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
      <div class="w-full px-2 md:px-4 py-6">
        <div class="flex items-center justify-end mb-6">
          {dashboard && (
            <Btn onClick$={executeDashboard} disabled={executionLoading.value}>
              <i class="i-heroicons-arrow-path-solid h-4 w-4 inline-block" aria-hidden="true"></i>
              {executionLoading.value ? 'Refreshing...' : 'Refresh'}
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

        {getGroupedWidgetErrors().length > 0 && (
          <Alert variant="warning" class="mb-6">
            <div class="space-y-2">
              {getGroupedWidgetErrors().map((item) => (
                <div key={item.message} class="text-sm">
                  <div class="font-semibold">{item.message}</div>
                  <div class="text-xs text-gray-700">Affects {item.widgetIds.length} widget(s): {item.widgetTitles.join(', ')}</div>
                </div>
              ))}
            </div>
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
              <div class="p-1">
                {!dashboard.widgets || dashboard.widgets.length === 0 ? (
                  <p class="text-gray-500">No widgets configured for this dashboard.</p>
                ) : (
                  <div>
                    {(() => {
                      const isSingleWidget = (dashboard.widgets?.length || 0) === 1;
                      const sortedWidgets = [...(dashboard.widgets || [])].sort((a, b) => {
                        const ay = a.position?.y ?? 0;
                        const by = b.position?.y ?? 0;
                        if (ay !== by) return ay - by;
                        const ax = a.position?.x ?? 0;
                        const bx = b.position?.x ?? 0;
                        return ax - bx;
                      });
                      return (
                        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                          {sortedWidgets.map((widget) => {
                            const x = widget.position?.x ?? 0;
                            const w = widget.position?.w ?? 4;

                            const safeX = isSingleWidget ? 0 : Math.max(0, Math.min(DASHBOARD_GRID_COLS - 1, x));
                            const safeW = Math.max(1, Math.min(DASHBOARD_GRID_COLS, w));
                            const clampedW = isSingleWidget ? DASHBOARD_GRID_COLS : Math.min(safeW, DASHBOARD_GRID_COLS - safeX);

                            return (
                              <div
                                key={widget.id}
                                class="border border-gray-200 dark:border-gray-700 rounded-lg bg-white overflow-hidden [grid-column:var(--widget-grid-column)]"
                                style={{
                                  '--widget-grid-column': `${safeX + 1} / span ${clampedW}`,
                                }}
                              >
                          
                                {widget.description && <p class="text-sm text-gray-500 mb-3">{widget.description}</p>}

                                {hasWidgetResult(widgetResults.value, widget.id) ? (
                                  (() => {
                                    const reportResult = getNormalizedReportResult(getWidgetResult(widgetResults.value, widget.id));
                                    if (!reportResult) {
                                      const widgetExecutionError = getWidgetExecutionErrorMessage(getWidgetResult(widgetResults.value, widget.id));
                                      if (widgetExecutionError) {
                                        return (
                                          <div class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                                            {widgetExecutionError}
                                          </div>
                                        );
                                      }

                                      return (
                                        <div class="text-xs bg-gray-50 dark:bg-gray-900 rounded p-2 max-h-28 overflow-auto">
                                          {JSON.stringify(getWidgetResult(widgetResults.value, widget.id))}
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
                                        <div
                                          class="bg-gray-50 rounded-lg p-3"
                                          style={{ height: 'clamp(260px, 38vh, 420px)' }}
                                        >
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
                                      <P9ETable
                                        title={widget.title || 'Widget Table'}
                                        header={(reportResult.headers || []).map((h: any) => ({
                                          key: h.key.toLowerCase(),
                                          label: h.label || h.key,
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
                                  })()
                                ) : (
                                  <div class="flex items-center gap-2 text-xs text-gray-500">
                                    <span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500"></span>
                                    <span>{executionLoading.value ? 'Loading widget data...' : 'Waiting for live widget data...'}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
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
  title: 'Home - Dashboard',
};
