// Analytics Report Builder - Professional UI
import { component$, useSignal, useStore, $ } from '@builder.io/qwik';
import { useNavigate, routeLoader$, server$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '../../../../../services/api-client';
import { analyticsService } from '../../../../../services/analytics.service';
import type { ReportDefinition, FormTablesResponse, FilterOperator, LogicalOperator, ChartType } from '../../../../../types/analytics';
import { Badge, Btn, FormField, PageHeader } from '../../../../../components/ds';

interface RoleOption {
  id: string;
  name: string;
  description?: string;
  is_global?: boolean;
  business_vertical_id?: string;
  business_vertical_name?: string;
}

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

const getTableFieldsServer = server$(async function (tableName: string) {
  const ssrApiClient = createSSRApiClient(this as any);
  return ssrApiClient.get(`/reports/forms/tables/${encodeURIComponent(tableName)}/fields`);
});

const getBusinessVerticalsServer = server$(async function () {
  const ssrApiClient = createSSRApiClient(this as any);
  try {
    const response: any = await ssrApiClient.get('/admin/businesses');
    console.log('[VERTICALS FETCH] Response:', response);
    // Handle various response formats
    const businesses = response?.businesses || response?.data || response || [];
    console.log('[VERTICALS FETCH] Extracted businesses:', businesses);
    return Array.isArray(businesses) ? businesses : [];
  } catch (error) {
    console.error('Failed to fetch business verticals:', error);
    return [];
  }
});

const getModulesServer = server$(async function (verticalId: string) {
  const ssrApiClient = createSSRApiClient(this as any);
  try {
    // Preferred endpoint: modules for selected business vertical
    try {
      const response: any = await ssrApiClient.get(`/admin/business-verticals/${verticalId}/modules`);
      console.log('[MODULES FETCH] Vertical modules response:', response);
      const modules = response?.modules || response?.data || response || [];
      if (Array.isArray(modules) && modules.length > 0) {
        return modules;
      }
    } catch (verticalErr) {
      console.warn('[MODULES FETCH] Vertical endpoint failed, falling back to /modules:', verticalErr);
    }

    // Fallback endpoint: all modules (filter by vertical when mapping exists)
    const fallbackResponse: any = await ssrApiClient.get('/modules');
    console.log('[MODULES FETCH] Fallback /modules response:', fallbackResponse);
    const allModules = fallbackResponse?.modules || fallbackResponse?.data || fallbackResponse || [];
    if (!Array.isArray(allModules)) {
      return [];
    }

    const filteredModules = allModules.filter((m: any) => {
      const moduleVerticalId = m?.business_vertical_id || m?.vertical_id || m?.business_id;
      return !moduleVerticalId || moduleVerticalId === verticalId;
    });

    // If no mapping field exists in module records, show all modules rather than disabling the UI.
    return filteredModules.length > 0 ? filteredModules : allModules;
  } catch (error) {
    console.error('Failed to fetch modules for vertical:', verticalId, error);
    return [];
  }
});

const getAvailableRolesServer = server$(async function () {
  const ssrApiClient = createSSRApiClient(this as any);
  try {
    const response: any = await ssrApiClient.get('/admin/roles/unified?include_business=true');
    const roles = response?.roles || response?.data || response || [];
    if (Array.isArray(roles) && roles.length > 0) {
      return roles.map((role: any, index: number) => ({
        id: role?.id || role?.ID || role?.role_id || `role_${index}`,
        name: role?.display_name || role?.DisplayName || role?.name || role?.Name || '',
        description: role?.description || role?.Description,
        is_global: role?.is_global ?? role?.IsGlobal,
        business_vertical_id: role?.business_vertical_id || role?.BusinessVerticalID,
        business_vertical_name:
          role?.business_vertical_name ||
          role?.BusinessVerticalName ||
          role?.business_vertical?.name ||
          role?.BusinessVertical?.Name,
      })) as RoleOption[];
    }

    // Fallback for environments where unified roles endpoint is unavailable.
    const fallback: any = await ssrApiClient.get('/reports/available-roles');
    return (fallback?.roles || []).map((role: any) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      is_global: true,
    })) as RoleOption[];
  } catch (error) {
    console.error('Failed to fetch available roles:', error);
    return [];
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

  // Business vertical and module data
  const availableVerticals = useSignal<any[]>([]);
  const availableModules = useSignal<any[]>([]);
  const selectedVertical = useSignal('');
  const selectedModule = useSignal('');
  const loadingModalData = useSignal(false);

  // Report access / visibility
  const isPublic = useSignal(false);
  const allowedRoles = useSignal<string[]>([]);
  const roleScope = useSignal<'selected_vertical' | 'all_verticals'>('selected_vertical');
  const availableRoles = useSignal<RoleOption[]>([]);

  const getScopedRoleOptions = () => {
    const byName = new Map<string, RoleOption>();
    const normalizedSelectedVertical = selectedVertical.value || '';

    const filteredRoles = availableRoles.value.filter((role) => {
      if (!role?.name) return false;
      if (roleScope.value === 'all_verticals') return true;
      if (!normalizedSelectedVertical) return !!role.is_global;
      return !!role.is_global || role.business_vertical_id === normalizedSelectedVertical;
    });

    for (const role of filteredRoles) {
      const key = role.name.trim().toLowerCase();
      if (key && !byName.has(key)) {
        byName.set(key, role);
      }
    }

    return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const trimAllowedRolesToScope = $(() => {
    const normalizedSelectedVertical = selectedVertical.value || '';
    const validRoles = new Set(
      availableRoles.value
        .filter((role) => {
          if (!role?.name) return false;
          if (roleScope.value === 'all_verticals') return true;
          if (!normalizedSelectedVertical) return !!role.is_global;
          return !!role.is_global || role.business_vertical_id === normalizedSelectedVertical;
        })
        .map((role) => role.name)
    );
    allowedRoles.value = allowedRoles.value.filter((roleName) => validRoles.has(roleName));
  });

  const getActiveBusinessId = $(() => {
    const keys = ['business_vertical_id', 'business_id', 'active_business_id'];
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value && value !== 'null' && value !== 'undefined') {
        return value;
      }
    }
    return undefined;
  });

  const loadModalData = $(async () => {
    loadingModalData.value = true;
    try {
      const [verticals, roles] = await Promise.all([
        getBusinessVerticalsServer(),
        getAvailableRolesServer(),
      ]);
      availableVerticals.value = verticals;
      availableRoles.value = roles;

      const activeVerticalId = await getActiveBusinessId();
      if (!selectedVertical.value && activeVerticalId && verticals.some((v: any) => (v.id || v.vertical_id) === activeVerticalId)) {
        selectedVertical.value = activeVerticalId;
      }

      // If there's only one vertical, select it automatically
      if (verticals.length === 1) {
        selectedVertical.value = verticals[0].id || verticals[0].vertical_id;
      }

      if (selectedVertical.value) {
        const modules = await getModulesServer(selectedVertical.value);
        availableModules.value = modules;
      }

      await trimAllowedRolesToScope();
    } catch (err: any) {
      console.error('Failed to load modal data:', err);
    } finally {
      loadingModalData.value = false;
    }
  });

  const buildUniqueReportCode = $((name: string) => {
    const base = (name || 'report')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'report';
    return `${base}_${Date.now()}`;
  });

  // Load fields when table is selected
  const loadTableFields = $(async (tableName: string) => {
    try {
      const response: any = await getTableFieldsServer(tableName);
      // Use form_fields (human-readable form definitions) as primary source
      // Fall back to db_fields (database columns) or fields (legacy) if form_fields not available
      const fields = response.form_fields || response.db_fields || response.fields || [];
      // Mark all fields as coming from the form schema for proper handling
      const enrichedFields = fields.map((f: any) => ({
        ...f,
        source: 'form' // Indicates these are from form schema with column_name
      }));
      console.log('[REPORT BUILDER] Loaded', enrichedFields.length, 'fields for table:', tableName, 'response:', response);
      tableFields.value = enrichedFields;
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
    // Always use column_name from form schema (backend ensures it's the actual database column)
    // Fall back to id/name only if column_name not available (for legacy db_fields)
    const fieldName = field.column_name || field.id || field.name;
    const fieldLabel = field.label || field.name || field.column_name;
    const fieldType = field.dataType || field.data_type || field.type || 'text';

    const exists = reportConfig.fields?.some(f => f.field_name === fieldName);
    if (!exists) {
      reportConfig.fields = [...(reportConfig.fields || []), {
        field_name: fieldName,
        alias: fieldLabel.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        data_source: 'data',
        data_type: fieldType,
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

    const businessVerticalId = selectedVertical.value || await getActiveBusinessId();
    if (!businessVerticalId) {
      error.value = 'Please select a business vertical before saving.';
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const finalReport = {
        ...reportConfig,
        code: await buildUniqueReportCode(reportConfig.name || 'report'),
        business_vertical_id: businessVerticalId,
        is_public: isPublic.value,
        allowed_roles: allowedRoles.value,
        ...(selectedVertical.value && { vertical_id: selectedVertical.value }),
        ...(selectedModule.value && { module_id: selectedModule.value })
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
      text: 'i-heroicons-document-text-solid',
      string: 'i-heroicons-document-text-solid',
      number: 'i-heroicons-calculator-solid',
      integer: 'i-heroicons-calculator-solid',
      float: 'i-heroicons-calculator-solid',
      date: 'i-heroicons-calendar-days-solid',
      datetime: 'i-heroicons-calendar-days-solid',
      boolean: 'i-heroicons-check-circle-solid',
      json: 'i-heroicons-code-bracket-solid',
    };
    return icons[type.toLowerCase()] || 'i-heroicons-clipboard-document-list-solid';
  };

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header with DS PageHeader */}
      <PageHeader
        title="Report Builder"
        subtitle="Design and build custom analytics reports"
      >
        <div q:slot="actions" class="flex items-center gap-3">
          <Btn
            onClick$={handlePreview}
            disabled={loading.value || (reportConfig.fields || []).length === 0}
            variant="secondary"
            size="sm"
          >
            <i class="i-heroicons-eye-solid h-4 w-4 inline-block" aria-hidden="true"></i>
            Preview
          </Btn>
          <Btn
            onClick$={async () => {
              await loadModalData();
              showSaveModal.value = true;
            }}
            disabled={loading.value || (reportConfig.fields || []).length === 0}
            variant="primary"
            size="sm"
          >
            <i class="i-heroicons-bookmark-square-solid h-4 w-4 inline-block" aria-hidden="true"></i>
            Save
          </Btn>
        </div>
      </PageHeader>

      {/* Progress Steps */}
      <div class="container mx-auto px-4 py-4">
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
                  ? 'bg-interactive-primary text-white font-semibold'
                  : 'bg-color-neutral-100 text-color-neutral-700'
              }`}>
                <div class={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep.value >= step.num ? 'bg-white text-interactive-primary' : 'bg-color-neutral-300 text-color-neutral-600'
                }`}>
                  {step.num}
                </div>
                <span class="text-sm font-medium hidden md:inline">{step.label}</span>
              </div>
              {step.num < 4 && (
                <svg class="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" class="text-color-neutral-400"></path>
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error.value && (
        <div class="container mx-auto px-4 py-4 animate-fade-in">
          <div class="bg-red-50 border-l-4 border-red-500 rounded-xl p-5 flex items-start gap-4 shadow-lg">
            <div class="bg-red-100 rounded-full p-2">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-red-800 text-lg">Error</h4>
              <p class="text-red-700 mt-1">{error.value}</p>
            </div>
            <Btn size="sm" variant="ghost" onClick$={() => error.value = ''} class="text-red-500 hover:text-red-700">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </Btn>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Configuration Panel */}
          <div class="col-span-4 space-y-6">
            {/* Step 1: Data Source Selector */}
            <div class="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div class="p-6 bg-blue-50 border-b border-blue-200">
                <h3 class="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div class="bg-interactive-primary p-2 rounded-xl">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                    </svg>
                  </div>
                  Data Source
                </h3>
              </div>
              <div class="p-6">
                <select
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
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
                  <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <p class="text-sm text-green-800 flex items-center gap-2">
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
              <div class="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div class="p-6 bg-purple-50 border-b border-purple-200">
                  <h3 class="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div class="bg-purple-600 p-2 rounded-xl">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                    </div>
                    Available Fields
                  </h3>
                  <p class="text-sm text-gray-600 mt-2">Click to add fields to your report</p>
                </div>
                <div class="p-4 space-y-2 overflow-y-auto">
                  {tableFields.value.length === 0 ? (
                    <div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      No fields found for the selected table. The table may be missing in the database or has no readable columns.
                    </div>
                  ) : (
                    tableFields.value.map((field: any) => {
                      // Trust backend form schema: column_name is the actual database column
                      // id might be form field ID, so use column_name as primary key
                      const fieldKey = field.column_name || field.id || field.name;
                      const fieldLabel = field.label || field.name || field.column_name;
                      const fieldType = field.dataType || field.data_type || field.type;
                      const fieldSource = field.source || 'form';
                      return (
                      <Btn
                        size="sm"
                        variant="ghost"
                        key={fieldKey}
                        onClick$={() => addField(field)}
                        class="w-full text-left p-3 transition-all hover:bg-purple-50 rounded-lg"
                      >
                        <div class="flex items-center gap-3">
                          <i class={`${fieldTypeIcon(fieldType)} h-5 w-5 inline-block text-purple-600`} aria-hidden="true"></i>
                          <div class="flex-1 min-w-0">
                            <div class="text-gray-900 truncate transition-colors font-medium">
                              {fieldLabel}
                            </div>
                            <div class="text-xs mt-0.5 flex items-center gap-1">
                              <span>{fieldType}</span>
                              {fieldSource === 'form' && <Badge variant="info">Form Field</Badge>}
                            </div>
                          </div>
                          <svg class="w-5 h-5 text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                          </svg>
                        </div>
                      </Btn>
                    );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Report Type & Chart Configuration */}
            <div class="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div class="p-6 bg-green-50 border-b border-green-200">
                <h3 class="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div class="bg-success-600 p-2 rounded-xl">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  Visualization
                </h3>
              </div>
              <div class="p-6 space-y-4">
                <FormField id="report-builder-type" label="Report Type">
                  <select
                    id="report-builder-type"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    value={reportConfig.report_type}
                    onChange$={(e: any) => {
                      reportConfig.report_type = e.target.value;
                      currentStep.value = 3;
                    }}
                  >
                    <option value="table">Table Report</option>
                    <option value="chart">Chart Visualization</option>
                    <option value="kpi">KPI Dashboard</option>
                  </select>
                </FormField>

                {reportConfig.report_type === 'chart' && (
                  <FormField id="report-builder-chart-type" label="Chart Type">
                    <div class="grid grid-cols-2 gap-2">
                      {[
                        { value: 'bar', label: 'Bar', icon: 'i-heroicons-chart-bar-solid' },
                        { value: 'line', label: 'Line', icon: 'i-heroicons-presentation-chart-line-solid' },
                        { value: 'pie', label: 'Pie', icon: 'i-heroicons-chart-pie-solid' },
                        { value: 'doughnut', label: 'Doughnut', icon: 'i-heroicons-circle-stack-solid' },
                        { value: 'area', label: 'Area', icon: 'i-heroicons-chart-bar-square-solid' },
                        { value: 'scatter', label: 'Scatter', icon: 'i-heroicons-sparkles-solid' },
                      ].map((chart) => (
                        <Btn
                          size="sm"
                          variant={reportConfig.chart_type === chart.value ? 'primary' : 'secondary'}
                          key={chart.value}
                          onClick$={() => reportConfig.chart_type = chart.value as ChartType}
                        >
                          <i class={`${chart.icon} h-5 w-5 inline-block`} aria-hidden="true"></i>
                          <div class="text-xs font-medium mt-1">{chart.label}</div>
                        </Btn>
                      ))}
                    </div>
                  </FormField>
                )}
              </div>
            </div>
          </div>

          {/* Main Canvas - Report Design Area */}
          <div class="col-span-12 lg:col-span-8 space-y-6">
            {/* Selected Fields */}
            <div class="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div class="p-6 bg-indigo-50 border-b border-indigo-200">
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div class="bg-indigo-600 p-2 rounded-xl">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                      </svg>
                    </div>
                    Selected Fields
                  </h3>
                  <Badge variant="info" class="px-3 py-1 text-sm">
                    {(reportConfig.fields || []).length} fields
                  </Badge>
                </div>
              </div>
              <div class="p-6">
                {(reportConfig.fields || []).length === 0 ? (
                  <div class="text-center py-16">
                    <div class="bg-gray-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                    </div>
                    <h4 class="text-xl font-semibold text-gray-700 mb-2">No fields selected</h4>
                    <p class="text-gray-500 mb-6">Select a data source and add fields from the sidebar</p>
                    <div class="flex items-center justify-center gap-2 text-sm text-gray-600">
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
                            ? 'bg-indigo-50 border-indigo-300 opacity-50'
                            : 'bg-gray-50 border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <svg class="w-5 h-5 text-gray-400 cursor-move" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                        </svg>

                        <div class="flex-1 grid grid-cols-2 gap-4">
                          <FormField id={`report-builder-field-alias-${index}`} label="Display Name">
                            <input
                              id={`report-builder-field-alias-${index}`}
                              type="text"
                              value={field.alias}
                              onInput$={(e: any) => {
                                (reportConfig.fields || [])[index].alias = e.target.value;
                              }}
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              placeholder="Field alias"
                            />
                          </FormField>
                          <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">Field Name</label>
                            <div class="px-3 py-2 text-sm bg-gray-100 rounded-lg text-gray-700 flex items-center gap-2">
                              <span>{fieldTypeIcon(field.data_type || 'text')}</span>
                              <span class="truncate">{field.field_name}</span>
                            </div>
                          </div>
                        </div>

                        <Btn
                          size="sm"
                          variant="danger"
                          onClick$={() => removeField(index)}
                          title="Remove field"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </Btn>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filters Section */}
            {(reportConfig.fields || []).length > 0 && (
              <div class="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div class="p-6 bg-cyan-50 border-b border-cyan-200">
                  <h3 class="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div class="bg-cyan-600 p-2 rounded-xl">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                      </svg>
                    </div>
                    Filters
                    <span class="text-sm font-normal text-gray-600">(Optional)</span>
                  </h3>
                </div>
                <div class="p-6 space-y-4">
                  {(reportConfig.filters || []).map((filter: any, index: number) => (
                    <div key={index} class="flex items-center gap-3 p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                      <span class="text-sm font-medium text-gray-900">
                        {filter.field_name} <span class="text-cyan-600 dark:text-cyan-400">{filter.operator}</span> {filter.value}
                      </span>
                      <Btn
                        size="sm"
                        variant="danger"
                        onClick$={() => removeFilter(index)}
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </Btn>
                    </div>
                  ))}

                  <div class="grid grid-cols-12 gap-2 items-end">
                    <FormField id="filter-field" label="Field" class="col-span-4 mb-0">
                      <select class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm" id="filter-field">
                        <option value="">Select field...</option>
                        {(reportConfig.fields || []).map((field: any) => (
                          <option key={field.field_name} value={field.field_name}>
                            {field.alias}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField id="filter-operator" label="Operator" class="col-span-3 mb-0">
                      <select class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm" id="filter-operator">
                        <option value="eq">Equals</option>
                        <option value="gt">Greater Than</option>
                        <option value="lt">Less Than</option>
                        <option value="like">Contains</option>
                        <option value="this_month">This Month</option>
                        <option value="this_week">This Week</option>
                      </select>
                    </FormField>
                    <FormField id="filter-value" label="Value" class="col-span-4 mb-0">
                      <input type="text" class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm" id="filter-value" placeholder="Value" />
                    </FormField>
                    <Btn
                      size="sm"
                      variant="primary"
                      onClick$={() => {
                        const field = (document.getElementById('filter-field') as HTMLSelectElement)?.value;
                        const operator = (document.getElementById('filter-operator') as HTMLSelectElement)?.value as FilterOperator;
                        const value = (document.getElementById('filter-value') as HTMLInputElement)?.value;
                        if (field && operator) {
                          addFilter(field, operator, value);
                        }
                      }}
                      class="col-span-1"
                    >
                      Add
                    </Btn>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Section */}
            {previewData.value && (
              <div class="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div class="p-6 bg-emerald-50 border-b border-emerald-200">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <div class="bg-emerald-600 p-2 rounded-xl">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </div>
                      Preview
                    </h3>
                    <div class="flex items-center gap-4 text-sm text-gray-600">
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
                      <tr class="bg-gray-50">
                        {previewData.value.headers.map((header: any) => (
                          <th key={header.key} class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            {header.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                      {previewData.value.data.slice(0, 10).map((row: any, i: number) => (
                        <tr key={i} class="hover:bg-gray-50 transition-colors">
                          {previewData.value.headers.map((header: any) => (
                            <td key={header.key} class="px-6 py-4 text-sm text-gray-900">
                              {row[header.key] !== null && row[header.key] !== undefined ? String(row[header.key]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.value.data.length > 10 && (
                  <div class="p-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-600">
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
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-scale-in">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div class="bg-interactive-primary p-2 rounded-xl">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                  </svg>
                </div>
                Save Report
              </h3>
              <Btn
                size="sm"
                variant="ghost"
                onClick$={() => showSaveModal.value = false}
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </Btn>
            </div>

            <div class="space-y-4">
              {error.value && (
                <div class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error.value}
                </div>
              )}

              <FormField id="save-report-name" label="Report Name" required>
                <input
                  id="save-report-name"
                  type="text"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  value={reportConfig.name}
                  onInput$={(e: any) => reportConfig.name = e.target.value}
                  placeholder="Enter a descriptive report name"
                  aria-required="true"
                />
              </FormField>

              <FormField id="save-report-description" label="Description">
                <textarea
                  id="save-report-description"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                  value={reportConfig.description}
                  onInput$={(e: any) => reportConfig.description = e.target.value}
                  placeholder="Add a description to help others understand this report"
                  rows={3}
                />
              </FormField>

              <FormField id="save-report-category" label="Category">
                <input
                  id="save-report-category"
                  type="text"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  value={reportConfig.category}
                  onInput$={(e: any) => reportConfig.category = e.target.value}
                  placeholder="e.g., Analytics, Operations, Finance"
                />
              </FormField>

              {/* Visibility */}
              <div class="rounded-xl border border-gray-200 p-4 space-y-3">
                <p class="text-sm font-semibold text-gray-800">Visibility &amp; Access</p>

                <label class="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    class={`relative w-11 h-6 rounded-full transition-colors ${isPublic.value ? 'bg-interactive-primary' : 'bg-gray-300'}`}
                    onClick$={() => {
                      isPublic.value = !isPublic.value;
                      if (isPublic.value) allowedRoles.value = [];
                    }}
                  >
                    <span
                      class={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublic.value ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                  <span class="text-sm text-gray-700">
                    {isPublic.value ? 'Public – visible to all users with report access' : 'Private – only visible to allowed roles and creator'}
                  </span>
                </label>

                {!isPublic.value && (
                  <div>
                    <FormField id="save-report-role-scope" label="Role Scope">
                    <select
                      id="save-report-role-scope"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 mb-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={roleScope.value}
                      onChange$={async (e: any) => {
                        roleScope.value = e.target.value;
                        await trimAllowedRolesToScope();
                      }}
                    >
                      <option value="selected_vertical">Roles from selected business vertical</option>
                      <option value="all_verticals">Roles from all business verticals</option>
                    </select>
                    </FormField>

                    {roleScope.value === 'selected_vertical' && !selectedVertical.value && (
                      <p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                        Select a business vertical below to load that vertical's roles. Global roles are shown meanwhile.
                      </p>
                    )}

                    <label class="block text-xs font-medium text-gray-600 mb-2">
                      Allowed Roles
                      <span class="ml-1 text-gray-400 font-normal">(leave empty to restrict to creator only)</span>
                    </label>
                    {getScopedRoleOptions().length === 0 ? (
                      <p class="text-xs text-gray-400 italic">Loading roles…</p>
                    ) : (
                      <div class="flex flex-wrap gap-2">
                        {getScopedRoleOptions().map((role) => {
                          const selected = allowedRoles.value.includes(role.name);
                          return (
                            <Btn
                              key={role.id}
                              type="button"
                              size="sm"
                              variant={selected ? 'primary' : 'secondary'}
                              onClick$={() => {
                                allowedRoles.value = selected
                                  ? allowedRoles.value.filter((r) => r !== role.name)
                                  : [...allowedRoles.value, role.name];
                              }}
                            >
                              {role.name}
                            </Btn>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div class="grid grid-cols-2 gap-4">
                <FormField id="save-report-business-vertical" label="Business Vertical">
                  <select
                    id="save-report-business-vertical"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    value={selectedVertical.value}
                    onChange$={async (e: any) => {
                      selectedVertical.value = e.target.value;
                      selectedModule.value = '';
                      await trimAllowedRolesToScope();
                      if (e.target.value) {
                        const modules = await getModulesServer(e.target.value);
                        availableModules.value = modules;
                      } else {
                        availableModules.value = [];
                      }
                    }}
                    disabled={loadingModalData.value}
                  >
                    <option value="">Select a vertical...</option>
                    {availableVerticals.value.map((v: any) => (
                      <option key={v.id || v.vertical_id} value={v.id || v.vertical_id}>
                        {v.name || v.vertical_name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField id="save-report-module" label="Module">
                  <select
                    id="save-report-module"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    value={selectedModule.value}
                    onChange$={(e: any) => {
                      selectedModule.value = e.target.value;
                    }}
                    disabled={loadingModalData.value || !selectedVertical.value}
                  >
                    <option value="">Select a module...</option>
                    {availableModules.value.map((m: any) => (
                      <option key={m.id || m.module_id} value={m.id || m.module_id}>
                        {m.name || m.module_name}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-blue-900">Report Summary</p>
                    <ul class="mt-2 text-xs text-blue-800 space-y-1">
                      <li>• {(reportConfig.fields || []).length} fields selected</li>
                      <li>• {(reportConfig.filters || []).length} filters applied</li>
                      <li>• Type: {reportConfig.report_type === 'chart' ? `${reportConfig.chart_type} chart` : reportConfig.report_type}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-3 mt-8">
              <Btn
                onClick$={() => showSaveModal.value = false}
                variant="secondary"
                class="flex-1 rounded-xl"
              >
                Cancel
              </Btn>
              <Btn
                onClick$={handleSave}
                disabled={loading.value || !reportConfig.name}
                class="flex-1 rounded-xl"
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
              </Btn>
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
