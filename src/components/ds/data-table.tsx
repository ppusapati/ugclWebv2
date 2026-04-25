import { Slot, component$, type QwikIntrinsicElements } from '@builder.io/qwik';

export interface DataTableProps {
  class?: string;
}

type NativeDivProps = Omit<QwikIntrinsicElements['div'], 'class'>;
type NativeTheadProps = Omit<QwikIntrinsicElements['thead'], 'class'>;
type NativeTbodyProps = Omit<QwikIntrinsicElements['tbody'], 'class'>;
type NativeTrProps = Omit<QwikIntrinsicElements['tr'], 'class'>;
type NativeThProps = Omit<QwikIntrinsicElements['th'], 'class'>;
type NativeTdProps = Omit<QwikIntrinsicElements['td'], 'class'>;

export const DataTable = component$<DataTableProps & NativeDivProps>((props) => {
  const classes = [
    'w-full overflow-hidden rounded-xl border border-color-border-primary bg-color-surface-primary',
    props.class,
  ].filter(Boolean).join(' ');

  return (
    <div {...props} class={classes}>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <Slot />
        </table>
      </div>
    </div>
  );
});

export const DataTableHead = component$<DataTableProps & NativeTheadProps>((props) => {
  return (
    <thead
      {...props}
      class={['bg-color-surface-secondary text-xs uppercase tracking-wide text-color-text-tertiary', props.class]
        .filter(Boolean)
        .join(' ')}
    >
      <Slot />
    </thead>
  );
});

export const DataTableBody = component$<DataTableProps & NativeTbodyProps>((props) => {
  return (
    <tbody
      {...props}
      class={['divide-y divide-color-border-primary', props.class].filter(Boolean).join(' ')}
    >
      <Slot />
    </tbody>
  );
});

export const DataTableRow = component$<DataTableProps & NativeTrProps>((props) => {
  return (
    <tr
      {...props}
      class={['text-color-text-primary hover:bg-color-surface-secondary', props.class].filter(Boolean).join(' ')}
    >
      <Slot />
    </tr>
  );
});

export const DataTableHeaderCell = component$<DataTableProps & NativeThProps>((props) => {
  return (
    <th
      {...props}
      class={['px-4 py-3 text-left font-semibold', props.class].filter(Boolean).join(' ')}
    >
      <Slot />
    </th>
  );
});

export const DataTableCell = component$<DataTableProps & NativeTdProps>((props) => {
  return (
    <td
      {...props}
      class={['px-4 py-3 align-middle text-color-text-secondary', props.class].filter(Boolean).join(' ')}
    >
      <Slot />
    </td>
  );
});
