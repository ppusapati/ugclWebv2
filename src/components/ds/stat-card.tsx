import { Slot, component$ } from '@builder.io/qwik';

export type StatCardTone = 'default' | 'info' | 'success' | 'warning' | 'error' | 'accent';

export interface StatCardProps {
  class?: string;
  tone?: StatCardTone;
}

const TONE_CLASS: Record<StatCardTone, string> = {
  default: 'border-color-border-primary bg-color-surface-primary',
  info: 'border-color-semantic-info-200 bg-color-semantic-info-100/60',
  success: 'border-color-semantic-success-200 bg-color-semantic-success-100/60',
  warning: 'border-color-semantic-warning-200 bg-color-semantic-warning-100/60',
  error: 'border-color-semantic-error-200 bg-color-semantic-error-100/60',
  accent: 'border-color-interactive-primary/20 bg-color-interactive-primary/5',
};

export const StatCard = component$<StatCardProps>((props) => {
  const tone = props.tone || 'default';

  const classes = [
    'rounded-xl border p-4 shadow-sm',
    TONE_CLASS[tone],
    props.class,
  ].filter(Boolean).join(' ');

  return (
    <section class={classes}>
      <Slot />
    </section>
  );
});