// src/routes/business/[code]/forms/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, useNavigate, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import { Badge, Btn, PageHeader, SectionCard } from '~/components/ds';
import { createSSRApiClient } from '~/services';
import type { AppForm } from '~/types/workflow';

export const useBusinessFormsData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const businessCode = requestEvent.params.code;

  try {
    // Primary source: business-scoped endpoint (applies business + user access rules on backend)
    let businessFormsResponse: any;
    try {
      businessFormsResponse = await ssrApiClient.get<any>(`/business/${businessCode}/forms`);
    } catch {
      // Some environments store business code in uppercase on backend routes.
      businessFormsResponse = await ssrApiClient.get<any>(`/business/${businessCode.toUpperCase()}/forms`);
    }
    const formsRaw = businessFormsResponse?.forms || businessFormsResponse?.data || businessFormsResponse || [];
    const forms = Array.isArray(formsRaw)
      ? formsRaw.filter((f: AppForm) => f?.is_active !== false)
      : [];

    return {
      forms,
      error: null as string | null,
    };
  } catch (err: any) {
    return {
      forms: [] as AppForm[],
      error: err.message || 'Failed to load forms',
    };
  }
});

export default component$(() => {
  const initialData = useBusinessFormsData();
  const nav = useNavigate();
  const loc = useLocation();
  const businessCode = loc.params.code;

  const forms = useSignal<AppForm[]>(initialData.value.forms || []);
  const loading = useSignal(false);
  const error = useSignal<string | null>(initialData.value.error || null);
  const searchQuery = useSignal('');

  const handleFormClick = $(async (formCode: string) => {
    await nav(`/masters/business/${businessCode}/forms/${formCode}`);
  });

  const handleViewSubmissions = $(async () => {
    await nav(`/masters/business/${businessCode}/submissions`);
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
    <div class="space-y-6">
      <PageHeader
        title="Forms"
        subtitle={`Select a form to submit for ${businessCode.toUpperCase()}`}
      >
        <Btn
          q:slot="actions"
          variant="secondary"
          onClick$={handleViewSubmissions}
          class="flex items-center gap-2"
        >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            My Submissions
        </Btn>
      </PageHeader>

      {/* Search */}
      <SectionCard title="Search" subtitle="Filter the available forms for this business vertical.">
        <div class="relative">
          <input
            type="text"
            value={searchQuery.value}
            onInput$={(e) => searchQuery.value = (e.target as HTMLInputElement).value}
            placeholder="Search forms..."
            class="w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-4 py-3 pl-12 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none"
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
      </SectionCard>

      {/* Loading State */}
      {loading.value && (
        <div class="flex justify-center py-12">
          <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Error State */}
      {error.value && (
        <div class="rounded-lg border border-color-semantic-error-300 bg-color-semantic-error-100 p-4 text-sm text-color-semantic-error-700">
          {error.value}
        </div>
      )}

      {/* Forms Grid */}
      {!loading.value && !error.value && (
        <>
          {filteredForms.length === 0 ? (
            <SectionCard class="p-12 text-center">
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
            </SectionCard>
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
                          <Badge variant={form.steps && form.steps.length > 1 ? 'info' : 'success'}>
                            {form.steps && form.steps.length > 1 ? 'Multi-Step' : 'Single Page'}
                          </Badge>
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
