// Dashboards List with Professional Design
import { component$, useStore, useSignal, $ } from '@builder.io/qwik';
import { useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '../../../../services/api-client';
import { analyticsService } from '../../../../services/analytics.service';
import type { Dashboard, DashboardListResponse } from '../../../../types/analytics';

// Load dashboards with SSR support
export const useDashboardsData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    console.log('[DASHBOARDS LOADER] Fetching dashboards');

    const response = await ssrApiClient.get<DashboardListResponse>('/dashboards');

    console.log('[DASHBOARDS LOADER] Dashboards fetched successfully:', response.dashboards?.length || 0);

    return {
      dashboards: response.dashboards || [],
      total: response.total || 0,
    };
  } catch (error: any) {
    console.error('[DASHBOARDS LOADER] Failed to load dashboards:', error);
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
    selectedFilter: 'all' as 'all' | 'default' | 'public' | 'private',
    favorites: [] as string[],
  });

  const draggedItem = useSignal<string | null>(null);

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

  const handleDragOver = $((e: DragEvent) => {
    e.preventDefault();
  });

  const handleDrop = $((e: DragEvent, targetId: string) => {
    e.preventDefault();
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
  });

  const handleDragEnd = $(() => {
    draggedItem.value = null;
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
    } else if (state.selectedFilter === 'public') {
      filtered = filtered.filter(d => d.is_public);
    } else if (state.selectedFilter === 'private') {
      filtered = filtered.filter(d => !d.is_public);
    }

    return filtered;
  };

  const filteredDashboards = getFilteredDashboards();

  // Statistics
  const stats = {
    total: state.dashboards.length,
    favorites: state.favorites.length,
    default: state.dashboards.filter(d => d.is_default).length,
    public: state.dashboards.filter(d => d.is_public).length,
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with Gradient */}
      <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl">
        <div class="max-w-screen-2xl mx-auto px-6 py-8">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 class="text-4xl font-bold flex items-center gap-3 mb-2">
                📊 Dashboards
              </h1>
              <p class="text-purple-100">Create and manage interactive analytics dashboards</p>
            </div>
            <div class="flex gap-3">
              <button
                onClick$={() => nav('/admin/analytics/reports')}
                class="btn bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
              >
                📋 Reports
              </button>
              <button
                onClick$={() => nav('/admin/analytics/dashboards/builder')}
                class="btn bg-white text-purple-600 hover:bg-purple-50 shadow-lg"
              >
                ➕ Create Dashboard
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
              onClick$={() => state.selectedFilter = 'all'}
            >
              <div class="text-3xl font-bold">{stats.total}</div>
              <div class="text-sm text-purple-100">Total Dashboards</div>
            </div>
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
              <div class="text-3xl font-bold">{stats.favorites}</div>
              <div class="text-sm text-purple-100">Favorites</div>
            </div>
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
              onClick$={() => state.selectedFilter = 'default'}
            >
              <div class="text-3xl font-bold">{stats.default}</div>
              <div class="text-sm text-purple-100">Default</div>
            </div>
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
              onClick$={() => state.selectedFilter = 'public'}
            >
              <div class="text-3xl font-bold">{stats.public}</div>
              <div class="text-sm text-purple-100">Public</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div class="max-w-screen-2xl mx-auto px-6 py-6">
        <div class="card bg-white dark:bg-gray-800 shadow-xl mb-6">
          <div class="card-body">
            <div class="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div class="flex-1">
                <div class="relative">
                  <input
                    type="text"
                    placeholder="🔍 Search dashboards by name, description, or tags..."
                    value={state.searchQuery}
                    onInput$={(e) => state.searchQuery = (e.target as HTMLInputElement).value}
                    class="input input-bordered w-full pl-10 bg-gray-50 dark:bg-gray-700"
                  />
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                </div>
              </div>

              {/* View Toggle */}
              <div class="btn-group">
                <button
                  class={`btn ${state.viewMode === 'grid' ? 'btn-active btn-primary' : 'btn-ghost'}`}
                  onClick$={() => state.viewMode = 'grid'}
                >
                  ▦ Grid
                </button>
                <button
                  class={`btn ${state.viewMode === 'list' ? 'btn-active btn-primary' : 'btn-ghost'}`}
                  onClick$={() => state.viewMode = 'list'}
                >
                  ☰ List
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div class="flex flex-wrap gap-2 mt-4">
              {(['all', 'default', 'public', 'private'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick$={() => state.selectedFilter = filter}
                  class={`btn btn-sm ${
                    state.selectedFilter === filter
                      ? 'btn-primary'
                      : 'btn-ghost'
                  }`}
                >
                  {filter === 'all' ? '📊 All Dashboards' :
                   filter === 'default' ? '⭐ Default' :
                   filter === 'public' ? '🌐 Public' :
                   '🔒 Private'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {state.error && (
          <div class="alert alert-error shadow-lg mb-6">
            <span>⚠️ {state.error}</span>
          </div>
        )}

        {/* Loading */}
        {state.loading && (
          <div class="flex flex-col items-center justify-center py-20">
            <span class="loading loading-spinner loading-lg text-purple-600"></span>
            <p class="mt-4 text-gray-600 dark:text-gray-400">Loading dashboards...</p>
          </div>
        )}

        {/* Dashboards Grid/List */}
        {!state.loading && (
          <>
            {filteredDashboards.length === 0 ? (
              <div class="card bg-white dark:bg-gray-800 shadow-xl">
                <div class="card-body items-center text-center py-20">
                  <div class="text-8xl mb-6 animate-bounce">📊</div>
                  <h3 class="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">
                    {state.searchQuery || state.selectedFilter !== 'all'
                      ? 'No dashboards found'
                      : 'No dashboards yet'}
                  </h3>
                  <p class="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                    {state.searchQuery || state.selectedFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Create your first dashboard to visualize and monitor your data'}
                  </p>
                  {!state.searchQuery && state.selectedFilter === 'all' && (
                    <button
                      onClick$={() => nav('/admin/analytics/dashboards/builder')}
                      class="btn btn-primary btn-lg gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      <span class="text-xl">➕</span>
                      Create Your First Dashboard
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div class={state.viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
              }>
                {filteredDashboards.map((dashboard) => (
                  <div
                    key={dashboard.id}
                    draggable
                    onDragStart$={() => handleDragStart(dashboard.id)}
                    onDragOver$={handleDragOver}
                    onDrop$={(e) => handleDrop(e, dashboard.id)}
                    onDragEnd$={handleDragEnd}
                    class={`card bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-move group ${
                      draggedItem.value === dashboard.id ? 'opacity-50 scale-95' : 'hover:scale-102'
                    }`}
                    onClick$={() => nav(`/admin/analytics/dashboards/view/${dashboard.id}`)}
                  >
                    {/* Card Header with Gradient */}
                    <div class="h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-2xl"></div>

                    <div class="card-body">
                      <div class="flex items-start justify-between gap-3 mb-3">
                        <div class="flex-1">
                          <h3 class="card-title text-lg flex items-center gap-2 group-hover:text-purple-600 transition-colors">
                            <span class="text-2xl">📊</span>
                            <span class="line-clamp-1">{dashboard.name}</span>
                          </h3>
                          {dashboard.description && (
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                              {dashboard.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick$={(e) => toggleFavorite(dashboard.id, e)}
                          class="btn btn-circle btn-ghost btn-sm text-xl hover:scale-110 transition-transform"
                        >
                          {state.favorites.includes(dashboard.id) ? '⭐' : '☆'}
                        </button>
                      </div>

                      {/* Widgets Info */}
                      {dashboard.widgets && dashboard.widgets.length > 0 && (
                        <div class="flex items-center gap-2 mb-3">
                          <div class="badge badge-lg gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                            <span>🧩</span>
                            <span>{dashboard.widgets.length} widgets</span>
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {dashboard.tags && dashboard.tags.length > 0 && (
                        <div class="flex flex-wrap gap-2 mb-3">
                          {dashboard.tags.slice(0, 3).map((tag) => (
                            <span key={tag} class="badge badge-sm badge-outline">{tag}</span>
                          ))}
                          {dashboard.tags.length > 3 && (
                            <span class="badge badge-sm badge-ghost">+{dashboard.tags.length - 3} more</span>
                          )}
                        </div>
                      )}

                      {/* Badges */}
                      <div class="flex flex-wrap gap-2 mb-3">
                        {dashboard.is_default && (
                          <span class="badge badge-primary gap-1">
                            <span>⭐</span>
                            <span>Default</span>
                          </span>
                        )}
                        {dashboard.is_public && (
                          <span class="badge badge-success gap-1">
                            <span>🌐</span>
                            <span>Public</span>
                          </span>
                        )}
                        {!dashboard.is_public && (
                          <span class="badge badge-ghost gap-1">
                            <span>🔒</span>
                            <span>Private</span>
                          </span>
                        )}
                      </div>

                      {/* Footer */}
                      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <span>
                          📅 {new Date(dashboard.updated_at).toLocaleDateString()}
                        </span>
                        <span class="text-purple-600 dark:text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          View →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Dashboards - Analytics',
};