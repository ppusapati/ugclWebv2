import { component$, PropFunction } from '@builder.io/qwik';
import { P9ELikert } from './likert';
interface Field {
  id: string;
  type: string;
  label: string;
  value: string | Record<string, string>;
  inputType?: string;
  options?: string[];
  likertOptions?: { label: string }[];
}

interface Props {
  field: Field;
  onLabelChange$: PropFunction<(label: string) => void>;
  onDelete$: PropFunction<() => void>;
}

export const FieldPreviewComponent = component$<Props>(({ field, onLabelChange$, onDelete$ }) => {
  return (
    <div class="border p-3 mb-3 rounded relative bg-white">
      <input
        type="text"
        class="font-bold text-lg border-b mb-2 w-full"
        value={field.label}
        onInput$={(e) => onLabelChange$((e.target as HTMLInputElement).value)}
      />
      {field.type === 'text' && (
        <input
          type={field.inputType || 'text'}
          class="border p-2 w-full"
          placeholder={`User input (${field.inputType || 'text'})`}
        />
      )}
      {field.type === 'select' && (
        <select class="border p-2 w-full">
          {field.options?.map((opt, idx) => (
            <option key={idx}>{opt}</option>
          ))}
        </select>
      )}
      {field.type === 'likert' && <P9ELikert  />}
      <button
        type="button"
        class="absolute top-2 right-2 text-red-500"
        onClick$={onDelete$}
      >
        ✕
      </button>
    </div>
  );
});
