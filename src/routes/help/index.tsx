import { component$, useSignal, useComputed$ } from '@builder.io/qwik';
import { PageHeader } from '~/components/ds';
import { HelpTopicContent } from '~/components/help/help-topic-content';
import { guidedHelpTours, helpTopics } from '~/content/help-content';
import { useTourContext } from '~/contexts/tour-context';
import { useAuthContext } from '~/contexts/auth-context';

export default component$(() => {
  const tour = useTourContext();
  const auth = useAuthContext();
  const search = useSignal('');

  // Filter tours the current user is allowed to see
  const visibleTours = useComputed$(() => {
    const user = auth.user;
    return guidedHelpTours.filter((t) => {
      if (t.requiredRoles && t.requiredRoles.length > 0) {
        if (!user || !t.requiredRoles.includes(user.role)) {
          return false;
        }
      }

      if (t.requiredPermissions && t.requiredPermissions.length > 0) {
        if (!user || !t.requiredPermissions.some((p) => user.permissions.includes(p))) {
          return false;
        }
      }

      return true;
    });
  });

  const activeTourId = useSignal(guidedHelpTours[0]?.id || '');
  const activeStepIndex = useSignal(0);
  const activeTour = visibleTours.value.find((t) => t.id === activeTourId.value) || visibleTours.value[0];
  const safeStepIndex = activeTour
    ? Math.min(Math.max(activeStepIndex.value, 0), activeTour.steps.length - 1)
    : 0;
  const activeStep = activeTour?.steps[safeStepIndex];

  const normalizedSearch = search.value.trim().toLowerCase();
  const visibleTopics = helpTopics.filter((topic) => {
    if (!normalizedSearch) {
      return true;
    }

    const haystack = [
      topic.title,
      topic.summary,
      ...(topic.quickActions ?? []),
      ...topic.sections.flatMap((section) => [section.title, ...section.bullets]),
      ...(topic.variants ?? []).flatMap((variant) => [
        variant.title,
        variant.summary ?? '',
        ...(variant.quickActions ?? []),
        ...(variant.sections?.flatMap((section) => [section.title, ...section.bullets]) ?? []),
      ]),
    ].join(' ').toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  return (
    <div class="space-y-6">
      <PageHeader
        title="Help Center"
        subtitle="Browse the same help content shown in the page drawer, plus cross-feature guidance in one place."
      >
        <div q:slot="actions" class="w-full max-w-sm">
          <label class="relative block">
            <span class="sr-only">Search help topics</span>
            <i class="i-heroicons-magnifying-glass-solid pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={search.value}
              placeholder="Search help topics"
              class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:border-primary-500"
              onInput$={(event) => {
                search.value = (event.target as HTMLInputElement).value;
              }}
            />
          </label>
        </div>
      </PageHeader>

      <section class="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Guided Tours</p>
            <h2 class="mt-2 text-xl font-bold text-gray-900">Step-by-step walkthroughs</h2>
            <p class="mt-1 text-sm leading-6 text-gray-600">
              Follow structured tours for Form Builder, Workflow Builder, Project Management, and Document Management.
            </p>
          </div>
          <span class="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700">
            {visibleTours.value.length} tours available
          </span>
        </div>

        <div class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <div class="rounded-2xl border border-blue-100 bg-white p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Tour list</p>
            <div class="mt-3 space-y-2">
              {visibleTours.value.map((t) => {
                const isDone = tour.completedTourIds.value.includes(t.id);

                return (
                <button
                  key={t.id}
                  type="button"
                  class={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                    activeTour?.id === t.id
                      ? 'border-blue-300 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick$={() => {
                    activeTourId.value = t.id;
                    activeStepIndex.value = 0;
                  }}
                >
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-sm font-semibold">{t.title}</p>
                    {isDone && (
                      <span class="inline-flex shrink-0 items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        <i class="i-heroicons-check-circle-solid h-3 w-3" aria-hidden="true" />
                        Done
                      </span>
                    )}
                  </div>
                  <p class="mt-1 text-xs leading-5 text-gray-600">{t.summary}</p>
                </button>
                );
              })}
            </div>
          </div>

          <div class="rounded-2xl border border-blue-100 bg-white p-4">
            {!activeTour || !activeStep ? (
              <div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                No guided tour is currently configured.
              </div>
            ) : (
              <div class="space-y-4">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-blue-700">{activeTour.title}</p>
                    <h3 class="mt-1 text-lg font-semibold text-gray-900">{activeStep.title}</h3>
                    <p class="mt-1 text-sm leading-6 text-gray-600">{activeStep.purpose}</p>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    {tour.completedTourIds.value.includes(activeTour.id) && (
                      <span class="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        <i class="i-heroicons-check-circle-solid h-3.5 w-3.5" aria-hidden="true" />
                        Completed
                      </span>
                    )}
                    <span class="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      Step {safeStepIndex + 1} of {activeTour.steps.length}
                    </span>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  {activeTour.steps.map((step, index) => (
                    <button
                      key={step.id}
                      type="button"
                      class={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        index === safeStepIndex
                          ? 'border-blue-300 bg-blue-50 text-blue-800'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick$={() => {
                        activeStepIndex.value = index;
                      }}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <div class="grid gap-3 md:grid-cols-2">
                  <section class="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <h4 class="text-sm font-semibold text-gray-900">Field-level focus</h4>
                    <ul class="mt-2 space-y-1.5 text-sm leading-6 text-gray-700">
                      {activeStep.fieldLevelGuidance.map((item) => (
                        <li key={item} class="flex items-start gap-2">
                          <span class="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section class="rounded-xl border border-green-200 bg-green-50/60 p-3">
                    <h4 class="text-sm font-semibold text-green-900">Generated output usage</h4>
                    <ul class="mt-2 space-y-1.5 text-sm leading-6 text-green-900">
                      {activeStep.generatedOutputUsage.map((item) => (
                        <li key={item} class="flex items-start gap-2">
                          <span class="mt-1 h-1.5 w-1.5 rounded-full bg-green-500"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                      disabled={safeStepIndex === 0}
                      onClick$={() => {
                        activeStepIndex.value = Math.max(0, safeStepIndex - 1);
                      }}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                      disabled={safeStepIndex >= activeTour.steps.length - 1}
                      onClick$={() => {
                        activeStepIndex.value = Math.min(activeTour.steps.length - 1, safeStepIndex + 1);
                      }}
                    >
                      Next
                    </button>
                    <button
                      type="button"
                      class="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-100"
                      onClick$={async () => {
                        await tour.startTour(activeTour.id, safeStepIndex);
                      }}
                    >
                      Start from this step
                    </button>
                  </div>

                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-100"
                    onClick$={async () => {
                      await tour.startTour(activeTour.id, 0);
                    }}
                  >
                    Start full tour
                    <i class="i-heroicons-arrow-up-right-solid h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section class="grid gap-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <div class="rounded-2xl bg-gray-50 p-4">
          <h2 class="text-sm font-semibold text-gray-900">Topics</h2>
          <p class="mt-1 text-sm leading-6 text-gray-600">Select a topic or use search to jump directly to relevant guidance.</p>
          <nav class="mt-4 space-y-2">
            {visibleTopics.map((topic) => (
              <a
                key={topic.id}
                href={`#${topic.id}`}
                class="block rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-gray-700 no-underline transition-colors hover:border-gray-200 hover:bg-white hover:text-gray-900"
              >
                {topic.title}
              </a>
            ))}
          </nav>
        </div>

        <div class="space-y-4">
          {visibleTopics.length === 0 ? (
            <div class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-600">
              No help topics matched your search.
            </div>
          ) : (
            visibleTopics.map((topic) => (
              <article key={topic.id} id={topic.id} class="scroll-mt-28 rounded-3xl border border-gray-200 bg-gray-50 p-5">
                <HelpTopicContent topic={topic} />
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
});