import { component$, useSignal } from '@builder.io/qwik';
import { PageHeader } from '~/components/ds';
import { HelpTopicContent } from '~/components/help/help-topic-content';
import { helpTopics } from '~/content/help-content';

export default component$(() => {
  const search = useSignal('');
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