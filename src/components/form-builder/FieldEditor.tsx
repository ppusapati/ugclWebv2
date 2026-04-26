// src/components/form-builder/FieldEditor.tsx
import { component$, useSignal, $, type PropFunction } from '@builder.io/qwik';
import { Badge, Btn, FormField } from '~/components/ds';
import type { FormField as WorkflowFormField, FieldOption, FieldType } from '~/types/workflow';

interface FieldEditorProps {
  field: WorkflowFormField;
  onUpdate$: PropFunction<(field: WorkflowFormField) => void>;
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
  { value: 'camera', label: 'Camera' },
  { value: 'signature', label: 'Signature' },
  { value: 'location', label: 'Location' },
];

export default component$<FieldEditorProps>((props) => {
  const expanded = useSignal(false);
  const showAdvanced = useSignal(false);
  const showConditions = useSignal(false);

  const field = props.field;

  const updateField = $(async (updates: Partial<WorkflowFormField>) => {
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
              <Badge variant="error" class="text-xs px-2 py-0.5">Required</Badge>
            )}
          </div>
          <div class="text-sm text-gray-500 mt-1">
            {FIELD_TYPES.find(t => t.value === field.type)?.label} • {field.id}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Btn
            onClick$={async (e) => {
              e.stopPropagation();
              await props.onDelete$();
            }}
            variant="danger"
            size="sm"
            class="rounded"
          >
            Delete
          </Btn>
          <i
            class={`${expanded.value ? 'i-heroicons-chevron-down-solid' : 'i-heroicons-chevron-right-solid'} h-4 w-4 inline-block text-gray-400`}
            aria-hidden="true"
          ></i>
        </div>
      </div>

      {/* Expanded Editor */}
      {expanded.value && (
        <div class="border-t border-gray-200 p-4 space-y-4">
          {/* Basic Settings */}
          <div class="grid grid-cols-2 gap-4">
            <div>
              <FormField id="editor-field-id" label="Field ID" required>
                <input
                  id="editor-field-id"
                  type="text"
                  value={field.id}
                  onInput$={(e) => updateField({ id: (e.target as HTMLInputElement).value })}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="field_name"
                />
              </FormField>
            </div>

            <div>
              <FormField id="editor-field-type" label="Field Type" required>
                <select
                  id="editor-field-type"
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
              </FormField>
            </div>

            <div class="col-span-2">
              <FormField id="editor-label" label="Label" required>
                <input
                  id="editor-label"
                  type="text"
                  value={field.label}
                  onInput$={(e) => updateField({ label: (e.target as HTMLInputElement).value })}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Field label"
                />
              </FormField>
            </div>

            <div class="col-span-2">
              <FormField id="editor-placeholder" label="Placeholder">
                <input
                  id="editor-placeholder"
                  type="text"
                  value={field.placeholder || ''}
                  onInput$={(e) => updateField({ placeholder: (e.target as HTMLInputElement).value })}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Placeholder text"
                />
              </FormField>
            </div>

            <div class="col-span-2">
              <FormField id="editor-hint" label="Hint Text">
                <input
                  id="editor-hint"
                  type="text"
                  value={field.hint || ''}
                  onInput$={(e) => updateField({ hint: (e.target as HTMLInputElement).value })}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Help text for the user"
                />
              </FormField>
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
                <div class="block text-sm font-medium text-gray-700">
                  Options
                </div>
                <Btn
                  onClick$={addOption}
                  size="sm"
                  class="rounded"
                >
                  + Add Option
                </Btn>
              </div>

              {/* Data Source Selection */}
              <div class="mb-4">
                <FormField id={`editor-${field.id}-datasource`} label="Data Source">
                  <select
                    id={`editor-${field.id}-datasource`}
                    value={field.dataSource || 'static'}
                    onChange$={(e) => updateField({ dataSource: (e.target as HTMLSelectElement).value as 'static' | 'api' })}
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  >
                    <option value="static">Static Options</option>
                    <option value="api">API Endpoint</option>
                  </select>
                </FormField>
              </div>

              {field.dataSource === 'api' ? (
                <div class="space-y-3 bg-blue-50 p-3 rounded">
                  <div>
                    <FormField id={`editor-${field.id}-api-endpoint`} label="API Endpoint">
                      <input
                        id={`editor-${field.id}-api-endpoint`}
                        type="text"
                        value={field.apiEndpoint || ''}
                        onInput$={(e) => updateField({ apiEndpoint: (e.target as HTMLInputElement).value })}
                        class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="/api/options"
                      />
                    </FormField>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <FormField id={`editor-${field.id}-display-field`} label="Display Field">
                        <input
                          id={`editor-${field.id}-display-field`}
                          type="text"
                          value={field.displayField || ''}
                          onInput$={(e) => updateField({ displayField: (e.target as HTMLInputElement).value })}
                          class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="name"
                        />
                      </FormField>
                    </div>
                    <div>
                      <FormField id={`editor-${field.id}-value-field`} label="Value Field">
                        <input
                          id={`editor-${field.id}-value-field`}
                          type="text"
                          value={field.valueField || ''}
                          onInput$={(e) => updateField({ valueField: (e.target as HTMLInputElement).value })}
                          class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="id"
                        />
                      </FormField>
                    </div>
                  </div>
                </div>
              ) : (
                <div class="space-y-2">
                  {(field.options || []).map((option: FieldOption, index: number) => (
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
                      <Btn
                        onClick$={() => deleteOption(index)}
                        variant="danger"
                        size="sm"
                        class="px-2"
                      >
                        ×
                      </Btn>
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
                <FormField id={`editor-${field.id}-rows`} label="Rows">
                  <input
                    id={`editor-${field.id}-rows`}
                    type="number"
                    value={field.rows || 3}
                    onInput$={(e) => updateField({ rows: parseInt((e.target as HTMLInputElement).value) })}
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    min="1"
                    max="20"
                  />
                </FormField>
              </div>
              <div>
                <FormField id={`editor-${field.id}-max-length`} label="Max Length">
                  <input
                    id={`editor-${field.id}-max-length`}
                    type="number"
                    value={field.maxLength || ''}
                    onInput$={(e) => updateField({ maxLength: parseInt((e.target as HTMLInputElement).value) })}
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    min="1"
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Number field specific */}
          {field.type === 'number' && (
            <div class="border-t pt-4 grid grid-cols-2 gap-4">
              <div>
                <FormField id={`editor-${field.id}-min`} label="Min Value">
                  <input
                    id={`editor-${field.id}-min`}
                    type="number"
                    value={field.min !== undefined ? field.min : ''}
                    onInput$={(e) => updateField({ min: (e.target as HTMLInputElement).value ? parseFloat((e.target as HTMLInputElement).value) : undefined })}
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </FormField>
              </div>
              <div>
                <FormField id={`editor-${field.id}-max`} label="Max Value">
                  <input
                    id={`editor-${field.id}-max`}
                    type="number"
                    value={field.max !== undefined ? field.max : ''}
                    onInput$={(e) => updateField({ max: (e.target as HTMLInputElement).value ? parseFloat((e.target as HTMLInputElement).value) : undefined })}
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </FormField>
              </div>
              <div>
                <FormField id={`editor-${field.id}-step`} label="Step">
                  <input
                    id={`editor-${field.id}-step`}
                    type="number"
                    value={field.step !== undefined ? field.step : ''}
                    onInput$={(e) => updateField({ step: (e.target as HTMLInputElement).value ? parseFloat((e.target as HTMLInputElement).value) : undefined })}
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    placeholder="1"
                  />
                </FormField>
              </div>
              <div>
                <FormField id={`editor-${field.id}-prefix-suffix`} label="Prefix/Suffix">
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
                </FormField>
              </div>
            </div>
          )}

          {/* File Upload specific */}
          {field.type === 'file_upload' && (
            <div class="border-t pt-4 space-y-3">
              <div>
                <FormField id={`editor-${field.id}-accept`} label="Accepted File Types">
                  <input
                    id={`editor-${field.id}-accept`}
                    type="text"
                    value={field.accept || ''}
                    onInput$={(e) => updateField({ accept: (e.target as HTMLInputElement).value })}
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    placeholder=".pdf,.jpg,.png"
                  />
                </FormField>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <FormField id={`editor-${field.id}-max-files`} label="Max Files">
                    <input
                      id={`editor-${field.id}-max-files`}
                      type="number"
                      value={field.maxFiles || 1}
                      onInput$={(e) => updateField({ maxFiles: parseInt((e.target as HTMLInputElement).value) })}
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                      min="1"
                    />
                  </FormField>
                </div>
                <div>
                  <FormField id={`editor-${field.id}-max-size`} label="Max Size (MB)">
                    <input
                      id={`editor-${field.id}-max-size`}
                      type="number"
                      value={field.maxSizePerFile || 5}
                      onInput$={(e) => updateField({ maxSizePerFile: parseInt((e.target as HTMLInputElement).value) })}
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                      min="1"
                    />
                  </FormField>
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
            <Btn
              onClick$={() => (showAdvanced.value = !showAdvanced.value)}
              variant="ghost"
              class="flex items-center justify-between w-full"
            >
              <span>Advanced Settings</span>
              <span class="text-xl">{showAdvanced.value ? '−' : '+'}</span>
            </Btn>

            {showAdvanced.value && (
              <div class="mt-4 space-y-4">
                {/* Validation Rules */}
                <div class="bg-gray-50 p-4 rounded">
                  <h4 class="font-medium text-sm mb-3">Validation Rules</h4>
                  <div class="grid grid-cols-2 gap-4">
                    {(field.type === 'text' || field.type === 'textarea') && (
                      <>
                        <div>
                          <FormField id={`editor-${field.id}-validation-min-length`} label="Min Length">
                            <input
                              id={`editor-${field.id}-validation-min-length`}
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
                          </FormField>
                        </div>
                        <div>
                          <FormField id={`editor-${field.id}-validation-max-length`} label="Max Length">
                            <input
                              id={`editor-${field.id}-validation-max-length`}
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
                          </FormField>
                        </div>
                        <div class="col-span-2">
                          <FormField id={`editor-${field.id}-validation-pattern`} label="Pattern (Regex)">
                            <input
                              id={`editor-${field.id}-validation-pattern`}
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
                          </FormField>
                        </div>
                      </>
                    )}

                    {field.type === 'number' && (
                      <>
                        <div>
                          <FormField id={`editor-${field.id}-validation-min`} label="Min Value">
                            <input
                              id={`editor-${field.id}-validation-min`}
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
                          </FormField>
                        </div>
                        <div>
                          <FormField id={`editor-${field.id}-validation-max`} label="Max Value">
                            <input
                              id={`editor-${field.id}-validation-max`}
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
                          </FormField>
                        </div>
                      </>
                    )}

                    {(field.type === 'date' || field.type === 'datetime') && (
                      <>
                        <div>
                          <FormField id={`editor-${field.id}-validation-min-date`} label="Min Date">
                            <input
                              id={`editor-${field.id}-validation-min-date`}
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
                          </FormField>
                        </div>
                        <div>
                          <FormField id={`editor-${field.id}-validation-max-date`} label="Max Date">
                            <input
                              id={`editor-${field.id}-validation-max-date`}
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
                          </FormField>
                        </div>
                      </>
                    )}

                    <div class="col-span-2">
                      <FormField id={`editor-${field.id}-validation-message`} label="Custom Validation Message">
                        <input
                          id={`editor-${field.id}-validation-message`}
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
                      </FormField>
                    </div>
                  </div>
                </div>

                {/* Default Value */}
                <div>
                  <FormField id={`editor-${field.id}-default-value`} label="Default Value">
                    <input
                      id={`editor-${field.id}-default-value`}
                      type="text"
                      value={field.defaultValue || ''}
                      onInput$={(e) => updateField({ defaultValue: (e.target as HTMLInputElement).value })}
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                      placeholder="Default value"
                    />
                  </FormField>
                </div>
              </div>
            )}
          </div>

          {/* Conditional Visibility */}
          <div class="border-t pt-4">
            <Btn
              onClick$={() => (showConditions.value = !showConditions.value)}
              variant="ghost"
              class="flex items-center justify-between w-full"
            >
              <span>Conditional Visibility</span>
              <span class="text-xl">{showConditions.value ? '−' : '+'}</span>
            </Btn>

            {showConditions.value && (
              <div class="mt-4 bg-blue-50 p-4 rounded space-y-3">
                <div>
                  <FormField id={`editor-${field.id}-condition-field`} label="Show when field">
                    <input
                      id={`editor-${field.id}-condition-field`}
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
                  </FormField>
                </div>
                <div>
                  <FormField id={`editor-${field.id}-condition-operator`} label="Operator">
                    <select
                      id={`editor-${field.id}-condition-operator`}
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
                  </FormField>
                </div>
                <div>
                  <FormField id={`editor-${field.id}-condition-value`} label="Value">
                    <input
                      id={`editor-${field.id}-condition-value`}
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
                  </FormField>
                </div>
                {field.visible?.field && (
                  <Btn
                    onClick$={() => updateField({ visible: undefined })}
                    variant="danger"
                    size="sm"
                    class="rounded"
                  >
                    Remove Condition
                  </Btn>
                )}
              </div>
            )}
          </div>

          {/* Field Preview */}
          <div class="border-t pt-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Preview</h4>
            <div class="bg-gray-50 p-4 rounded border border-gray-200">
              <div class="block text-sm font-medium text-gray-700 mb-2">
                {field.label} {field.required && <span class="text-red-500">*</span>}
              </div>
              
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
                  {(field.options || []).map((opt: FieldOption) => (
                    <option key={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
              
              {field.type === 'radio' && (
                <div class="space-y-2">
                  {(field.options || []).map((opt: FieldOption) => (
                    <label key={opt.value} class="flex items-center">
                      <input type="radio" name={field.id} class="mr-2" disabled />
                      <span class="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {field.type === 'checkbox' && (
                <div class="space-y-2">
                  {(field.options || []).map((opt: FieldOption) => (
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
                  <div class="text-sm text-gray-500 flex items-center gap-1.5">
                    <i class="i-heroicons-map-pin-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                    Location Picker
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
