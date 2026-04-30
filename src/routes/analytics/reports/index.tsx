// Reports List Screen - Enhanced Professional Design
import { component$, isServer, useStore, $, useSignal, useTask$, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate, routeLoader$, useLocation } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services/api-client';
import { analyticsService } from '~/services/analytics.service';
import type { ReportDefinition, ReportListResponse, ReportTemplate } from '~/types/analytics';
import { useAuthContext } from '~/contexts/auth-context';
import { Badge, Btn } from '~/components/ds';

// Load reports with SSR support
export const useReportsData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const response = await ssrApiClient.get<ReportListResponse>('/reports/definitions');

    return {
      reports: response.reports || [],
      total: response.total || 0,
    };
  } catch (error: any) {
    return {
      reports: [],
      total: 0,
      error: error.message || 'Failed to load reports',
    };
  }
});

// Report type icons and colors
const reportTypeConfig = {
  table: { icon: 'i-heroicons-chart-bar-solid', color: 'bg-gradient-to-br from-blue-600 to-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
  chart: { icon: 'i-heroicons-presentation-chart-line-solid', color: 'bg-gradient-to-br from-violet-600 to-fuchsia-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700' },
  kpi: { icon: 'i-heroicons-cursor-arrow-rays-solid', color: 'bg-gradient-to-br from-emerald-600 to-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' },
  pivot: { icon: 'i-heroicons-squares-2x2-solid', color: 'bg-gradient-to-br from-amber-500 to-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700' },
};

function getCategoryVariant(category?: string): 'info' | 'neutral' | 'success' | 'warning' {
  switch (category) {
    case 'Analytics':
      return 'info';
    case 'Operations':
      return 'neutral';
    case 'Finance':
      return 'success';
    case 'HR':
      return 'warning';
    default:
      return 'neutral';
  }
}

export default component$(() => {
  const auth = useAuthContext();
  const nav = useNavigate();
  const loc = useLocation();
  const initialData = useReportsData();
  const draggedItem = useSignal<string | null>(null);
  const dragOverItem = useSignal<string | null>(null);
  const initialCategory = (loc.url.searchParams.get('category') || 'all').trim();

  const reportDomains = [
    {
      id: 'all',
      title: 'All Reports',
      description: 'Browse every analytics report and cross-module template from one place.',
      icon: 'i-heroicons-squares-2x2-solid',
      accent: 'border-slate-200 bg-slate-50 text-slate-700',
    },
    {
      id: 'DMS',
      title: 'DMS Reports',
      description: 'Document compliance, aging, usage, and approval tracking built on Report Builder.',
      icon: 'i-heroicons-folder-open-solid',
      accent: 'border-blue-200 bg-blue-50 text-blue-700',
    },
    {
      id: 'PMS',
      title: 'PMS Reports',
      description: 'Project health, task execution, budget variance, and workflow bottleneck reporting.',
      icon: 'i-heroicons-clipboard-document-list-solid',
      accent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
  ] as const;

  const state = useStore({
    reports: initialData.value.reports as ReportDefinition[],
    templates: [] as ReportTemplate[],
    templatesLoading: false,
    creatingTemplateId: '' as string,
    templateBusy: false,
    showCreateTemplateModal: false,
    showEditTemplateModal: false,
    loading: false,
    error: (initialData.value as any).error || '',
    searchQuery: '',
    selectedCategory: initialCategory,
    viewMode: 'grid' as 'grid' | 'list',
    sortBy: 'recent' as 'recent' | 'name' | 'type',
    showFilters: false,
  });

  const newTemplateForm = useStore({
    sourceReportId: '',
    name: '',
    description: '',
    category: initialCategory !== 'all' ? initialCategory : 'Analytics',
    icon: 'i-heroicons-document-duplicate-solid',
  });

  const editTemplateForm = useStore({
    id: '',
    name: '',
    description: '',
    category: '',
    icon: '',
    isActive: true,
  });

  const permissionState = useStore({
    canCreateReports: true,
    canViewDashboards: false,
  });

  useTask$(({ track }) => {
    track(() => auth.user?.id);
    track(() => auth.user?.business_roles?.length || 0);

    if (isServer) {
      permissionState.canCreateReports = true;
      permissionState.canViewDashboards = false;
      return;
    }

    const activeBusinessId = window.localStorage.getItem('ugcl_current_business_vertical');
    const businessRole = activeBusinessId
      ? auth.user?.business_roles?.find((role) => role.business_vertical_id === activeBusinessId)
      : auth.user?.business_roles?.[0];

    const globalPermissions = auth.user?.permissions || [];
    const businessPermissions = businessRole?.permissions || [];
    const allPermissions = new Set([...globalPermissions, ...businessPermissions]);

    // Keep create actions visible in UI; backend remains the source of truth for authorization.
    permissionState.canCreateReports = true;
    permissionState.canViewDashboards = allPermissions.has('dashboard:view') || !!auth.user?.is_super_admin;
  });

  // Add animation on mount
  useTask$(() => {
    if (isServer) {
      return;
    }

    const cards = document.querySelectorAll('.report-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('animate-fade-in');
      }, index * 50);
    });
  });

  const loadTemplates = $(async () => {
    try {
      state.templatesLoading = true;
      const params: { category?: string; is_active?: boolean } = { is_active: true };
      if (state.selectedCategory !== 'all') {
        params.category = state.selectedCategory;
      }
      const response = await analyticsService.getReportTemplates(params);
      state.templates = response.templates || [];
    } catch {
      state.templates = [];
    } finally {
      state.templatesLoading = false;
    }
  });

  const loadReports = $(async () => {
    try {
      state.loading = true;
      state.error = '';

      const params: any = {};
      if (state.selectedCategory !== 'all') {
        params.category = state.selectedCategory;
      }

      const response = await analyticsService.getReports(params);
      state.reports = response.reports || [];
    } catch (err: any) {
      state.error = err.message || 'Failed to load reports';
    } finally {
      state.loading = false;
    }
  });

  const resolveActiveBusinessVerticalId = $((): string | null => {
    if (isServer) {
      return auth.user?.business_roles?.[0]?.business_vertical_id || null;
    }

    const current = window.localStorage.getItem('ugcl_current_business_vertical');
    if (current) {
      return current;
    }

    return auth.user?.business_roles?.[0]?.business_vertical_id || null;
  });

  const createFromTemplate = $(async (template: ReportTemplate) => {
    try {
      const businessVerticalId = await resolveActiveBusinessVerticalId();
      if (!businessVerticalId) {
        state.error = 'No active business vertical found. Select a business context and try again.';
        return;
      }

      state.creatingTemplateId = template.id;
      const response = await analyticsService.createReportFromTemplate(template.id, {
        name: `${template.name} ${new Date().toLocaleDateString('en-CA')}`,
        description: template.description,
        category: template.category,
        business_vertical_id: businessVerticalId,
      });

      await loadReports();
      nav(`/analytics/reports/view/${response.report.id}`);
    } catch (err: any) {
      state.error = err.message || 'Failed to create report from template';
    } finally {
      state.creatingTemplateId = '';
    }
  });

  const openCreateTemplateModal = $(() => {
    state.error = '';
    state.showCreateTemplateModal = true;
    if (!newTemplateForm.sourceReportId && state.reports.length > 0) {
      const defaultReport = state.reports[0];
      newTemplateForm.sourceReportId = defaultReport.id;
      newTemplateForm.name = `${defaultReport.name} Template`;
      newTemplateForm.description = defaultReport.description || '';
      newTemplateForm.category = defaultReport.category || (state.selectedCategory !== 'all' ? state.selectedCategory : 'Analytics');
    }
  });

  const closeCreateTemplateModal = $(() => {
    state.showCreateTemplateModal = false;
  });

  const createTemplate = $(async () => {
    const sourceReportId = String(newTemplateForm.sourceReportId || '').trim();
    const templateName = String(newTemplateForm.name || '').trim();
    if (!sourceReportId) {
      state.error = 'Select a source report to build template payload.';
      return;
    }
    if (!templateName) {
      state.error = 'Template name is required.';
      return;
    }

    try {
      state.templateBusy = true;
      state.error = '';
      await analyticsService.createReportTemplate({
        report_id: sourceReportId,
        name: templateName,
        description: String(newTemplateForm.description || '').trim(),
        category: String(newTemplateForm.category || '').trim(),
        icon: String(newTemplateForm.icon || '').trim(),
      });

      await loadTemplates();
      state.showCreateTemplateModal = false;
      newTemplateForm.name = '';
      newTemplateForm.description = '';
    } catch (err: any) {
      state.error = err.message || 'Failed to create template';
    } finally {
      state.templateBusy = false;
    }
  });

  const openEditTemplateModal = $((template: ReportTemplate) => {
    state.error = '';
    editTemplateForm.id = template.id;
    editTemplateForm.name = template.name || '';
    editTemplateForm.description = template.description || '';
    editTemplateForm.category = template.category || '';
    editTemplateForm.icon = template.icon || 'i-heroicons-document-duplicate-solid';
    editTemplateForm.isActive = template.is_active !== false;
    state.showEditTemplateModal = true;
  });

  const closeEditTemplateModal = $(() => {
    state.showEditTemplateModal = false;
  });

  const updateTemplate = $(async () => {
    const templateId = String(editTemplateForm.id || '').trim();
    const templateName = String(editTemplateForm.name || '').trim();
    if (!templateId) {
      state.error = 'Template not selected for update.';
      return;
    }
    if (!templateName) {
      state.error = 'Template name is required.';
      return;
    }

    try {
      state.templateBusy = true;
      state.error = '';
      await analyticsService.updateReportTemplate(templateId, {
        name: templateName,
        description: String(editTemplateForm.description || '').trim(),
        category: String(editTemplateForm.category || '').trim(),
        icon: String(editTemplateForm.icon || '').trim(),
        is_active: !!editTemplateForm.isActive,
      });

      await loadTemplates();
      state.showEditTemplateModal = false;
    } catch (err: any) {
      state.error = err.message || 'Failed to update template';
    } finally {
      state.templateBusy = false;
    }
  });

  useTask$(({ track }) => {
    track(() => state.selectedCategory);
    void loadTemplates();
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    // SSR routeLoader may fail when auth token is not available in cookies.
    // Retry client-side with the token from localStorage.
    if (state.reports.length === 0 || (initialData.value as any).error) {
      await loadReports();
    }
  });

  const deleteReport = $(async (reportId: string, reportName: string) => {
    if (!confirm(`Are you sure you want to delete "${reportName}"? This action cannot be undone.`)) return;

    try {
      await analyticsService.deleteReport(reportId);
      state.reports = state.reports.filter((r) => r.id !== reportId);
    } catch (err: any) {
      state.error = err.message || 'Failed to delete report';
    }
  });

  const toggleFavorite = $(async (reportId: string, event: Event) => {
    event.stopPropagation();
    try {
      const report = state.reports.find(r => r.id === reportId);
      if (report) {
        report.is_favorite = !report.is_favorite;
      }
      await analyticsService.toggleFavorite(reportId);
    } catch (err: any) {
      state.error = err.message || 'Failed to update favorite';
      await loadReports(); // Revert on error
    }
  });

  const handleDragStart = $((reportId: string) => {
    draggedItem.value = reportId;
  });

  const handleDragOver = $((event: DragEvent, reportId: string) => {
    event.preventDefault();
    dragOverItem.value = reportId;
  });

  const handleDragEnd = $(() => {
    if (draggedItem.value && dragOverItem.value && draggedItem.value !== dragOverItem.value) {
      const draggedIndex = state.reports.findIndex(r => r.id === draggedItem.value);
      const targetIndex = state.reports.findIndex(r => r.id === dragOverItem.value);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newReports = [...state.reports];
        const [draggedReport] = newReports.splice(draggedIndex, 1);
        newReports.splice(targetIndex, 0, draggedReport);
        state.reports = newReports;
      }
    }
    draggedItem.value = null;
    dragOverItem.value = null;
  });

  const filteredReports = state.reports.filter((report) => {
    const matchesSearch = report.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                         report.description?.toLowerCase().includes(state.searchQuery.toLowerCase());
    const matchesCategory = state.selectedCategory === 'all' || report.category === state.selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (state.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'type':
        return a.report_type.localeCompare(b.report_type);
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const categories = [
    'all',
    'DMS',
    'PMS',
    ...new Set(state.reports.map(r => r.category).filter((category): category is string => Boolean(category) && category !== 'DMS' && category !== 'PMS')),
  ];
  const reportStats = {
    total: state.reports.length,
    favorites: state.reports.filter(r => r.is_favorite).length,
    byType: state.reports.reduce((acc, r) => {
      acc[r.report_type] = (acc[r.report_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <div class="space-y-6">
      {/* Page Header */}
      <div class="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl">
        <div class="px-6 py-6">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 class="text-4xl font-bold flex items-center gap-3 mb-2">
                <i class="i-heroicons-clipboard-document-list-solid h-9 w-9 inline-block" aria-hidden="true"></i>
                Analytics Reports
              </h1>
              <p class="text-indigo-100">Manage and analyze custom reports</p>
            </div>
            <div class="flex gap-3">
              {permissionState.canViewDashboards && (
              <Btn
                onClick$={() => nav('/analytics/dashboards')}
                variant="ghost"
                class="border border-white/30 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
              >
                <i class="i-heroicons-chart-bar-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                Dashboards
              </Btn>
              )}
              {permissionState.canCreateReports && (
              <Btn
                onClick$={() => nav('/analytics/reports/builder')}
                class="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
              >
                <i class="i-heroicons-plus-circle-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                Create Report
              </Btn>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
              <div class="text-3xl font-bold">{reportStats.total}</div>
              <div class="text-sm text-indigo-100">Total Reports</div>
            </div>
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
              <div class="text-3xl font-bold">{reportStats.favorites}</div>
              <div class="text-sm text-indigo-100">Favorites</div>
            </div>
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
              <div class="text-3xl font-bold">{reportStats.byType.chart || 0}</div>
              <div class="text-sm text-indigo-100">Charts</div>
            </div>
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
              <div class="text-3xl font-bold">{reportStats.byType.table || 0}</div>
              <div class="text-sm text-indigo-100">Tables</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div>
        <div class="rounded-lg border border-gray-200 bg-white shadow-lg mb-6">
          <div class="p-6">
            <div class="mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Report Domains</h2>
              <p class="text-sm text-gray-600">DMS and PMS are integrated here as report domains inside the main Reports workspace.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportDomains.map((domain) => {
                const isActive = state.selectedCategory === domain.id;
                return (
                  <button
                    key={domain.id}
                    type="button"
                    class={`rounded-xl border p-5 text-left transition-all ${domain.accent} ${isActive ? 'ring-2 ring-offset-2 ring-indigo-500 shadow-md' : 'hover:shadow-sm'}`}
                    onClick$={() => {
                      state.selectedCategory = domain.id;
                    }}
                  >
                    <div class="flex items-start gap-3">
                      <span class={`${domain.icon} h-6 w-6 flex-shrink-0`}></span>
                      <div>
                        <div class="text-base font-semibold">{domain.title}</div>
                        <p class="mt-1 text-sm opacity-90">{domain.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg mb-6">
          <div class="p-6">
            <div class="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div class="flex-1">
                <div class="relative">
                  <input
                    type="text"
                    placeholder="Search reports by name or description..."
                    value={state.searchQuery}
                    onInput$={(e: any) => state.searchQuery = e.target.value}
                    class="w-full rounded-lg border border-color-border-primary bg-color-surface-secondary py-3 pl-10 pr-4 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none"
                  />
                  <i class="i-heroicons-magnifying-glass-solid absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" aria-hidden="true"></i>
                </div>
              </div>

              {/* View Toggle */}
              <div class="flex gap-2">
                <Btn
                  variant={state.viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick$={() => state.viewMode = 'grid'}
                >
                  <i class="i-heroicons-squares-2x2-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                  Grid
                </Btn>
                <Btn
                  variant={state.viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick$={() => state.viewMode = 'list'}
                >
                  <i class="i-heroicons-list-bullet-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                  List
                </Btn>
              </div>
            </div>

            {/* Filter Pills */}
            <div class="flex flex-wrap gap-2 mt-4">
              {categories.map((cat) => (
                <Btn
                  key={cat || 'all'}
                  onClick$={() => {
                    state.selectedCategory = cat || 'all';
                  }}
                  size="sm"
                  variant={state.selectedCategory === cat ? 'primary' : 'ghost'}
                >
                  {cat === 'all' ? (
                    <>
                      <i class="i-heroicons-clipboard-document-list-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                      All Reports
                    </>
                  ) : (
                    cat
                  )}
                </Btn>
              ))}
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white shadow-lg mb-6">
          <div class="p-6">
            <div class="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 class="text-lg font-semibold text-gray-900">Template Quick Start</h2>
                <p class="text-sm text-gray-600">Create report-builder reports from curated templates, including built-in DMS and PMS reporting packs.</p>
              </div>
              <Btn
                size="sm"
                variant="primary"
                onClick$={() => openCreateTemplateModal()}
              >
                <i class="i-heroicons-plus-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                Create Template
              </Btn>
            </div>

            {state.templatesLoading ? (
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((skeleton) => (
                  <div key={skeleton} class="h-36 rounded-lg bg-gray-100 animate-pulse"></div>
                ))}
              </div>
            ) : state.templates.length > 0 ? (
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {state.templates.map((template) => (
                  <div key={template.id} class="rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all">
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <h3 class="text-sm font-semibold text-gray-900 line-clamp-2">{template.name}</h3>
                      {template.category ? <Badge variant="info">{template.category}</Badge> : null}
                    </div>
                    <p class="text-xs text-gray-600 line-clamp-3 min-h-[3rem]">{template.description || 'Template without description'}</p>
                    <div class="mt-4">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Btn
                          size="sm"
                          class="w-full"
                          disabled={state.creatingTemplateId === template.id}
                          onClick$={() => createFromTemplate(template)}
                        >
                          {state.creatingTemplateId === template.id ? 'Creating...' : 'Use Template'}
                        </Btn>
                        <Btn
                          size="sm"
                          variant="ghost"
                          class="w-full"
                          onClick$={() => openEditTemplateModal(template)}
                        >
                          Edit
                        </Btn>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div class="text-sm text-gray-600">No templates found for the selected category.</div>
            )}
          </div>
        </div>

        {state.showCreateTemplateModal && (
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200">
              <div class="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">Create Template From Report</h3>
                  <p class="text-sm text-gray-600">Generate reusable template payload from an existing report definition.</p>
                </div>
                <Btn size="sm" variant="ghost" onClick$={() => closeCreateTemplateModal()}>Close</Btn>
              </div>
              <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Source Report</label>
                  <select
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={newTemplateForm.sourceReportId}
                    onChange$={(e: any) => {
                      const reportId = String(e.target.value || '');
                      newTemplateForm.sourceReportId = reportId;
                      const selected = state.reports.find((report) => report.id === reportId);
                      if (selected && !newTemplateForm.name) {
                        newTemplateForm.name = `${selected.name} Template`;
                        newTemplateForm.description = selected.description || '';
                        newTemplateForm.category = selected.category || newTemplateForm.category;
                      }
                    }}
                  >
                    <option value="">Select report...</option>
                    {state.reports.map((report) => (
                      <option key={report.id} value={report.id}>{report.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={newTemplateForm.name}
                    onInput$={(e: any) => {
                      newTemplateForm.name = e.target.value;
                    }}
                    placeholder="Monthly Compliance Template"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={newTemplateForm.category}
                    onInput$={(e: any) => {
                      newTemplateForm.category = e.target.value;
                    }}
                    placeholder="DMS / PMS / Analytics"
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[96px]"
                    value={newTemplateForm.description}
                    onInput$={(e: any) => {
                      newTemplateForm.description = e.target.value;
                    }}
                    placeholder="Reusable baseline for document compliance and status analytics"
                  ></textarea>
                </div>
              </div>
              <div class="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <Btn variant="ghost" onClick$={() => closeCreateTemplateModal()} disabled={state.templateBusy}>Cancel</Btn>
                <Btn onClick$={() => createTemplate()} disabled={state.templateBusy}>
                  {state.templateBusy ? 'Creating...' : 'Create Template'}
                </Btn>
              </div>
            </div>
          </div>
        )}

        {state.showEditTemplateModal && (
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200">
              <div class="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">Edit Template</h3>
                  <p class="text-sm text-gray-600">Update template metadata and active status.</p>
                </div>
                <Btn size="sm" variant="ghost" onClick$={() => closeEditTemplateModal()}>Close</Btn>
              </div>
              <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={editTemplateForm.name}
                    onInput$={(e: any) => {
                      editTemplateForm.name = e.target.value;
                    }}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={editTemplateForm.category}
                    onInput$={(e: any) => {
                      editTemplateForm.category = e.target.value;
                    }}
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[96px]"
                    value={editTemplateForm.description}
                    onInput$={(e: any) => {
                      editTemplateForm.description = e.target.value;
                    }}
                  ></textarea>
                </div>

                <div class="md:col-span-2 flex items-center gap-3">
                  <input
                    id="template-active"
                    type="checkbox"
                    checked={editTemplateForm.isActive}
                    onChange$={(e: any) => {
                      editTemplateForm.isActive = !!e.target.checked;
                    }}
                  />
                  <label for="template-active" class="text-sm font-medium text-gray-700">Template is active</label>
                </div>
              </div>
              <div class="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <Btn variant="ghost" onClick$={() => closeEditTemplateModal()} disabled={state.templateBusy}>Cancel</Btn>
                <Btn onClick$={() => updateTemplate()} disabled={state.templateBusy}>
                  {state.templateBusy ? 'Saving...' : 'Save Changes'}
                </Btn>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div>
        {state.error && (
          <div class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <div class="flex items-start gap-3">
              <svg class="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h4 class="font-semibold text-red-800">Error</h4>
                <p class="text-red-700 text-sm mt-1">{state.error}</p>
              </div>
              <Btn size="sm" variant="ghost" onClick$={() => state.error = ''} class="ml-auto text-red-500 hover:text-red-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </Btn>
            </div>
          </div>
        )}

      {/* Loading State — skeleton grid matches card layout to prevent CLS */}
      {state.loading && (
        <div class="py-8">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} class="rounded-2xl bg-gray-100 animate-pulse h-64"></div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Display */}
      {!state.loading && (
        <>
        <div class="py-8">
          {filteredReports.length === 0 ? (
            <div class="text-center py-16">
              <div class="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-700 mb-2">
                {state.searchQuery ? 'No reports found' : 'No reports yet'}
              </h3>
              <p class="text-gray-500 mb-6 max-w-md mx-auto">
                {state.searchQuery
                  ? 'Try adjusting your search or filters to find what you\'re looking for'
                  : 'Get started by creating your first analytics report'}
              </p>
              <Btn
                onClick$={() => nav('/analytics/reports/builder')}
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Create Your First Report
              </Btn>
            </div>
          ) : state.viewMode === 'grid' ? (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredReports.map((report: any) => {
                const config = reportTypeConfig[report.report_type as keyof typeof reportTypeConfig] || reportTypeConfig.table;
                const isDragging = draggedItem.value === report.id;
                const isDragOver = dragOverItem.value === report.id;

                return (
                  <div
                    key={report.id}
                    draggable
                    onDragStart$={() => handleDragStart(report.id)}
                    onDragOver$={(e: DragEvent) => handleDragOver(e, report.id)}
                    onDragEnd$={handleDragEnd}
                    class={`report-card group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-move border-2 ${
                      isDragging ? 'opacity-50 scale-95' : ''
                    } ${
                      isDragOver ? `${config.borderColor} scale-105` : 'border-transparent'
                  } hover:border-gray-300 hover:-translate-y-1`}
                    onClick$={() => nav(`/analytics/reports/view/${report.id}`)}
                  >
                    {/* Card Header */}
                    <div class={`${config.color} p-6 rounded-t-2xl`}>
                      <div class="flex items-start justify-between">
                        <div class={`${config.bgColor} ${config.borderColor} border rounded-xl p-3`}>
                          <i class={`${config.icon} h-8 w-8 inline-block text-white`} aria-hidden="true"></i>
                        </div>
                        <Btn
                          size="sm"
                          variant="ghost"
                          onClick$={(e) => toggleFavorite(report.id, e)}
                          class="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          {report.is_favorite ? (
                            <svg class="w-6 h-6 text-yellow-500 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                            </svg>
                          ) : (
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                            </svg>
                          )}
                        </Btn>
                      </div>

                      <h3 class="text-xl font-bold text-white mt-4 mb-2 line-clamp-2">
                        {report.name}
                      </h3>
                      <p class="text-white/90 text-sm line-clamp-2 min-h-[2.5rem]">
                        {report.description || 'No description available'}
                      </p>
                    </div>

                    {/* Card Body */}
                    <div class="p-6 bg-white rounded-b-2xl">
                      <div class="flex flex-wrap gap-2 mb-4">
                        {report.category && (
                          <Badge variant={getCategoryVariant(report.category)}>
                            {report.category}
                          </Badge>
                        )}
                        <Badge variant="neutral">
                          {report.report_type}
                        </Badge>
                        {report.chart_type && (
                          <Badge variant="neutral">
                            {report.chart_type}
                          </Badge>
                        )}
                        {/* Visibility badge */}
                        {report.is_public ? (
                          <Badge variant="success">Public</Badge>
                        ) : (
                          <span title={(report.allowed_roles || []).length > 0 ? `Roles: ${(report.allowed_roles || []).join(', ')}` : 'Creator only'}>
                            <Badge variant="warning">
                              {(report.allowed_roles || []).length > 0 ? `Private (${(report.allowed_roles || []).length} role${(report.allowed_roles || []).length !== 1 ? 's' : ''})` : 'Private'}
                            </Badge>
                          </span>
                        )}
                      </div>

                      <div class="flex items-center gap-2 text-xs text-gray-500 mb-4">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>

                      {/* Action Buttons */}
                      <div class="flex gap-2">
                        <Btn
                          onClick$={(e) => {
                            e.stopPropagation();
                            nav(`/analytics/reports/view/${report.id}`);
                          }}
                          size="sm"
                          class="flex-1"
                        >
                          View
                        </Btn>
                        {permissionState.canCreateReports && (
                        <Btn
                          size="sm"
                          variant="secondary"
                          onClick$={(e) => {
                            e.stopPropagation();
                            nav(`/analytics/reports/builder?clone=${report.id}`);
                          }}
                          title="Clone"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                        </Btn>
                        )}
                        <Btn
                          size="sm"
                          variant="danger"
                          onClick$={(e) => {
                            e.stopPropagation();
                            deleteReport(report.id, report.name);
                          }}
                          title="Delete"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </Btn>
                      </div>
                    </div>

                    {/* Drag Handle Indicator */}
                    <div class="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg class="w-5 h-5 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div class="space-y-3">
              {filteredReports.map((report: any) => {
                const config = reportTypeConfig[report.report_type as keyof typeof reportTypeConfig] || reportTypeConfig.table;
                const isDragging = draggedItem.value === report.id;
                const isDragOver = dragOverItem.value === report.id;

                return (
                  <div
                    key={report.id}
                    draggable
                    onDragStart$={() => handleDragStart(report.id)}
                    onDragOver$={(e: DragEvent) => handleDragOver(e, report.id)}
                    onDragEnd$={handleDragEnd}
                    class={`report-card group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-move border-2 ${
                      isDragging ? 'opacity-50 scale-98' : ''
                    } ${
                      isDragOver ? `${config.borderColor}` : 'border-transparent'
                  } hover:border-gray-300`}
                    onClick$={() => nav(`/analytics/reports/view/${report.id}`)}
                  >
                    <div class="flex items-center gap-6 p-6">
                      {/* Icon */}
                      <div class={`${config.color} w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <i class={`${config.icon} h-8 w-8 inline-block text-white`} aria-hidden="true"></i>
                      </div>

                      {/* Info */}
                      <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-4">
                          <div class="flex-1 min-w-0">
                            <h3 class="text-lg font-semibold text-gray-900 mb-1 truncate">
                              {report.name}
                            </h3>
                            <p class="text-sm text-gray-600 line-clamp-1 mb-3">
                              {report.description || 'No description'}
                            </p>
                            <div class="flex flex-wrap items-center gap-2">
                              {report.category && (
                                <Badge variant={getCategoryVariant(report.category)}>
                                  {report.category}
                                </Badge>
                              )}
                              <Badge variant="neutral">
                                {report.report_type}
                              </Badge>
                              {report.chart_type && (
                                <Badge variant="neutral">
                                  {report.chart_type}
                                </Badge>
                              )}
                              {/* Visibility badge */}
                              {report.is_public ? (
                                <Badge variant="success">Public</Badge>
                              ) : (
                                <span title={(report.allowed_roles || []).length > 0 ? `Roles: ${(report.allowed_roles || []).join(', ')}` : 'Creator only'}>
                                  <Badge variant="warning">
                                    {(report.allowed_roles || []).length > 0 ? `Private (${(report.allowed_roles || []).length}r)` : 'Private'}
                                  </Badge>
                                </span>
                              )}
                              <span class="text-xs text-gray-500 flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div class="flex items-center gap-2">
                            <Btn
                              size="sm"
                              variant="ghost"
                              onClick$={(e) => toggleFavorite(report.id, e)}
                              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {report.is_favorite ? (
                                <svg class="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                </svg>
                              ) : (
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                                </svg>
                              )}
                            </Btn>
                            <Btn
                              onClick$={(e) => {
                                e.stopPropagation();
                                nav(`/analytics/reports/view/${report.id}`);
                              }}
                              size="sm"
                            >
                              View
                            </Btn>
                            {permissionState.canCreateReports && (
                            <Btn
                              size="sm"
                              variant="secondary"
                              onClick$={(e) => {
                                e.stopPropagation();
                                nav(`/analytics/reports/builder?clone=${report.id}`);
                              }}
                              title="Clone"
                            >
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                              </svg>
                            </Btn>
                            )}
                            <Btn
                              size="sm"
                              variant="danger"
                              onClick$={(e) => {
                                e.stopPropagation();
                                deleteReport(report.id, report.name);
                              }}
                              title="Delete"
                            >
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </Btn>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </>
      )}
      </div>

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
  title: 'Analytics Reports - Professional Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Create, manage, and analyze your custom analytics reports with our professional dashboard',
    },
  ],
};
