import { Slot, component$ } from '@builder.io/qwik';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface AlertProps {
  variant?: AlertVariant;
  class?: string;
}

const VARIANT_CLASS: Record<AlertVariant, string> = {
  success: 'border-color-semantic-success-300 bg-color-semantic-success-100 text-color-semantic-success-800',
  warning: 'border-color-semantic-warning-300 bg-color-semantic-warning-100 text-color-semantic-warning-800',
  error: 'border-color-semantic-error-300 bg-color-semantic-error-100 text-color-semantic-error-800',
  info: 'border-color-semantic-info-300 bg-color-semantic-info-100 text-color-semantic-info-800',
  neutral: 'border-color-border-primary bg-color-surface-secondary text-color-text-secondary',
};

export const Alert = component$<AlertProps>((props) => {
  const variant = props.variant || 'info';

  const classes = [
    'rounded-lg border px-4 py-3 text-sm',
    VARIANT_CLASS[variant],
    props.class,
  ].filter(Boolean).join(' ');

  return (
    <div class={classes} role="alert">
      <Slot />
    </div>
  );
});