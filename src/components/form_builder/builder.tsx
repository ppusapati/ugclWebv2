
import { $, component$, useStore } from '@builder.io/qwik';
import { P9ELikert } from './likert';
import { FieldPreviewComponent } from './fieldpreiview';
import DragDrop from '../dragdrop';

interface LikertOption {
  label: string;
}

interface Field {
  id: string;
  type: string;
  label: string;
  value: string | Record<string, string>;
  inputType?: string;
  options?: string[];
  likertOptions?: LikertOption[];
}

type FormState = {
  fields: Field[];
  title?: string;
  selectedFieldType: Field['type'];
  dropdownOpen: boolean;
  availableFieldTypes: string[];
};

export const FormBuilder = component$(() => {
  const state = useStore({
    selectedValue: '',
    inputType: 'text',
    label: '',
    options: [''],
    likertFields: [
      {
        statement: '',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
      },
    ],
  });

  const formState = useStore<FormState>({
    fields: [],
    title: '',
    selectedFieldType: 'text',
    dropdownOpen: false,
    availableFieldTypes: ['text', 'select', 'checkbox', 'radio', 'likert'],
  });

  const onSelected = $((event: Event) => {
    const target = event.target as HTMLSelectElement;
    state.selectedValue = target.value;
  });

  const onOptionsChange = $((index: number, event: Event) => {
    const target = event.target as HTMLInputElement;
    state.options[index] = target.value;
  });

  const addOption = $(() => {
    state.options.push('');
  });

  const addField = $(() => {
    const id = crypto.randomUUID();
    const label = state.label.trim() || 'Untitled Field';
    let newField: Field;

    switch (state.selectedValue) {
      case 'Text':
        newField = {
          id,
          type: 'text',
          label,
          value: '',
          inputType: state.inputType,
        };
        break;
      case 'Select':
        newField = {
          id,
          type: 'select',
          label,
          value: '',
          options: [...state.options],
        };
        break;
      case 'Likert':
        newField = {
          id,
          type: 'likert',
          label,
          value: {},
          likertOptions: state.likertFields[0].options.map((label) => ({ label })),
        };
        break;
      default:
        return;
    }

    formState.fields.push(newField);
    state.options = [''];
    state.inputType = 'text';
    state.selectedValue = '';
    state.label = '';
  });

  return (
    <div class="p-4">
      <h1 class="text-2xl mb-4 font-bold">Form Builder</h1>
      <input
        type="text"
        class="border p-2 mb-4 w-full"
        placeholder="Form Title"
        value={formState.title}
        onInput$={(e) => (formState.title = (e.target as HTMLInputElement).value)}
      />
      <select class="border p-2 mb-2" onChange$={onSelected} value={state.selectedValue}>
        <option value="">Select Field Type</option>
        <option value="Text">Text</option>
        <option value="Select">Select</option>
        <option value="Likert">Likert</option>
      </select>

      {state.selectedValue && (
        <div class="mb-4">
          <label class="block mb-1">Label</label>
          <input
            type="text"
            class="border p-2 w-full"
            placeholder="Enter field label"
            value={state.label}
            onInput$={$((e) => (state.label = (e.target as HTMLInputElement).value))}
          />
        </div>
      )}

      {state.selectedValue === 'Text' && (
        <div class="mb-4">
          <label class="block mb-1">Input Type</label>
          <select
            class="border p-2 mb-2 w-full"
            value={state.inputType}
            onChange$={$((e) => (state.inputType = (e.target as HTMLSelectElement).value))}
          >
            <option value="text">Text</option>
            <option value="email">Email</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="url">Website</option>
          </select>
          <input type={state.inputType} class="border p-2 w-full" placeholder={`Preview: ${state.inputType}`} disabled />
        </div>
      )}

      {state.selectedValue === 'Select' && (
        <div class="mb-4">
          <label class="block mb-2">Options</label>
          {state.options.map((option, index) => (
            <input
              key={index}
              type="text"
              class="border p-2 mb-2 w-full"
              placeholder={`Option ${index + 1}`}
              value={option}
              onInput$={$((e) => onOptionsChange(index, e))}
            />
          ))}
          <button class="bg-blue-500 text-white px-3 py-1 rounded" onClick$={addOption}>Add Option</button>
        </div>
      )}

      {state.selectedValue === 'Likert' && (
        <div class="mb-4">
          <label class="block mb-2">Likert Scale Preview</label>
          <P9ELikert />
        </div>
      )}

      <button class="bg-green-600 text-white px-4 py-2 rounded mb-6" onClick$={addField} disabled={!state.selectedValue}>
        Add Field
      </button>

      <DragDrop
        components={formState.fields.map((field, idx) => ({
          id: idx,
          component: FieldPreviewComponent,
          props: {
            field,
            onLabelChange$: $((label: string) => {
              formState.fields[idx].label = label;
            }),
            onDelete$: $(() => {
              formState.fields.splice(idx, 1);
            }),
          },
        }))}
      />
    </div>
  );
});
