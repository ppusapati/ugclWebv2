import { component$, useResource$, Resource } from '@builder.io/qwik';
import { Link, useLocation, type DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  const location = useLocation();
  const documentId = location.params.id;

  const documentViewerComponent = useResource$(async () => {
    const mod = await import('~/components/documents/DocumentViewer');
    return mod.DocumentViewer;
  });

  return (
    <div class="space-y-6 py-2">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Document Reader</h1>
          <p class="mt-1 text-sm text-gray-600">Full-page reader mode for preview, AI review, versions and activity.</p>
        </div>
        <Link
          href="/documents"
          class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 px-4 py-2 text-sm btn-secondary"
        >
          <i class="i-heroicons-arrow-left-solid h-4 w-4" aria-hidden="true"></i>
          Back to Documents
        </Link>
      </div>

      <Resource
        value={documentViewerComponent}
        onPending={() => <div class="h-[70vh] rounded-lg bg-white border border-gray-200" />}
        onResolved={(DocumentViewerComponent) => (
          <DocumentViewerComponent documentId={documentId} />
        )}
      />
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Document Reader - UGCL',
  meta: [
    {
      name: 'description',
      content: 'Full-page document reader for preview and AI-assisted document analysis.',
    },
  ],
};
