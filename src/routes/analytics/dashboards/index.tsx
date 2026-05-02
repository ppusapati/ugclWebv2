// Dashboards List with Professional Design
import { component$, useStore, useSignal, $, isServer, useTask$ } from '@builder.io/qwik';
import { useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services/api-client';
import { analyticsService } from '~/services/analytics.service';
import type { Dashboard, DashboardListResponse } from '~/types/analytics';
import { Btn, Badge } from '~/components/ds';

const dashboardCardConfig = {
  color: 'bg-gradient-to-br from-blue-600 to-violet-600',
  bgColor: 'bg-blue-50/20',
  borderColor: 'border-white/20',
  textColor: 'text-indigo-700',
  icon: 'i-heroicons-chart-bar-solid',
};

// Load dashboards with SSR support
export const useDashboardsData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const response = await ssrApiClient.get<DashboardListResponse>('/dashboards');

    return {
      dashboards: response.dashboards || [],
      total: response.total || 0,
    };
  } catch (error: any) {
    return {
      dashboards: [],
      total: 0,
      error: error.message || 'Failed to load dashboards',
    };
  }
});

export default component$(() => {
  const nav = useNavigate();
  const initialData = useDashboardsData();

  const state = useStore({
    dashboards: initialData.value.dashboards as Dashboard[],
    loading: false,
    error: (initialData.value as any).error || '',
    searchQuery: '',
    viewMode: 'grid' as 'grid' | 'list',
    selectedFilter: 'all' as 'all' | 'default',
    favorites: [] as string[],
  });

  const draggedItem = useSignal<string | null>(null);
  const dragOverItem = useSignal<string | null>(null);

  useTask$(() => {
    if (isServer) {
      return;
    }

    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('animate-fade-in');
      }, index * 50);
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadDashboards = $(async () => {
    try {
      state.loading = true;
      state.error = '';

      const response = await analyticsService.getDashboards();
      state.dashboards = response.dashboards || [];
    } catch (err: any) {
      state.error = err.message || 'Failed to load dashboards';
    } finally {
      state.loading = false;
    }
  });

  // Handle drag and drop
  const handleDragStart = $((dashboardId: string) => {
    draggedItem.value = dashboardId;
  });

  const handleDragOver = $((e: DragEvent, dashboardId?: string) => {
    dragOverItem.value = dashboardId || null;
  });

  const handleDrop = $((e: DragEvent, targetId: string) => {
    if (draggedItem.value && draggedItem.value !== targetId) {
      const fromIndex = state.dashboards.findIndex(d => d.id === draggedItem.value);
      const toIndex = state.dashboards.findIndex(d => d.id === targetId);

      if (fromIndex !== -1 && toIndex !== -1) {
        const newDashboards = [...state.dashboards];
        const [movedItem] = newDashboards.splice(fromIndex, 1);
        newDashboards.splice(toIndex, 0, movedItem);
        state.dashboards = newDashboards;
      }
    }
    draggedItem.value = null;
    dragOverItem.value = null;
  });

  const handleDragEnd = $(() => {
    draggedItem.value = null;
    dragOverItem.value = null;
  });

  // Toggle favorite
  const toggleFavorite = $((dashboardId: string, e: Event) => {
    e.stopPropagation();
    if (state.favorites.includes(dashboardId)) {
      state.favorites = state.favorites.filter(id => id !== dashboardId);
    } else {
      state.favorites = [...state.favorites, dashboardId];
    }
  });

  const deleteDashboard = $(async (dashboardId: string, dashboardName: string) => {
    if (!confirm(`Are you sure you want to delete "${dashboardName}"? This action cannot be undone.`)) return;

    try {
      state.error = '';
      await analyticsService.deleteDashboard(dashboardId);
      state.dashboards = state.dashboards.filter((dashboard) => dashboard.id !== dashboardId);
      state.favorites = state.favorites.filter((id) => id !== dashboardId);
    } catch (err: any) {
      state.error = err.message || 'Failed to delete dashboard';
    }
  });

  // Filtered dashboards
  const getFilteredDashboards = () => {
    let filtered = state.dashboards;

    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query) ||
        d.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (state.selectedFilter === 'default') {
      filtered = filtered.filter(d => d.is_default);
    }

    return filtered;
  };

  const filteredDashboards = getFilteredDashboards();

  // Statistics
  const stats = {
    total: state.dashboards.length,
    favorites: state.favorites.length,
    default: state.dashboards.filter(d => d.is_default).length,
    private: state.dashboards.length,
  };

  return (
    <div class="space-y-6">
      <div class="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl">
        <div class="px-6 py-6">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 class="text-4xl font-bold flex items-center gap-3 mb-2">
                <i class="i-heroicons-chart-bar-solid h-9 w-9 inline-block" aria-hidden="true"></i>
                Dashboards
              </h1>
              <p class="text-indigo-100">Manage and monitor interactive analytics dashboards</p>
            </div>
            <div class="flex gap-3">
              <Btn
                onClick$={() => nav('/analytics/reports')}
                variant="ghost"
                class="border border-white/30 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
              >
                <i class="i-heroicons-clipboard-document-list-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                Reports
              </Btn>
              <Btn
                onClick$={() => nav('/analytics/dashboards/builder')}
                class="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
              >
                <i class="i-heroicons-plus-circle-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                Create Dashboard
              </Btn>
            </div>
          </div>

          {/* Statistics Cards */}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
              onClick$={() => state.selectedFilter = 'all'}
            >
              <div class="text-3xl font-bold">{stats.total}</div>
              <div class="text-sm text-indigo-100">Total Dashboards</div>
            </div>
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
              <div class="text-3xl font-bold">{stats.favorites}</div>
              <div class="text-sm text-indigo-100">Favorites</div>
            </div>
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
              onClick$={() => state.selectedFilter = 'default'}
            >
              <div class="text-3xl font-bold">{stats.default}</div>
              <div class="text-sm text-indigo-100">Default</div>
            </div>
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
              onClick$={() => state.selectedFilter = 'all'}
            >
              <div class="text-3xl font-bold">{stats.private}</div>
              <div class="text-sm text-indigo-100">My Dashboards</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div>
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg mb-6">
          <div class="p-6">
            <div class="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div class="flex-1">
                <div class="relative">
                  <input
                    type="text"
                    placeholder="Search dashboards by name, description, or tags..."
                    value={state.searchQuery}
                    onInput$={(e) => state.searchQuery = (e.target as HTMLInputElement).value}
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
              {(['all', 'default'] as const).map((filter) => (
                <Btn
                  key={filter}
                  onClick$={() => state.selectedFilter = filter}
                  size="sm"
                  variant={state.selectedFilter === filter ? 'primary' : 'ghost'}
                >
                  {filter === 'all' ? (
                    <>
                      <i class="i-heroicons-chart-bar-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                      All Dashboards
                    </>
                  ) : (
                    <>
                      <i class="i-heroicons-star-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                      Default
                    </>
                  )}
                </Btn>
              ))}
            </div>
          </div>
        </div>

        {/* Error Alert */}
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

        {/* Loading */}
        {state.loading && (
          <div class="flex flex-col items-center justify-center py-20">
            <div class="relative">
              <div class="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div class="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
            </div>
            <p class="mt-4 text-gray-600 font-medium">Loading dashboards...</p>
          </div>
        )}

        {/* Dashboards Grid/List */}
        {!state.loading && (
          <>
            {filteredDashboards.length === 0 ? (
              <div class="text-center py-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                <div class="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="i-heroicons-chart-bar-solid h-12 w-12 inline-block text-gray-400" aria-hidden="true"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">
                    {state.searchQuery || state.selectedFilter !== 'all'
                      ? 'No dashboards found'
                      : 'No dashboards yet'}
                </h3>
                <p class="text-gray-500 mb-6 max-w-md mx-auto">
                    {state.searchQuery || state.selectedFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Create your first dashboard to visualize and monitor your data'}
                </p>
                {!state.searchQuery && state.selectedFilter === 'all' && (
                  <Btn
                    onClick$={() => nav('/analytics/dashboards/builder')}
                    class="gap-2"
                  >
                    <i class="i-heroicons-plus-circle-solid h-5 w-5 inline-block" aria-hidden="true"></i>
                    Create Your First Dashboard
                  </Btn>
                )}
              </div>
            ) : (
              state.viewMode === 'grid' ? (
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredDashboards.map((dashboard) => {
                    const isDragging = draggedItem.value === dashboard.id;
                    const isDragOver = dragOverItem.value === dashboard.id;
                    const canDelete = !dashboard.is_default;

                    return (
                      <div
                        key={dashboard.id}
                        draggable
                        onDragStart$={() => handleDragStart(dashboard.id)}
                        onDragOver$={(e) => handleDragOver(e, dashboard.id)}
                        preventdefault:dragover
                        onDrop$={(e) => handleDrop(e, dashboard.id)}
                        preventdefault:drop
                        onDragEnd$={handleDragEnd}
                        class={`dashboard-card group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-move border-2 ${
                          isDragging ? 'opacity-50 scale-95' : ''
                        } ${
                          isDragOver ? 'border-indigo-200 scale-105' : 'border-transparent'
                        } hover:border-gray-300 hover:-translate-y-1`}
                        onClick$={() => nav(`/analytics/dashboards/view/${dashboard.id}`)}
                      >
                        <div class={`${dashboardCardConfig.color} p-6 rounded-t-2xl`}>
                          <div class="flex items-start justify-between gap-3">
                            <div class={`${dashboardCardConfig.bgColor} ${dashboardCardConfig.borderColor} border rounded-xl p-3`}>
                              <i class={`${dashboardCardConfig.icon} h-8 w-8 inline-block text-white`} aria-hidden="true"></i>
                            </div>
                            <Btn
                              size="sm"
                              variant="ghost"
                              onClick$={(e) => toggleFavorite(dashboard.id, e)}
                              class="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                              {state.favorites.includes(dashboard.id) ? (
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
                            {dashboard.name}
                          </h3>
                          <p class="text-white/90 text-sm line-clamp-2 min-h-[2.5rem]">
                            {dashboard.description || 'No description available'}
                          </p>
                        </div>

                        <div class="p-6 bg-white rounded-b-2xl">
                          <div class="flex flex-wrap gap-2 mb-4">
                            <Badge variant="info">
                              {(dashboard.widgets || []).length} widgets
                            </Badge>
                            {dashboard.is_default && <Badge variant="info">Default</Badge>}
                            {dashboard.is_public ? (
                              <Badge variant="success">Public</Badge>
                            ) : (
                              <Badge variant="warning">Private</Badge>
                            )}
                          </div>

                          {dashboard.tags && dashboard.tags.length > 0 && (
                            <div class="flex flex-wrap gap-2 mb-4">
                              {dashboard.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="neutral">{tag}</Badge>
                              ))}
                              {dashboard.tags.length > 3 && <Badge variant="neutral">+{dashboard.tags.length - 3} more</Badge>}
                            </div>
                          )}

                          <div class="flex items-center gap-2 text-xs text-gray-500 mb-4">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            {new Date(dashboard.created_at || dashboard.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>

                          <div class="flex gap-2">
                            <Btn
                              onClick$={(e) => {
                                e.stopPropagation();
                                nav(`/analytics/dashboards/view/${dashboard.id}`);
                              }}
                              size="sm"
                              class="flex-1"
                            >
                              View
                            </Btn>
                            {canDelete && (
                              <Btn
                                size="sm"
                                variant="danger"
                                onClick$={(e) => {
                                  e.stopPropagation();
                                  deleteDashboard(dashboard.id, dashboard.name);
                                }}
                                title="Delete"
                              >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                              </Btn>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div class="space-y-3">
                  {filteredDashboards.map((dashboard) => {
                    const isDragging = draggedItem.value === dashboard.id;
                    const isDragOver = dragOverItem.value === dashboard.id;
                    const canDelete = !dashboard.is_default;

                    return (
                      <div
                        key={dashboard.id}
                        draggable
                        onDragStart$={() => handleDragStart(dashboard.id)}
                        onDragOver$={(e) => handleDragOver(e, dashboard.id)}
                        preventdefault:dragover
                        onDrop$={(e) => handleDrop(e, dashboard.id)}
                        preventdefault:drop
                        onDragEnd$={handleDragEnd}
                        class={`dashboard-card group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-move border-2 ${
                          isDragging ? 'opacity-50 scale-98' : ''
                        } ${
                          isDragOver ? 'border-indigo-200' : 'border-transparent'
                        } hover:border-gray-300`}
                        onClick$={() => nav(`/analytics/dashboards/view/${dashboard.id}`)}
                      >
                        <div class="flex items-center gap-6 p-6">
                          <div class={`${dashboardCardConfig.color} w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <i class={`${dashboardCardConfig.icon} h-8 w-8 inline-block text-white`} aria-hidden="true"></i>
                          </div>

                          <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-4">
                              <div class="flex-1 min-w-0">
                                <h3 class="text-lg font-semibold text-gray-900 mb-1 truncate">
                                  {dashboard.name}
                                </h3>
                                <p class="text-sm text-gray-600 line-clamp-1 mb-3">
                                  {dashboard.description || 'No description'}
                                </p>
                                <div class="flex flex-wrap items-center gap-2">
                                  <Badge variant="info">{(dashboard.widgets || []).length} widgets</Badge>
                                  {dashboard.is_default && <Badge variant="info">Default</Badge>}
                                  {dashboard.is_public ? <Badge variant="success">Public</Badge> : <Badge variant="warning">Private</Badge>}
                                  {dashboard.tags?.slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="neutral">{tag}</Badge>
                                  ))}
                                  <span class="text-xs text-gray-500 flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    {new Date(dashboard.created_at || dashboard.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>

                              <div class="flex items-center gap-2">
                                <Btn
                                  size="sm"
                                  variant="ghost"
                                  onClick$={(e) => toggleFavorite(dashboard.id, e)}
                                  class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  {state.favorites.includes(dashboard.id) ? (
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
                                    nav(`/analytics/dashboards/view/${dashboard.id}`);
                                  }}
                                  size="sm"
                                >
                                  View
                                </Btn>
                                {canDelete && (
                                  <Btn
                                    size="sm"
                                    variant="danger"
                                    onClick$={(e) => {
                                      e.stopPropagation();
                                      deleteDashboard(dashboard.id, dashboard.name);
                                    }}
                                    title="Delete"
                                  >
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                  </Btn>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}

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
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Dashboards - Analytics',
};