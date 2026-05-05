import { Slot, component$ } from '@builder.io/qwik';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  class?: string;
  tourId?: string;
}

export const PageHeader = component$<PageHeaderProps>((props) => {
  const classes = ['mb-5 flex items-start justify-between gap-4', props.class].filter(Boolean).join(' ');

  return (
    <div class={classes} data-tour-id={props.tourId}>
      <div>
        <h1 class="text-3xl font-bold text-color-text-primary">{props.title}</h1>
        {props.subtitle ? (
          <p class="mt-1 text-sm text-color-text-secondary">{props.subtitle}</p>
        ) : null}
      </div>
      <div class="flex items-center gap-2">
        <Slot name="actions" />
      </div>
    </div>
  );
});
