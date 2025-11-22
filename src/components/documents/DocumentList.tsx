import { component$, useSignal, useStore, useVisibleTask$, $, type QRL } from '@builder.io/qwik';
import { documentService } from '~/services/document.service';
import type { Document, DocumentListParams, DocumentStatus } from '~/types/document';

interface DocumentListProps {
  businessVerticalId?: string;
  categoryId?: string;
  status?: DocumentStatus;
  onDocumentClick?: QRL<(document: Document) => void>;
  onDocumentSelect?: QRL<(documentIds: string[]) => void>;
  allowSelection?: boolean;
  viewMode?: 'list' | 'grid';
}

export const DocumentList = component$<DocumentListProps>((props) => {
  const {
    businessVerticalId,
    categoryId,
    status,
    onDocumentClick,
    onDocumentSelect,
    allowSelection = false,
    viewMode: initialViewMode = 'list',
  } = props;

  const state = useStore({
    documents: [] as Document[],
    loading: true,
    error: '',
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
    search: '',
    selectedIds: new Set<string>(),
    viewMode: initialViewMode,
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const loadDocuments = $(async () => {
    state.loading = true;
    state.error = '';

    try {
      const params: DocumentListParams = {
        page: state.page,
        limit: state.limit,
        business_vertical_id: businessVerticalId,
        category_id: categoryId,
        status,
        search: state.search || undefined,
        sort_by: state.sortBy,
        sort_order: state.sortOrder,
      };

      const response = await documentService.getDocuments(params);
      state.documents = response.documents;
      state.total = response.total;
      state.pages = response.pages;
    } catch (error: any) {
      state.error = error.message || 'Failed to load documents';
    } finally {
      state.loading = false;
    }
  });

  // Load documents on mount
  useVisibleTask$(async () => {
    await loadDocuments();
  });

  const handleSearch = $(async () => {
    state.page = 1;
    await loadDocuments();
  });

  const handlePageChange = $(async (newPage: number) => {
    state.page = newPage;
    await loadDocuments();
  });

  const handleDocumentClick = $((document: Document) => {
    if (onDocumentClick) {
      onDocumentClick(document);
    }
  });

  const handleSelectToggle = $((documentId: string) => {
    if (state.selectedIds.has(documentId)) {
      state.selectedIds.delete(documentId);
    } else {
      state.selectedIds.add(documentId);
    }

    if (onDocumentSelect) {
      onDocumentSelect(Array.from(state.selectedIds));
    }
  });

  const handleSelectAll = $(() => {
    if (state.selectedIds.size === state.documents.length) {
      state.selectedIds.clear();
    } else {
      state.documents.forEach((doc) => state.selectedIds.add(doc.id));
    }

    if (onDocumentSelect) {
      onDocumentSelect(Array.from(state.selectedIds));
    }
  });

  const handleSort = $((field: string) => {
    if (state.sortBy === field) {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortBy = field;
      state.sortOrder = 'desc';
    }
    loadDocuments();
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: DocumentStatus) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      archived: 'bg-blue-100 text-blue-800',
      deleted: 'bg-gray-100 text-gray-500',
    };
    return colors[status] || colors.draft;
  };

  return (
    <div class="document-list">
      {/* Header */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div class="flex-1 w-full sm:w-auto">
            <div class="relative">
              <input
                type="text"
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search documents..."
                value={state.search}
                onInput$={(e) => (state.search = (e.target as HTMLInputElement).value)}
                onKeyPress$={(e) => e.key === 'Enter' && handleSearch()}
              />
              <svg
                class="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div class="flex items-center gap-2">
            <button
              class={`p-2 rounded ${state.viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick$={() => (state.viewMode = 'list')}
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            </button>
            <button
              class={`p-2 rounded ${state.viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick$={() => (state.viewMode = 'grid')}
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Results info & Selection */}
        <div class="mt-3 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {state.documents.length} of {state.total} documents
          </div>
          {allowSelection && state.selectedIds.size > 0 && (
            <div class="text-blue-600 font-medium">{state.selectedIds.size} selected</div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {state.loading && (
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Loading documents...</p>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-600">{state.error}</p>
        </div>
      )}

      {/* Empty State */}
      {!state.loading && !state.error && state.documents.length === 0 && (
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p class="mt-4 text-gray-600">No documents found</p>
        </div>
      )}

      {/* List View */}
      {!state.loading && !state.error && state.documents.length > 0 && state.viewMode === 'list' && (
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                {allowSelection && (
                  <th class="px-6 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={state.selectedIds.size === state.documents.length}
                      onChange$={handleSelectAll}
                    />
                  </th>
                )}
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick$={() => handleSort('title')}
                >
                  Document
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick$={() => handleSort('created_at')}
                >
                  Created
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {state.documents.map((document) => (
                <tr key={document.id} class="hover:bg-gray-50">
                  {allowSelection && (
                    <td class="px-6 py-4">
                      <input
                        type="checkbox"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={state.selectedIds.has(document.id)}
                        onChange$={() => handleSelectToggle(document.id)}
                      />
                    </td>
                  )}
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                          <span class="text-xl">
                            {documentService.isImage(document.file_name) ? '🖼️' : '📄'}
                          </span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div
                          class="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                          onClick$={() => handleDocumentClick(document)}
                        >
                          {document.title}
                        </div>
                        <div class="text-sm text-gray-500">{document.file_name}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {document.category ? (
                      <span class="text-sm text-gray-900">{document.category.name}</span>
                    ) : (
                      <span class="text-sm text-gray-400">Uncategorized</span>
                    )}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(document.status)}`}>
                      {document.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {documentService.formatFileSize(document.file_size)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(document.created_at)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a
                      href={documentService.getDownloadUrl(document.id)}
                      class="text-blue-600 hover:text-blue-900 mr-3"
                      download
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {!state.loading && !state.error && state.documents.length > 0 && state.viewMode === 'grid' && (
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {state.documents.map((document) => (
            <div
              key={document.id}
              class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick$={() => handleDocumentClick(document)}
            >
              {allowSelection && (
                <div class="mb-2">
                  <input
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={state.selectedIds.has(document.id)}
                    onChange$={(e) => {
                      e.stopPropagation();
                      handleSelectToggle(document.id);
                    }}
                  />
                </div>
              )}
              <div class="flex items-center justify-center h-32 bg-gray-100 rounded mb-3">
                <span class="text-4xl">
                  {documentService.isImage(document.file_name) ? '🖼️' : '📄'}
                </span>
              </div>
              <h4 class="text-sm font-medium text-gray-900 truncate mb-1">{document.title}</h4>
              <p class="text-xs text-gray-500 truncate mb-2">{document.file_name}</p>
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>{documentService.formatFileSize(document.file_size)}</span>
                <span class={`px-2 py-1 rounded-full ${getStatusColor(document.status)}`}>
                  {document.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!state.loading && !state.error && state.pages > 1 && (
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 mt-4 flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Page {state.page} of {state.pages}
          </div>
          <div class="flex gap-2">
            <button
              class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              onClick$={() => handlePageChange(state.page - 1)}
              disabled={state.page === 1}
            >
              Previous
            </button>
            <button
              class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              onClick$={() => handlePageChange(state.page + 1)}
              disabled={state.page === state.pages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
