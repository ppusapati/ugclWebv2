import {
  type Signal,
  type QRL,
  component$,
  useStylesScoped$,
} from '@builder.io/qwik';
import { SortButton } from '../SortButton';

interface HeaderProps {
  header: {
    key: string;
    label: string;
  }[];
  sortOrder: Signal<string>;
  sortKey: Signal<string>;
  colWidths: Record<string, string>;
  onResizeStart$: QRL<(e: MouseEvent, key: string) => void>;
}

export const TableHead = component$((props: HeaderProps) => {
  useStylesScoped$(AppCSS);

  return (
    <thead>
      <tr>
        {props.header.map(({ key, label }) => (
          <th
            key={key}
            style={{ width: props.colWidths[key] || 'auto' }}
            class="th-cell"
          >
            <div class="cell-content">
              <span class="truncate">{label}</span>
              <SortButton cellKey={key} sortOrder={props.sortOrder} sortKey={props.sortKey} />
            </div>
            <div class="resizer" onMouseDown$={(e) => props.onResizeStart$(e, key)} />
          </th>
        ))}
      </tr>
    </thead>
  );
});

export const AppCSS = `
  .th-cell {
  position: relative;
  color: #334155;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  overflow: hidden;
}

.cell-content span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1; /* allow label to grow and push sort icon */
}

.resizer {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 6px;
  cursor: col-resize;
  z-index: 10;
}

`;
