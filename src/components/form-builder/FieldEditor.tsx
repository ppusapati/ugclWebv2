// src/components/form-builder/FieldEditor.tsx
import { component$, useSignal, $, type PropFunction } from '@builder.io/qwik';
import type { FormField, FieldType } from '~/types/workflow';

interface FieldEditorProps {
  field: FormField;
  onUpdate$: PropFunction<(field: FormField) => void>;
  onDelete$: PropFunction<() => void>;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'time', label: 'Time' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'select', label: 'Select' },
  { value: 'file_upload', label: 'File Upload' },
  { value: 'signature', label: 'Signature' },
  { value: 'location', label: 'Location' },
];

export default component$<FieldEditorProps>((props) => {
  const expanded = useSignal(false);
  const showAdvanced = useSignal(false);
  const showConditions = useSignal(false);

  const field = props.field;

  const updateField = $(async (updates: Partial<FormField>) => {
    await props.onUpdate$({ ...field, ...updates });
  });

  const addOption = $(() => {
    const options = field.options || [];
    options.push({ label: 'New Option', value: `option_${options.length + 1}` });
    updateField({ options: [...options] });
  });

  const updateOption = $((index: number, key: 'label' | 'value', value: string) => {
    const options = [...(field.options || [])];
    options[index] = { ...options[index], [key]: value };
    updateField({ options });
  });

  const deleteOption = $((index: number) => {
    const options = [...(field.options || [])];
    options.splice(index, 1);
    updateField({ options });
  });

  const needsOptions = ['radio', 'checkbox', 'dropdown', 'select'].includes(field.type);


  return (
    <div class="border border-gray-300 rounded-lg bg-white">
      {/* Header - Collapsed View */}
      <div
        class="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
        onClick$={() => (expanded.value = !expanded.value)}
      >
        <div class="flex-1">
          <div class="flex items-center gap-3">
            <span class="font-medium">{field.label || 'Untitled Field'}</span>
            {field.required && (
              <span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Required</span>
            )}
          </div>
          <div class="text-sm text-gray-500 mt-1">
            {FIELD_TYPES.find(t => t.value === field.type)?.label} • {field.id}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            onClick$={async (e) => {
              e.stopPropagation();
              await props.onDelete$();
            }}
            class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            Delete
          </button>
          <span class="text-gray-400">{expanded.value ? '▼' : '▶'}</span>
        </div>
      </div>

      {/* Expanded Editor */}
      {expanded.value && (
        <div class="border-t border-gray-200 p-4 space-y-4">
          {/* Basic Settings */}
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Field ID *
              </label>
              <input
                type="text"
                value={field.id}
                onInput$={(e) => updateField({ id: (e.target as HTMLInputElement).value })}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="field_name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Field Type *
              </label>
              <select
                value={field.type}
                onChange$={(e) => updateField({ type: (e.target as HTMLSelectElement).value as FieldType })}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Label *
              </label>
              <input
                type="text"
                value={field.label}
                onInput$={(e) => updateField({ label: (e.target as HTMLInputElement).value })}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Field label"
              />
            </div>

            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={field.placeholder || ''}
                onInput$={(e) => updateField({ placeholder: (e.target as HTMLInputElement).value })}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Placeholder text"
              />
            </div>

            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Hint Text
              </label>
              <input
                type="text"
                value={field.hint || ''}
                onInput$={(e) => updateField({ hint: (e.target as HTMLInputElement).value })}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Help text for the user"
              />
            </div>

            <div class="col-span-2">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange$={(e) => updateField({ required: (e.target as HTMLInputElement).checked })}
                  class="mr-2"
                />
                <span class="text-sm font-medium text-gray-700">Required Field</span>
              </label>
            </div>
          </div>

          {/* Options for select-type fields */}
          {needsOptions && (
            <div class="border-t pt-4">
              <div class="flex justify-between items-center mb-3">
                <label class="block text-sm font-medium text-gray-700">
                  Options
                </label>
                <button
                  onClick$={addOption}
                  class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Add Option
                </button>
              </div>

              {/* Data Source Selection */}
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Data Source
                </label>
                <select
                  value={field.dataSource || 'static'}
                  onChange$={(e) => updateField({ dataSource: (e.target as HTMLSelectElement).value as 'static' | 'api' })}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                >
                  <option value="static">Static Options</option>
                  <option value="api">API Endpoint</option>
                </select>
              </div>

              {field.dataSource === 'api' ? (
                <div class="space-y-3 bg-blue-50 p-3 rounded">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">
                      API Endpoint
                    </label>
                    <input
                      type="text"
                      value={field.apiEndpoint || ''}
                      onInput$={(e) => updateField({ apiEndpoint: (e.target as HTMLInputElement).value })}
                      class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="/api/options"
                    />
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">
                        Display Field
                      </label>
                      <input
                        type="text"
                        value={field.displayField || ''}
                        onInput$={(e) => updateField({ displayField: (e.target as HTMLInputElement).value })}
                        class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="name"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">
                        Value Field
                      </label>
                      <input
                        type="text"
                        value={field.valueField || ''}
                        onInput$={(e) => updateField({ valueField: (e.target as HTMLInputElement).value })}
                        class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="id"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div class="space-y-2">
                  {(field.options || []).map((option, index) => (
                    <div key={index} class="flex gap-2">
                      <input
                        type="text"
                        value={option.label}
                        onInput$={(e) => updateOption(index, 'label', (e.target as HTMLInputElement).value)}
                        class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="Label"
                      />
                      <input
                        type="text"
                        value={String(option.value)}
                        onInput$={(e) => updateOption(index, 'value', (e.target as HTMLInputElement).value)}
                        class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="Value"
                      />
                      <button
                        onClick$={() => deleteOption(index)}
                        class="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(!field.options || field.options.length === 0) && (
                    <div class="text-sm text-gray-500 text-center py-2">
                      No options added. Click "Add Option" to create one.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Text Area specific */}
          {field.type === 'textarea' && (
            <div class="border-t pt-4 grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Rows
                </label>
                <input
                  type="number"
                  value={field.rows || 3}
                  onInput$={(e) => updateField({ rows: parseInt((e.target as HTMLInputElement).value) })}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  min="1"
                  max="20"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Max Length
                </label>
                <input
                  type="number"
                  value={field.maxLength || ''}
                  onInput$={(e) => updateField({ maxLength: parseInt((e.target as HTMLInputElement).value) })}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  min="1"
                />
              </div>
            </div>
          )}

          {/* Number field specific */}
          {field.type === 'number' && (
            <div class="border-t pt-4 grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Min Value
                </label>
                <input
                  type="number"
                  value={field.min !== undefined ? field.min : ''}
                  onInput$={(e) => updateField({ min: (e.target as HTMLInputElement).value ? parseFloat((e.target as HTMLInputElement).value) : undefined })}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Max Value
                </label>
                <input
                  type="number"
                  value={field.max !== undefined ? field.max : ''}
                  onInput$={(e) => updateField({ max: (e.target as HTMLInputElement).value ? parseFloat((e.target as HTMLInputElement).value) : undefined })}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Step
                </label>
                <input
                  type="number"
                  value={field.step !== undefined ? field.step : ''}
                  onInput$={(e) => updateField({ step: (e.target as HTMLInputElement).value ? parseFloat((e.target as HTMLInputElement).value) : undefined })}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  placeholder="1"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Prefix/Suffix
                </label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    value={field.prefix || ''}
                    onInput$={(e) => updateField({ prefix: (e.target as HTMLInputElement).value })}
                    class="flex-1 px-2 py-2 text-sm border border-gray-300 rounded"
                    placeholder="Prefix"
                  />
                  <input
                    type="text"
                    value={field.suffix || ''}
                    onInput$={(e) => updateField({ suffix: (e.target as HTMLInputElement).value })}
                    class="flex-1 px-2 py-2 text-sm border border-gray-300 rounded"
                    placeholder="Suffix"
                  />
                </div>
              </div>
            </div>
          )}

          {/* File Upload specific */}
          {field.type === 'file_upload' && (
            <div class="border-t pt-4 space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Accepted File Types
                </label>
                <input
                  type="text"
                  value={field.accept || ''}
                  onInput$={(e) => updateField({ accept: (e.target as HTMLInputElement).value })}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  placeholder=".pdf,.jpg,.png"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Max Files
                  </label>
                  <input
                    type="number"
                    value={field.maxFiles || 1}
                    onInput$={(e) => updateField({ maxFiles: parseInt((e.target as HTMLInputElement).value) })}
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    min="1"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Max Size (MB)
                  </label>
                  <input
                    type="number"
                    value={field.maxSizePerFile || 5}
                    onInput$={(e) => updateField({ maxSizePerFile: parseInt((e.target as HTMLInputElement).value) })}
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    min="1"
                  />
                </div>
              </div>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  checked={field.multiple}
                  onChange$={(e) => updateField({ multiple: (e.target as HTMLInputElement).checked })}
                  class="mr-2"
                />
                <span class="text-sm font-medium text-gray-700">Allow Multiple Files</span>
              </label>
            </div>
          )}

          {/* Advanced Settings Toggle */}
          <div class="border-t pt-4">
            <button
              onClick$={() => (showAdvanced.value = !showAdvanced.value)}
              class="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <span>Advanced Settings</span>
              <span class="text-xl">{showAdvanced.value ? '−' : '+'}</span>
            </button>

            {showAdvanced.value && (
              <div class="mt-4 space-y-4">
                {/* Validation Rules */}
                <div class="bg-gray-50 p-4 rounded">
                  <h4 class="font-medium text-sm mb-3">Validation Rules</h4>
                  <div class="grid grid-cols-2 gap-4">
                    {(field.type === 'text' || field.type === 'textarea') && (
                      <>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">
                            Min Length
                          </label>
                          <input
                            type="number"
                            value={field.validation?.minLength || ''}
                            onInput$={(e) => updateField({
                              validation: {
                                ...field.validation,
                                minLength: (e.target as HTMLInputElement).value ? parseInt((e.target as HTMLInputElement).value) : undefined
                              }
                            })}
                            class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            min="0"
                          />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">
                            Max Length
                          </label>
                          <input
                            type="number"
                            value={field.validation?.maxLength || ''}
                            onInput$={(e) => updateField({
                              validation: {
                                ...field.validation,
                                maxLength: (e.target as HTMLInputElement).value ? parseInt((e.target as HTMLInputElement).value) : undefined
                              }
                            })}
                            class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            min="1"
                          />
                        </div>
                        <div class="col-span-2">
                          <label class="block text-xs font-medium text-gray-700 mb-1">
                            Pattern (Regex)
                          </label>
                          <input
                            type="text"
                            value={field.validation?.pattern || ''}
                            onInput$={(e) => updateField({
                              validation: {
                                ...field.validation,
                                pattern: (e.target as HTMLInputElement).value
                              }
                            })}
                            class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="^[A-Za-z]+$"
                          />
                        </div>
                      </>
                    )}

                    {field.type === 'number' && (
                      <>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">
                            Min Value
                          </label>
                          <input
                            type="number"
                            value={field.validation?.min !== undefined ? field.validation.min : ''}
                            onInput$={(e) => updateField({
                              validation: {
                                ...field.validation,
                                min: (e.target as HTMLInputElement).value ? parseFloat((e.target as HTMLInputElement).value) : undefined
                              }
                            })}
                            class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">
                            Max Value
                          </label>
                          <input
                            type="number"
                            value={field.validation?.max !== undefined ? field.validation.max : ''}
                            onInput$={(e) => updateField({
                              validation: {
                                ...field.validation,
                                max: (e.target as HTMLInputElement).value ? parseFloat((e.target as HTMLInputElement).value) : undefined
                              }
                            })}
                            class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      </>
                    )}

                    {(field.type === 'date' || field.type === 'datetime') && (
                      <>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">
                            Min Date
                          </label>
                          <input
                            type="date"
                            value={field.validation?.minDate || ''}
                            onInput$={(e) => updateField({
                              validation: {
                                ...field.validation,
                                minDate: (e.target as HTMLInputElement).value
                              }
                            })}
                            class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">
                            Max Date
                          </label>
                          <input
                            type="date"
                            value={field.validation?.maxDate || ''}
                            onInput$={(e) => updateField({
                              validation: {
                                ...field.validation,
                                maxDate: (e.target as HTMLInputElement).value
                              }
                            })}
                            class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      </>
                    )}

                    <div class="col-span-2">
                      <label class="block text-xs font-medium text-gray-700 mb-1">
                        Custom Validation Message
                      </label>
                      <input
                        type="text"
                        value={field.validation?.message || ''}
                        onInput$={(e) => updateField({
                          validation: {
                            ...field.validation,
                            message: (e.target as HTMLInputElement).value
                          }
                        })}
                        class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="This field is invalid"
                      />
                    </div>
                  </div>
                </div>

                {/* Default Value */}
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Default Value
                  </label>
                  <input
                    type="text"
                    value={field.defaultValue || ''}
                    onInput$={(e) => updateField({ defaultValue: (e.target as HTMLInputElement).value })}
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    placeholder="Default value"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Conditional Visibility */}
          <div class="border-t pt-4">
            <button
              onClick$={() => (showConditions.value = !showConditions.value)}
              class="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <span>Conditional Visibility</span>
              <span class="text-xl">{showConditions.value ? '−' : '+'}</span>
            </button>

            {showConditions.value && (
              <div class="mt-4 bg-blue-50 p-4 rounded space-y-3">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">
                    Show when field
                  </label>
                  <input
                    type="text"
                    value={field.visible?.field || ''}
                    onInput$={(e) => updateField({
                      visible: {
                        ...field.visible!,
                        field: (e.target as HTMLInputElement).value,
                        operator: field.visible?.operator || 'equals',
                        value: field.visible?.value || ''
                      }
                    })}
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="field_id"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">
                    Operator
                  </label>
                  <select
                    value={field.visible?.operator || 'equals'}
                    onChange$={(e) => updateField({
                      visible: {
                        ...field.visible!,
                        field: field.visible?.field || '',
                        operator: (e.target as HTMLSelectElement).value as any,
                        value: field.visible?.value || ''
                      }
                    })}
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    value={field.visible?.value || ''}
                    onInput$={(e) => updateField({
                      visible: {
                        ...field.visible!,
                        field: field.visible?.field || '',
                        operator: field.visible?.operator || 'equals',
                        value: (e.target as HTMLInputElement).value
                      }
                    })}
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="comparison value"
                  />
                </div>
                {field.visible?.field && (
                  <button
                    onClick$={() => updateField({ visible: undefined })}
                    class="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove Condition
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Field Preview */}
          <div class="border-t pt-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Preview</h4>
            <div class="bg-gray-50 p-4 rounded border border-gray-200">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {field.label} {field.required && <span class="text-red-500">*</span>}
              </label>
              
              {field.type === 'text' && (
                <input
                  type="text"
                  placeholder={field.placeholder}
                  class="w-full px-3 py-2 border border-gray-300 rounded"
                  disabled
                />
              )}
              
              {field.type === 'textarea' && (
                <textarea
                  placeholder={field.placeholder}
                  rows={field.rows || 3}
                  class="w-full px-3 py-2 border border-gray-300 rounded"
                  disabled
                />
              )}
              
              {field.type === 'number' && (
                <div class="flex items-center">
                  {field.prefix && <span class="mr-2 text-gray-600">{field.prefix}</span>}
                  <input
                    type="number"
                    placeholder={field.placeholder}
                    class="flex-1 px-3 py-2 border border-gray-300 rounded"
                    disabled
                  />
                  {field.suffix && <span class="ml-2 text-gray-600">{field.suffix}</span>}
                </div>
              )}
              
              {(field.type === 'dropdown' || field.type === 'select') && (
                <select class="w-full px-3 py-2 border border-gray-300 rounded" disabled>
                  <option>{field.placeholder || 'Select an option'}</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
              
              {field.type === 'radio' && (
                <div class="space-y-2">
                  {(field.options || []).map((opt) => (
                    <label key={opt.value} class="flex items-center">
                      <input type="radio" name={field.id} class="mr-2" disabled />
                      <span class="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {field.type === 'checkbox' && (
                <div class="space-y-2">
                  {(field.options || []).map((opt) => (
                    <label key={opt.value} class="flex items-center">
                      <input type="checkbox" class="mr-2" disabled />
                      <span class="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {field.type === 'date' && (
                <input
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded"
                  disabled
                />
              )}
              
              {field.type === 'datetime' && (
                <input
                  type="datetime-local"
                  class="w-full px-3 py-2 border border-gray-300 rounded"
                  disabled
                />
              )}
              
              {field.type === 'time' && (
                <input
                  type="time"
                  class="w-full px-3 py-2 border border-gray-300 rounded"
                  disabled
                />
              )}

              {field.type === 'email' && (
                <input
                  type="email"
                  placeholder={field.placeholder}
                  class="w-full px-3 py-2 border border-gray-300 rounded"
                  disabled
                />
              )}

              {field.type === 'phone' && (
                <input
                  type="tel"
                  placeholder={field.placeholder}
                  class="w-full px-3 py-2 border border-gray-300 rounded"
                  disabled
                />
              )}
              
              {field.type === 'file_upload' && (
                <div class="border-2 border-dashed border-gray-300 rounded p-4 text-center">
                  <div class="text-sm text-gray-500">
                    Click to upload or drag and drop
                  </div>
                  <div class="text-xs text-gray-400 mt-1">
                    {field.accept || 'All files'} • Max {field.maxSizePerFile || 5}MB
                  </div>
                </div>
              )}

              {field.type === 'signature' && (
                <div class="border-2 border-dashed border-gray-300 rounded p-8 text-center bg-white">
                  <div class="text-sm text-gray-500">
                    Signature Canvas
                  </div>
                </div>
              )}

              {field.type === 'location' && (
                <div class="border border-gray-300 rounded p-4 bg-white">
                  <div class="text-sm text-gray-500">
                    📍 Location Picker
                  </div>
                </div>
              )}
              
              {field.hint && (
                <p class="mt-2 text-xs text-gray-500">{field.hint}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
