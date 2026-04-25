import { Slot, component$, type QwikIntrinsicElements } from '@builder.io/qwik';

export type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type BtnSize = 'sm' | 'md' | 'lg';

export interface BtnProps {
  variant?: BtnVariant;
  size?: BtnSize;
  type?: 'button' | 'submit' | 'reset';
  class?: string;
}

type NativeButtonProps = Omit<QwikIntrinsicElements['button'], 'class' | 'type'>;

export type DesignSystemBtnProps = BtnProps & NativeButtonProps;

const VARIANT_CLASS: Record<BtnVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

const SIZE_CLASS: Record<BtnSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export const Btn = component$<DesignSystemBtnProps>((props) => {
  const variant = props.variant || 'primary';
  const size = props.size || 'md';
  const type = props.type || 'button';

  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    props.class,
  ].filter(Boolean).join(' ');

  return (
    <button {...props} type={type} class={classes}>
      <Slot />
    </button>
  );
});
