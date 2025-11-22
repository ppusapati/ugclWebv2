import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { CategoryManager } from '~/components/documents/CategoryManager';

export default component$(() => {
  return (
    <div class="container mx-auto px-4 py-8">
      <CategoryManager />
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
