// Reports List Screen - Enhanced Professional Design
import { component$, isServer, useStore, $, useSignal, useTask$ } from '@builder.io/qwik';
import { useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '../../../../services/api-client';
import { analyticsService } from '../../../../services/analytics.service';
import type { ReportDefinition, ReportListResponse } from '../../../../types/analytics';

// Load reports with SSR support
export const useReportsData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    console.log('[REPORTS LOADER] Fetching reports from /reports/definitions');

    const response = await ssrApiClient.get<ReportListResponse>('/reports/definitions');

    console.log('[REPORTS LOADER] Reports fetched successfully:', response.reports?.length || 0);

    return {
      reports: response.reports || [],
      total: response.total || 0,
    };
  } catch (error: any) {
    console.error('[REPORTS LOADER] Failed to load reports:', error);
    return {
      reports: [],
      total: 0,
      error: error.message || 'Failed to load reports',
    };
  }
});

// Report type icons and colors
const reportTypeConfig = {
  table: { icon: '📊', color: 'bg-gradient-to-br from-blue-600 to-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
  chart: { icon: '📈', color: 'bg-gradient-to-br from-violet-600 to-fuchsia-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700' },
  kpi: { icon: '🎯', color: 'bg-gradient-to-br from-emerald-600 to-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' },
  pivot: { icon: '🔲', color: 'bg-gradient-to-br from-amber-500 to-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700' },
};

const categoryColors: Record<string, string> = {
  Analytics: 'badge-primary',
  Operations: 'badge-secondary',
  Finance: 'badge-success',
  HR: 'badge-warning',
  default: 'badge-ghost',
};

export default component$(() => {
  const nav = useNavigate();
  const initialData = useReportsData();
  const draggedItem = useSignal<string | null>(null);
  const dragOverItem = useSignal<string | null>(null);

  const state = useStore({
    reports: initialData.value.reports as ReportDefinition[],
    loading: false,
    error: (initialData.value as any).error || '',
    searchQuery: '',
    selectedCategory: 'all',
    viewMode: 'grid' as 'grid' | 'list',
    sortBy: 'recent' as 'recent' | 'name' | 'type',
    showFilters: false,
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

  const categories = ['all', ...new Set(state.reports.map(r => r.category).filter(Boolean))];
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
      {/* Standard Admin Header */}
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-6 py-6">
          {/* Header Content */}
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="bg-blue-600 rounded-lg p-3">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">Analytics Reports</h1>
                <p class="text-sm text-gray-600">Manage and analyze custom reports</p>
              </div>
            </div>
            <div class="flex gap-3">
              <button
                onClick$={() => nav('/admin/analytics/dashboards')}
                class="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Dashboards
              </button>
              <button
                onClick$={() => nav('/admin/analytics/reports/builder')}
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Create Report
              </button>
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-blue-700 text-sm font-medium">Total Reports</p>
                  <p class="text-2xl font-bold text-blue-900 mt-1">{reportStats.total}</p>
                </div>
                <div class="bg-blue-100 rounded-lg p-2">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
              </div>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-yellow-700 text-sm font-medium">Favorites</p>
                  <p class="text-2xl font-bold text-yellow-900 mt-1">{reportStats.favorites}</p>
                </div>
                <div class="bg-yellow-100 rounded-lg p-2">
                  <svg class="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-purple-700 text-sm font-medium">Charts</p>
                  <p class="text-2xl font-bold text-purple-900 mt-1">{reportStats.byType.chart || 0}</p>
                </div>
                <div class="bg-purple-100 rounded-lg p-2">
                  <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                  </svg>
                </div>
              </div>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-green-700 text-sm font-medium">Tables</p>
                  <p class="text-2xl font-bold text-green-900 mt-1">{reportStats.byType.table || 0}</p>
                </div>
                <div class="bg-green-100 rounded-lg p-2">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Controls Section */}
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-6 py-5">
          <div class="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div class="flex-1 relative">
              <input
                type="text"
                class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Search reports by name or description..."
                value={state.searchQuery}
                onInput$={(e: any) => state.searchQuery = e.target.value}
              />
              <svg class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              {state.searchQuery && (
                <button
                  onClick$={() => state.searchQuery = ''}
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div class="flex gap-2 overflow-x-auto pb-2 lg:pb-0 flex-shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat || 'all'}
                  onClick$={() => state.selectedCategory = cat || 'all'}
                  class={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap border ${
                    state.selectedCategory === cat
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat || 'Unknown'}
                </button>
              ))}
            </div>

            {/* View Controls */}
            <div class="flex gap-2 flex-shrink-0">
              <select
                class="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                value={state.sortBy}
                onChange$={(e: any) => state.sortBy = e.target.value}
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="type">Type</option>
              </select>

              <div class="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick$={() => state.viewMode = 'grid'}
                  class={`px-3 py-2.5 transition-colors ${state.viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                  </svg>
                </button>
                <button
                  onClick$={() => state.viewMode = 'list'}
                  class={`px-3 py-2.5 transition-colors border-l border-gray-200 ${state.viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {state.error && (
        <div class="max-w-7xl mx-auto px-6 py-4">
              <div class="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3 shadow-sm">
            <svg class="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
                  <h4 class="font-semibold text-red-800">Error</h4>
                  <p class="text-red-700 text-sm mt-1">{state.error}</p>
            </div>
            <button onClick$={() => state.error = ''} class="ml-auto text-red-500 hover:text-red-700">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {state.loading && (
        <div class="flex flex-col items-center justify-center py-20">
          <div class="relative">
            <div class="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div class="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p class="mt-4 text-gray-600 font-medium">Loading reports...</p>
        </div>
      )}

      {/* Reports Display */}
      {!state.loading && (
        <div class="max-w-7xl mx-auto px-6 py-8">
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
              <button
                onClick$={() => nav('/admin/analytics/reports/builder')}
                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Create Your First Report
              </button>
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
                    onClick$={() => nav(`/admin/analytics/reports/view/${report.id}`)}
                  >
                    {/* Card Header */}
                    <div class={`${config.color} p-6 rounded-t-2xl`}>
                      <div class="flex items-start justify-between">
                        <div class={`${config.bgColor} ${config.borderColor} border rounded-xl p-3`}>
                          <span class="text-3xl">{config.icon}</span>
                        </div>
                        <button
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
                        </button>
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
                          <span class={`badge ${categoryColors[report.category] || categoryColors.default} badge-sm font-medium`}>
                            {report.category}
                          </span>
                        )}
                        <span class="badge badge-outline badge-sm capitalize border-gray-300 text-gray-700">
                          {report.report_type}
                        </span>
                        {report.chart_type && (
                          <span class="badge badge-ghost badge-sm capitalize bg-gray-100 text-gray-700">
                            {report.chart_type}
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
                        <button
                          onClick$={(e) => {
                            e.stopPropagation();
                            nav(`/admin/analytics/reports/view/${report.id}`);
                          }}
                          class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          View
                        </button>
                        <button
                          onClick$={(e) => {
                            e.stopPropagation();
                            nav(`/admin/analytics/reports/builder?clone=${report.id}`);
                          }}
                          class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                          title="Clone"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                        </button>
                        <button
                          onClick$={(e) => {
                            e.stopPropagation();
                            deleteReport(report.id, report.name);
                          }}
                          class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium text-sm"
                          title="Delete"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
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
                    onClick$={() => nav(`/admin/analytics/reports/view/${report.id}`)}
                  >
                    <div class="flex items-center gap-6 p-6">
                      {/* Icon */}
                      <div class={`${config.color} w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <span class="text-2xl">{config.icon}</span>
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
                                <span class={`badge ${categoryColors[report.category] || categoryColors.default} badge-sm`}>
                                  {report.category}
                                </span>
                              )}
                              <span class="badge badge-outline badge-sm capitalize">
                                {report.report_type}
                              </span>
                              {report.chart_type && (
                                <span class="badge badge-ghost badge-sm capitalize">
                                  {report.chart_type}
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
                            <button
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
                            </button>
                            <button
                              onClick$={(e) => {
                                e.stopPropagation();
                                nav(`/admin/analytics/reports/view/${report.id}`);
                              }}
                              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                            >
                              View
                            </button>
                            <button
                              onClick$={(e) => {
                                e.stopPropagation();
                                nav(`/admin/analytics/reports/builder?clone=${report.id}`);
                              }}
                              class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                              title="Clone"
                            >
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                              </svg>
                            </button>
                            <button
                              onClick$={(e) => {
                                e.stopPropagation();
                                deleteReport(report.id, report.name);
                              }}
                              class="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                              title="Delete"
                            >
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
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
