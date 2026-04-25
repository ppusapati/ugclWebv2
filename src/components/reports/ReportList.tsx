// src/components/reports/ReportList.tsx
import { component$, isServer, useSignal, useTask$, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { reportService, getReportConfig } from '~/services';
import type { ReportKey, ReportType } from '~/services';
import { Alert, Btn, SectionCard, StatCard } from '~/components/ds';

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

  useTask$(async () => {
    if (isServer) {
      return;
    }

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
      <div class="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div class="text-center">
          <i class="i-heroicons-arrow-path-solid animate-spin mb-4 inline-block h-10 w-10 text-primary-500" aria-hidden="true"></i>
          <p class="text-neutral-600">Loading {config.displayName.toLowerCase()}...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-neutral-50 py-8 px-4">
      <div class="container-lg mx-auto">
        {/* Header */}
        <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold text-neutral-800 flex items-center gap-3">
              <i class={`${config.icon} h-10 w-10 inline-block text-primary-600`} aria-hidden="true"></i>
              {config.displayName}
            </h1>
            <p class="text-neutral-600 mt-2">{config.description}</p>
          </div>
          <div class="flex gap-3">
            <Btn onClick$={handleExport} variant="secondary">
              Export CSV
            </Btn>
            <Btn
              onClick$={() => nav(`/reports/${reportType}/new`)}
              variant="primary"
            >
              + Create Report
            </Btn>
          </div>
        </div>

        {/* Error Alert */}
        {error.value && (
          <Alert variant="error" class="mb-6 border-l-4">
            <p class="text-error-800">{error.value}</p>
          </Alert>
        )}

        {/* Search Bar */}
        <SectionCard class="mb-6">
          <div class="flex gap-4">
            <input
              type="text"
              value={searchQuery.value}
              onInput$={(e) => { searchQuery.value = (e.target as HTMLInputElement).value; }}
              onKeyPress$={async (e) => { if (e.key === 'Enter') await loadReports(); }}
              class="form-input flex-1 px-4 py-3 border border-neutral-300 rounded-lg"
              placeholder="Search reports..."
            />
            <Btn onClick$={loadReports} variant="primary">
              Search
            </Btn>
          </div>
        </SectionCard>

        {/* Stats */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard class="p-6">
            <div class="text-sm text-neutral-600">Total Reports</div>
            <div class="text-3xl font-bold text-primary-600 mt-2">{reports.value.length}</div>
          </StatCard>
        </div>

        {/* Reports Table */}
        <SectionCard>
          {reports.value.length === 0 ? (
            <div class="text-center py-12">
              <i class={`${config.icon} mb-4 inline-block h-16 w-16 text-neutral-300`} aria-hidden="true"></i>
              <h3 class="text-xl font-semibold text-neutral-800 mb-2">No Reports Yet</h3>
              <p class="text-neutral-600 mb-6">Create your first {config.displayName.toLowerCase()}</p>
              <Btn
                onClick$={() => nav(`/reports/${reportType}/new`)}
                variant="primary"
              >
                Create Report
              </Btn>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-light-200">
                <thead class="bg-neutral-50">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">ID</th>
                    {config.fields.slice(0, 4).map((field: any) => (
                      <th key={field.name} class="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">
                        {field.label}
                      </th>
                    ))}
                    <th class="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Created</th>
                    <th class="px-6 py-4 text-right text-xs font-semibold text-neutral-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-light-200">
                  {reports.value.map((report: any) => (
                    <tr key={report.id} class="hover:bg-neutral-50 transition">
                      <td class="px-6 py-4 text-sm font-mono text-neutral-600">
                        {report.id.slice(0, 8)}...
                      </td>
                      {config.fields.slice(0, 4).map((field: any) => (
                        <td key={field.name} class="px-6 py-4 text-sm text-neutral-800">
                          {field.type === 'date' && report[field.name]
                            ? new Date(report[field.name]).toLocaleDateString()
                            : String(report[field.name] || '-')}
                        </td>
                      ))}
                      <td class="px-6 py-4 text-sm text-neutral-600">
                        {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2">
                          <Btn
                            size="sm"
                            variant="ghost"
                            onClick$={() => nav(`/reports/${reportType}/${report.id}`)}
                            class="text-info-600 hover:text-info-700"
                            title="View"
                          >
                            View
                          </Btn>
                          <Btn
                            size="sm"
                            variant="secondary"
                            onClick$={() => nav(`/reports/${reportType}/${report.id}/edit`)}
                            class="text-primary-600 hover:text-primary-700"
                            title="Edit"
                          >
                            Edit
                          </Btn>
                          <Btn
                            size="sm"
                            variant="danger"
                            onClick$={() => handleDelete(report.id)}
                            class="text-error-600 hover:text-error-700"
                            title="Delete"
                          >
                            Delete
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
});
