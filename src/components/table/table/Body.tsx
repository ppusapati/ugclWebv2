import { type Signal, component$, useComputed$, useStylesScoped$, $, type QRL } from '@builder.io/qwik';
import { extractImageUrls, isImage } from '../utils/imageBool';

function formatDate(val: string, formatStr = 'dd-MM-yyyy') {
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return formatStr
    .replace('dd', day)
    .replace('MM', month)
    .replace('yyyy', String(year));
}

// Action button interface
export interface ActionButton {
  type: 'button';
  label: string;
  onClick$: QRL<() => void>;
  class?: string;
}

// Action link interface
export interface ActionLink {
  type: 'link';
  label: string;
  href: string;
  class?: string;
}

export type ActionItem = ActionButton | ActionLink;
export type ActionItems = ActionItem | ActionItem[];

interface bodyProps {
  data: {
    [key: string]: string | number | null | undefined | ActionItems;
  }[];
  header: { key: string; label: string; type?: string; format?: string }[];
  pageNo: Signal<number>;
  postPerPage: Signal<number>;
  serverPagination?: boolean;
}

type cellType = {
  [key: string]: string | number | null | undefined | ActionItems;
}

export const TableBody = component$((props: bodyProps) => {
  useStylesScoped$(AppCSS);

const computedPosts = useComputed$(() => {
  if (props.serverPagination) {
    return props.data; // already paginated by backend
  }

  const start = props.pageNo.value * props.postPerPage.value;
  const end = start + parseInt(props.postPerPage.value.toString());
  return Array.isArray([...props.data])
    ? props.data.slice(start, end)
    : [];
});


  // Helper function to render a single action item
  const renderActionItem = (item: ActionItem, index: number) => {
    if (item.type === 'button') {
      return (
        <button
          key={index}
          class={item.class || 'px-3 py-1 text-sm text-blue-600 hover:text-blue-900 border border-blue-300 rounded hover:bg-blue-50'}
          onClick$={item.onClick$}
        >
          {item.label}
        </button>
      );
    } else if (item.type === 'link') {
      return (
        <a
          key={index}
          href={item.href}
          class={item.class || 'px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 border border-indigo-300 rounded hover:bg-indigo-50'}
        >
          {item.label}
        </a>
      );
    }
    return null;
  };

  return (
    <tbody>
      {computedPosts.value.map((cell: cellType, rowIdx) => (
        <tr key={(typeof cell.id === 'string' || typeof cell.id === 'number') ? cell.id : rowIdx}>
          {props.header.map((col, i) => {
            const val = cell[col.key];

            // Check if it's an action item or array of action items
            if (typeof val === 'object' && val !== null && 'type' in val) {
              // Single action item
              const actionItem = val as ActionItem;
              return (
                <td key={i}>
                  <div class="flex flex-wrap gap-2">
                    {renderActionItem(actionItem, 0)}
                  </div>
                </td>
              );
            } else if (Array.isArray(val)) {
              // Array of action items
              return (
                <td key={i}>
                  <div class="flex flex-wrap gap-2">
                    {val.map((item, idx) => renderActionItem(item as ActionItem, idx))}
                  </div>
                </td>
              );
            }

            // Check if it's an image
            if (isImage(val)) {
              const urls = extractImageUrls(val);
              return (
                <td key={i}>
                  {urls.map((src, index) =>
                    <img
                      key={index}
                      src={typeof src === 'string' ? src.trim() : ''}
                      width={50}
                      height={50}
                      alt="photo"
                      style={{ marginRight: '4px', borderRadius: '4px' }}
                    />
                  )}
                </td>
              );
            } else if (col.type === 'date' && val) {
              const displayFormat = col.format || 'dd-MM-yyyy';
              return <td key={i}>{formatDate(val as string, displayFormat)}</td>;
            } else {
              return <td class='w-25' key={i}>{val == null || typeof val === 'object' ? '' : val.toString()}</td>;
            }
          })}
        </tr>
      ))}
    </tbody>
  );
});

export const AppCSS = `
  tbody {
    color: #0f172a;
    font-size: 15px;
    letter-spacing: 0.3px;
  }
  img {
    object-fit: cover;
  }
`;
