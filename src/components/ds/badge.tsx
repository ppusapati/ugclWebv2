import { Slot, component$ } from '@builder.io/qwik';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  class?: string;
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  success: 'bg-color-semantic-success-100 text-color-semantic-success-800',
  warning: 'bg-color-semantic-warning-100 text-color-semantic-warning-800',
  error: 'bg-color-semantic-error-100 text-color-semantic-error-800',
  info: 'bg-color-semantic-info-100 text-color-semantic-info-800',
  neutral: 'bg-color-neutral-100 text-color-neutral-700',
};

export const Badge = component$<BadgeProps>((props) => {
  const variant = props.variant || 'neutral';

  const classes = [
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
    VARIANT_CLASS[variant],
    props.class,
  ].filter(Boolean).join(' ');

  return (
    <span class={classes}>
      <Slot />
    </span>
  );
});
