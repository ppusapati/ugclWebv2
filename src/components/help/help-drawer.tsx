import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import { Btn } from '~/components/ds';
import { resolveHelpContext, getToursForPath } from '~/content/help-content';
import { HelpTopicContent } from '~/components/help/help-topic-content';
import { useTourContext } from '~/contexts/tour-context';

export const HelpDrawer = component$(() => {
  const location = useLocation();
  const tour = useTourContext();
  const isOpen = useSignal(false);
  const activeHelpContext = resolveHelpContext(location.url.pathname);
  const contextualTours = getToursForPath(location.url.pathname);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => location.url.pathname);
    isOpen.value = false;
  });

  const openDrawer = $(() => {
    isOpen.value = true;
  });

  const closeDrawer = $(() => {
    isOpen.value = false;
  });

  return (
    <>
      <Btn
        size="sm"
        variant="ghost"
        class="h-10 w-10 rounded-lg border-0 bg-transparent p-0 text-gray-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700"
        title={`Help for ${activeHelpContext.topic.title}`}
        aria-label={`Open help for ${activeHelpContext.topic.title}`}
        onClick$={openDrawer}
      >
        <i class="i-heroicons-question-mark-circle-solid inline-block h-5 w-5" aria-hidden="true" />
      </Btn>

      {isOpen.value ? (
        <>
          <button
            type="button"
            class="fixed inset-0 z-40 bg-slate-950/30"
            aria-label="Close help drawer"
            onClick$={closeDrawer}
          />
          <aside class="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-gray-200 bg-gray-50 shadow-2xl">
            <div class="flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-5">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">In-context help</p>
                <h2 class="mt-2 text-lg font-semibold text-gray-900">{activeHelpContext.topic.title}</h2>
                <p class="mt-1 text-sm text-gray-600">Guidance for the page you are currently viewing.</p>
                {activeHelpContext.variant ? (
                  <p class="mt-1 text-xs font-medium text-blue-700">{activeHelpContext.variant.title}</p>
                ) : null}
              </div>
              <Btn
                size="sm"
                variant="ghost"
                class="h-10 w-10 rounded-lg border-0 bg-transparent p-0 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                title="Close help"
                onClick$={closeDrawer}
              >
                <i class="i-heroicons-x-mark-solid inline-block h-5 w-5" aria-hidden="true" />
              </Btn>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <HelpTopicContent
                topic={activeHelpContext.topic}
                activeVariant={activeHelpContext.variant}
                helpAnchor={activeHelpContext.anchor}
                compact
              />
            </div>

            {contextualTours.length > 0 ? (
              <div class="border-t border-gray-200 bg-white px-6 py-4">
                <p class="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                  <i class="i-heroicons-map-solid mr-1.5 inline-block h-3.5 w-3.5 align-middle" aria-hidden="true" />
                  Guided Tours
                </p>
                <div class="space-y-2">
                  {contextualTours.map((t) => {
                    const isDone = tour.completedTourIds.value.includes(t.id);

                    return (
                      <div key={t.id} class="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5">
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-2">
                            <p class="truncate text-sm font-semibold text-gray-900">{t.title}</p>
                            {isDone ? (
                              <span class="inline-flex shrink-0 items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                                <i class="i-heroicons-check-circle-solid h-3 w-3" aria-hidden="true" />
                                Done
                              </span>
                            ) : null}
                          </div>
                          <p class="mt-0.5 text-xs leading-5 text-gray-600">{t.summary}</p>
                        </div>
                        <Btn
                          size="sm"
                          variant="primary"
                          class="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold"
                          onClick$={async () => {
                            isOpen.value = false;
                            await tour.startTour(t.id, 0);
                          }}
                        >
                          <i class="i-heroicons-play-solid mr-1.5 inline-block h-3.5 w-3.5" aria-hidden="true" />
                          {isDone ? 'Replay' : 'Start'}
                        </Btn>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </aside>
        </>
      ) : null}
    </>
  );
});