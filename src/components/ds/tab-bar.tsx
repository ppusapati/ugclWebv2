import { component$, type PropFunction } from '@builder.io/qwik';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface TabBarProps {
  items: TabItem[];
  activeKey: string;
  onTabChange$: PropFunction<(key: string) => void>;
  class?: string;
}

export const TabBar = component$<TabBarProps>((props) => {
  const classes = ['flex flex-wrap items-center gap-2', props.class].filter(Boolean).join(' ');

  return (
    <div class={classes} role="tablist" aria-label="Tabs">
      {props.items.map((tab) => {
        const isActive = tab.key === props.activeKey;

        const tabClasses = [
          'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-200',
          isActive
            ? 'border-color-interactive-primary bg-color-interactive-primary text-color-text-inverse'
            : 'border-color-border-primary bg-color-surface-primary text-color-text-secondary hover:bg-color-surface-secondary',
          tab.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        ].join(' ');

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            class={tabClasses}
            onClick$={() => {
              if (!tab.disabled) {
                props.onTabChange$(tab.key);
              }
            }}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' ? (
              <span class="inline-flex min-w-5 items-center justify-center rounded-full bg-color-surface-secondary px-1.5 text-xs text-color-text-primary">
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
});
