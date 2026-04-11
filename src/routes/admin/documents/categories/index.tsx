import { component$, useResource$, Resource } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  const categoryManagerComponent = useResource$(async () => {
    const mod = await import('~/components/documents/CategoryManager');
    return mod.CategoryManager;
  });

  return (
    <div class="container mx-auto px-4 py-8">
      <Resource
        value={categoryManagerComponent}
        onPending={() => <div class="h-96 rounded-lg bg-gray-100 animate-pulse" />}
        onResolved={(CategoryManagerComponent) => <CategoryManagerComponent />}
      />
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Category Management - UGCL',
  meta: [
    {
      name: 'description',
      content: 'Manage document categories with hierarchical organization.',
    },
  ],
};
