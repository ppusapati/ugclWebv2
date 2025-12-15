// src/components/reports/ReportList.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { reportService, getReportConfig } from '~/services';
import type { ReportKey, ReportType } from '~/services';

interface ReportListProps {
  reportType: ReportKey;
  businessCode?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ReportList = component$<ReportListProps>(({ reportType, businessCode: _businessCode }) => {
  const nav = useNavigate();

  const reports = useSignal<ReportType[]>([]);
  const loading = useSignal(true);
  const error = useSignal('');
  const searchQuery = useSignal('');
  const page = useSignal(1);
  const pageSize = 20;

  const config = getReportConfig(reportType);

  useVisibleTask$(async () => {
    await loadReports();
  });

  const loadReports = $(async () => {
    try {
      loading.value = true;
      error.value = '';

      const response = await reportService.getReports(reportType, {
        page: page.value,
        page_size: pageSize,
        search: searchQuery.value || undefined,
      });

      reports.value = response.data || [];
    } catch (err: any) {
      error.value = err.message || 'Failed to load reports';
    } finally {
      loading.value = false;
    }
  });

  const handleDelete = $(async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await reportService.deleteReport(reportType, reportId);
      reports.value = reports.value.filter(r => (r as any).id !== reportId);
    } catch (err: any) {
      error.value = err.message || 'Failed to delete report';
    }
  });

  const handleExport = $(async () => {
    try {
      await reportService.exportReports(reportType);
    } catch (err: any) {
      error.value = err.message || 'Failed to export reports';
    }
  });

  if (loading.value) {
    return (
      <div class="min-h-screen bg-light-50 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-dark-600">Loading {config.displayName.toLowerCase()}...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container-lg mx-auto">
        {/* Header */}
        <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold text-dark-800 flex items-center gap-3">
              <span class="text-4xl">{config.icon}</span>
              {config.displayName}
            </h1>
            <p class="text-dark-600 mt-2">{config.description}</p>
          </div>
          <div class="flex gap-3">
            <button onClick$={handleExport} class="btn-success px-6 py-3 rounded-lg font-semibold">
              Export CSV
            </button>
            <button
              onClick$={() => nav(`/reports/${reportType}/new`)}
              class="btn-primary px-6 py-3 rounded-lg font-semibold"
            >
              + Create Report
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error.value && (
          <div class="alert-danger rounded-lg p-4 mb-6 bg-danger-50 border-l-4 border-danger-500">
            <p class="text-danger-800">{error.value}</p>
          </div>
        )}

        {/* Search Bar */}
        <div class="card bg-white shadow rounded-xl p-6 mb-6">
          <div class="flex gap-4">
            <input
              type="text"
              value={searchQuery.value}
              onInput$={(e) => { searchQuery.value = (e.target as HTMLInputElement).value; }}
              onKeyPress$={async (e) => { if (e.key === 'Enter') await loadReports(); }}
              class="form-input flex-1 px-4 py-3 border border-light-300 rounded-lg"
              placeholder="Search reports..."
            />
            <button onClick$={loadReports} class="btn-primary px-6 py-3 rounded-lg">
              Search
            </button>
          </div>
        </div>

        {/* Stats */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="card bg-white shadow rounded-lg p-6">
            <div class="text-sm text-dark-600">Total Reports</div>
            <div class="text-3xl font-bold text-primary-600 mt-2">{reports.value.length}</div>
          </div>
        </div>

        {/* Reports Table */}
        <div class="card bg-white shadow-lg rounded-xl p-6">
          {reports.value.length === 0 ? (
            <div class="text-center py-12">
              <div class="text-6xl text-light-300 mb-4">{config.icon}</div>
              <h3 class="text-xl font-semibold text-dark-800 mb-2">No Reports Yet</h3>
              <p class="text-dark-600 mb-6">Create your first {config.displayName.toLowerCase()}</p>
              <button
                onClick$={() => nav(`/reports/${reportType}/new`)}
                class="btn-primary px-6 py-3 rounded-lg"
              >
                Create Report
              </button>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-light-200">
                <thead class="bg-light-50">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">ID</th>
                    {config.fields.slice(0, 4).map((field: any) => (
                      <th key={field.name} class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">
                        {field.label}
                      </th>
                    ))}
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">Created</th>
                    <th class="px-6 py-4 text-right text-xs font-semibold text-dark-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-light-200">
                  {reports.value.map((report: any) => (
                    <tr key={report.id} class="hover:bg-light-50 transition">
                      <td class="px-6 py-4 text-sm font-mono text-dark-600">
                        {report.id.slice(0, 8)}...
                      </td>
                      {config.fields.slice(0, 4).map((field: any) => (
                        <td key={field.name} class="px-6 py-4 text-sm text-dark-800">
                          {field.type === 'date' && report[field.name]
                            ? new Date(report[field.name]).toLocaleDateString()
                            : String(report[field.name] || '-')}
                        </td>
                      ))}
                      <td class="px-6 py-4 text-sm text-dark-600">
                        {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2">
                          <button
                            onClick$={() => nav(`/reports/${reportType}/${report.id}`)}
                            class="text-info-600 hover:text-info-700 px-3 py-1 text-sm"
                            title="View"
                          >
                            View
                          </button>
                          <button
                            onClick$={() => nav(`/reports/${reportType}/${report.id}/edit`)}
                            class="text-primary-600 hover:text-primary-700 px-3 py-1 text-sm"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick$={() => handleDelete(report.id)}
                            class="text-danger-600 hover:text-danger-700 px-3 py-1 text-sm"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
