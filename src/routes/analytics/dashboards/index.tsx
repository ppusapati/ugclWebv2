// Dashboards List with Professional Design
import { component$, useStore, useSignal, $ } from '@builder.io/qwik';
import { useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services/api-client';
import { analyticsService } from '~/services/analytics.service';
import type { Dashboard, DashboardListResponse } from '~/types/analytics';
import { Btn, Badge, Alert } from '~/components/ds';

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
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with Gradient */}
      <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl">
        <div class="space-y-6">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 class="text-4xl font-bold flex items-center gap-3 mb-2">
                <i class="i-heroicons-chart-bar-solid h-9 w-9 inline-block" aria-hidden="true"></i>
                Dashboards
              </h1>
              <p class="text-purple-100">Create and manage interactive analytics dashboards</p>
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
                class="bg-white text-purple-600 hover:bg-purple-50 shadow-lg"
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
              onClick$={() => state.selectedFilter = 'all'}
            >
              <div class="text-3xl font-bold">{stats.private}</div>
              <div class="text-sm text-purple-100">My Dashboards</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div class="container mx-auto px-4 py-6">
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
          <Alert variant="error" class="mb-6 shadow-lg">
            <span class="flex items-center gap-2">
              <i class="i-heroicons-exclamation-triangle-solid h-5 w-5 inline-block" aria-hidden="true"></i>
              {state.error}
            </span>
          </Alert>
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
              <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                <div class="p-8 flex flex-col items-center text-center py-20">
                  <i class="i-heroicons-chart-bar-solid mb-6 inline-block h-20 w-20 animate-bounce text-purple-500" aria-hidden="true"></i>
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
                    <Btn
                      onClick$={() => nav('/analytics/dashboards/builder')}
                      size="lg"
                      class="gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      <i class="i-heroicons-plus-circle-solid h-5 w-5 inline-block" aria-hidden="true"></i>
                      Create Your First Dashboard
                    </Btn>
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
                    class={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-move group ${
                      draggedItem.value === dashboard.id ? 'opacity-50 scale-95' : 'hover:scale-102'
                    }`}
                    onClick$={() => nav(`/analytics/dashboards/view/${dashboard.id}`)}
                  >
                    {/* Card Header with Gradient */}
                    <div class="h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-lg"></div>

                    <div class="p-6">
                      <div class="flex items-start justify-between gap-3 mb-3">
                        <div class="flex-1">
                          <h3 class="text-lg font-semibold flex items-center gap-2 group-hover:text-purple-600 transition-colors">
                            <i class="i-heroicons-chart-bar-solid h-6 w-6 inline-block text-indigo-600" aria-hidden="true"></i>
                            <span class="line-clamp-1">{dashboard.name}</span>
                          </h3>
                          {dashboard.description && (
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                              {dashboard.description}
                            </p>
                          )}
                        </div>
                        <Btn
                          onClick$={(e) => toggleFavorite(dashboard.id, e)}
                          variant="ghost"
                          size="sm"
                          class="rounded-full !p-2 text-xl hover:scale-110 transition-transform"
                        >
                          {state.favorites.includes(dashboard.id) ? (
                            <i class="i-heroicons-star-solid h-5 w-5 inline-block text-amber-500" aria-hidden="true"></i>
                          ) : (
                            <i class="i-heroicons-star h-5 w-5 inline-block text-gray-500" aria-hidden="true"></i>
                          )}
                        </Btn>
                      </div>

                      {/* Widgets Info */}
                      {dashboard.widgets && dashboard.widgets.length > 0 && (
                        <div class="flex items-center gap-2 mb-3">
                          <Badge variant="info" class="gap-2 px-3 py-1">
                            <i class="i-heroicons-squares-plus-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                            <span>{dashboard.widgets.length} widgets</span>
                          </Badge>
                        </div>
                      )}

                      {/* Tags */}
                      {dashboard.tags && dashboard.tags.length > 0 && (
                        <div class="flex flex-wrap gap-2 mb-3">
                          {dashboard.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="neutral">{tag}</Badge>
                          ))}
                          {dashboard.tags.length > 3 && (
                            <Badge variant="neutral">+{dashboard.tags.length - 3} more</Badge>
                          )}
                        </div>
                      )}

                      {/* Badges */}
                      <div class="flex flex-wrap gap-2 mb-3">
                        {dashboard.is_default && (
                          <Badge variant="info" class="gap-1">
                            <i class="i-heroicons-star-solid h-3.5 w-3.5 inline-block" aria-hidden="true"></i>
                            <span>Default</span>
                          </Badge>
                        )}
                        {dashboard.is_public && (
                          <Badge variant="success" class="gap-1">
                            <i class="i-heroicons-globe-alt-solid h-3.5 w-3.5 inline-block" aria-hidden="true"></i>
                            <span>Public</span>
                          </Badge>
                        )}
                        {!dashboard.is_public && (
                          <Badge variant="neutral" class="gap-1">
                            <i class="i-heroicons-lock-closed-solid h-3.5 w-3.5 inline-block" aria-hidden="true"></i>
                            <span>Private</span>
                          </Badge>
                        )}
                      </div>

                      {/* Footer */}
                      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <span class="flex items-center gap-1.5">
                          <i class="i-heroicons-calendar-days-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                          {new Date(dashboard.updated_at).toLocaleDateString()}
                        </span>
                        <span class="text-purple-600 dark:text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          View
                          <i class="i-heroicons-arrow-right-solid ml-1 h-3.5 w-3.5 inline-block" aria-hidden="true"></i>
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