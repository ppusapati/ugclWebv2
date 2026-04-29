import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import type { HelpTopic, HelpVariant } from '~/content/help-content';

interface HelpTopicContentProps {
  topic: HelpTopic;
  compact?: boolean;
  activeVariant?: HelpVariant;
  helpAnchor?: string;
}

export const HelpTopicContent = component$<HelpTopicContentProps>(({ topic, compact, activeVariant, helpAnchor }) => {
  const resolvedAnchor = helpAnchor || (activeVariant ? `${topic.id}-${activeVariant.id}` : topic.id);

  return (
    <div class="space-y-5">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Quick Help</p>
        <h2 class="mt-2 text-2xl font-bold text-gray-900">{topic.title}</h2>
        <p class="mt-2 text-sm leading-6 text-gray-600">{topic.summary}</p>
      </div>

      {activeVariant ? (
        <section class="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
          <h3 class="text-sm font-semibold text-blue-900">Current page mode: {activeVariant.title}</h3>
          {activeVariant.summary ? (
            <p class="mt-2 text-sm leading-6 text-blue-950">{activeVariant.summary}</p>
          ) : null}
          {activeVariant.quickActions && activeVariant.quickActions.length > 0 ? (
            <ul class="mt-3 space-y-2 text-sm leading-6 text-blue-950">
              {activeVariant.quickActions.map((action) => (
                <li key={action} class="flex items-start gap-2">
                  <span class="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {activeVariant.sections && activeVariant.sections.length > 0 ? (
            <div class="mt-4 space-y-3">
              {activeVariant.sections.map((section) => (
                <div key={section.title}>
                  <h4 class="text-sm font-semibold text-blue-900">{section.title}</h4>
                  <ul class="mt-2 space-y-2 text-sm leading-6 text-blue-950">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} class="flex items-start gap-2">
                        <span class="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {topic.quickActions && topic.quickActions.length > 0 ? (
        <section class="rounded-2xl border border-primary-100 bg-primary-50/70 p-4">
          <h3 class="text-sm font-semibold text-primary-900">Start here</h3>
          <ul class="mt-3 space-y-2 text-sm leading-6 text-primary-950">
            {topic.quickActions.map((action) => (
              <li key={action} class="flex items-start gap-2">
                <span class="mt-1 h-1.5 w-1.5 rounded-full bg-primary-500"></span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {topic.sections.map((section) => (
        <section key={section.title} class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-900">{section.title}</h3>
          <ul class="mt-3 space-y-2 text-sm leading-6 text-gray-700">
            {section.bullets.map((bullet) => (
              <li key={bullet} class="flex items-start gap-2">
                <span class="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {!topic.variants || topic.variants.length === 0 ? null : (
        <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-900">Route-specific guidance</h3>
          <div class="mt-3 space-y-4">
            {topic.variants.map((variant) => (
              <article key={variant.id} id={`${topic.id}-${variant.id}`} class="scroll-mt-28 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <h4 class="text-sm font-semibold text-gray-900">{variant.title}</h4>
                {variant.summary ? <p class="mt-1 text-sm leading-6 text-gray-700">{variant.summary}</p> : null}
                {variant.quickActions && variant.quickActions.length > 0 ? (
                  <ul class="mt-2 space-y-1.5 text-sm leading-6 text-gray-700">
                    {variant.quickActions.map((action) => (
                      <li key={action} class="flex items-start gap-2">
                        <span class="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      )}

      {!compact ? null : (
        <div class="pt-1">
          <Link
            href={`/help#${resolvedAnchor}`}
            class="inline-flex items-center gap-2 text-sm font-medium text-primary-700 no-underline transition-colors hover:text-primary-800"
          >
            Open full help center
            <i class="i-heroicons-arrow-up-right-solid h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
});