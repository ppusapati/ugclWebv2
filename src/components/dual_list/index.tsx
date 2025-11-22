import {
  component$,
  useStore,
  $,
  useSignal,
  useTask$,
  PropFunction,
} from '@builder.io/qwik';

interface ColumnItem {
  key: string;
  label: string;
}

interface DualListboxProps {
  allColumns: ColumnItem[];
  selected: string[];
  onChange$: PropFunction<(selected: string[]) => void>;
  fixedHeight?: string;
}

// Defensive arrayMove
function arrayMove(arr: any[] = [], from: number, to: number) {
  if (!arr.length || from < 0 || from >= arr.length || to < 0 || to >= arr.length) return arr;
  const newArr = arr.slice();
  const val = newArr.splice(from, 1)[0];
  newArr.splice(to, 0, val);
  return newArr;
}

export const DualListbox = component$((props: DualListboxProps) => {
  const allColumns = Array.isArray(props.allColumns) ? props.allColumns : [];
  const selected = Array.isArray(props.selected) ? props.selected : [];

  const leftList = useStore<{ keys: string[]; selected: Set<string> }>({
    keys: allColumns
      .map((c) => c.key)
      .filter((k) => !selected.includes(k)),
    selected: new Set<string>(),
  });
  
  const rightList = useStore<{ keys: string[]; selected: Set<string> }>({
    keys: selected.slice(),
    selected: new Set<string>(),
  });

  const isDragActive = useSignal(false);
  const draggingIdx = useSignal<number | null>(null);

  useTask$(({ track }) => {
    track(() => props.allColumns);
    track(() => props.selected);
    leftList.keys = (Array.isArray(props.allColumns) ? props.allColumns : [])
      .map((c) => c.key)
      .filter((k) => !props.selected?.includes(k));
    leftList.selected = new Set();
    rightList.keys = Array.isArray(props.selected) ? props.selected.slice() : [];
    rightList.selected = new Set();
  });

  const moveToRight = $(() => {
    if (!rightList.keys) rightList.keys = [];
    const newRight = [...rightList.keys, ...leftList.selected];
    props.onChange$(newRight);
    leftList.selected = new Set();
  });

  const moveToLeft = $(() => {
    if (!rightList.keys) rightList.keys = [];
    const toRemove = rightList.selected;
    const newRight = rightList.keys.filter((k) => !toRemove.has(k));
    props.onChange$(newRight);
    rightList.selected = new Set();
  });

  const moveAllToRight = $(() => {
    props.onChange$(allColumns.map((c) => c.key));
    leftList.selected = new Set();
  });

  const moveAllToLeft = $(() => {
    props.onChange$([]);
    rightList.selected = new Set();
  });

  const handleDragStart = $((idx: number) => {
    draggingIdx.value = idx;
    isDragActive.value = true;
  });

  const handleDragOver = $((idx: number, e: DragEvent) => {
    e.preventDefault();
    if (
      draggingIdx.value !== null &&
      draggingIdx.value !== idx &&
      Array.isArray(rightList.keys)
    ) {
      rightList.keys = arrayMove(rightList.keys, draggingIdx.value, idx);
      draggingIdx.value = idx;
      props.onChange$(rightList.keys);
    }
  });

  const handleDragEnd = $(() => {
    draggingIdx.value = null;
    isDragActive.value = false;
  });

  const handleSelect = $((
    list: typeof leftList | typeof rightList,
    key: string,
    e: MouseEvent
  ) => {
    if (!Array.isArray(list.keys) || !list.keys.length) return;
    if (e.shiftKey && list.selected.size > 0) {
      const keysArr = list.keys;
      const last = Array.from(list.selected).pop();
      if (!last) return;
      const i1 = keysArr.indexOf(last);
      const i2 = keysArr.indexOf(key);
      if (i1 === -1 || i2 === -1) return;
      const [start, end] = i1 < i2 ? [i1, i2] : [i2, i1];
      const newSel = new Set(list.selected);
      for (let i = start; i <= end; i++) newSel.add(keysArr[i]);
      list.selected = newSel;
    } else if (e.ctrlKey || e.metaKey) {
      if (list.selected.has(key)) list.selected.delete(key);
      else list.selected.add(key);
      list.selected = new Set(list.selected);
    } else {
      list.selected = new Set([key]);
    }
  });

  const getLabel = (key: string) => {
    if (!Array.isArray(props.allColumns)) return key;
    const c = props.allColumns.find((col) => col.key === key);
    return c ? c.label : key;
  };

  return (
    <div class="w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-primary-50 rounded-2xl shadow-xl border border-white/20">
      {/* Header */}
      <div class="mb-6 text-center">
        <h3 class="text-2xl font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
          Column Manager
        </h3>
        <p class="text-slate-600 text-sm mt-1">Configure your table columns with drag & drop</p>
      </div>

      <div 
        class="flex gap-6 items-stretch"
        style={{ height: props.fixedHeight || '400px' }}
      >
        {/* LEFT: Available columns */}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
            <h4 class="font-semibold text-slate-700 text-lg">Available Columns</h4>
            <div class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
              {leftList.keys?.length || 0}
            </div>
          </div>
          
          <div class="relative h-full">
            <ul
              role="listbox"
              aria-label="Available columns"
              aria-multiselectable="true"
              class="h-full overflow-y-auto bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-lg p-3 space-y-2"
              style={{ 
                maxHeight: `calc(${props.fixedHeight || '400px'} - 80px)`,
                minHeight: `calc(${props.fixedHeight || '400px'} - 80px)`
              }}
            >
              {!leftList.keys?.length && (
                <li class="flex items-center justify-center h-32 text-slate-400 text-sm">
                  <div class="text-center">
                    <div class="text-2xl mb-2">📋</div>
                    <div>No columns available</div>
                  </div>
                </li>
              )}
              {leftList.keys?.map((key) => (
                <li
                  key={key}
                  tabIndex={0}
                  class={`
                    group relative px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 
                    border border-transparent select-none
                    ${leftList.selected.has(key)
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg scale-[1.02] border-primary-300'
                      : 'bg-white/60 hover:bg-white hover:shadow-md hover:scale-[1.01] hover:border-slate-200'
                    }
                  `}
                  onClick$={(e) => handleSelect(leftList, key, e as MouseEvent)}
                >
                  <div class="flex items-center gap-3">
                    <div class={`w-2 h-2 rounded-full transition-colors duration-200 ${
                      leftList.selected.has(key) ? 'bg-white' : 'bg-slate-300 group-hover:bg-primary-400'
                    }`}></div>
                    <span class="font-medium text-sm">{getLabel(key)}</span>
                  </div>
                  {leftList.selected.has(key) && (
                    <div class="absolute inset-0 rounded-lg ring-2 ring-primary-300 ring-opacity-50 pointer-events-none"></div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* MIDDLE: Control buttons */}
        <div class="flex flex-col items-center justify-center gap-3 px-2">
          <div class="flex flex-col gap-2">
            <button
              disabled={!leftList.selected?.size}
              onClick$={moveToRight}
              class="group relative w-12 h-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:scale-100"
              title="Add selected columns"
            >
              <span class="text-lg font-bold">→</span>
              <div class="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
            
            <button
              disabled={!leftList.keys?.length}
              onClick$={moveAllToRight}
              class="group relative w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:scale-100"
              title="Add all columns"
            >
              <span class="text-sm font-bold">⇒</span>
              <div class="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </div>

          <div class="w-px h-8 bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>

          <div class="flex flex-col gap-2">
            <button
              disabled={!rightList.selected?.size}
              onClick$={moveToLeft}
              class="group relative w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:scale-100"
              title="Remove selected columns"
            >
              <span class="text-lg font-bold">←</span>
              <div class="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
            
            <button
              disabled={!rightList.keys?.length}
              onClick$={moveAllToLeft}
              class="group relative w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:scale-100"
              title="Remove all columns"
            >
              <span class="text-sm font-bold">⇐</span>
              <div class="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </div>
        </div>

        {/* RIGHT: Selected columns (sortable) */}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-3 h-3 rounded-full bg-gradient-to-r from-secondary-400 to-secondary-500"></div>
            <h4 class="font-semibold text-slate-700 text-lg">Selected Columns</h4>
            <div class="bg-secondary-100 text-secondary-700 px-2 py-1 rounded-full text-xs font-medium">
              {rightList.keys?.length || 0}
            </div>
          </div>
          
          <div class="relative h-full">
            <ul
              class={`h-full overflow-y-auto bg-white/80 backdrop-blur-sm rounded-xl border shadow-lg p-3 space-y-2 transition-all duration-200 ${
                isDragActive.value ? 'border-secondary-300 bg-secondary-50/50' : 'border-slate-200/60'
              }`}
              style={{ 
                maxHeight: `calc(${props.fixedHeight || '400px'} - 80px)`,
                minHeight: `calc(${props.fixedHeight || '400px'} - 80px)`
              }}
            >
              {!rightList.keys?.length && (
                <li class="flex items-center justify-center h-32 text-slate-400 text-sm">
                  <div class="text-center">
                    <div class="text-2xl mb-2">🎯</div>
                    <div>Drag columns here</div>
                    <div class="text-xs mt-1">or use the arrow buttons</div>
                  </div>
                </li>
              )}
              {rightList.keys?.map((key, idx) => (
                <li
                  key={key}
                  tabIndex={0}
                  draggable
                  class={`
                    group relative px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 
                    border select-none flex items-center gap-3
                    ${rightList.selected.has(key)
                      ? 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-lg scale-[1.02] border-secondary-300'
                      : 'bg-white/60 hover:bg-white hover:shadow-md hover:scale-[1.01] border-transparent hover:border-slate-200'
                    }
                    ${draggingIdx.value === idx ? 'opacity-50 scale-95' : ''}
                  `}
                  onClick$={(e) => handleSelect(rightList, key, e as MouseEvent)}
                  onDragStart$={() => handleDragStart(idx)}
                  onDragOver$={(e) => handleDragOver(idx, e as DragEvent)}
                  onDragEnd$={handleDragEnd}
                >
                  <div class="flex items-center gap-3 flex-1">
                    <div class={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors duration-200 ${
                      rightList.selected.has(key) 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-100 text-slate-600 group-hover:bg-secondary-100 group-hover:text-secondary-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <span class="font-medium text-sm flex-1">{getLabel(key)}</span>
                  </div>
                  
                  <div class={`flex items-center gap-1 transition-colors duration-200 ${
                    rightList.selected.has(key) ? 'text-white/70' : 'text-slate-400 group-hover:text-secondary-400'
                  }`}>
                    <span class="text-xs font-medium">DRAG</span>
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                    </svg>
                  </div>
                  
                  {rightList.selected.has(key) && (
                    <div class="absolute inset-0 rounded-lg ring-2 ring-secondary-300 ring-opacity-50 pointer-events-none"></div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div class="mt-6 pt-4 border-t border-slate-200/60">
        <div class="flex items-center justify-between text-xs text-slate-500">
          <div class="flex items-center gap-4">
            <span>💡 Hold Ctrl/Cmd for multi-select</span>
            <span>⇧ Hold Shift for range select</span>
          </div>
          <div class="flex items-center gap-2">
            <span>Total: {allColumns.length}</span>
            <span>•</span>
            <span>Selected: {rightList.keys?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
});