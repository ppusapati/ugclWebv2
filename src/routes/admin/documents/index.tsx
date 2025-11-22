import { component$, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { Link } from '@builder.io/qwik-city';
import { DocumentList } from '~/components/documents/DocumentList';
import { DocumentUpload } from '~/components/documents/DocumentUpload';
import { DocumentViewer } from '~/components/documents/DocumentViewer';
import { CategorySidebar } from '~/components/documents/CategorySidebar';
import { documentService } from '~/services/document.service';
import type { Document, DocumentCategory, DocumentTag } from '~/types/document';

export default component$(() => {
  const state = useStore({
    showUpload: false,
    selectedDocument: null as Document | null,
    selectedDocumentIds: [] as string[],
    selectedCategoryId: undefined as string | undefined,
    refreshKey: 0,
    categories: [] as DocumentCategory[],
    tags: [] as DocumentTag[],
    loadingCategories: true,
    loadingTags: true,
  });

  // Load categories and tags on mount
  useVisibleTask$(async () => {
    try {
      const [categories, tags] = await Promise.all([
        documentService.getCategories(),
        documentService.getTags(),
      ]);
      state.categories = categories;
      state.tags = tags;
    } catch (error) {
      console.error('Failed to load categories/tags:', error);
    } finally {
      state.loadingCategories = false;
      state.loadingTags = false;
    }
  });

  const handleUploadComplete = $(() => {
    state.showUpload = false;
    state.refreshKey++; // Trigger refresh of document list
    alert('Document uploaded successfully!');
  });

  const handleDocumentClick = $((document: Document) => {
    state.selectedDocument = document;
  });

  const handleDocumentSelect = $((documentIds: string[]) => {
    state.selectedDocumentIds = documentIds;
  });

  const handleCloseViewer = $(() => {
    state.selectedDocument = null;
  });

  const handleCategorySelect = $((categoryId: string | undefined) => {
    state.selectedCategoryId = categoryId === 'uncategorized' ? '' : categoryId;
    state.refreshKey++; // Trigger refresh of document list
  });

  return (
    <div class="container mx-auto px-4 py-8">
      {/* Header */}
      <div class="mb-8 flex items-start justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Document Management</h1>
          <p class="mt-2 text-gray-600">
            Upload, organize, and manage your documents with version control and permissions.
          </p>
        </div>
        <Link
          href="/documents/categories"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Manage Categories
        </Link>
      </div>

      {/* Main Layout with Sidebar */}
      <div class="flex gap-6">
        {/* Category Sidebar */}
        <div class="w-64 flex-shrink-0">
          <CategorySidebar
            selectedCategoryId={state.selectedCategoryId}
            onCategorySelect={handleCategorySelect}
            refreshKey={state.refreshKey}
          />
        </div>

        {/* Main Content */}
        <div class="flex-1 min-w-0">
          {/* Action Bar */}
          <div class="mb-6 flex gap-4">
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              onClick$={() => (state.showUpload = !state.showUpload)}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {state.showUpload ? 'Cancel Upload' : 'Upload Document'}
            </button>

            {state.selectedDocumentIds.length > 0 && (
              <>
                <button
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick$={async () => {
                    if (confirm(`Delete ${state.selectedDocumentIds.length} documents?`)) {
                      try {
                        await documentService.bulkDelete(state.selectedDocumentIds);
                        state.selectedDocumentIds = [];
                        state.refreshKey++;
                        alert('Documents deleted successfully');
                      } catch (error: any) {
                        alert(error.message || 'Failed to delete documents');
                      }
                    }
                  }}
                >
                  Delete Selected ({state.selectedDocumentIds.length})
                </button>
                <button
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick$={async () => {
                    try {
                      await documentService.bulkDownload(state.selectedDocumentIds, 'documents.zip');
                      alert('Download started');
                    } catch (error: any) {
                      alert(error.message || 'Failed to download documents');
                    }
                  }}
                >
                  Download Selected ({state.selectedDocumentIds.length})
                </button>
              </>
            )}
          </div>

          {/* Upload Section */}
          {state.showUpload && (
            <div class="mb-6">
              <DocumentUpload
                onUploadComplete={handleUploadComplete}
                categories={state.categories}
                tags={state.tags}
              />
            </div>
          )}

          {/* Document List */}
          {!state.selectedDocument && (
            <DocumentList
              key={state.refreshKey}
              categoryId={state.selectedCategoryId}
              onDocumentClick={handleDocumentClick}
              onDocumentSelect={handleDocumentSelect}
              allowSelection={true}
            />
          )}
        </div>
      </div>

      {/* Document Viewer */}
      {state.selectedDocument && (
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <DocumentViewer
              documentId={state.selectedDocument.id}
              onClose={handleCloseViewer}
            />
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Document Management - UGCL',
  meta: [
    {
      name: 'description',
      content: 'Manage your documents with version control, permissions, and collaboration features.',
    },
  ],
};
