import { component$, useSignal, useStore, useVisibleTask$, $, type PropFunction } from '@builder.io/qwik';
import { documentService } from '~/services/document.service';
import type { DocumentCategory } from '~/types/document';

interface CategoryManagerProps {
  businessVerticalId?: string;
  onCategoryChange$?: PropFunction<() => void>;
}

export const CategoryManager = component$<CategoryManagerProps>((props) => {
  const { businessVerticalId, onCategoryChange$ } = props;

  const state = useStore({
    categories: [] as DocumentCategory[],
    loading: true,
    error: '',
    showForm: false,
    editingCategory: null as DocumentCategory | null,
  });

  const formState = useStore({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '📁',
    parentId: '',
    isActive: true,
  });

  const loadCategories = $(async () => {
    state.loading = true;
    state.error = '';

    try {
      const categories = await documentService.getCategories(businessVerticalId);
      state.categories = categories;
    } catch (error: any) {
      state.error = error.message || 'Failed to load categories';
    } finally {
      state.loading = false;
    }
  });

  // Load categories on mount
  useVisibleTask$(async () => {
    await loadCategories();
  });

  const handleShowForm = $((category?: DocumentCategory) => {
    if (category) {
      state.editingCategory = category;
      formState.name = category.name;
      formState.description = category.description || '';
      formState.color = category.color || '#3B82F6';
      formState.icon = category.icon || '📁';
      formState.parentId = category.parent_id || '';
      formState.isActive = category.is_active;
    } else {
      state.editingCategory = null;
      formState.name = '';
      formState.description = '';
      formState.color = '#3B82F6';
      formState.icon = '📁';
      formState.parentId = '';
      formState.isActive = true;
    }
    state.showForm = true;
  });

  const handleCancelForm = $(() => {
    state.showForm = false;
    state.editingCategory = null;
  });

  const handleSubmit = $(async () => {
    if (!formState.name.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      if (state.editingCategory) {
        // Update existing category
        await documentService.updateCategory(state.editingCategory.id, {
          name: formState.name,
          description: formState.description || undefined,
          color: formState.color,
          icon: formState.icon,
          parent_id: formState.parentId || undefined,
          is_active: formState.isActive,
        });
      } else {
        // Create new category
        await documentService.createCategory({
          name: formState.name,
          description: formState.description || undefined,
          color: formState.color,
          icon: formState.icon,
          parent_id: formState.parentId || undefined,
          business_vertical_id: businessVerticalId,
        });
      }

      state.showForm = false;
      state.editingCategory = null;
      await loadCategories();

      if (onCategoryChange$) {
        await onCategoryChange$();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to save category');
    }
  });

  const handleDelete = $(async (category: DocumentCategory) => {
    if (!confirm(`Delete category "${category.name}"? This will fail if documents are using it.`)) {
      return;
    }

    try {
      await documentService.deleteCategory(category.id);
      await loadCategories();

      if (onCategoryChange$) {
        await onCategoryChange$();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to delete category. It may have documents assigned to it.');
    }
  });

  const getCategoryTree = (parentId?: string | null): DocumentCategory[] => {
    return state.categories.filter((cat) => cat.parent_id === parentId);
  };

  const renderCategoryTree = (parentId?: string | null, level: number = 0): any => {
    const categories = getCategoryTree(parentId);

    return categories.map((category) => (
      <div key={category.id}>
        <div
          class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 mb-2"
          style={{ marginLeft: `${level * 24}px` }}
        >
          <div class="flex items-center gap-3 flex-1">
            <span class="text-2xl">{category.icon || '📁'}</span>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900">{category.name}</span>
                {category.color && (
                  <span
                    class="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: category.color }}
                  />
                )}
                {!category.is_active && (
                  <span class="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                    Inactive
                  </span>
                )}
              </div>
              {category.description && (
                <p class="text-sm text-gray-500 mt-0.5">{category.description}</p>
              )}
            </div>
          </div>

          <div class="flex gap-2">
            <button
              class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
              onClick$={() => handleShowForm(category)}
            >
              Edit
            </button>
            <button
              class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              onClick$={() => handleDelete(category)}
            >
              Delete
            </button>
          </div>
        </div>
        {renderCategoryTree(category.id, level + 1)}
      </div>
    ));
  };

  const iconOptions = ['📁', '📄', '📋', '📊', '📈', '📉', '📦', '🗂️', '📚', '📝', '🔒', '🌟', '⚙️', '💼', '🏢', '📱', '💻', '🎨', '🔧', '📷'];

  return (
    <div class="category-manager">
      {/* Header */}
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Category Management</h2>
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          onClick$={() => handleShowForm()}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Category
        </button>
      </div>

      {/* Loading State */}
      {state.loading && (
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Loading categories...</p>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p class="text-red-600">{state.error}</p>
        </div>
      )}

      {/* Category List */}
      {!state.loading && !state.error && (
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {state.categories.length === 0 ? (
            <div class="text-center py-12 text-gray-500">
              <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p>No categories yet. Create your first category to get started.</p>
            </div>
          ) : (
            renderCategoryTree()
          )}
        </div>
      )}

      {/* Form Modal */}
      {state.showForm && (
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">
              {state.editingCategory ? 'Edit Category' : 'New Category'}
            </h3>

            <div class="space-y-4">
              {/* Name */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formState.name}
                  onInput$={(e) => (formState.name = (e.target as HTMLInputElement).value)}
                  placeholder="Enter category name"
                />
              </div>

              {/* Description */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={formState.description}
                  onInput$={(e) => (formState.description = (e.target as HTMLTextAreaElement).value)}
                  placeholder="Enter description (optional)"
                />
              </div>

              {/* Icon */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div class="flex flex-wrap gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      class={`text-2xl p-2 rounded border-2 ${
                        formState.icon === icon
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick$={() => (formState.icon = icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div class="flex items-center gap-3">
                  <input
                    type="color"
                    class="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    value={formState.color}
                    onInput$={(e) => (formState.color = (e.target as HTMLInputElement).value)}
                  />
                  <input
                    type="text"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={formState.color}
                    onInput$={(e) => (formState.color = (e.target as HTMLInputElement).value)}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              {/* Parent Category */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formState.parentId}
                  onChange$={(e) => (formState.parentId = (e.target as HTMLSelectElement).value)}
                >
                  <option value="">None (Top Level)</option>
                  {state.categories
                    .filter((cat) => !state.editingCategory || cat.id !== state.editingCategory.id)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Active Status */}
              {state.editingCategory && (
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="is-active"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formState.isActive}
                    onChange$={(e) => (formState.isActive = (e.target as HTMLInputElement).checked)}
                  />
                  <label for="is-active" class="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div class="flex gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                onClick$={handleSubmit}
              >
                {state.editingCategory ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                onClick$={handleCancelForm}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
