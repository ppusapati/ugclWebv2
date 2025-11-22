import {
  component$,
  useStore,
  $,
} from '@builder.io/qwik';
import { P9ETable } from '~/components/table';

const API_URL = 'http://localhost:8080/api/v1';
// const API_URL = 'https://ugcl-429789556411.asia-south1.run.app/api/v1';
const formLabelMap: Record<string, string> = {
  dairysite: 'Dairy Site',
  diesel: 'Diesel',
  painting: 'Painting',
  contractor: 'Contractor',
  material: 'Material',
  mnr: 'NMR',
  nmr_vehicle: 'NMR Vehicle',
  vehiclelog: 'Vehicle Log',
  tasks: 'Tasks',
  payment: 'Payment',
  stock: 'Stock',
  water: 'Water',
  eway: 'E-Way',
  wrapping: 'Wrapping',
  dprsite: 'DPR Site',
};

export default component$(() => {
  const formState = useStore({
    visibleColumns: [] as string[],
    allColumns: [] as { key: string; label: string }[],
    selectedForm: 'dairysite',
    forms: Object.keys(formLabelMap),
    headers: [] as { key: string; label: string }[],
    data: [] as any[],
    loading: false,
    error: '',
    page: 1,
    limit: 10,
    total: 0,
    tableKey: 0,
    filter: {
      fromDate: '',
      toDate: '',
      site: '',
      contractor: '',
    },
    isDirty: false,
  });

  // Fetch columns for selected form
  const fetchAllColumns = $(async (store: typeof formState) => {
    store.loading = true;
    store.error = '';
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_URL}/admin/${store.selectedForm}?page=1&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
          },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch: ' + res.statusText);
      const result = await res.json();
      const firstRow = result.data?.[0] ?? {};
      store.allColumns = Object.entries(firstRow)
        .filter(([key]) => key.toLowerCase() !== 'id')
        .map(([key]) => ({
          key,
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim(),
        }));
      store.visibleColumns = store.allColumns.map((c) => c.key);
      // FIXED: Maintain the order of selected columns
      store.headers = store.allColumns.filter((col) =>
        store.visibleColumns.includes(col.key)
      );
      store.data = [];
      store.page = 1;
      store.total = 0;
      store.isDirty = true;
    } catch (e: any) {
      store.error = e.message || 'Failed to load columns';
      store.allColumns = [];
      store.visibleColumns = [];
      store.headers = [];
      store.data = [];
      store.page = 1;
      store.total = 0;
      store.isDirty = true;
    } finally {
      store.loading = false;
    }
  });

  // Fetch table data
  const fetchData = $(async (store: typeof formState, page: number, limit: number) => {
    if (page !== undefined) store.page = page;
    if (!store.visibleColumns.length) {
      store.data = [];
      store.total = 0;
      store.isDirty = false;
      return;
    }
    store.loading = true;
    store.error = '';
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('page', (store.page + 1).toString());
      params.append('limit', limit.toString());
      params.append('fields', store.visibleColumns.join(','));
      if (store.filter.fromDate) params.append('fromDate', store.filter.fromDate);
      if (store.filter.toDate) params.append('toDate', store.filter.toDate);
      if (store.filter.site) params.append('name_of_site', store.filter.site);
      if (store.filter.contractor) params.append('name_of_contractor', store.filter.contractor);

      const res = await fetch(
        `${API_URL}/admin/${store.selectedForm}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
          },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch: ' + res.statusText);
      const result = await res.json();

      // FIXED: Maintain the order of selected columns based on visibleColumns array
      store.headers = store.visibleColumns.map(colKey => {
        const col = store.allColumns.find(c => c.key === colKey);
        return col || { key: colKey, label: colKey };
      });

      store.data = (result.data ?? []).map((row: any) => {
        const newRow: Record<string, any> = {};
        // FIXED: Process data in the order of visibleColumns to maintain column order
        for (const col of store.visibleColumns) {
          newRow[col] = row[col];
        }
        return newRow;
      });
      store.total = result.total ?? 0;
      store.isDirty = false;
    } catch (e: any) {
      store.error = e.message || 'Failed to load data';
      store.data = [];
      store.total = 0;
      store.isDirty = true;
    } finally {
      store.loading = false;
    }
  });

  // FIXED: Function to fetch ALL data for export (not limited by pagination)
  const fetchAllDataForExport = $(async () => {
    if (!formState.visibleColumns.length) {
      return [];
    }

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '999999'); // Request a very large limit to get all data
      params.append('fields', formState.visibleColumns.join(','));
      if (formState.filter.fromDate) params.append('fromDate', formState.filter.fromDate);
      if (formState.filter.toDate) params.append('toDate', formState.filter.toDate);
      if (formState.filter.site) params.append('name_of_site', formState.filter.site);
      if (formState.filter.contractor) params.append('name_of_contractor', formState.filter.contractor);

      const res = await fetch(
        `${API_URL}/admin/${formState.selectedForm}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
          },
        }
      );

      if (!res.ok) throw new Error('Failed to fetch export data: ' + res.statusText);
      const result = await res.json();

      return (result.data ?? []).map((row: any) => {
        const newRow: Record<string, any> = {};
        // Maintain the order of visibleColumns
        for (const col of formState.visibleColumns) {
          newRow[col] = row[col];
        }
        return newRow;
      });
    } catch (error) {
      console.error('Error fetching all data for export:', error);
      throw error;
    }
  });

  return (
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Data Management Dashboard</h1>
          <p class="mt-1 text-sm text-gray-600">Configure and view your data sources with custom filters and column selection</p>
        </div>

        {/* Main Layout Grid */}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Sidebar - Configuration Panel */}
          <div class="lg:col-span-1 space-y-6">

            {/* Step 1: Data Source Selection */}
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div class="flex items-center">
                  <div class="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <h3 class="ml-3 text-sm font-medium text-gray-900">Select Data Source</h3>
                </div>
              </div>
              <div class="p-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Select the data source
                </label>
                <select
                  value={formState.selectedForm}
                  onChange$={async (e) => {
                    formState.selectedForm = (e.target as HTMLSelectElement).value;
                    await fetchAllColumns(formState);
                  }}
                  class="w-full px-3 py-2 bg-white text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formState.forms.map((formName) => (
                    <option key={formName} value={formName}>
                      {formLabelMap[formName] || formName.charAt(0).toUpperCase() + formName.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Data Filters */}
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div class="flex items-center">
                  <div class="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <h3 class="ml-3 text-sm font-medium text-gray-900">Apply Filters</h3>
                </div>
              </div>
              <div class="p-4 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={formState.filter.fromDate}
                    onInput$={(e) => {
                      formState.filter.fromDate = (e.target as HTMLInputElement).value;
                      formState.isDirty = true;
                      formState.data = [];
                    }}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={formState.filter.toDate}
                    onInput$={(e) => {
                      formState.filter.toDate = (e.target as HTMLInputElement).value;
                      formState.isDirty = true;
                      formState.data = [];
                    }}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
                  <select
                    value={formState.filter.site}
                    onChange$={(e) => {
                      formState.filter.site = (e.target as HTMLSelectElement).value;
                      formState.isDirty = true;
                      formState.data = [];
                    }}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Sites</option>
                    <option value="Magadi">Magadi</option>
                    <option value="Ramanagar">Ramanagar</option>
                    <option value="VG Doddi">VG Doddi</option>
                    <option value="Mallipatana">Mallipatana</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Contractor Name</label>
                  <input
                    type="text"
                    placeholder="Enter contractor name"
                    value={formState.filter.contractor}
                    onInput$={(e) => {
                      formState.filter.contractor = (e.target as HTMLInputElement).value;
                      formState.isDirty = true;
                      formState.data = [];
                    }}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              class={`w-full flex items-center justify-center px-4 py-3 rounded-md font-medium text-sm transition-colors ${formState.visibleColumns.length === 0 || formState.loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                }`}
              disabled={formState.visibleColumns.length === 0 || formState.loading}
              onClick$={async () => {
                await fetchData(formState, formState.page, formState.limit);
                formState.tableKey++;
              }}
            >
              {formState.loading ? (
                <>
                  <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Loading Data...
                </>
              ) : (
                <>
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Load Data
                </>
              )}
            </button>

            {formState.isDirty && !formState.loading && (
              <div class="mt-3 flex items-center text-xs text-amber-600">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                Configuration changed - click to refresh
              </div>
            )}
          </div>

          {/* Right Content Area */}
          <div class="lg:col-span-2 space-y-6">

            {/* Step 3: Column Selection */}
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div class="flex items-center">
                  <div class="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-gray-900">Configure Table Columns</h3>
                  </div>
                </div>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formState.allColumns.map((col) => (
                    <label key={col.key} class="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={formState.visibleColumns.includes(col.key)}
                        onChange$={(e) => {
                          const checked = (e.target as HTMLInputElement).checked;
                          if (checked) {
                            formState.visibleColumns = [...formState.visibleColumns, col.key];
                          } else {
                            formState.visibleColumns = formState.visibleColumns.filter(k => k !== col.key);
                          }
                          // FIXED: Update headers to maintain the selected column order
                          formState.headers = formState.visibleColumns.map(colKey => {
                            const column = formState.allColumns.find(c => c.key === colKey);
                            return column || { key: colKey, label: colKey };
                          });
                          formState.isDirty = true;
                          formState.data = [];
                        }}
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span class="text-sm text-gray-700">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {formState.error && (
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex items-center">
                  <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  <div>
                    <h4 class="text-sm font-medium text-red-800">Error Loading Data</h4>
                    <p class="text-sm text-red-700 mt-1">{formState.error}</p>
                  </div>
                </div>
              </div>
            )}
          </div></div>
        {/* Data Table */}
        {formState.data.length > 0 && (
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <P9ETable
              key={formState.tableKey}
              header={formState.headers}
              data={formState.data}
              defaultLimit={formState.limit}
              title={`${formLabelMap[formState.selectedForm] ?? formState.selectedForm} Data`}
              enableSearch
              enableSort
              serverPagination
              totalCount={formState.total}
              selectedForm={formState.selectedForm}
              onPageChange$={async (page, limit) => {
                formState.limit = limit;
                await fetchData(formState, page, limit);
                return [...formState.data];
              }}
              onExportData$={fetchAllDataForExport}
            />
          </div>
        )}

        {/* Empty State */}
        {!formState.data.length && !formState.loading && !formState.error && formState.visibleColumns.length > 0 && (
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div class="text-center">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-4 text-lg font-medium text-gray-900">Ready to Load Data</h3>
              <p class="mt-2 text-sm text-gray-500">
                Configure your filters and click "Load Data" to display your results.
              </p>
              <div class="mt-4 text-xs text-gray-400">
                Source: {formLabelMap[formState.selectedForm]} • {formState.visibleColumns.length} columns selected
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
});