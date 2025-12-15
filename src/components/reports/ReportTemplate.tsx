/* eslint-disable qwik/valid-lexical-scope */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Generic Report Template Component
 * Reusable component for all 15 report types (DPR, Water, Material, etc.)
 *
 * Usage:
 * <ReportTemplate
 *   reportType="water"
 *   reportTitle="Water Tanker Reports"
 *   listColumns={columns}
 *   formFields={fields}
 * />
 */

import { component$, useStore, $, useVisibleTask$, type PropFunction } from '@builder.io/qwik';
import { useNavigate, useLocation } from '@builder.io/qwik-city';
import { P9ETable } from '~/components/table';
import { DynamicForm, type FormField } from '~/components/form_generator';
import { reportService, type ReportKey } from '~/services/report.service';
import { siteService } from '~/services/site.service';
import type { PaginationParams } from '~/services/types';

export interface ReportColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => any;
}

export interface ReportTemplateProps {
  reportType: ReportKey;
  reportTitle: string;
  listColumns: ReportColumn[];
  formFields?: FormField<any>[];
  showSiteFilter?: boolean;
  showDateFilter?: boolean;
  customFilters?: any[];
  businessCode?: string;
  onBeforeSubmit$?: PropFunction<(data: any) => any>;
}

export const ReportTemplate = component$<ReportTemplateProps>((props) => {
  const nav = useNavigate();
  const loc = useLocation();

  const isListView = !loc.url.pathname.includes('/new') && !loc.url.pathname.includes('/edit');
  const isCreateView = loc.url.pathname.includes('/new');
  const isEditView = loc.url.pathname.includes('/edit');

  const state = useStore<{
    data: any[];
    loading: boolean;
    error: string;
    success: string;
    page: number;
    limit: number;
    total: number;
    deleting: string | null;
    filters: {
      start_date: string;
      end_date: string;
      site_id: string;
      [key: string]: any;
    };
    sites: any[];
    reportData: any;
    loadingReport: boolean;
  }>({
    data: [],
    loading: true,
    error: '',
    success: '',
    page: 0,
    limit: 10,
    total: 0,
    deleting: null,
    filters: {
      start_date: '',
      end_date: '',
      site_id: '',
    },
    sites: [],
    reportData: null,
    loadingReport: false,
  });

  // Fetch reports list
  const fetchReports = $(async (page = state.page) => {
    state.loading = true;
    state.error = '';

    try {
      const params: PaginationParams & Record<string, any> = {
        page: page + 1,
        page_size: state.limit,
      };

      // Add filters
      if (state.filters.start_date) params.start_date = state.filters.start_date;
      if (state.filters.end_date) params.end_date = state.filters.end_date;
      if (state.filters.site_id) params.site_id = state.filters.site_id;

      const response = await reportService.getReports(props.reportType, params);

      state.data = response.data || [];
      state.total = response.pagination?.total || 0;
      state.page = page;
    } catch (error: any) {
      state.error = error.message || 'Failed to load reports';
    } finally {
      state.loading = false;
    }
  });

  // Fetch sites for dropdown
  const fetchSites = $(async () => {
    try {
      if (props.businessCode) {
        const sites = await siteService.getMySites(props.businessCode);
        state.sites = sites || [];
      }
    } catch (error) {
      console.error('Failed to load sites');
    }
  });

  // Fetch single report for edit view
  const fetchReport = $(async (reportId: string) => {
    state.loadingReport = true;
    try {
      state.reportData = await reportService.getReportById(props.reportType, reportId);
    } catch (error: any) {
      state.error = error.message || 'Failed to load report';
    } finally {
      state.loadingReport = false;
    }
  });

  // Initialize
  useVisibleTask$(async () => {
    if (isListView) {
      await fetchReports();
    }

    if (isCreateView || isEditView) {
      await fetchSites();
    }

    if (isEditView) {
      const reportId = loc.params.id;
      if (reportId) {
        await fetchReport(reportId);
      }
    }
  });

  // Delete report
  const handleDelete = $(async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    state.deleting = reportId;
    try {
      await reportService.deleteReport(props.reportType, reportId);
      await fetchReports(state.page);
    } catch (error: any) {
      alert(error.message || 'Failed to delete report');
    } finally {
      state.deleting = null;
    }
  });

  // Create/Update report
  const handleSubmit = $(async (data: any) => {
    state.loading = true;
    state.error = '';
    state.success = '';

    try {
      // Apply custom transformation if provided
      const submitData = props.onBeforeSubmit$
        ? await props.onBeforeSubmit$(data)
        : data;

      if (isEditView && loc.params.id) {
        await reportService.updateReport(props.reportType, loc.params.id, submitData);
        state.success = 'Report updated successfully!';
      } else {
        await reportService.createReport(props.reportType, submitData);
        state.success = 'Report created successfully!';
      }

      setTimeout(() => {
        nav(`/reports/${props.reportType}`);
      }, 1500);
    } catch (error: any) {
      state.error = error.message || 'Failed to submit report';
    } finally {
      state.loading = false;
    }
  });

  // Action column for list view
  const actionColumn: ReportColumn = {
    key: 'actions',
    label: 'Actions',
    render: (_val, row) => (
      <div class="flex gap-2">
        <button
          onClick$={() => nav(`/reports/${props.reportType}/${row.id}`)}
          class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          View
        </button>
        <button
          onClick$={() => nav(`/reports/${props.reportType}/${row.id}/edit`)}
          class="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
        >
          Edit
        </button>
        <button
          onClick$={() => handleDelete(row.id)}
          disabled={state.deleting === row.id}
          class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
        >
          {state.deleting === row.id ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    ),
  };

  const allColumns = [...props.listColumns, actionColumn];

  // LIST VIEW
  if (isListView) {
    return (
      <div class="container mx-auto px-4 py-6">
        {/* Header */}
        <div class="mb-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              {props.reportTitle}
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              View and manage all {props.reportTitle.toLowerCase()}
            </p>
          </div>
          <button
            onClick$={() => nav(`/reports/${props.reportType}/new`)}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span>+</span> New Report
          </button>
        </div>

        {/* Error Display */}
        {state.error && (
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {state.error}
          </div>
        )}

        {/* Filters */}
        {(props.showDateFilter || props.showSiteFilter) && (
          <div class="bg-white dark:bg-dark-800 rounded-lg shadow-md p-4 mb-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              {props.showDateFilter && (
                <>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={state.filters.start_date}
                      onInput$={(e) => {
                        state.filters.start_date = (e.target as HTMLInputElement).value;
                        fetchReports(0);
                      }}
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={state.filters.end_date}
                      onInput$={(e) => {
                        state.filters.end_date = (e.target as HTMLInputElement).value;
                        fetchReports(0);
                      }}
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    />
                  </div>
                </>
              )}

              {props.showSiteFilter && (
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site
                  </label>
                  <select
                    value={state.filters.site_id}
                    onChange$={(e) => {
                      state.filters.site_id = (e.target as HTMLSelectElement).value;
                      fetchReports(0);
                    }}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    <option value="">All Sites</option>
                    {state.sites.map(site => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div class="flex items-end">
                <button
                  onClick$={() => {
                    state.filters = { start_date: '', end_date: '', site_id: '' };
                    fetchReports(0);
                  }}
                  class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reports Table */}
        <div class="bg-white dark:bg-dark-800 rounded-lg shadow-md overflow-hidden">
          <P9ETable
            header={allColumns}
            data={state.data}
            defaultLimit={state.limit}
            title={`All ${props.reportTitle}`}
            enableSearch
            enableSort
            serverPagination={true}
            totalCount={state.total}
            onPageChange$={$(async (p: number, l: number) => {
              state.limit = l;
              await fetchReports(p);
              return state.data;
            })}
          />
        </div>
      </div>
    );
  }

  // CREATE/EDIT VIEW
  if (isCreateView || isEditView) {
    if (state.loadingReport && isEditView) {
      return (
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-lg">Loading report...</div>
        </div>
      );
    }

    // Add site selector to form fields if provided
    const enrichedFormFields: FormField<any>[] = props.formFields
      ? [
          {
            type: 'select',
            name: 'site_id',
            label: 'Site',
            required: true,
            options: state.sites.map(s => ({ label: s.name, value: s.id })),
          },
          ...props.formFields,
        ]
      : [];

    const initialValues = isEditView && state.reportData ? state.reportData : {};

    return (
      <div class="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div class="mb-6">
          <button
            onClick$={() => nav(`/reports/${props.reportType}`)}
            class="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <span>←</span> Back to {props.reportTitle}
          </button>
        </div>

        {/* Form Card */}
        <div class="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6">
          <h1 class="text-2xl font-bold mb-6">
            {isEditView ? 'Edit Report' : 'Create New Report'}
          </h1>

          {state.error && (
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {state.error}
            </div>
          )}

          {state.success && (
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {state.success}
            </div>
          )}

          {enrichedFormFields.length > 0 ? (
            <DynamicForm
              formFields={enrichedFormFields}
              formLoader={initialValues}
              onClick$={handleSubmit}
              heading={isEditView ? 'Edit Report' : 'Create Report'}
            />
          ) : (
            <div class="text-center py-8 text-gray-500">
              No form fields configured for this report type.
              Please configure form fields in the report configuration.
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div>Invalid view</div>;
});

export default ReportTemplate;
