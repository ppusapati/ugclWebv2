import { Slot, component$ } from '@builder.io/qwik';

export interface SectionCardProps {
  title?: string;
  subtitle?: string;
  class?: string;
}

export const SectionCard = component$<SectionCardProps>((props) => {
  const classes = [
    'rounded-xl border border-color-border-primary bg-color-surface-primary p-6 shadow-sm',
    props.class,
  ].filter(Boolean).join(' ');

  return (
    <section class={classes}>
      {props.title ? (
        <header class="mb-4">
          <h2 class="text-xl font-semibold text-color-text-primary">{props.title}</h2>
          {props.subtitle ? <p class="mt-1 text-sm text-color-text-secondary">{props.subtitle}</p> : null}
        </header>
      ) : null}
      <Slot />
    </section>
  );
});
