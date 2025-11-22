import { component$, useStore, useVisibleTask$, $, type QRL } from '@builder.io/qwik';
import { documentService } from '~/services/document.service';
import type { Document, DocumentVersion, DocumentAuditLog } from '~/types/document';

interface DocumentViewerProps {
  documentId: string;
  onClose?: QRL<() => void>;
}

export const DocumentViewer = component$<DocumentViewerProps>((props) => {
  const { documentId, onClose } = props;

  const state = useStore({
    document: null as Document | null,
    versions: [] as DocumentVersion[],
    auditLogs: [] as DocumentAuditLog[],
    loading: true,
    error: '',
    activeTab: 'details' as 'details' | 'versions' | 'audit',
  });

  const loadDocument = $(async () => {
    state.loading = true;
    state.error = '';

    try {
      const document = await documentService.getDocument(documentId);
      state.document = document;
    } catch (error: any) {
      state.error = error.message || 'Failed to load document';
    } finally {
      state.loading = false;
    }
  });

  const loadVersions = $(async () => {
    try {
      state.versions = await documentService.getVersions(documentId);
    } catch (error: any) {
      console.error('Failed to load versions:', error);
    }
  });

  const loadAuditLogs = $(async () => {
    try {
      state.auditLogs = await documentService.getAuditLogs(documentId);
    } catch (error: any) {
      console.error('Failed to load audit logs:', error);
    }
  });

  useVisibleTask$(async () => {
    await loadDocument();
    await loadVersions();
    await loadAuditLogs();
  });

  const handleDownload = $(async () => {
    if (!state.document) return;

    try {
      await documentService.downloadDocument(documentId, state.document.file_name);
    } catch (error: any) {
      alert('Download failed: ' + error.message);
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (state.loading) {
    return (
      <div class="bg-white rounded-lg shadow-lg p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading document...</p>
      </div>
    );
  }

  if (state.error || !state.document) {
    return (
      <div class="bg-white rounded-lg shadow-lg p-8">
        <div class="text-center">
          <p class="text-red-600">{state.error || 'Document not found'}</p>
          {onClose && (
            <button
              class="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              onClick$={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  const doc = state.document;

  return (
    <div class="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div class="border-b border-gray-200 p-6">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-gray-900">{doc.title}</h2>
            <p class="mt-1 text-sm text-gray-500">{doc.file_name}</p>
          </div>
          {onClose && (
            <button
              class="ml-4 text-gray-400 hover:text-gray-500"
              onClick$={onClose}
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          {doc.tags?.map((tag) => (
            <span key={tag.id} class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {tag.name}
            </span>
          ))}
        </div>

        <div class="mt-4 flex gap-3">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            onClick$={handleDownload}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px">
          <button
            class={`px-6 py-3 text-sm font-medium border-b-2 ${
              state.activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick$={() => (state.activeTab = 'details')}
          >
            Details
          </button>
          <button
            class={`px-6 py-3 text-sm font-medium border-b-2 ${
              state.activeTab === 'versions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick$={() => (state.activeTab = 'versions')}
          >
            Versions ({state.versions.length})
          </button>
          <button
            class={`px-6 py-3 text-sm font-medium border-b-2 ${
              state.activeTab === 'audit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick$={() => (state.activeTab = 'audit')}
          >
            Activity ({state.auditLogs.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div class="p-6">
        {/* Details Tab */}
        {state.activeTab === 'details' && (
          <div class="space-y-4">
            {doc.description && (
              <div>
                <h3 class="text-sm font-medium text-gray-700">Description</h3>
                <p class="mt-1 text-sm text-gray-900">{doc.description}</p>
              </div>
            )}

            <div class="grid grid-cols-2 gap-4">
              <div>
                <h3 class="text-sm font-medium text-gray-700">Category</h3>
                <p class="mt-1 text-sm text-gray-900">{doc.category?.name || 'Uncategorized'}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">Status</h3>
                <p class="mt-1 text-sm text-gray-900 capitalize">{doc.status}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">File Size</h3>
                <p class="mt-1 text-sm text-gray-900">{documentService.formatFileSize(doc.file_size)}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">File Type</h3>
                <p class="mt-1 text-sm text-gray-900">{doc.file_type}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">Version</h3>
                <p class="mt-1 text-sm text-gray-900">v{doc.version}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">Uploaded By</h3>
                <p class="mt-1 text-sm text-gray-900">{doc.uploaded_by?.name || 'Unknown'}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">Created</h3>
                <p class="mt-1 text-sm text-gray-900">{formatDate(doc.created_at)}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">Last Modified</h3>
                <p class="mt-1 text-sm text-gray-900">{formatDate(doc.updated_at)}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">Views</h3>
                <p class="mt-1 text-sm text-gray-900">{doc.view_count}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">Downloads</h3>
                <p class="mt-1 text-sm text-gray-900">{doc.download_count}</p>
              </div>
            </div>
          </div>
        )}

        {/* Versions Tab */}
        {state.activeTab === 'versions' && (
          <div class="space-y-3">
            {state.versions.length === 0 ? (
              <p class="text-gray-500 text-sm">No version history available</p>
            ) : (
              state.versions.map((version) => (
                <div key={version.id} class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900">Version {version.version_number}</span>
                        {version.is_current_version && (
                          <span class="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">Current</span>
                        )}
                      </div>
                      <p class="mt-1 text-sm text-gray-600">{version.change_log || 'No description'}</p>
                      <div class="mt-2 text-xs text-gray-500">
                        {version.created_by?.name} • {formatDate(version.created_at)} • {documentService.formatFileSize(version.file_size)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Audit Tab */}
        {state.activeTab === 'audit' && (
          <div class="space-y-3">
            {state.auditLogs.length === 0 ? (
              <p class="text-gray-500 text-sm">No activity logs available</p>
            ) : (
              state.auditLogs.map((log) => (
                <div key={log.id} class="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-900 capitalize">{log.action.replace(/_/g, ' ')}</span>
                      {log.user && <span class="text-sm text-gray-500">by {log.user.name}</span>}
                    </div>
                    <p class="mt-1 text-xs text-gray-500">{formatDate(log.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
});
