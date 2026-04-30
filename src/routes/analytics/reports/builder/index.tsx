// Analytics Report Builder - Professional UI
import { component$, useSignal, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate, routeLoader$, server$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services/api-client';
import { analyticsService } from '~/services/analytics.service';
import type { ReportDefinition, FormTablesResponse, FilterOperator, LogicalOperator, ChartType } from '~/types/analytics';
import { Badge, Btn, FormField, PageHeader } from '~/components/ds';

interface PermissionOption {
  id: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
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

const CHART_TYPE_META = [
  { value: 'bar', label: 'Bar', icon: 'i-heroicons-chart-bar-solid', desc: 'Compare values across categories. Ideal for rankings or grouped comparisons.' },
  { value: 'line', label: 'Line', icon: 'i-heroicons-presentation-chart-line-solid', desc: 'Track changes and trends over time or a continuous sequence.' },
  { value: 'area', label: 'Area', icon: 'i-heroicons-chart-bar-square-solid', desc: 'Emphasise cumulative volume or filled region under a trend line.' },
  { value: 'pie', label: 'Pie', icon: 'i-heroicons-chart-pie-solid', desc: 'Show part-to-whole proportions across a small number of categories.' },
  { value: 'doughnut', label: 'Donut', icon: 'i-heroicons-circle-stack-solid', desc: 'Same as pie with a centre space for a summary value or label.' },
  { value: 'scatter', label: 'Scatter', icon: 'i-heroicons-sparkles-solid', desc: 'Reveal correlations or distribution between two numeric fields.' },
];

const SYSTEM_SCOPE_TOKENS: Record<string, string[]> = {
  documents: ['documents', 'document', 'dms'],
  projects: ['projects', 'project', 'pms', 'task', 'tasks'],
  attendance: ['attendance'],
  workflow: ['workflow', 'workflows'],
};

const dedupeTablesByName = (tables: any[]) => {
  const seen = new Set<string>();
  return tables.filter((table: any) => {
    const key = String(table?.table_name || '').trim();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const moduleMatchesSystemScope = (moduleOption: any, moduleId: string, systemScope: string): boolean => {
  const normalizedScope = normalizeScopeToken(systemScope);
  if (!normalizedScope) {
    return false;
  }

  const moduleTokens = buildModuleTokens(moduleOption, moduleId);
  const scopeTokens = SYSTEM_SCOPE_TOKENS[normalizedScope] || [normalizedScope];

  return scopeTokens.some((scopeToken) =>
    moduleTokens.some((moduleToken) =>
      moduleToken === scopeToken ||
      moduleToken.includes(scopeToken) ||
      scopeToken.includes(moduleToken)
    )
  );
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
  const systemTables = tables.filter((table: any) => !!table?.system);
  const scopedSystemTables = systemTables.filter((table: any) =>
    moduleMatchesSystemScope(moduleOption, moduleId, String(table?.system_scope || ''))
  );

  // For regular modules, exclude system data sources from the dropdown.
  const regularTables = tables.filter((table: any) => !table?.system);

  const strictMatches = filterTablesBySelection(regularTables, verticalId, moduleId);
  if (strictMatches.length > 0) {
    return dedupeTablesByName([...strictMatches, ...scopedSystemTables]);
  }

  const anyMetadataPresent = regularTables.some((table) => hasScopeMetadata(table));
  const moduleTokens = buildModuleTokens(moduleOption, moduleId);

  // If payload has partial metadata but strict matching still missed (e.g., module serialized inconsistently),
  // fall back to module token matching before giving up.
  const moduleFallbackMatches = regularTables.filter((table) =>
    tableMatchesModuleHeuristic(table, moduleId, moduleTokens)
  );

  if (anyMetadataPresent) {
    return dedupeTablesByName([...moduleFallbackMatches, ...scopedSystemTables]);
  }

  return dedupeTablesByName([...moduleFallbackMatches, ...scopedSystemTables]);
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

const getAvailablePermissionsServer = server$(async function () {
  const ssrApiClient = createSSRApiClient(this as any);
  try {
    const response: any = await ssrApiClient.get('/admin/permissions');
    const permissions = response?.permissions || response?.data || response || [];
    if (!Array.isArray(permissions)) {
      return [] as PermissionOption[];
    }

    return permissions
      .map((permission: any, index: number) => ({
        id: permission?.id || permission?.ID || `permission_${index}`,
        name:
          permission?.name ||
          (permission?.resource && permission?.action
            ? `${permission.resource}:${permission.action}`
            : ''),
        description: permission?.description,
        resource: permission?.resource,
        action: permission?.action,
      }))
      .filter((permission: PermissionOption) => !!permission.name)
      .sort((left: PermissionOption, right: PermissionOption) => left.name.localeCompare(right.name));
  } catch (error) {
    console.error('Failed to fetch available permissions:', error);
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
  const tableFieldsBySource = useStore<Record<string, any[]>>({});
  const selectedTable = useSignal('');
  const activeDataSourceAlias = useSignal('');
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

  const getModuleOptions = () => {
    return Array.isArray(availableModules.value) ? [...availableModules.value] : [];
  };

  const encodeFieldSelection = (field: any) => `${String(field?.data_source || '').trim()}::${String(field?.field_name || '').trim()}`;

  const parseFieldSelection = (value: string) => {
    const [dataSource, ...fieldParts] = String(value || '').split('::');
    return {
      dataSource: String(dataSource || '').trim(),
      fieldName: fieldParts.join('::').trim(),
    };
  };

  const getFieldOptionLabel = (field: any) => {
    const label = field.alias || field.field_name;
    return field.data_source ? `${label} [${field.data_source}]` : label;
  };

  const getFieldBySelection = (selection: string) => {
    const { dataSource, fieldName } = parseFieldSelection(selection);
    return (reportConfig.fields || []).find((field: any) =>
      String(field.field_name || '') === fieldName && String(field.data_source || '') === dataSource
    );
  };

  const clearSelectedDataSource = $(() => {
    selectedTable.value = '';
    activeDataSourceAlias.value = '';
    tableFields.value = [];
    Object.keys(tableFieldsBySource).forEach((key) => {
      delete tableFieldsBySource[key];
    });
    reportConfig.data_sources = [];
    reportConfig.fields = [];
    reportConfig.filters = [];
    reportConfig.groupings = [];
    reportConfig.sorting = [];
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
      const scopedParams: any = {
        business_vertical_id: normalizedVerticalId,
        vertical_id: normalizedVerticalId,
        module_id: normalizedModuleId,
      };

      const response: any = await analyticsService.getFormTables(scopedParams);

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
  const selectedPermissions = useSignal<string[]>([]);
  const availablePermissions = useSignal<PermissionOption[]>([]);

  // KPI configuration state (enterprise metric definition)
  const kpiMetricField = useSignal('');
  const kpiAggregation = useSignal<KpiAggregation>('COUNT');
  const kpiGroupByField = useSignal('');
  const kpiTargetValue = useSignal('');
  const kpiComparisonMode = useSignal<'none' | 'previous_period' | 'same_period_last_month'>('none');

  // Chart visualization configuration state
  const chartXAxisField = useSignal('');
  const chartXAxisLabel = useSignal('');
  const chartXAxisDateGrouping = useSignal('');
  const chartYAxisField = useSignal('');
  const chartYAxisLabel = useSignal('');
  const chartYAxisAggregate = useSignal<KpiAggregation>('SUM');
  const chartGroupByField = useSignal('');
  const chartShowLegend = useSignal(true);
  const chartLegendPosition = useSignal<'top' | 'bottom' | 'left' | 'right'>('top');
  const chartShowDataLabels = useSignal(false);
  const chartShowGridLines = useSignal(true);
  const chartStacked = useSignal(false);
  const chartStacked100 = useSignal(false);
  const chartColorPalette = useSignal('default');
  const chartCustomColors = useSignal<string[]>(['#2563eb', '#f97316', '#22c55e', '#a855f7', '#ef4444']);
  const chartTitle = useSignal('');

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
      availablePermissions.value = await getAvailablePermissionsServer();
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
    const sourceAlias = activeDataSourceAlias.value;
    if (!sourceAlias) {
      tableFields.value = [];
      return;
    }

    if (tableFieldsBySource[sourceAlias]?.length) {
      tableFields.value = tableFieldsBySource[sourceAlias];
      return;
    }

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
      tableFieldsBySource[sourceAlias] = enrichedFields;
      tableFields.value = enrichedFields;
    } catch (err: any) {
      error.value = err.message || 'Failed to load fields';
    }
  });

  const handleTableSelect = $(async (tableName: string, formCode: string, formId: string) => {
    const currentDataSources = (reportConfig.data_sources || []) as any[];
    const existingSource = currentDataSources.find((source: any) => String(source.table_name) === String(tableName));
    if (existingSource) {
      activeDataSourceAlias.value = String(existingSource.alias || '');
      selectedTable.value = tableName;
      await loadTableFields(tableName);
      currentStep.value = 2;
      return;
    }

    const normalizedAlias = String(tableName || 'source')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'source';

    const existingAliases = new Set(currentDataSources.map((source: any) => String(source.alias || '').trim()));
    let alias = normalizedAlias;
    if (existingAliases.has(alias)) {
      let counter = 2;
      while (existingAliases.has(`${normalizedAlias}_${counter}`)) {
        counter += 1;
      }
      alias = `${normalizedAlias}_${counter}`;
    }

    const nextSource: any = {
      alias,
      table_name: tableName,
      form_code: formCode,
      form_id: formId,
    };

    if (currentDataSources.length > 0) {
      nextSource.join_type = 'LEFT';
      nextSource.join_on = '';
    }

    selectedTable.value = tableName;
    activeDataSourceAlias.value = alias;
    reportConfig.data_sources = [...currentDataSources, nextSource];
    tableFields.value = [];
    await loadTableFields(tableName);
    currentStep.value = 2;
  });

  const selectDataSource = $(async (alias: string) => {
    const currentDataSources = (reportConfig.data_sources || []) as any[];
    const source = currentDataSources.find((item: any) => String(item.alias || '') === String(alias || ''));
    if (!source) {
      return;
    }
    activeDataSourceAlias.value = String(source.alias || '');
    selectedTable.value = String(source.table_name || '');
    await loadTableFields(String(source.table_name || ''));
  });

  const updateDataSourceJoin = $((alias: string, key: 'join_type' | 'join_on', value: string) => {
    const currentDataSources = (reportConfig.data_sources || []) as any[];
    reportConfig.data_sources = currentDataSources.map((source: any) =>
      String(source.alias || '') === String(alias || '')
        ? { ...source, [key]: value }
        : source
    );
  });

  const removeDataSource = $(async (alias: string) => {
    const currentDataSources = (reportConfig.data_sources || []) as any[];
    const remainingSources = currentDataSources.filter((source: any) => String(source.alias || '') !== String(alias || ''));
    reportConfig.data_sources = remainingSources;
    reportConfig.fields = (reportConfig.fields || []).filter((field: any) => String(field.data_source || '') !== String(alias || ''));
    reportConfig.filters = (reportConfig.filters || []).filter((filter: any) => String(filter.data_source || '') !== String(alias || ''));
    reportConfig.sorting = (reportConfig.sorting || []).filter((item: any) => String(item.data_source || '') !== String(alias || ''));
    reportConfig.groupings = (reportConfig.groupings || []).filter((item: any) => String(item.data_source || '') !== String(alias || ''));
    delete tableFieldsBySource[alias];

    if (activeDataSourceAlias.value === alias) {
      const nextAlias = String(remainingSources[0]?.alias || '');
      activeDataSourceAlias.value = nextAlias;
      selectedTable.value = String(remainingSources[0]?.table_name || '');
      if (nextAlias && selectedTable.value) {
        await loadTableFields(selectedTable.value);
      } else {
        tableFields.value = [];
      }
    }

    if (remainingSources.length === 0) {
      selectedTable.value = '';
      tableFields.value = [];
      currentStep.value = 1;
    }
  });

  const WORKFLOW_TIMELINE_FIELDS = [
    'current_state',
    'wf_last_action',
    'wf_last_action_by',
    'wf_last_action_at',
    'wf_last_comment',
  ];

  const addField = $((field: any) => {
    const currentDataSources = (reportConfig.data_sources || []) as any[];
    const sourceAlias = activeDataSourceAlias.value || String(currentDataSources[0]?.alias || '').trim();
    if (!sourceAlias) {
      error.value = 'Select a data source before adding fields.';
      return;
    }

    // Always use column_name from form schema (backend ensures it's the actual database column)
    // Fall back to id/name only if column_name not available (for legacy db_fields)
    const fieldName = field.column_name || field.id || field.name;
    const fieldLabel = field.label || field.name || field.column_name;
    const fieldType = field.dataType || field.data_type || field.type || 'text';

    const exists = reportConfig.fields?.some(f => f.field_name === fieldName && f.data_source === sourceAlias);
    if (!exists) {
      const fieldEntry: any = {
        field_name: fieldName,
        alias: fieldLabel.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        data_source: sourceAlias,
        data_type: fieldType,
        is_visible: true,
        order: (reportConfig.fields?.length || 0) + 1,
      };
      if (field.apiEndpoint) {
        fieldEntry.options_source = field.apiEndpoint;
      }
      reportConfig.fields = [...(reportConfig.fields || []), fieldEntry];

      if (WORKFLOW_TIMELINE_FIELDS.includes(String(fieldName || ''))) {
        const alreadySelected = (reportConfig.fields || []).some((item: any) => item.field_name === 'submission_id');
        if (!alreadySelected) {
          const submissionField = (tableFields.value || []).find((item: any) =>
            String(item.column_name || item.id || item.name || '') === 'submission_id'
          );
          if (submissionField) {
            const submissionFieldLabel = submissionField.label || submissionField.name || submissionField.column_name;
            const submissionFieldType = submissionField.dataType || submissionField.data_type || submissionField.type || 'text';
            reportConfig.fields = [
              ...(reportConfig.fields || []),
              {
                field_name: 'submission_id',
                alias: String(submissionFieldLabel || 'Submission ID').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                data_source: sourceAlias,
                data_type: submissionFieldType,
                is_visible: true,
                order: (reportConfig.fields?.length || 0) + 1,
              },
            ];
          }
        }
      }

      if (reportConfig.report_type === 'kpi') {
        if (!kpiMetricField.value) {
          kpiMetricField.value = `${sourceAlias}::${fieldName}`;
        }
        ensureKpiConfigDefaults();
      }
    }
  });

  const removeField = $((index: number) => {
    const removedField = (reportConfig.fields || [])[index] as any;

    const hasWorkflowTimelineSelection = (reportConfig.fields || []).some((field: any) =>
      WORKFLOW_TIMELINE_FIELDS.includes(String(field.field_name || ''))
    );

    if (removedField?.field_name === 'submission_id' && hasWorkflowTimelineSelection) {
      error.value = 'Submission ID is required for workflow timeline drill-down. Remove workflow status fields first if you do not need the timeline.';
      return;
    }

    reportConfig.fields = (reportConfig.fields || []).filter((_, i) => i !== index);

    if (removedField?.field_name && removedField?.data_source && kpiMetricField.value === `${removedField.data_source}::${removedField.field_name}`) {
      const nextField = (reportConfig.fields || [])[0] as any;
      kpiMetricField.value = nextField ? `${nextField.data_source}::${nextField.field_name}` : '';
    }
    if (removedField?.field_name && removedField?.data_source && kpiGroupByField.value === `${removedField.data_source}::${removedField.field_name}`) {
      kpiGroupByField.value = '';
    }

    if (reportConfig.report_type === 'kpi') {
      ensureKpiConfigDefaults();
    }
  });

  const toggleFieldSelection = $((field: any) => {
    const fieldName = field.column_name || field.id || field.name;
    const currentDataSources = (reportConfig.data_sources || []) as any[];
    const sourceAlias = activeDataSourceAlias.value || String(currentDataSources[0]?.alias || '').trim();
    const selectedIndex = (reportConfig.fields || []).findIndex((item: any) => item.field_name === fieldName && item.data_source === sourceAlias);

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

  const addFilter = $((fieldSelection: string, operator: FilterOperator, value: any, logicalOp: LogicalOperator = 'AND') => {
    const [dataSourcePart, ...fieldParts] = String(fieldSelection || '').split('::');
    const dataSource = String(dataSourcePart || '').trim();
    const fieldName = fieldParts.join('::').trim();
    reportConfig.filters = [...(reportConfig.filters || []), {
      field_name: fieldName,
      data_source: dataSource,
      operator,
      value,
      logical_op: logicalOp
    }];
  });

  const removeFilter = $((index: number) => {
    reportConfig.filters = (reportConfig.filters || []).filter((_, i) => i !== index);
  });

  const addSort = $((fieldSelection: string, direction: 'ASC' | 'DESC') => {
    const [dataSourcePart, ...fieldParts] = String(fieldSelection || '').split('::');
    const dataSource = String(dataSourcePart || '').trim();
    const fieldName = fieldParts.join('::').trim();
    if (!fieldName || !dataSource) return;
    const existing = reportConfig.sorting || [];
    const already = existing.find((item: any) => item.field_name === fieldName && item.data_source === dataSource);
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
        data_source: dataSource,
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

  const addGroupBy = $((fieldSelection: string) => {
    const [dataSourcePart, ...fieldParts] = String(fieldSelection || '').split('::');
    const dataSource = String(dataSourcePart || '').trim();
    const fieldName = fieldParts.join('::').trim();
    if (!fieldName || !dataSource) return;
    const existing = (reportConfig as any).groupings || [];
    const already = existing.some((item: any) => item.field_name === fieldName && item.data_source === dataSource);
    if (already) return;

    (reportConfig as any).groupings = [
      ...existing,
      {
        field_name: fieldName,
        data_source: dataSource,
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

    const selected = getFieldBySelection(filterFieldName.value);
    if (selected?.data_type) return String(selected.data_type);

    const parsedSelection = parseFieldSelection(filterFieldName.value);
    const source = (tableFields.value || []).find(
      (field: any) =>
        String(field.column_name || field.id || field.name || '') === String(parsedSelection.fieldName || '')
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

    const [metricDataSourcePart, ...metricFieldParts] = String(kpiMetricField.value || '').split('::');
    const metricSelection = {
      dataSource: String(metricDataSourcePart || '').trim(),
      fieldName: metricFieldParts.join('::').trim(),
    };
    if (!metricSelection.fieldName || !metricSelection.dataSource) {
      return;
    }

    const [breakoutDataSourcePart, ...breakoutFieldParts] = String(kpiGroupByField.value || '').split('::');
    const breakoutSelection = {
      dataSource: String(breakoutDataSourcePart || '').trim(),
      fieldName: breakoutFieldParts.join('::').trim(),
    };
    const shouldBreakout = !!breakoutSelection.fieldName && (
      breakoutSelection.fieldName !== metricSelection.fieldName ||
      breakoutSelection.dataSource !== metricSelection.dataSource
    );

    const nextFields = [...(reportConfig.fields || [])].map((field: any, index: number) => {
      const isMetric = field.field_name === metricSelection.fieldName && field.data_source === metricSelection.dataSource;
      const isGroupBy = shouldBreakout && field.field_name === breakoutSelection.fieldName && field.data_source === breakoutSelection.dataSource;

      return {
        ...field,
        aggregation: isMetric ? kpiAggregation.value : '',
        is_visible: isMetric || isGroupBy,
        order: index + 1,
      };
    });

    reportConfig.fields = nextFields;
    (reportConfig as any).aggregations = [];

    (reportConfig as any).groupings = shouldBreakout
      ? [{ field_name: breakoutSelection.fieldName, data_source: breakoutSelection.dataSource, order: 1 }]
      : [];

    reportConfig.sorting = shouldBreakout
      ? [{ field_name: metricSelection.fieldName, data_source: metricSelection.dataSource, direction: 'DESC', order: 1 }]
      : [];

    reportConfig.chart_config = {
      ...(reportConfig.chart_config || {}),
      kpi: {
        metric_field: metricSelection.fieldName,
        aggregation: kpiAggregation.value,
        breakout_field: shouldBreakout ? breakoutSelection.fieldName : '',
        target: kpiTargetValue.value ? Number(kpiTargetValue.value) : undefined,
        comparison_mode: kpiComparisonMode.value,
      },
    };
  });

  const applyChartConfiguration = $(() => {
    if (reportConfig.report_type !== 'chart') return;

    const [xDataSourcePart, ...xFieldParts] = String(chartXAxisField.value || '').split('::');
    const [yDataSourcePart, ...yFieldParts] = String(chartYAxisField.value || '').split('::');
    const [groupDataSourcePart, ...groupFieldParts] = String(chartGroupByField.value || '').split('::');
    const xSelection = {
      dataSource: String(xDataSourcePart || '').trim(),
      fieldName: xFieldParts.join('::').trim(),
    };
    const ySelection = {
      dataSource: String(yDataSourcePart || '').trim(),
      fieldName: yFieldParts.join('::').trim(),
    };
    const groupSelection = {
      dataSource: String(groupDataSourcePart || '').trim(),
      fieldName: groupFieldParts.join('::').trim(),
    };
    const xField = xSelection.fieldName;
    const yField = ySelection.fieldName;
    const groupField = groupSelection.fieldName;
    const isStackable = ['bar', 'area'].includes(reportConfig.chart_type || '');

    reportConfig.chart_config = {
      ...(reportConfig.chart_config as any || {}),
      title: chartTitle.value || undefined,
      x_axis: {
        field: xField || undefined,
        label: chartXAxisLabel.value || undefined,
        date_grouping: (chartXAxisDateGrouping.value as any) || undefined,
      },
      y_axis: {
        field: yField || undefined,
        label: chartYAxisLabel.value || undefined,
      },
      series: yField
        ? [{ field: yField, aggregate: chartYAxisAggregate.value, label: chartYAxisLabel.value || undefined }]
        : [],
      group_by: groupField || undefined,
      appearance: {
        show_legend: chartShowLegend.value,
        legend_position: chartLegendPosition.value,
        show_data_labels: chartShowDataLabels.value,
        show_grid_lines: chartShowGridLines.value,
        color_palette: chartColorPalette.value,
        custom_colors: chartColorPalette.value === 'custom' ? [...chartCustomColors.value] : undefined,
        stacked: isStackable && chartStacked.value,
        stacked_100: isStackable && chartStacked100.value,
      },
    } as any;

    // Build groupings so the backend can GROUP BY x-axis / split-by fields
    const newGroupings: any[] = [];
    if (xField && xSelection.dataSource) newGroupings.push({ field_name: xField, data_source: xSelection.dataSource, order: 1 });
    if (groupField && groupField !== xField) {
      newGroupings.push({ field_name: groupField, data_source: groupSelection.dataSource, order: newGroupings.length + 1 });
    }
    (reportConfig as any).groupings = newGroupings;

    // Stamp aggregation on the Y-axis field inside the fields list so the backend can aggregate it
    if (yField) {
      reportConfig.fields = (reportConfig.fields || []).map((field: any) => ({
        ...field,
        aggregation:
          field.field_name === yField && field.data_source === ySelection.dataSource
            ? chartYAxisAggregate.value
            : ((field.field_name === xField && field.data_source === xSelection.dataSource) || (field.field_name === groupField && field.data_source === groupSelection.dataSource)
              ? ''
              : field.aggregation),
      }));
    }

    // Default sort by X-axis ascending for time-series readability
    if (xField && xSelection.dataSource) {
      reportConfig.sorting = [{ field_name: xField, data_source: xSelection.dataSource, direction: 'ASC', order: 1 }];
    }
  });

  const ensureKpiConfigDefaults = $(() => {
    if (reportConfig.report_type !== 'kpi') {
      return;
    }

    const fields = reportConfig.fields || [];
    if (!kpiMetricField.value && fields.length > 0) {
      kpiMetricField.value = `${String(fields[0]?.data_source || '').trim()}::${String(fields[0]?.field_name || '').trim()}`;
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

    const [metricDataSourcePart, ...metricFieldParts] = String(kpiMetricField.value || '').split('::');
    const metricDataSource = String(metricDataSourcePart || '').trim();
    const metricFieldName = metricFieldParts.join('::').trim();
    const metric = (reportConfig.fields || []).find((field: any) =>
      String(field.field_name || '') === metricFieldName && String(field.data_source || '') === metricDataSource
    );
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
        permissions: {
          required: selectedPermissions.value,
        },
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

  return (
    <div class="space-y-6">
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
      <div class="space-x-8">
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
        <div class="animate-fade-in">
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
        <div class="py-5">
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
                  {getModuleOptions().map((m: any) => (
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
                onChange$={async (e: any) => {
                  const table = availableTables.value.find((t: any) => t.table_name === e.target.value);
                  if (table) {
                    await handleTableSelect(table.table_name, table.form_code, table.form_id);
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
                    {table.system ? `${table.form_title} [Module Table]` : table.form_title}
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
                  onChange$={async (e: any) => {
                    reportConfig.report_type = e.target.value;
                    currentStep.value = 3;
                    if (reportConfig.report_type === 'kpi') {
                      await ensureKpiConfigDefaults();
                    } else if (reportConfig.report_type === 'chart') {
                      await applyChartConfiguration();
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
          {((reportConfig.data_sources || []) as any[]).length > 0 && (
            <div class="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-blue-900">Connected Data Sources</p>
                  <p class="text-xs text-blue-800">Add one table for a single-source report, or attach multiple tables and define joins for a query-builder style report.</p>
                </div>
                <Badge variant="info">{((reportConfig.data_sources || []) as any[]).length} sources</Badge>
              </div>

              <div class="space-y-3">
                {((reportConfig.data_sources || []) as any[]).map((source: any, index: number) => (
                  <div key={source.alias} class={`rounded-lg border p-3 ${activeDataSourceAlias.value === source.alias ? 'border-blue-400 bg-white' : 'border-blue-200 bg-white/70'}`}>
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <button
                        type="button"
                        class="text-left"
                        onClick$={async () => {
                          await selectDataSource(source.alias);
                        }}
                      >
                        <div class="text-sm font-semibold text-gray-900">{source.table_name}</div>
                        <div class="text-xs text-gray-600">Alias: {source.alias}</div>
                      </button>
                      <div class="flex items-center gap-2">
                        {activeDataSourceAlias.value === source.alias ? <Badge variant="success">Active</Badge> : null}
                        <Btn
                          size="sm"
                          variant="ghost"
                          onClick$={async () => {
                            await removeDataSource(source.alias);
                          }}
                        >
                          Remove
                        </Btn>
                      </div>
                    </div>

                    {index > 0 && (
                      <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField id={`join-type-${source.alias}`} label="Join Type">
                          <select
                            id={`join-type-${source.alias}`}
                            class="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-sm"
                            value={source.join_type || 'LEFT'}
                            onChange$={(e: any) => updateDataSourceJoin(source.alias, 'join_type', e.target.value)}
                          >
                            <option value="LEFT">LEFT</option>
                            <option value="INNER">INNER</option>
                            <option value="RIGHT">RIGHT</option>
                          </select>
                        </FormField>
                        <FormField id={`join-on-${source.alias}`} label="Join Condition" hint="Example: projects.id = tasks.project_id">
                          <input
                            id={`join-on-${source.alias}`}
                            type="text"
                            class="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-sm"
                            value={source.join_on || ''}
                            onInput$={(e: any) => updateDataSourceJoin(source.alias, 'join_on', e.target.value)}
                            placeholder="base_table.id = joined_table.foreign_key"
                          />
                        </FormField>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div class="py-8">
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
                  <div class="divide-y divide-gray-100">
                    {/* 1 – Chart Type */}
                    <div class="p-5">
                      <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Chart Type</p>
                      <div class="grid grid-cols-3 gap-2">
                        {CHART_TYPE_META.map((ct) => (
                          <button
                            key={ct.value}
                            type="button"
                            onClick$={async () => {
                              reportConfig.chart_type = ct.value as ChartType;
                              await applyChartConfiguration();
                            }}
                            class={`flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 transition-all ${
                              reportConfig.chart_type === ct.value
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                            }`}
                          >
                            <i
                              class={`${ct.icon} h-5 w-5 ${reportConfig.chart_type === ct.value ? 'text-blue-600' : 'text-gray-400'}`}
                              aria-hidden="true"
                            />
                            <span class={`text-[11px] font-semibold ${reportConfig.chart_type === ct.value ? 'text-blue-700' : 'text-gray-600'}`}>
                              {ct.label}
                            </span>
                          </button>
                        ))}
                      </div>
                      {(() => {
                        const meta = CHART_TYPE_META.find((c) => c.value === reportConfig.chart_type);
                        return meta ? (
                          <p class="mt-2.5 text-[11px] leading-relaxed text-gray-500">{meta.desc}</p>
                        ) : null;
                      })()}
                    </div>

                    {/* 2 – Axes */}
                    <div class="p-5 space-y-3">
                      <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {(['pie', 'doughnut'] as string[]).includes(reportConfig.chart_type || '') ? 'Data Mapping' : 'Axes'}
                      </p>

                      <FormField
                        id="chart-x-axis-field"
                        label={(['pie', 'doughnut'] as string[]).includes(reportConfig.chart_type || '') ? 'Label Field' : 'X-Axis Field'}
                        hint={(['pie', 'doughnut'] as string[]).includes(reportConfig.chart_type || '') ? 'The field used as slice labels.' : 'The category or time dimension shown on the horizontal axis.'}
                      >
                        <select
                          id="chart-x-axis-field"
                          class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                          value={chartXAxisField.value}
                          onChange$={async (e: any) => {
                            chartXAxisField.value = e.target.value;
                            await applyChartConfiguration();
                          }}
                          disabled={(reportConfig.fields || []).length === 0}
                        >
                          <option value="">Select field...</option>
                          {(reportConfig.fields || []).map((field: any) => (
                            <option key={`${field.data_source}_${field.field_name}`} value={encodeFieldSelection(field)}>
                              {getFieldOptionLabel(field)}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      {chartXAxisField.value && isDateLikeFieldType(
                        (getFieldBySelection(chartXAxisField.value) as any)?.data_type || ''
                      ) && (
                        <FormField
                          id="chart-date-grouping"
                          label="Date Grouping"
                          hint="Aggregate date values by this interval to reduce noise."
                        >
                          <select
                            id="chart-date-grouping"
                            class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                            value={chartXAxisDateGrouping.value}
                            onChange$={async (e: any) => {
                              chartXAxisDateGrouping.value = e.target.value;
                              await applyChartConfiguration();
                            }}
                          >
                            <option value="">No grouping</option>
                            <option value="day">Daily</option>
                            <option value="week">Weekly</option>
                            <option value="month">Monthly</option>
                            <option value="quarter">Quarterly</option>
                            <option value="year">Yearly</option>
                          </select>
                        </FormField>
                      )}

                      <FormField
                        id="chart-y-axis-field"
                        label={(['pie', 'doughnut'] as string[]).includes(reportConfig.chart_type || '') ? 'Value Field' : 'Y-Axis Field'}
                        required
                        hint={(['pie', 'doughnut'] as string[]).includes(reportConfig.chart_type || '') ? 'The numeric field that determines slice size.' : 'The numeric field plotted on the vertical axis.'}
                      >
                        <select
                          id="chart-y-axis-field"
                          class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                          value={chartYAxisField.value}
                          onChange$={async (e: any) => {
                            chartYAxisField.value = e.target.value;
                            await applyChartConfiguration();
                          }}
                          disabled={(reportConfig.fields || []).length === 0}
                        >
                          <option value="">Select field...</option>
                          {(reportConfig.fields || []).map((field: any) => (
                            <option key={field.field_name} value={field.field_name}>
                              {field.alias || field.field_name}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField
                        id="chart-y-aggregate"
                        label="Y-Axis Aggregation"
                        required
                        hint="How to combine multiple row values for each X position."
                      >
                        <select
                          id="chart-y-aggregate"
                          class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                          value={chartYAxisAggregate.value}
                          onChange$={async (e: any) => {
                            chartYAxisAggregate.value = e.target.value as KpiAggregation;
                            await applyChartConfiguration();
                          }}
                        >
                          {KPI_AGGREGATIONS.map((agg) => (
                            <option key={agg} value={agg}>{agg}</option>
                          ))}
                        </select>
                      </FormField>

                      <div class="grid grid-cols-2 gap-2">
                        <FormField id="chart-x-label" label="X-Axis Label" class="mb-0">
                          <input
                            id="chart-x-label"
                            type="text"
                            class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                            value={chartXAxisLabel.value}
                            onInput$={async (e: any) => {
                              chartXAxisLabel.value = e.target.value;
                              await applyChartConfiguration();
                            }}
                            placeholder="Auto"
                          />
                        </FormField>
                        <FormField id="chart-y-label" label="Y-Axis Label" class="mb-0">
                          <input
                            id="chart-y-label"
                            type="text"
                            class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                            value={chartYAxisLabel.value}
                            onInput$={async (e: any) => {
                              chartYAxisLabel.value = e.target.value;
                              await applyChartConfiguration();
                            }}
                            placeholder="Auto"
                          />
                        </FormField>
                      </div>
                    </div>

                    {/* 3 – Series / Grouping (not for pie/doughnut) */}
                    {!(['pie', 'doughnut'] as string[]).includes(reportConfig.chart_type || '') && (
                      <div class="p-5 space-y-3">
                        <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Series</p>

                        <FormField
                          id="chart-group-by"
                          label="Split by (Optional)"
                          hint="Divide data into multiple colored series by this field."
                        >
                          <select
                            id="chart-group-by"
                            class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                            value={chartGroupByField.value}
                            onChange$={async (e: any) => {
                              chartGroupByField.value = e.target.value;
                              await applyChartConfiguration();
                            }}
                            disabled={(reportConfig.fields || []).length === 0}
                          >
                            <option value="">No split</option>
                            {(reportConfig.fields || [])
                                .filter((field: any) => encodeFieldSelection(field) !== chartXAxisField.value && encodeFieldSelection(field) !== chartYAxisField.value)
                              .map((field: any) => (
                                  <option key={`${field.data_source}_${field.field_name}`} value={encodeFieldSelection(field)}>
                                    {getFieldOptionLabel(field)}
                                </option>
                              ))}
                          </select>
                        </FormField>

                        {(['bar', 'area'] as string[]).includes(reportConfig.chart_type || '') && (
                          <div class="space-y-2">
                            <label class="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={chartStacked.value}
                                onChange$={async (e: any) => {
                                  chartStacked.value = (e.target as HTMLInputElement).checked;
                                  if ((e.target as HTMLInputElement).checked) chartStacked100.value = false;
                                  await applyChartConfiguration();
                                }}
                                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span class="text-sm text-gray-700">Stacked series</span>
                            </label>
                            <label class="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={chartStacked100.value}
                                onChange$={async (e: any) => {
                                  chartStacked100.value = (e.target as HTMLInputElement).checked;
                                  if ((e.target as HTMLInputElement).checked) chartStacked.value = false;
                                  await applyChartConfiguration();
                                }}
                                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span class="text-sm text-gray-700">100% stacked</span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4 – Appearance */}
                    <div class="p-5 space-y-3">
                      <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Appearance</p>

                      <FormField id="chart-title" label="Chart Title">
                        <input
                          id="chart-title"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                          value={chartTitle.value}
                          onInput$={async (e: any) => {
                            chartTitle.value = e.target.value;
                            await applyChartConfiguration();
                          }}
                          placeholder="Optional chart title"
                        />
                      </FormField>

                      <div>
                        <div class="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                          <div class="mb-2 flex items-center justify-between">
                            <p class="text-xs font-medium text-blue-800">Chart Colors</p>
                            <span class="text-[10px] text-blue-700">Pick any colors you want</span>
                          </div>
                          <div class="grid grid-cols-5 gap-2">
                            {chartCustomColors.value.map((color: string, index: number) => (
                              <label key={index} class="flex flex-col items-center gap-1">
                                <input
                                  type="color"
                                  value={color}
                                  class="h-10 w-10 cursor-pointer rounded border border-gray-300 p-0"
                                  onInput$={async (e: any) => {
                                    const next = [...chartCustomColors.value];
                                    next[index] = e.target.value;
                                    chartCustomColors.value = next;
                                    chartColorPalette.value = 'custom';
                                    await applyChartConfiguration();
                                  }}
                                />
                                <span class="text-[10px] text-gray-600">C{index + 1}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div class="space-y-2">
                        <label class="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={chartShowLegend.value}
                            onChange$={async (e: any) => {
                              chartShowLegend.value = (e.target as HTMLInputElement).checked;
                              await applyChartConfiguration();
                            }}
                            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span class="text-sm text-gray-700">Show legend</span>
                        </label>

                        {chartShowLegend.value && (
                          <div class="ml-6">
                            <select
                              class="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm"
                              value={chartLegendPosition.value}
                              onChange$={async (e: any) => {
                                chartLegendPosition.value = e.target.value;
                                await applyChartConfiguration();
                              }}
                            >
                              <option value="top">Top</option>
                              <option value="bottom">Bottom</option>
                              <option value="left">Left</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                        )}

                        <label class="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={chartShowDataLabels.value}
                            onChange$={async (e: any) => {
                              chartShowDataLabels.value = (e.target as HTMLInputElement).checked;
                              await applyChartConfiguration();
                            }}
                            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span class="text-sm text-gray-700">Show data labels</span>
                        </label>

                        {!(['pie', 'doughnut'] as string[]).includes(reportConfig.chart_type || '') && (
                          <label class="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={chartShowGridLines.value}
                              onChange$={async (e: any) => {
                                chartShowGridLines.value = (e.target as HTMLInputElement).checked;
                                await applyChartConfiguration();
                              }}
                              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span class="text-sm text-gray-700">Show grid lines</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* 5 – Summary */}
                    {(chartXAxisField.value || chartYAxisField.value) && (
                      <div class="p-5">
                        <div class="space-y-1.5 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-gray-700">
                          <p class="font-semibold text-gray-900">Chart Summary</p>
                          {chartXAxisField.value && (
                            <div>
                              <span class="font-medium text-gray-900">
                                {(['pie', 'doughnut'] as string[]).includes(reportConfig.chart_type || '') ? 'Labels' : 'X-Axis'}:
                              </span>{' '}
                              {(getFieldBySelection(chartXAxisField.value) as any)?.alias || parseFieldSelection(chartXAxisField.value).fieldName || chartXAxisField.value}
                              {chartXAxisDateGrouping.value ? ` (${chartXAxisDateGrouping.value})` : ''}
                            </div>
                          )}
                          {chartYAxisField.value && (
                            <div>
                              <span class="font-medium text-gray-900">
                                {(['pie', 'doughnut'] as string[]).includes(reportConfig.chart_type || '') ? 'Values' : 'Y-Axis'}:
                              </span>{' '}
                              {chartYAxisAggregate.value}({(getFieldBySelection(chartYAxisField.value) as any)?.alias || parseFieldSelection(chartYAxisField.value).fieldName || chartYAxisField.value})
                            </div>
                          )}
                          {chartGroupByField.value && (
                            <div>
                              <span class="font-medium text-gray-900">Split by:</span>{' '}
                              {(getFieldBySelection(chartGroupByField.value) as any)?.alias || parseFieldSelection(chartGroupByField.value).fieldName || chartGroupByField.value}
                            </div>
                          )}
                          {(chartStacked.value || chartStacked100.value) && (
                            <div>
                              <span class="font-medium text-gray-900">Mode:</span>{' '}
                              {chartStacked100.value ? '100% Stacked' : 'Stacked'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {reportConfig.report_type === 'kpi' && (
                  <div class="p-6 space-y-3">
                    <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                      <p class="font-semibold">What a KPI means here</p>
                      <p class="mt-1 text-emerald-800">
                        A KPI card shows one core number. You choose the metric field, how it is aggregated, an optional breakout, a target threshold, and an optional comparison baseline.
                      </p>
                    </div>

                    <FormField
                      id="report-builder-kpi-metric-field"
                      label="Metric Field"
                      required
                      hint="Pick the numeric field you want the KPI card to measure."
                    >
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
                            <option key={`${field.data_source}_${field.field_name}`} value={encodeFieldSelection(field)}>
                              {getFieldOptionLabel(field)}
                            </option>
                          ))}
                      </select>
                    </FormField>

                    <FormField
                      id="report-builder-kpi-aggregation"
                      label="Aggregation"
                      required
                      hint="Choose how the metric field should be calculated across all matching rows."
                    >
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

                    <FormField
                      id="report-builder-kpi-breakout"
                      label="Breakout (Optional)"
                      hint="Split one KPI into multiple cards by another field, such as site, status, or category."
                    >
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
                          .filter((field: any) => encodeFieldSelection(field) !== kpiMetricField.value)
                          .map((field: any) => (
                            <option key={`${field.data_source}_${field.field_name}`} value={encodeFieldSelection(field)}>
                              {getFieldOptionLabel(field)}
                            </option>
                          ))}
                      </select>
                    </FormField>

                    <div class="grid grid-cols-2 gap-3">
                      <FormField
                        id="report-builder-kpi-target"
                        label="Target Threshold"
                        hint="Optional goal or benchmark for the KPI. Example: daily production target, expected count, revenue goal."
                      >
                        <input
                          id="report-builder-kpi-target"
                          type="number"
                          class="w-full px-3 py-2 border border-emerald-200 rounded-lg bg-white text-sm"
                          value={kpiTargetValue.value}
                          onInput$={async (e: any) => {
                            kpiTargetValue.value = e.target.value;
                            await applyKpiConfiguration();
                          }}
                          placeholder="Example: 100"
                        />
                      </FormField>

                      <FormField
                        id="report-builder-kpi-compare"
                        label="Compare Against"
                        hint="Optional baseline used to show trend or delta for the KPI."
                      >
                        <select
                          id="report-builder-kpi-compare"
                          class="w-full px-3 py-2 border border-emerald-200 rounded-lg bg-white text-sm"
                          value={kpiComparisonMode.value}
                          onChange$={async (e: any) => {
                            kpiComparisonMode.value = e.target.value;
                            await applyKpiConfiguration();
                          }}
                        >
                          <option value="none">No comparison</option>
                          <option value="previous_period">Previous period</option>
                          <option value="same_period_last_month">Same period last month</option>
                        </select>
                      </FormField>
                    </div>

                    <div class="rounded-xl border border-emerald-200 bg-white p-4">
                      <h4 class="text-sm font-semibold text-gray-900">KPI Summary</h4>
                      <div class="mt-3 space-y-2 text-sm text-gray-700">
                        <div>
                          <span class="font-medium text-gray-900">Metric:</span>{' '}
                          {(getFieldBySelection(kpiMetricField.value) as any)?.alias || parseFieldSelection(kpiMetricField.value).fieldName || 'Not selected'}
                        </div>
                        <div>
                          <span class="font-medium text-gray-900">Calculation:</span>{' '}
                          {kpiAggregation.value} of {(getFieldBySelection(kpiMetricField.value) as any)?.alias || parseFieldSelection(kpiMetricField.value).fieldName || 'metric field'}
                        </div>
                        <div>
                          <span class="font-medium text-gray-900">Breakout:</span>{' '}
                          {(getFieldBySelection(kpiGroupByField.value) as any)?.alias || parseFieldSelection(kpiGroupByField.value).fieldName || 'Single KPI card'}
                        </div>
                        <div>
                          <span class="font-medium text-gray-900">Target:</span>{' '}
                          {kpiTargetValue.value || 'No target set'}
                        </div>
                        <div>
                          <span class="font-medium text-gray-900">Compare:</span>{' '}
                          {kpiComparisonMode.value === 'none'
                            ? 'No comparison'
                            : kpiComparisonMode.value === 'previous_period'
                              ? 'Previous period'
                              : 'Same period last month'}
                        </div>
                      </div>
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
                    <p class="text-gray-500">Choose a data source above to load its fields, then add more sources if you need joins.</p>
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

                    <div class="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">
                      <span class="font-semibold">Submission ID</span> enables workflow lifecycle drill-down in report table views.
                      It is auto-added when you select workflow status fields such as <span class="font-medium">Status</span> or <span class="font-medium">Last Action</span>.
                    </div>

                    <div class="space-y-3">
                      {[...tableFields.value]
                        .filter((field: any) => {
                          const fieldKey = String(field.column_name || field.id || field.name || '');
                          const fieldLabel = String(field.label || field.name || field.column_name || '');
                          const fieldType = String(field.dataType || field.data_type || field.type || 'text');
                          const selected = (reportConfig.fields || []).some((item: any) => item.field_name === fieldKey && item.data_source === activeDataSourceAlias.value);
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
                          const leftSelected = (reportConfig.fields || []).some((item: any) => item.field_name === leftKey && item.data_source === activeDataSourceAlias.value);
                          const rightSelected = (reportConfig.fields || []).some((item: any) => item.field_name === rightKey && item.data_source === activeDataSourceAlias.value);

                          if (leftSelected !== rightSelected) {
                            return leftSelected ? -1 : 1;
                          }

                          const leftIndex = (reportConfig.fields || []).findIndex((item: any) => item.field_name === leftKey && item.data_source === activeDataSourceAlias.value);
                          const rightIndex = (reportConfig.fields || []).findIndex((item: any) => item.field_name === rightKey && item.data_source === activeDataSourceAlias.value);

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
                          const selectedIndex = (reportConfig.fields || []).findIndex((item: any) => item.field_name === fieldKey && item.data_source === activeDataSourceAlias.value);
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
                                        {activeDataSourceAlias.value && <span class="uppercase tracking-wide">{activeDataSourceAlias.value}</span>}
                                        {fieldKey === 'submission_id' && (
                                          <Badge variant="info" class="text-[10px] px-2 py-0.5">Timeline key</Badge>
                                        )}
                                        {selectedField?.aggregation && (
                                          <Badge variant="info" class="text-[10px] px-2 py-0.5">{selectedField.aggregation}</Badge>
                                        )}
                                        {selectedField?.is_visible === false && (
                                          <Badge variant="neutral" class="text-[10px] px-2 py-0.5">Hidden</Badge>
                                        )}
                                        {field.apiEndpoint && (
                                          <Badge variant="success" class="text-[10px] px-2 py-0.5">
                                            Resolves from {String(field.apiEndpoint).split('/').filter(Boolean).pop()}
                                          </Badge>
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
                        {(reportConfig.fields || []).find((field: any) => field.field_name === filter.field_name && field.data_source === filter.data_source)?.alias || `${filter.field_name} [${filter.data_source}]`} <span class="text-cyan-600 dark:text-cyan-400">{operatorLabelMap[filter.operator as FilterOperator] || filter.operator}</span> {Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value ?? '')}
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
                          const [dataSourcePart, ...fieldParts] = String(e.target.value || '').split('::');
                          const selectedFieldName = {
                            dataSource: String(dataSourcePart || '').trim(),
                            fieldName: fieldParts.join('::').trim(),
                          };
                          const selectedField = (reportConfig.fields || []).find(
                            (field: any) => field.field_name === selectedFieldName.fieldName && field.data_source === selectedFieldName.dataSource
                          );
                          const sourceField = (tableFields.value || []).find(
                            (field: any) =>
                              String(field.column_name || field.id || field.name || '') === String(selectedFieldName.fieldName)
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
                          <option key={`${field.data_source}_${field.field_name}`} value={encodeFieldSelection(field)}>
                            {getFieldOptionLabel(field)}
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
                            <option key={`${field.data_source}_${field.field_name}`} value={encodeFieldSelection(field)}>{getFieldOptionLabel(field)}</option>
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
                            <span>{(reportConfig.fields || []).find((field: any) => field.field_name === sort.field_name && field.data_source === sort.data_source)?.alias || `${sort.field_name} [${sort.data_source}]`} ({sort.direction})</span>
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
                            <option key={`${field.data_source}_${field.field_name}`} value={encodeFieldSelection(field)}>{getFieldOptionLabel(field)}</option>
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
                            <span>{(reportConfig.fields || []).find((field: any) => field.field_name === group.field_name && field.data_source === group.data_source)?.alias || `${group.field_name} [${group.data_source}]`}</span>
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

              {/* Scope Context (reuses selected builder values) */}
              {/* Visibility and Permissions */}
              <div class="rounded-xl border border-gray-200 p-4 space-y-3">
                <p class="text-sm font-semibold text-gray-800">Visibility &amp; Permissions</p>

                <label class="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    class={`relative w-11 h-6 rounded-full transition-colors ${isPublic.value ? 'bg-interactive-primary' : 'bg-gray-300'}`}
                    onClick$={() => {
                      isPublic.value = !isPublic.value;
                      if (isPublic.value) {
                        selectedPermissions.value = [];
                      }
                    }}
                  >
                    <span
                      class={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublic.value ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                  <span class="text-sm text-gray-700">
                    {isPublic.value ? 'Public – visible to all users with report access' : 'Restricted – users must have selected permissions'}
                  </span>
                </label>

                {!isPublic.value && (
                  <div class="space-y-3">
                    <FormField id="save-report-permissions" label="Permissions (multi-select)">
                      <select
                        id="save-report-permissions"
                        multiple
                        size={Math.min(Math.max(availablePermissions.value.length, 4), 10)}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        disabled={loadingModalData.value}
                        onChange$={(e: any) => {
                          const options = Array.from((e.target as HTMLSelectElement).selectedOptions || []);
                          selectedPermissions.value = options
                            .map((option: any) => String(option.value || '').trim())
                            .filter((value: string) => !!value);
                        }}
                      >
                        {availablePermissions.value.map((permission) => (
                          <option
                            key={permission.id}
                            value={permission.name}
                            selected={selectedPermissions.value.includes(permission.name)}
                          >
                            {permission.name}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    {loadingModalData.value ? (
                      <p class="text-xs text-gray-400 italic">Loading permissions…</p>
                    ) : (
                      <p class="text-xs text-gray-500">
                        Hold Ctrl (Windows) or Cmd (Mac) to select multiple permissions. {selectedPermissions.value.length} selected.
                      </p>
                    )}
                  </div>
                )}
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
