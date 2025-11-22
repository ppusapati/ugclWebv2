import { component$, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { documentService } from '~/services/document.service';
import type { DocumentStatistics } from '~/types/document';

interface DocumentStatsProps {
  businessVerticalId?: string;
}

export const DocumentStats = component$<DocumentStatsProps>((props) => {
  const { businessVerticalId } = props;

  const state = useStore({
    stats: null as DocumentStatistics | null,
    loading: true,
    error: '',
  });

  const loadStats = $(async () => {
    state.loading = true;
    state.error = '';

    try {
      const stats = await documentService.getStatistics(businessVerticalId);
      state.stats = stats;
    } catch (error: any) {
      state.error = error.message || 'Failed to load statistics';
    } finally {
      state.loading = false;
    }
  });

  useVisibleTask$(async () => {
    await loadStats();
  });

  if (state.loading) {
    return (
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="animate-pulse space-y-4">
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          <div class="h-8 bg-gray-200 rounded"></div>
          <div class="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (state.error || !state.stats) {
    return (
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p class="text-red-600 text-sm">{state.error || 'Failed to load statistics'}</p>
      </div>
    );
  }

  const stats = state.stats;

  return (
    <div class="space-y-6">
      {/* Overview Cards */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Documents</p>
              <p class="mt-2 text-3xl font-semibold text-gray-900">{stats.total_documents}</p>
            </div>
            <div class="bg-blue-100 rounded-full p-3">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Storage</p>
              <p class="mt-2 text-3xl font-semibold text-gray-900">
                {documentService.formatFileSize(stats.total_size)}
              </p>
            </div>
            <div class="bg-green-100 rounded-full p-3">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Views</p>
              <p class="mt-2 text-3xl font-semibold text-gray-900">{stats.total_views}</p>
            </div>
            <div class="bg-purple-100 rounded-full p-3">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Downloads</p>
              <p class="mt-2 text-3xl font-semibold text-gray-900">{stats.total_downloads}</p>
            </div>
            <div class="bg-orange-100 rounded-full p-3">
              <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Documents by Status */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Documents by Status</h3>
        <div class="space-y-3">
          {Object.entries(stats.documents_by_status).map(([status, count]) => (
            <div key={status} class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class={`w-3 h-3 rounded-full ${
                  status === 'approved' ? 'bg-green-500' :
                  status === 'pending' ? 'bg-yellow-500' :
                  status === 'draft' ? 'bg-gray-500' :
                  status === 'rejected' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}></div>
                <span class="text-sm text-gray-700 capitalize">{status}</span>
              </div>
              <span class="text-sm font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Uploads */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Uploads</h3>
        <div class="space-y-3">
          {stats.recent_uploads.length === 0 ? (
            <p class="text-sm text-gray-500">No recent uploads</p>
          ) : (
            stats.recent_uploads.map((doc) => (
              <div key={doc.id} class="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                <div class="flex-shrink-0 w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <span class="text-xl">{documentService.isImage(doc.file_name) ? '🖼️' : '📄'}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                  <p class="text-xs text-gray-500">
                    {doc.uploaded_by?.name} • {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div class="text-xs text-gray-500">
                  {documentService.formatFileSize(doc.file_size)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Categories */}
      {stats.top_categories.length > 0 && (
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
          <div class="space-y-3">
            {stats.top_categories.map((cat) => (
              <div key={cat.category_id} class="flex items-center justify-between">
                <span class="text-sm text-gray-700">{cat.category_name}</span>
                <span class="text-sm font-medium text-gray-900">{cat.count} docs</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
