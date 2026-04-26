// Analytics Report Builder - Professional UI
import { component$, useSignal, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate, routeLoader$, server$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services/api-client';
import { analyticsService } from '~/services/analytics.service';
import type { ReportDefinition, FormTablesResponse, FilterOperator, LogicalOperator, ChartType } from '~/types/analytics';
import { Badge, Btn, FormField, PageHeader } from '~/components/ds';

interface RoleOption {
  id: string;
  name: string;
  description?: string;
  is_global?: boolean;
  business_vertical_id?: string;
  business_vertical_name?: string;
}

const KPI_AGGREGATIONS = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'] as const;
type KpiAggregation = (typeof KPI_AGGREGATIONS)[number];

const getEntityId = (value: any): string =>
  String(
    value?.id ||
      value?.module_id ||
      value?.vertical_id ||
      value?.business_vertical_id ||
      value?.business_id ||
      value ||
      ''
  ).trim();

const filterTablesBySelection = (tables: any[], verticalId: string, moduleId: string) => {
  const normalizedVerticalId = String(verticalId || '').trim();
  const normalizedModuleId = String(moduleId || '').trim();

  return tables.filter((table: any) => {
    const tableVerticalId = getEntityId(
      table?.business_vertical_id ||
        table?.vertical_id ||
        table?.business_id ||
        table?.business_vertical
    );
    const tableModuleId = getEntityId(
      table?.module_id ||
        table?.form_module_id ||
        table?.module
    );

    const verticalMatches = !tableVerticalId || tableVerticalId === normalizedVerticalId;
    const moduleMatches = !!tableModuleId && tableModuleId === normalizedModuleId;
    return verticalMatches && moduleMatches;
  });
};

const normalizeScopeToken = (value: any): string =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const hasScopeMetadata = (table: any): boolean => {
  const tableVerticalId = getEntityId(
    table?.business_vertical_id ||
      table?.vertical_id ||
      table?.business_id ||
      table?.business_vertical
  );
  const tableModuleId = getEntityId(
    table?.module_id ||
      table?.form_module_id ||
      table?.module
  );
  return !!tableVerticalId || !!tableModuleId;
};

const buildModuleTokens = (moduleOption: any, moduleId: string): string[] => {
  const values = [
    moduleId,
    moduleOption?.id,
    moduleOption?.module_id,
    moduleOption?.code,
    moduleOption?.module_code,
    moduleOption?.name,
    moduleOption?.module_name,
  ];

  const tokenSet = new Set<string>();
  values.forEach((value) => {
    const normalized = normalizeScopeToken(value);
    if (normalized) {
      tokenSet.add(normalized);
      tokenSet.add(normalized.replace(/_/g, ''));
    }
  });

  return Array.from(tokenSet).filter((token) => token.length >= 3);
};

const isNumericFieldType = (fieldType: string | undefined): boolean => {
  if (!fieldType) return false;
  const numericTypes = ['number', 'integer', 'int', 'float', 'decimal', 'currency', 'percent', 'money', 'bigint', 'smallint', 'numeric', 'real', 'double'];
  return numericTypes.includes(fieldType.toLowerCase());
};

const isDateLikeFieldType = (fieldType: string | undefined): boolean => {
  if (!fieldType) return false;
  const dateTypes = ['date', 'datetime', 'timestamp', 'time'];
  return dateTypes.includes(fieldType.toLowerCase());
};

const isBooleanFieldType = (fieldType: string | undefined): boolean => {
  if (!fieldType) return false;
  const booleanTypes = ['bool', 'boolean'];
  return booleanTypes.includes(fieldType.toLowerCase());
};

const operatorLabelMap: Record<FilterOperator, string> = {
  eq: 'Equals',
  ne: 'Not equals',
  gt: 'Greater than',
  gte: 'Greater than or equal',
  lt: 'Less than',
  lte: 'Less than or equal',
  like: 'Contains',
  in: 'In list',
  between: 'Between',
  this_month: 'This month',
  this_week: 'This week',
  this_year: 'This year',
  last_month: 'Last month',
  last_week: 'Last week',
  last_year: 'Last year',
};

const tableMatchesModuleHeuristic = (table: any, moduleId: string, moduleTokens: string[]): boolean => {
  const tableModuleId = getEntityId(
    table?.module_id ||
      table?.form_module_id ||
      table?.module
  );

  if (tableModuleId && tableModuleId === moduleId) {
    return true;
  }

  const candidates = [
    table?.table_name,
    table?.form_code,
    table?.form_title,
    table?.module_name,
    table?.module_code,
    table?.module?.name,
    table?.module?.code,
  ]
    .map((value) => normalizeScopeToken(value))
    .filter(Boolean);

  if (candidates.length === 0 || moduleTokens.length === 0) {
    return false;
  }

  return candidates.some((candidate) =>
    moduleTokens.some((token) => {
      if (!token) return false;
      return (
        candidate === token ||
        candidate.startsWith(`${token}_`) ||
        candidate.includes(`_${token}_`) ||
        candidate.includes(token)
      );
    })
  );
};

const resolveScopedTables = (
  tables: any[],
  verticalId: string,
  moduleId: string,
  moduleOption?: any
): any[] => {
  const strictMatches = filterTablesBySelection(tables, verticalId, moduleId);
  if (strictMatches.length > 0) {
    return strictMatches;
  }

  const anyMetadataPresent = tables.some((table) => hasScopeMetadata(table));
  const moduleTokens = buildModuleTokens(moduleOption, moduleId);

  // If payload has partial metadata but strict matching still missed (e.g., module serialized inconsistently),
  // fall back to module token matching before giving up.
  const moduleFallbackMatches = tables.filter((table) =>
    tableMatchesModuleHeuristic(table, moduleId, moduleTokens)
  );

  if (anyMetadataPresent) {
    return moduleFallbackMatches;
  }

  return moduleFallbackMatches;
};

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

  const availableTables = useSignal<any[]>([]);
  const tableFields = useSignal<any[]>([]);
  const selectedTable = useSignal('');
  const previewData = useSignal<any>(null);
  const loading = useSignal(false);
  const error = useSignal((initialData.value as any).error || '');
  const showSaveModal = useSignal(false);
  const currentStep = useSignal(1);
  const draggedFieldIndex = useSignal<number | null>(null);
  const fieldSearch = useSignal('');
  const showSelectedFieldsOnly = useSignal(false);
  const filterFieldName = useSignal('');
  const filterOperatorValue = useSignal<FilterOperator>('eq');
  const filterValueInput = useSignal('');
  const filterLogicalOp = useSignal<LogicalOperator>('AND');
  const sortFieldName = useSignal('');
  const sortDirection = useSignal<'ASC' | 'DESC'>('ASC');
  const groupByFieldName = useSignal('');
  const previewLimit = useSignal('100');

  // Business vertical and module data
  const availableVerticals = useSignal<any[]>([]);
  const availableModules = useSignal<any[]>([]);
  const selectedVertical = useSignal('');
  const selectedModule = useSignal('');
  const loadingModalData = useSignal(false);

  const clearSelectedDataSource = $(() => {
    selectedTable.value = '';
    tableFields.value = [];
    reportConfig.data_sources = [];
    reportConfig.fields = [];
    reportConfig.filters = [];
  });

  const loadScopedTables = $(async (verticalId?: string, moduleId?: string) => {
    const normalizedVerticalId = String(verticalId || '').trim();
    const normalizedModuleId = String(moduleId || '').trim();

    if (!normalizedVerticalId || !normalizedModuleId) {
      availableTables.value = [];
      await clearSelectedDataSource();
      return;
    }

    try {
      const response: any = await analyticsService.getFormTables({
        business_vertical_id: normalizedVerticalId,
        vertical_id: normalizedVerticalId,
        module_id: normalizedModuleId,
      });

      let tables = response?.tables || [];
      if (tables.length === 0) {
        const fallbackResponse: any = await analyticsService.getFormTables();
        tables = fallbackResponse?.tables || [];
      }

      const selectedModuleOption = availableModules.value.find((m: any) => {
        const candidateId = String(m?.id || m?.module_id || '').trim();
        return candidateId === normalizedModuleId;
      });

      availableTables.value = resolveScopedTables(
        tables,
        normalizedVerticalId,
        normalizedModuleId,
        selectedModuleOption
      );
      await clearSelectedDataSource();
    } catch (err: any) {
      console.error('Failed to load scoped data sources:', err);
      availableTables.value = [];
      await clearSelectedDataSource();
      error.value = err?.message || 'Failed to load data sources for selected business vertical and module.';
    }
  });

  // Report access / visibility
  const isPublic = useSignal(false);
  const allowedRoles = useSignal<string[]>([]);
  const roleScope = useSignal<'selected_vertical' | 'all_verticals'>('selected_vertical');
  const availableRoles = useSignal<RoleOption[]>([]);

  // KPI configuration state (enterprise metric definition)
  const kpiMetricField = useSignal('');
  const kpiAggregation = useSignal<KpiAggregation>('COUNT');
  const kpiGroupByField = useSignal('');
  const kpiTargetValue = useSignal('');
  const kpiComparisonMode = useSignal<'none' | 'previous_period' | 'same_period_last_month'>('none');

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
    const keys = ['business_vertical_id', 'business_id', 'active_business_id', 'ugcl_current_business_vertical'];
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

  const loadBuilderScopeData = $(async () => {
    loadingModalData.value = true;
    try {
      const verticals = await getBusinessVerticalsServer();
      availableVerticals.value = verticals;

      const activeVerticalId = await getActiveBusinessId();
      if (!selectedVertical.value && activeVerticalId && verticals.some((v: any) => String(v.id || v.vertical_id) === String(activeVerticalId))) {
        selectedVertical.value = activeVerticalId;
      }

      if (!selectedVertical.value && verticals.length === 1) {
        selectedVertical.value = verticals[0].id || verticals[0].vertical_id;
      }

      if (selectedVertical.value) {
        const modules = await getModulesServer(selectedVertical.value);
        availableModules.value = modules;
      } else {
        availableModules.value = [];
      }
    } catch (err: any) {
      console.error('Failed to load builder scope data:', err);
    } finally {
      loadingModalData.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadBuilderScopeData();
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
      const response: any = await analyticsService.getTableFields(tableName);
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

      if (reportConfig.report_type === 'kpi') {
        if (!kpiMetricField.value) {
          kpiMetricField.value = fieldName;
        }
        ensureKpiConfigDefaults();
      }
    }
  });

  const removeField = $((index: number) => {
    const removedField = (reportConfig.fields || [])[index] as any;
    reportConfig.fields = (reportConfig.fields || []).filter((_, i) => i !== index);

    if (removedField?.field_name && kpiMetricField.value === removedField.field_name) {
      kpiMetricField.value = (reportConfig.fields || [])[0]?.field_name || '';
    }
    if (removedField?.field_name && kpiGroupByField.value === removedField.field_name) {
      kpiGroupByField.value = '';
    }

    if (reportConfig.report_type === 'kpi') {
      ensureKpiConfigDefaults();
    }
  });

  const toggleFieldSelection = $((field: any) => {
    const fieldName = field.column_name || field.id || field.name;
    const selectedIndex = (reportConfig.fields || []).findIndex((item: any) => item.field_name === fieldName);

    if (selectedIndex >= 0) {
      removeField(selectedIndex);
      return;
    }

    addField(field);
  });

  const moveField = $((fromIndex: number, toIndex: number) => {
    const fields = [...(reportConfig.fields || [])];
    const [movedField] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, movedField);
    fields.forEach((f, i) => f.order = i + 1);
    reportConfig.fields = fields;
  });

  const addFilter = $((fieldName: string, operator: FilterOperator, value: any, logicalOp: LogicalOperator = 'AND') => {
    reportConfig.filters = [...(reportConfig.filters || []), {
      field_name: fieldName,
      data_source: 'data',
      operator,
      value,
      logical_op: logicalOp
    }];
  });

  const removeFilter = $((index: number) => {
    reportConfig.filters = (reportConfig.filters || []).filter((_, i) => i !== index);
  });

  const addSort = $((fieldName: string, direction: 'ASC' | 'DESC') => {
    if (!fieldName) return;
    const existing = reportConfig.sorting || [];
    const already = existing.find((item: any) => item.field_name === fieldName);
    if (already) {
      already.direction = direction;
      reportConfig.sorting = [...existing].map((item: any, index: number) => ({
        ...item,
        order: index + 1,
      }));
      return;
    }

    reportConfig.sorting = [
      ...existing,
      {
        field_name: fieldName,
        data_source: 'data',
        direction,
        order: existing.length + 1,
      },
    ];
  });

  const removeSort = $((index: number) => {
    reportConfig.sorting = (reportConfig.sorting || [])
      .filter((_, i) => i !== index)
      .map((item: any, nextIndex: number) => ({
        ...item,
        order: nextIndex + 1,
      }));
  });

  const addGroupBy = $((fieldName: string) => {
    if (!fieldName) return;
    const existing = (reportConfig as any).groupings || [];
    const already = existing.some((item: any) => item.field_name === fieldName);
    if (already) return;

    (reportConfig as any).groupings = [
      ...existing,
      {
        field_name: fieldName,
        data_source: 'data',
        order: existing.length + 1,
      },
    ];
  });

  const removeGroupBy = $((index: number) => {
    (reportConfig as any).groupings = ((reportConfig as any).groupings || [])
      .filter((_: any, i: number) => i !== index)
      .map((item: any, nextIndex: number) => ({
        ...item,
        order: nextIndex + 1,
      }));
  });

  const selectedFilterFieldType = (() => {
    if (!filterFieldName.value) return 'text';

    const selected = (reportConfig.fields || []).find(
      (field: any) => field.field_name === filterFieldName.value
    );
    if (selected?.data_type) return String(selected.data_type);

    const source = (tableFields.value || []).find(
      (field: any) =>
        String(field.column_name || field.id || field.name || '') === String(filterFieldName.value)
    );

    return String(source?.dataType || source?.data_type || source?.type || 'text');
  })();

  const selectedFilterOperators: FilterOperator[] = isBooleanFieldType(selectedFilterFieldType)
    ? ['eq', 'ne']
    : isDateLikeFieldType(selectedFilterFieldType)
      ? ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'this_week', 'this_month', 'this_year', 'last_week', 'last_month', 'last_year']
      : isNumericFieldType(selectedFilterFieldType)
        ? ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'in']
        : ['eq', 'ne', 'like', 'in'];

  const requiresFilterValue = (operator: FilterOperator): boolean => {
    return !['this_week', 'this_month', 'this_year', 'last_week', 'last_month', 'last_year'].includes(operator);
  };

  const addFilterFromInputs = $(async () => {
    const field = filterFieldName.value;
    const operator = filterOperatorValue.value;
    const needValue = !['this_week', 'this_month', 'this_year', 'last_week', 'last_month', 'last_year'].includes(operator);

    if (!field || !operator) return;
    const trimmed = String(filterValueInput.value || '').trim();
    if (needValue && !trimmed) return;

    let parsedValue: any = trimmed;
    if (operator === 'in') {
      parsedValue = trimmed
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (operator === 'between') {
      parsedValue = trimmed
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 2);
    }

    addFilter(field, operator, parsedValue, filterLogicalOp.value);
    filterValueInput.value = '';
  });

  const applyKpiConfiguration = $(() => {
    if (reportConfig.report_type !== 'kpi') {
      return;
    }

    const metricFieldName = kpiMetricField.value;
    if (!metricFieldName) {
      return;
    }

    const groupByFieldName = kpiGroupByField.value;
    const shouldBreakout = !!groupByFieldName && groupByFieldName !== metricFieldName;

    const nextFields = [...(reportConfig.fields || [])].map((field: any, index: number) => {
      const isMetric = field.field_name === metricFieldName;
      const isGroupBy = shouldBreakout && field.field_name === groupByFieldName;

      return {
        ...field,
        aggregation: isMetric ? kpiAggregation.value : '',
        is_visible: isMetric || isGroupBy,
        order: index + 1,
      };
    });

    reportConfig.fields = nextFields;
    reportConfig.aggregations = [];

    reportConfig.groupings = shouldBreakout
      ? [{ field_name: groupByFieldName, data_source: 'data', order: 1 }]
      : [];

    reportConfig.sorting = shouldBreakout
      ? [{ field_name: metricFieldName, data_source: 'data', direction: 'DESC', order: 1 }]
      : [];

    reportConfig.chart_config = {
      ...(reportConfig.chart_config || {}),
      kpi: {
        metric_field: metricFieldName,
        aggregation: kpiAggregation.value,
        breakout_field: shouldBreakout ? groupByFieldName : '',
        target: kpiTargetValue.value ? Number(kpiTargetValue.value) : undefined,
        comparison_mode: kpiComparisonMode.value,
      },
    };
  });

  const ensureKpiConfigDefaults = $(() => {
    if (reportConfig.report_type !== 'kpi') {
      return;
    }

    const fields = reportConfig.fields || [];
    if (!kpiMetricField.value && fields.length > 0) {
      kpiMetricField.value = fields[0].field_name;
    }

    if (kpiGroupByField.value && kpiGroupByField.value === kpiMetricField.value) {
      kpiGroupByField.value = '';
    }

    applyKpiConfiguration();
  });

  const validateKpiConfiguration = $(() => {
    if (reportConfig.report_type !== 'kpi') {
      return true;
    }

    if (!kpiMetricField.value) {
      error.value = 'For KPI Dashboard, select a metric field.';
      return false;
    }

    const metric = (reportConfig.fields || []).find((field: any) => field.field_name === kpiMetricField.value);
    if (!metric) {
      error.value = 'Selected KPI metric field is not available. Please reselect.';
      return false;
    }

    if (!metric.aggregation) {
      error.value = 'KPI aggregation is required (COUNT/SUM/AVG/MIN/MAX).';
      return false;
    }

    return true;
  });

  const handlePreview = $(async () => {
    if (!reportConfig.fields || reportConfig.fields.length === 0) {
      error.value = 'Please select at least one field';
      return;
    }

    if (!(await validateKpiConfiguration())) {
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

      const parsedLimit = Math.max(1, parseInt(previewLimit.value || '100', 10) || 100);
      const executeResponse = await analyticsService.executeReport(reportId, undefined, {
        page: 1,
        page_size: parsedLimit,
      });
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

    await ensureKpiConfigDefaults();
    if (!(await validateKpiConfiguration())) {
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
      nav(`/analytics/reports/view/${response.report.id}`);
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

      {/* Quick Configuration Panel */}
      <div class="bg-white border-b border-gray-200">
        <div class="container mx-auto px-4 py-5">
          <div class="grid grid-cols-12 gap-4 items-end">
            <div class="col-span-3">
              <FormField id="builder-business-vertical" label="Business Vertical" required>
                <select
                  id="builder-business-vertical"
                  class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                  value={selectedVertical.value}
                  onChange$={async (e: any) => {
                    selectedVertical.value = e.target.value;
                    selectedModule.value = '';
                    availableModules.value = selectedVertical.value
                      ? await getModulesServer(selectedVertical.value)
                      : [];
                    await clearSelectedDataSource();
                    availableTables.value = [];
                  }}
                  disabled={loadingModalData.value}
                >
                  <option value="">Select vertical...</option>
                  {availableVerticals.value.map((v: any) => (
                    <option key={v.id || v.vertical_id} value={v.id || v.vertical_id}>
                      {v.name || v.vertical_name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div class="col-span-3">
              <FormField id="builder-module" label="Module" required>
                <select
                  id="builder-module"
                  class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                  value={selectedModule.value}
                  onChange$={async (e: any) => {
                    selectedModule.value = e.target.value;
                    await loadScopedTables(selectedVertical.value, selectedModule.value);
                  }}
                  disabled={loadingModalData.value || !selectedVertical.value}
                >
                  <option value="">Select module...</option>
                  {availableModules.value.map((m: any) => (
                    <option key={m.id || m.module_id} value={m.id || m.module_id}>
                      {m.name || m.module_name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div class="col-span-3">
              <label class="block text-xs font-medium text-gray-700 mb-1.5">Data Source</label>
              <select
                class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                onChange$={(e: any) => {
                  const table = availableTables.value.find((t: any) => t.table_name === e.target.value);
                  if (table) {
                    handleTableSelect(table.table_name, table.form_code, table.form_id);
                  }
                }}
                disabled={!selectedVertical.value || !selectedModule.value || availableTables.value.length === 0}
              >
                <option value="">
                  {!selectedVertical.value || !selectedModule.value
                    ? 'Select vertical & module...'
                    : 'Select data source...'}
                </option>
                {availableTables.value.map((table: any) => (
                  <option key={table.table_name} value={table.table_name}>
                    {table.form_title}
                  </option>
                ))}
              </select>
            </div>

            <div class="col-span-3">
              <FormField id="report-builder-type" label="Visualization Type">
                <select
                  id="report-builder-type"
                  class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-sm"
                  value={reportConfig.report_type}
                  onChange$={(e: any) => {
                    reportConfig.report_type = e.target.value;
                    currentStep.value = 3;
                    if (reportConfig.report_type === 'kpi') {
                      ensureKpiConfigDefaults();
                    }
                  }}
                >
                  <option value="table">Table Report</option>
                  <option value="chart">Chart Visualization</option>
                  <option value="kpi">KPI Dashboard</option>
                </select>
              </FormField>
            </div>
          </div>

          {selectedVertical.value && selectedModule.value && availableTables.value.length === 0 && (
            <div class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              No data sources found for the selected business vertical and module.
            </div>
          )}
          {selectedTable.value && (
            <div class="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 flex items-center gap-2">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Connected: {selectedTable.value}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 gap-6 xl:grid-cols-10">
          <div class="space-y-6 xl:col-span-3 xl:col-start-8 xl:row-start-1">
            {reportConfig.report_type !== 'table' ? (
              <div class="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden h-full">
                <div class={`p-6 border-b ${reportConfig.report_type === 'chart' ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <h3 class="text-xl font-bold text-gray-900">Visualization Settings</h3>
                  <p class="text-sm text-gray-600 mt-1">
                    {reportConfig.report_type === 'chart' ? 'Chart settings' : 'KPI configuration'}
                  </p>
                </div>

                {reportConfig.report_type === 'chart' && (
                  <div class="p-6">
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
                          class="text-xs"
                        >
                          <i class={`${chart.icon} h-4 w-4 inline-block`} aria-hidden="true"></i>
                          <div class="text-[10px] font-medium mt-1">{chart.label}</div>
                        </Btn>
                      ))}
                    </div>
                  </div>
                )}

                {reportConfig.report_type === 'kpi' && (
                  <div class="p-6 space-y-3">
                    <FormField id="report-builder-kpi-metric-field" label="Metric Field" required>
                      <select
                        id="report-builder-kpi-metric-field"
                        class="w-full px-3 py-2 border border-emerald-200 rounded-lg bg-white text-sm"
                        value={kpiMetricField.value}
                        onChange$={async (e: any) => {
                          kpiMetricField.value = e.target.value;
                          await applyKpiConfiguration();
                        }}
                      >
                        <option value="">Select field...</option>
                        {(reportConfig.fields || [])
                          .filter((field: any) => isNumericFieldType(field.data_type))
                          .map((field: any) => (
                            <option key={field.field_name} value={field.field_name}>
                              {field.alias || field.field_name}
                            </option>
                          ))}
                      </select>
                    </FormField>

                    <FormField id="report-builder-kpi-aggregation" label="Aggregation" required>
                      <select
                        id="report-builder-kpi-aggregation"
                        class="w-full px-3 py-2 border border-emerald-200 rounded-lg bg-white text-sm"
                        value={kpiAggregation.value}
                        onChange$={async (e: any) => {
                          kpiAggregation.value = e.target.value as KpiAggregation;
                          await applyKpiConfiguration();
                        }}
                      >
                        {KPI_AGGREGATIONS.map((agg) => (
                          <option key={agg} value={agg}>{agg}</option>
                        ))}
                      </select>
                    </FormField>

                    <FormField id="report-builder-kpi-breakout" label="Breakout (Optional)">
                      <select
                        id="report-builder-kpi-breakout"
                        class="w-full px-3 py-2 border border-emerald-200 rounded-lg bg-white text-sm"
                        value={kpiGroupByField.value}
                        onChange$={async (e: any) => {
                          kpiGroupByField.value = e.target.value;
                          await applyKpiConfiguration();
                        }}
                      >
                        <option value="">Single card</option>
                        {(reportConfig.fields || [])
                          .filter((field: any) => field.field_name !== kpiMetricField.value)
                          .map((field: any) => (
                            <option key={field.field_name} value={field.field_name}>
                              {field.alias || field.field_name}
                            </option>
                          ))}
                      </select>
                    </FormField>

                    <div class="grid grid-cols-2 gap-3">
                      <FormField id="report-builder-kpi-target" label="Target">
                        <input
                          id="report-builder-kpi-target"
                          type="number"
                          class="w-full px-3 py-2 border border-emerald-200 rounded-lg bg-white text-sm"
                          value={kpiTargetValue.value}
                          onInput$={async (e: any) => {
                            kpiTargetValue.value = e.target.value;
                            await applyKpiConfiguration();
                          }}
                          placeholder="e.g. 100"
                        />
                      </FormField>

                      <FormField id="report-builder-kpi-compare" label="Compare">
                        <select
                          id="report-builder-kpi-compare"
                          class="w-full px-3 py-2 border border-emerald-200 rounded-lg bg-white text-sm"
                          value={kpiComparisonMode.value}
                          onChange$={async (e: any) => {
                            kpiComparisonMode.value = e.target.value;
                            await applyKpiConfiguration();
                          }}
                        >
                          <option value="none">None</option>
                          <option value="previous_period">Prev period</option>
                          <option value="same_period_last_month">Last month</option>
                        </select>
                      </FormField>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div class="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div class="p-6 bg-gray-50 border-b border-gray-200">
                  <h3 class="text-xl font-bold text-gray-900">Visualization Settings</h3>
                  <p class="text-sm text-gray-600 mt-1">Table reports do not require extra chart or KPI configuration.</p>
                </div>
              </div>
            )}
          </div>

          <div class="space-y-6 xl:col-span-4 xl:col-start-4 xl:row-start-1">
            <div class="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div class="p-6 bg-indigo-50 border-b border-indigo-200">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-xl font-bold text-gray-900">Fields</h3>
                    <p class="text-sm text-gray-600 mt-1">Selected fields stay white. Unselected fields are muted. Edit the display name directly on selected rows.</p>
                  </div>
                  <Badge variant="info" class="px-3 py-1 text-sm">
                    {(reportConfig.fields || []).length} fields
                  </Badge>
                </div>
              </div>
              <div class="p-6">
                {!selectedTable.value ? (
                  <div class="text-center py-16">
                    <h4 class="text-xl font-semibold text-gray-700 mb-2">No data source selected</h4>
                    <p class="text-gray-500">Choose a data source above to load its fields.</p>
                  </div>
                ) : tableFields.value.length === 0 ? (
                  <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    No fields found for the selected table. The table may be missing in the database or has no readable columns.
                  </div>
                ) : (
                  <div class="space-y-4">
                    <div class="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
                      <input
                        id="report-builder-field-search"
                        type="text"
                        value={fieldSearch.value}
                        onInput$={(e: any) => {
                          fieldSearch.value = e.target.value;
                        }}
                        class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 md:max-w-sm"
                        placeholder="Search fields by label, name, or type"
                      />
                      <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={showSelectedFieldsOnly.value}
                          onChange$={(e: any) => {
                            showSelectedFieldsOnly.value = !!e.target.checked;
                          }}
                          class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Show selected only
                      </label>
                    </div>

                    <div class="space-y-3">
                      {[...tableFields.value]
                        .filter((field: any) => {
                          const fieldKey = String(field.column_name || field.id || field.name || '');
                          const fieldLabel = String(field.label || field.name || field.column_name || '');
                          const fieldType = String(field.dataType || field.data_type || field.type || 'text');
                          const selected = (reportConfig.fields || []).some((item: any) => item.field_name === fieldKey);
                          const query = fieldSearch.value.trim().toLowerCase();

                          if (showSelectedFieldsOnly.value && !selected) {
                            return false;
                          }

                          if (!query) {
                            return true;
                          }

                          return [fieldKey, fieldLabel, fieldType].some((value) => value.toLowerCase().includes(query));
                        })
                        .sort((left: any, right: any) => {
                          const leftKey = String(left.column_name || left.id || left.name || '');
                          const rightKey = String(right.column_name || right.id || right.name || '');
                          const leftSelected = (reportConfig.fields || []).some((item: any) => item.field_name === leftKey);
                          const rightSelected = (reportConfig.fields || []).some((item: any) => item.field_name === rightKey);

                          if (leftSelected !== rightSelected) {
                            return leftSelected ? -1 : 1;
                          }

                          const leftIndex = (reportConfig.fields || []).findIndex((item: any) => item.field_name === leftKey);
                          const rightIndex = (reportConfig.fields || []).findIndex((item: any) => item.field_name === rightKey);

                          if (leftSelected && rightSelected && leftIndex !== rightIndex) {
                            return leftIndex - rightIndex;
                          }

                          const leftLabel = String(left.label || left.name || left.column_name || '').toLowerCase();
                          const rightLabel = String(right.label || right.name || right.column_name || '').toLowerCase();
                          return leftLabel.localeCompare(rightLabel);
                        })
                        .map((field: any) => {
                          const fieldKey = field.column_name || field.id || field.name;
                          const fieldLabel = field.label || field.name || field.column_name;
                          const fieldType = field.dataType || field.data_type || field.type || 'text';
                          const selectedIndex = (reportConfig.fields || []).findIndex((item: any) => item.field_name === fieldKey);
                          const selectedField = selectedIndex >= 0 ? (reportConfig.fields || [])[selectedIndex] : null;

                          return (
                            <div
                              key={fieldKey}
                              draggable={selectedIndex >= 0}
                              onDragStart$={() => {
                                if (selectedIndex >= 0) {
                                  draggedFieldIndex.value = selectedIndex;
                                }
                              }}
                              onDragOver$={(e: DragEvent) => {
                                if (selectedIndex >= 0) {
                                  e.preventDefault();
                                }
                              }}
                              onDrop$={() => {
                                if (
                                  selectedIndex >= 0 &&
                                  draggedFieldIndex.value !== null &&
                                  draggedFieldIndex.value !== selectedIndex
                                ) {
                                  moveField(draggedFieldIndex.value, selectedIndex);
                                  draggedFieldIndex.value = null;
                                }
                              }}
                              class={`rounded-xl border transition-all ${
                                selectedIndex >= 0
                                  ? 'border-gray-200 bg-white shadow-sm'
                                  : 'border-gray-200 bg-gray-100/70'
                              } ${draggedFieldIndex.value === selectedIndex ? 'opacity-60' : ''}`}
                            >
                              <div class="flex items-start gap-3 p-3">
                                <button
                                  type="button"
                                  class={`mt-0.5 h-4 w-4 rounded border transition-colors ${
                                    selectedIndex >= 0
                                      ? 'border-indigo-600 bg-indigo-600'
                                      : 'border-gray-300 bg-white'
                                  }`}
                                  onClick$={() => toggleFieldSelection(field)}
                                  aria-label={selectedIndex >= 0 ? `Remove ${fieldLabel}` : `Add ${fieldLabel}`}
                                >
                                  {selectedIndex >= 0 && <span class="block text-[10px] leading-3 text-white">✓</span>}
                                </button>

                                <div class="flex-1 min-w-0">
                                  <div class="flex items-start justify-between gap-2">
                                    <div class="min-w-0">
                                      {selectedIndex >= 0 && selectedField ? (
                                        <input
                                          id={`report-builder-field-alias-${selectedIndex}`}
                                          type="text"
                                          value={selectedField.alias}
                                          onInput$={(e: any) => {
                                            (reportConfig.fields || [])[selectedIndex].alias = e.target.value;
                                          }}
                                          class="w-full border-0 bg-transparent p-0 text-sm font-medium text-gray-900 focus:outline-none focus:ring-0"
                                          placeholder={fieldLabel}
                                        />
                                      ) : (
                                        <div class="truncate text-sm font-medium text-gray-600">
                                          {fieldLabel}
                                        </div>
                                      )}
                                      <div class="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                                        <span>{fieldKey}</span>
                                        <span class="uppercase tracking-wide">{fieldType}</span>
                                        {selectedField?.aggregation && (
                                          <Badge variant="info" class="text-[10px] px-2 py-0.5">{selectedField.aggregation}</Badge>
                                        )}
                                        {selectedField?.is_visible === false && (
                                          <Badge variant="neutral" class="text-[10px] px-2 py-0.5">Hidden</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      class={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                        selectedIndex >= 0
                                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                      }`}
                                      onClick$={() => toggleFieldSelection(field)}
                                    >
                                      {selectedIndex >= 0 ? 'Selected' : 'Select'}
                                    </button>
                                  </div>

                                  {selectedIndex >= 0 && selectedField && (
                                    <div class="mt-1 min-w-0 text-[11px] text-gray-500 md:text-right">
                                      <span class="font-medium text-gray-600">Field Name:</span> {selectedField.field_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div class="space-y-6 xl:col-span-3 xl:col-start-1 xl:row-start-1">
              <div class="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden h-full">
                <div class="p-6 bg-cyan-50 border-b border-cyan-200">
                  <h3 class="text-xl font-bold text-gray-900">Filters <span class="text-sm font-normal text-gray-600">(Optional)</span></h3>
                </div>
                <div class="p-6 space-y-4">
                  {(reportConfig.fields || []).length === 0 && (
                    <div class="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-800">
                      Select at least one field to add filters.
                    </div>
                  )}

                  {(reportConfig.filters || []).map((filter: any, index: number) => (
                    <div key={index} class="flex items-center gap-3 p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                      <span class="text-sm font-medium text-gray-900">
                        {filter.field_name} <span class="text-cyan-600 dark:text-cyan-400">{operatorLabelMap[filter.operator as FilterOperator] || filter.operator}</span> {Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value ?? '')}
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

                  <div class="flex flex-wrap items-end gap-2 rounded-xl border border-cyan-200 bg-white p-3">
                    <FormField id="filter-field" label="Field" class="mb-0 min-w-[170px] flex-1">
                      <select
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                        id="filter-field"
                        value={filterFieldName.value}
                        onChange$={(e: any) => {
                          filterFieldName.value = e.target.value;
                          const selectedFieldName = e.target.value;
                          const selectedField = (reportConfig.fields || []).find(
                            (field: any) => field.field_name === selectedFieldName
                          );
                          const sourceField = (tableFields.value || []).find(
                            (field: any) =>
                              String(field.column_name || field.id || field.name || '') === String(selectedFieldName)
                          );
                          const nextFieldType = String(
                            selectedField?.data_type ||
                              sourceField?.dataType ||
                              sourceField?.data_type ||
                              sourceField?.type ||
                              'text'
                          );

                          const options: FilterOperator[] = isBooleanFieldType(nextFieldType)
                            ? ['eq', 'ne']
                            : isDateLikeFieldType(nextFieldType)
                              ? ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'this_week', 'this_month', 'this_year', 'last_week', 'last_month', 'last_year']
                              : isNumericFieldType(nextFieldType)
                                ? ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'in']
                                : ['eq', 'ne', 'like', 'in'];

                          if (!options.includes(filterOperatorValue.value)) {
                            filterOperatorValue.value = options[0];
                          }
                        }}
                        disabled={(reportConfig.fields || []).length === 0}
                      >
                        <option value="">Select field...</option>
                        {(reportConfig.fields || []).map((field: any) => (
                          <option key={field.field_name} value={field.field_name}>
                            {field.alias}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField id="filter-operator" label="Operator" class="mb-0 min-w-[170px]">
                      <select
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                        id="filter-operator"
                        value={filterOperatorValue.value}
                        onChange$={(e: any) => {
                          filterOperatorValue.value = e.target.value as FilterOperator;
                        }}
                        disabled={(reportConfig.fields || []).length === 0}
                      >
                        {selectedFilterOperators.map((operator) => (
                          <option key={operator} value={operator}>
                            {operatorLabelMap[operator]}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField id="filter-logical" label="Join" class="mb-0 min-w-[120px]">
                      <select
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                        id="filter-logical"
                        value={filterLogicalOp.value}
                        onChange$={(e: any) => {
                          filterLogicalOp.value = e.target.value as LogicalOperator;
                        }}
                        disabled={(reportConfig.fields || []).length === 0}
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    </FormField>
                    <FormField id="filter-value" label="Value" class="mb-0 min-w-[200px] flex-1">
                      <input
                        type="text"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                        id="filter-value"
                        value={filterValueInput.value}
                        onInput$={(e: any) => {
                          filterValueInput.value = e.target.value;
                        }}
                        placeholder={
                          filterOperatorValue.value === 'between'
                            ? 'start,end'
                            : filterOperatorValue.value === 'in'
                              ? 'a,b,c'
                              : requiresFilterValue(filterOperatorValue.value)
                                ? 'Value'
                                : 'No value needed'
                        }
                        disabled={(reportConfig.fields || []).length === 0}
                      />
                    </FormField>
                    <Btn
                      size="sm"
                      variant="primary"
                      disabled={(reportConfig.fields || []).length === 0}
                      onClick$={async () => {
                        await addFilterFromInputs();
                      }}
                      class="whitespace-nowrap"
                    >
                      Add
                    </Btn>
                  </div>

                  <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <h4 class="text-sm font-semibold text-slate-800">Query Operations</h4>

                    <div class="flex flex-wrap items-end gap-2">
                      <FormField id="query-sort-field" label="Sort Field" class="mb-0 min-w-[170px] flex-1">
                        <select
                          id="query-sort-field"
                          class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                          value={sortFieldName.value}
                          onChange$={(e: any) => {
                            sortFieldName.value = e.target.value;
                          }}
                          disabled={(reportConfig.fields || []).length === 0}
                        >
                          <option value="">Select field...</option>
                          {(reportConfig.fields || []).map((field: any) => (
                            <option key={field.field_name} value={field.field_name}>{field.alias}</option>
                          ))}
                        </select>
                      </FormField>

                      <FormField id="query-sort-direction" label="Direction" class="mb-0 min-w-[120px]">
                        <select
                          id="query-sort-direction"
                          class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                          value={sortDirection.value}
                          onChange$={(e: any) => {
                            sortDirection.value = e.target.value;
                          }}
                          disabled={(reportConfig.fields || []).length === 0}
                        >
                          <option value="ASC">ASC</option>
                          <option value="DESC">DESC</option>
                        </select>
                      </FormField>

                      <Btn
                        size="sm"
                        variant="secondary"
                        disabled={!sortFieldName.value}
                        onClick$={() => addSort(sortFieldName.value, sortDirection.value)}
                        class="whitespace-nowrap"
                      >
                        Add Sort
                      </Btn>
                    </div>

                    {(reportConfig.sorting || []).length > 0 && (
                      <div class="space-y-2">
                        {(reportConfig.sorting || []).map((sort: any, index: number) => (
                          <div key={`${sort.field_name}-${index}`} class="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                            <span>{sort.field_name} ({sort.direction})</span>
                            <Btn size="sm" variant="danger" onClick$={() => removeSort(index)}>Remove</Btn>
                          </div>
                        ))}
                      </div>
                    )}

                    <div class="flex flex-wrap items-end gap-2">
                      <FormField id="query-group-by" label="Group By" class="mb-0 min-w-[170px] flex-1">
                        <select
                          id="query-group-by"
                          class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                          value={groupByFieldName.value}
                          onChange$={(e: any) => {
                            groupByFieldName.value = e.target.value;
                          }}
                          disabled={(reportConfig.fields || []).length === 0}
                        >
                          <option value="">Select field...</option>
                          {(reportConfig.fields || []).map((field: any) => (
                            <option key={field.field_name} value={field.field_name}>{field.alias}</option>
                          ))}
                        </select>
                      </FormField>

                      <Btn
                        size="sm"
                        variant="secondary"
                        disabled={!groupByFieldName.value}
                        onClick$={() => addGroupBy(groupByFieldName.value)}
                        class="whitespace-nowrap"
                      >
                        Add Group
                      </Btn>
                    </div>

                    {((reportConfig as any).groupings || []).length > 0 && (
                      <div class="space-y-2">
                        {((reportConfig as any).groupings || []).map((group: any, index: number) => (
                          <div key={`${group.field_name}-${index}`} class="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                            <span>{group.field_name}</span>
                            <Btn size="sm" variant="danger" onClick$={() => removeGroupBy(index)}>Remove</Btn>
                          </div>
                        ))}
                      </div>
                    )}

                    <FormField id="query-preview-limit" label="Preview Row Limit" class="mb-0">
                      <input
                        id="query-preview-limit"
                        type="number"
                        min="1"
                        max="1000"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                        value={previewLimit.value}
                        onInput$={(e: any) => {
                          previewLimit.value = e.target.value;
                        }}
                        placeholder="100"
                      />
                    </FormField>
                  </div>
                </div>
              </div>
          </div>
        </div>

        {previewData.value && (
          <div class="mt-6 bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
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
                  {previewData.value.data.slice(0, 10).map((row: any, index: number) => (
                    <tr key={index} class="hover:bg-gray-50 transition-colors">
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
                      <li>
                        • Type: {
                          reportConfig.report_type === 'chart'
                            ? `${reportConfig.chart_type} chart`
                            : reportConfig.report_type === 'kpi'
                              ? `${kpiAggregation.value} of ${kpiMetricField.value || 'metric field'}`
                              : reportConfig.report_type
                        }
                      </li>
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
