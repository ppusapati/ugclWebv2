// src/routes/business/[code]/forms/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import { formBuilderService } from '~/services';
import type { AppForm } from '~/types/workflow';

export default component$(() => {
  const nav = useNavigate();
  const loc = useLocation();
  const businessCode = loc.params.code;

  const forms = useSignal<AppForm[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const searchQuery = useSignal('');

  useVisibleTask$(async () => {
    try {
      loading.value = true;
      // Get all forms and filter by business vertical access
      const allForms = await formBuilderService.getAllForms();
      // Filter forms that are active and accessible for this business vertical
      forms.value = allForms.filter(f =>
        f.is_active &&
        (!f.accessible_verticals || f.accessible_verticals.length === 0 || f.accessible_verticals.includes(businessCode))
      );
    } catch (err: any) {
      error.value = err.message || 'Failed to load forms';
    } finally {
      loading.value = false;
    }
  });

  const handleFormClick = $(async (formCode: string) => {
    await nav(`/business/${businessCode}/forms/${formCode}`);
  });

  const handleViewSubmissions = $(async () => {
    await nav(`/business/${businessCode}/submissions`);
  });

  const filteredForms = forms.value.filter(form => {
    if (!searchQuery.value) return true;
    const query = searchQuery.value.toLowerCase();
    return (
      form.title.toLowerCase().includes(query) ||
      form.code.toLowerCase().includes(query) ||
      form.description?.toLowerCase().includes(query)
    );
  });

  // Group forms by module
  const groupedForms: Record<string, AppForm[]> = {};
  filteredForms.forEach(form => {
    const moduleId = form.module_id || 'Other';
    if (!groupedForms[moduleId]) {
      groupedForms[moduleId] = [];
    }
    groupedForms[moduleId].push(form);
  });

  return (
    <div class="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div class="mb-6">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Forms</h1>
            <p class="text-gray-600 mt-1">
              Select a form to submit - Business: <span class="font-medium">{businessCode.toUpperCase()}</span>
            </p>
          </div>
          <button
            onClick$={handleViewSubmissions}
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            My Submissions
          </button>
        </div>
      </div>

      {/* Search */}
      <div class="mb-6">
        <div class="relative">
          <input
            type="text"
            value={searchQuery.value}
            onInput$={(e) => searchQuery.value = (e.target as HTMLInputElement).value}
            placeholder="Search forms..."
            class="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Loading State */}
      {loading.value && (
        <div class="flex justify-center py-12">
          <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Error State */}
      {error.value && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error.value}
        </div>
      )}

      {/* Forms Grid */}
      {!loading.value && !error.value && (
        <>
          {filteredForms.length === 0 ? (
            <div class="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No forms available</h3>
              <p class="mt-1 text-sm text-gray-500">
                {searchQuery.value
                  ? 'Try adjusting your search'
                  : 'No forms are currently available for this business vertical'
                }
              </p>
            </div>
          ) : (
            <div class="space-y-8">
              {Object.entries(groupedForms).map(([moduleId, moduleForms]) => (
                <div key={moduleId}>
                  {/* Module Header */}
                  <h2 class="text-xl font-semibold text-gray-900 mb-4">
                    {moduleId}
                  </h2>

                  {/* Forms Grid */}
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {moduleForms.map((form) => (
                      <button
                        key={form.code}
                        onClick$={() => handleFormClick(form.code)}
                        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                      >
                        {/* Form Icon */}
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>

                        {/* Form Info */}
                        <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                          {form.title}
                        </h3>
                        {form.description && (
                          <p class="text-sm text-gray-600 line-clamp-2 mb-4">
                            {form.description}
                          </p>
                        )}

                        {/* Form Meta */}
                        <div class="flex items-center justify-between text-xs text-gray-500">
                          <span class="font-mono">{form.code}</span>
                          <span class={`px-2 py-1 rounded ${
                            form.steps && form.steps.length > 1
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {form.steps && form.steps.length > 1 ? 'Multi-Step' : 'Single Page'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Forms - Business',
  meta: [
    {
      name: 'description',
      content: 'Select a form to submit',
    },
  ],
};
