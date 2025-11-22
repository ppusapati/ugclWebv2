import { component$, useSignal, useStore, useVisibleTask$, $, type QRL } from '@builder.io/qwik';
import { documentService } from '~/services/document.service';
import type { DocumentCategory } from '~/types/document';

interface CategorySidebarProps {
  businessVerticalId?: string;
  selectedCategoryId?: string;
  onCategorySelect?: QRL<(categoryId: string | undefined) => void>;
  refreshKey?: number;
}

export const CategorySidebar = component$<CategorySidebarProps>((props) => {
  const { businessVerticalId, selectedCategoryId, onCategorySelect, refreshKey = 0 } = props;

  const state = useStore({
    categories: [] as DocumentCategory[],
    loading: true,
    error: '',
    expandedCategories: new Set<string>(),
  });

  const loadCategories = $(async () => {
    state.loading = true;
    state.error = '';

    try {
      const categories = await documentService.getCategories(businessVerticalId);
      state.categories = categories.filter((cat) => cat.is_active);
    } catch (error: any) {
      state.error = error.message || 'Failed to load categories';
    } finally {
      state.loading = false;
    }
  });

  // Load categories on mount and when refreshKey changes
  useVisibleTask$(async ({ track }) => {
    track(() => refreshKey);
    await loadCategories();
  });

  const handleCategoryClick = $((categoryId?: string) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  });

  const toggleExpand = $((categoryId: string) => {
    if (state.expandedCategories.has(categoryId)) {
      state.expandedCategories.delete(categoryId);
    } else {
      state.expandedCategories.add(categoryId);
    }
  });

  const getCategoryTree = (parentId?: string | null): DocumentCategory[] => {
    return state.categories.filter((cat) => cat.parent_id === parentId);
  };

  const hasChildren = (categoryId: string): boolean => {
    return state.categories.some((cat) => cat.parent_id === categoryId);
  };

  const getDocumentCount = $(async (categoryId: string): Promise<number> => {
    try {
      const response = await documentService.getDocuments({
        category_id: categoryId,
        limit: 1,
      });
      return response.total;
    } catch {
      return 0;
    }
  });

  const renderCategoryTree = (parentId?: string | null, level: number = 0): any => {
    const categories = getCategoryTree(parentId);

    return categories.map((category) => {
      const isSelected = selectedCategoryId === category.id;
      const isExpanded = state.expandedCategories.has(category.id);
      const children = hasChildren(category.id);

      return (
        <div key={category.id}>
          <div
            class={`
              flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
              ${isSelected ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}
            `}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
          >
            {/* Expand/Collapse Arrow */}
            {children ? (
              <button
                class="flex-shrink-0 w-5 h-5 flex items-center justify-center"
                onClick$={(e) => {
                  e.stopPropagation();
                  toggleExpand(category.id);
                }}
              >
                <svg
                  class={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            ) : (
              <span class="w-5" />
            )}

            {/* Category Content */}
            <div
              class="flex-1 flex items-center gap-2 min-w-0"
              onClick$={() => handleCategoryClick(category.id)}
            >
              <span class="text-lg flex-shrink-0">{category.icon || '📁'}</span>
              <span class="truncate flex-1">{category.name}</span>
              {category.color && (
                <span
                  class="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
              )}
            </div>
          </div>

          {/* Children */}
          {children && isExpanded && renderCategoryTree(category.id, level + 1)}
        </div>
      );
    });
  };

  return (
    <div class="category-sidebar bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Categories</h3>

        {/* All Documents */}
        <div
          class={`
            flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
            ${!selectedCategoryId ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}
          `}
          onClick$={() => handleCategoryClick(undefined)}
        >
          <span class="text-lg">📚</span>
          <span class="flex-1">All Documents</span>
        </div>
      </div>

      {/* Loading State */}
      {state.loading && (
        <div class="py-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div class="p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      {/* Category Tree */}
      {!state.loading && !state.error && (
        <div class="space-y-1">
          {state.categories.length === 0 ? (
            <div class="text-center py-8 text-gray-500">
              <p class="text-sm">No categories available</p>
            </div>
          ) : (
            renderCategoryTree()
          )}
        </div>
      )}

      {/* Uncategorized */}
      <div class="mt-4 pt-4 border-t">
        <div
          class={`
            flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
            ${selectedCategoryId === 'uncategorized' ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}
          `}
          onClick$={() => handleCategoryClick('uncategorized')}
        >
          <span class="text-lg">📄</span>
          <span class="flex-1">Uncategorized</span>
        </div>
      </div>
    </div>
  );
});
