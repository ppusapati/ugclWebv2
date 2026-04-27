import { component$, useStore, useResource$, Resource, $ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { Link, routeLoader$, useLocation, useNavigate } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services';
import { documentService } from '~/services/document.service';
import type { Document, DocumentCategory, DocumentTag } from '~/types/document';
import { Btn, PageHeader } from '~/components/ds';

export const useDocumentsMetaData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const [categories, tags] = await Promise.all([
      ssrApiClient.get<DocumentCategory[]>('/documents/categories'),
      ssrApiClient.get<DocumentTag[]>('/documents/tags'),
    ]);

    return {
      categories,
      tags,
    };
  } catch {
    return {
      categories: [] as DocumentCategory[],
      tags: [] as DocumentTag[],
    };
  }
});

export default component$(() => {
  const navigate = useNavigate();
  const loc = useLocation();
  const initialMeta = useDocumentsMetaData();

  const contextType = loc.url.searchParams.get('context') || undefined;
  const contextProjectId = loc.url.searchParams.get('project_id') || undefined;
  const contextTaskId = loc.url.searchParams.get('task_id') || undefined;
  const contextBusinessVerticalId = loc.url.searchParams.get('business_vertical_id') || undefined;

  const contextMetadata = {
    ...(contextType ? { context: contextType } : {}),
    ...(contextProjectId ? { project_id: contextProjectId } : {}),
    ...(contextTaskId ? { task_id: contextTaskId } : {}),
  };

  const hasContext = Object.keys(contextMetadata).length > 0;

  const state = useStore({
    showUpload: false,
    selectedDocumentIds: [] as string[],
    selectedCategoryId: undefined as string | undefined,
    refreshKey: 0,
    categories: initialMeta.value.categories,
    tags: initialMeta.value.tags,
    loadingCategories: false,
    loadingTags: false,
  });

  const categorySidebarComponent = useResource$(async () => {
    const mod = await import('~/components/documents/CategorySidebar');
    return mod.CategorySidebar;
  });

  const documentListComponent = useResource$(async () => {
    const mod = await import('~/components/documents/DocumentList');
    return mod.DocumentList;
  });

  const documentUploadComponent = useResource$(async ({ track }) => {
    track(() => state.showUpload);
    if (!state.showUpload) return null;
    const mod = await import('~/components/documents/DocumentUpload');
    return mod.DocumentUpload;
  });

  const handleUploadComplete = $(() => {
    state.showUpload = false;
    state.refreshKey++; // Trigger refresh of document list
    alert('Document uploaded successfully!');
  });

  const handleDocumentClick = $((document: Document) => {
    navigate(`/documents/view/${document.id}`);
  });

  const handleDocumentSelect = $((documentIds: string[]) => {
    state.selectedDocumentIds = documentIds;
  });

  const handleCategorySelect = $((categoryId: string | undefined) => {
    state.selectedCategoryId = categoryId === 'uncategorized' ? '' : categoryId;
    state.refreshKey++; // Trigger refresh of document list
  });

  return (
    <div class="space-y-8 py-2">
      <PageHeader
        title="Document Management"
        subtitle="Upload, organize, and manage your documents with version control and permissions."
        class="mb-8"
      >
        <Link
          q:slot="actions"
          href="/documents/categories"
          class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 px-4 py-2 text-sm btn-secondary"
        >
          <i class="i-heroicons-folder-open-solid h-4 w-4" aria-hidden="true"></i>
          Manage Categories
        </Link>
      </PageHeader>

      {/* Main Layout with Sidebar */}
      <div class="flex gap-6">
        {/* Category Sidebar */}
        <div class="w-64 flex-shrink-0">
          <Resource
            value={categorySidebarComponent}
            onPending={() => <div class="h-64 rounded-lg bg-gray-100 animate-pulse" />}
            onResolved={(CategorySidebarComponent) => (
              <CategorySidebarComponent
                selectedCategoryId={state.selectedCategoryId}
                onCategorySelect={handleCategorySelect}
                refreshKey={state.refreshKey}
              />
            )}
          />
        </div>

        {/* Main Content */}
        <div class="flex-1 min-w-0">
          {hasContext && (
            <div class="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Context mode: {contextType || 'general'}
              {contextProjectId ? ` | Project: ${contextProjectId}` : ''}
              {contextTaskId ? ` | Task: ${contextTaskId}` : ''}
            </div>
          )}

          {/* Action Bar */}
          <div class="mb-6 flex gap-4">
            <Btn
              variant={state.showUpload ? 'secondary' : 'primary'}
              onClick$={() => (state.showUpload = !state.showUpload)}
            >
              <i class="i-heroicons-arrow-up-tray-solid h-4 w-4" aria-hidden="true"></i>
              {state.showUpload ? 'Cancel Upload' : 'Upload Document'}
            </Btn>

            {state.selectedDocumentIds.length > 0 && (
              <>
                <Btn
                  variant="danger"
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
                  <i class="i-heroicons-trash-solid h-4 w-4" aria-hidden="true"></i>
                  Delete Selected ({state.selectedDocumentIds.length})
                </Btn>
                <Btn
                  variant="secondary"
                  onClick$={async () => {
                    try {
                      await documentService.bulkDownload(state.selectedDocumentIds, 'documents.zip');
                      alert('Download started');
                    } catch (error: any) {
                      alert(error.message || 'Failed to download documents');
                    }
                  }}
                >
                  <i class="i-heroicons-arrow-down-tray-solid h-4 w-4" aria-hidden="true"></i>
                  Download Selected ({state.selectedDocumentIds.length})
                </Btn>
              </>
            )}
          </div>

          {/* Upload Section */}
          {state.showUpload && (
            <div class="mb-6">
              <Resource
                value={documentUploadComponent}
                onPending={() => <div class="h-48 rounded-lg bg-gray-100 animate-pulse" />}
                onResolved={(DocumentUploadComponent) =>
                  DocumentUploadComponent ? (
                    <DocumentUploadComponent
                      onUploadComplete={handleUploadComplete}
                      categories={state.categories}
                      tags={state.tags}
                        businessVerticalId={contextBusinessVerticalId || undefined}
                        projectId={contextProjectId || undefined}
                        taskId={contextTaskId || undefined}
                        contextMetadata={hasContext ? contextMetadata : undefined}
                    />
                  ) : null
                }
              />
            </div>
          )}

          {/* Document List */}
          <Resource
            value={documentListComponent}
            onPending={() => <div class="h-96 rounded-lg bg-gray-100 animate-pulse" />}
            onResolved={(DocumentListComponent) => (
              <DocumentListComponent
                key={state.refreshKey}
                categoryId={state.selectedCategoryId}
                businessVerticalId={contextBusinessVerticalId || undefined}
                contextFilter={hasContext ? {
                  context: contextType,
                  project_id: contextProjectId,
                  task_id: contextTaskId,
                } : undefined}
                onDocumentClick={handleDocumentClick}
                onDocumentSelect={handleDocumentSelect}
                allowSelection={true}
              />
            )}
          />
        </div>
      </div>
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
