// src/components/form-builder/workflow/FieldEditorComplete.tsx
import { component$, useStore, useSignal, $, type PropFunction } from '@builder.io/qwik';
import type { FormField, FieldType, FieldOption } from '~/types/workflow';
import { FormField as DSFormField } from '~/components/ds';
import { Btn } from '~/components/ds';

interface FieldEditorCompleteProps {
  field: FormField;
  onUpdate$: PropFunction<(field: FormField) => void>;
  onDelete$: PropFunction<() => void>;
  canDelete?: boolean;
}

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Text Input', icon: 'i-heroicons-pencil-square-solid' },
  { value: 'textarea', label: 'Text Area', icon: 'i-heroicons-document-text-solid' },
  { value: 'number', label: 'Number', icon: 'i-heroicons-calculator-solid' },
  { value: 'email', label: 'Email', icon: 'i-heroicons-envelope-solid' },
  { value: 'phone', label: 'Phone', icon: 'i-heroicons-device-phone-mobile-solid' },
  { value: 'date', label: 'Date', icon: 'i-heroicons-calendar-days-solid' },
  { value: 'datetime', label: 'Date & Time', icon: 'i-heroicons-calendar-days-solid' },
  { value: 'time', label: 'Time', icon: 'i-heroicons-clock-solid' },
  { value: 'radio', label: 'Radio Buttons', icon: 'i-heroicons-dot-solid' },
  { value: 'checkbox', label: 'Checkboxes', icon: 'i-heroicons-check-circle-solid' },
  { value: 'dropdown', label: 'Dropdown', icon: 'i-heroicons-chevron-down-solid' },
  { value: 'select', label: 'Select', icon: 'i-heroicons-clipboard-document-list-solid' },
  { value: 'file_upload', label: 'File Upload', icon: 'i-heroicons-paper-clip-solid' },
  { value: 'signature', label: 'Signature', icon: 'i-heroicons-pencil-solid' },
  { value: 'location', label: 'Location', icon: 'i-heroicons-map-pin-solid' },
];

export default component$<FieldEditorCompleteProps>((props) => {
  const editingField = useStore<FormField>({ ...props.field });
  const showAdvanced = useSignal(false);

  const handleUpdate = $(async (updates: Partial<FormField>) => {
    Object.assign(editingField, updates);
    await props.onUpdate$(editingField);
  });

  const addOption = $(async () => {
    if (!editingField.options) {
      editingField.options = [];
    }
    editingField.options.push({ label: 'New Option', value: `option_${editingField.options.length + 1}` });
    await props.onUpdate$(editingField);
  });

  const updateOption = $(async (index: number, updates: Partial<FieldOption>) => {
    if (editingField.options?.[index]) {
      Object.assign(editingField.options[index], updates);
      await props.onUpdate$(editingField);
    }
  });

  const removeOption = $(async (index: number) => {
    editingField.options?.splice(index, 1);
    await props.onUpdate$(editingField);
  });

  const needsOptions = ['radio', 'checkbox', 'dropdown', 'select'].includes(editingField.type);
  const selectedFieldType = FIELD_TYPES.find((t) => t.value === editingField.type);

  return (
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Field Configuration</h3>
            <div class="flex items-center gap-2 mt-1">
              <code class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{editingField.id}</code>
              {selectedFieldType && (
                <span class="text-xs text-gray-500 flex items-center gap-1.5">
                  <i class={`${selectedFieldType.icon} h-4 w-4 inline-block`} aria-hidden="true"></i>
                  {selectedFieldType.label}
                </span>
              )}
              {editingField.required && (
                <span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Required</span>
              )}
            </div>
          </div>
          {props.canDelete !== false && (
            <Btn
              size="sm"
              variant="danger"
              onClick$={props.onDelete$}
              class="text-red-600 hover:bg-red-50 border border-red-200"
            >
              Delete Field
            </Btn>
          )}
        </div>
      </div>

      <div class="p-6 space-y-6">
        {/* Basic Information */}
        <div class="space-y-4">
          <h4 class="font-medium text-gray-900 text-sm uppercase tracking-wide">Basic Information</h4>

          <div class="grid grid-cols-2 gap-4">
            <DSFormField
              id="workflow-field-editor-id"
              label="Field ID"
              required
              hint="Unique identifier (lowercase, underscores only)"
            >
              <input
                id="workflow-field-editor-id"
                type="text"
                value={editingField.id}
                onInput$={(e) => handleUpdate({ id: (e.target as HTMLInputElement).value })}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="field_name"
                required
                aria-required="true"
                aria-describedby="workflow-field-editor-id-hint"
              />
            </DSFormField>

            <DSFormField id="workflow-field-editor-type" label="Field Type" required>
              <select
                id="workflow-field-editor-type"
                value={editingField.type}
                onChange$={(e) => handleUpdate({ type: (e.target as HTMLSelectElement).value as FieldType })}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-required="true"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </DSFormField>

            <DSFormField id="workflow-field-editor-label" label="Label" required class="col-span-2">
              <input
                id="workflow-field-editor-label"
                type="text"
                value={editingField.label}
                onInput$={(e) => handleUpdate({ label: (e.target as HTMLInputElement).value })}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Field Label"
                required
                aria-required="true"
              />
            </DSFormField>

            <DSFormField id="workflow-field-editor-placeholder" label="Placeholder" class="col-span-2">
              <input
                id="workflow-field-editor-placeholder"
                type="text"
                value={editingField.placeholder || ''}
                onInput$={(e) => handleUpdate({ placeholder: (e.target as HTMLInputElement).value })}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter placeholder text..."
              />
            </DSFormField>

            <DSFormField id="workflow-field-editor-hint" label="Hint Text" class="col-span-2">
              <input
                id="workflow-field-editor-hint"
                type="text"
                value={editingField.hint || ''}
                onInput$={(e) => handleUpdate({ hint: (e.target as HTMLInputElement).value })}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Helper text shown below the field"
              />
            </DSFormField>

            <div class="col-span-2">
              <label class="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={editingField.required || false}
                  onChange$={(e) => handleUpdate({ required: (e.target as HTMLInputElement).checked })}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="ml-3 text-sm font-medium text-gray-900">Required Field</span>
              </label>
            </div>
          </div>
        </div>

        {/* Type-Specific Settings */}
        {editingField.type === 'number' && (
          <div class="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 class="font-medium text-gray-900 text-sm">Number Field Settings</h4>
            <div class="grid grid-cols-2 gap-4">
              <DSFormField id="workflow-field-editor-min-value" label="Min Value">
                <input
                  id="workflow-field-editor-min-value"
                  type="number"
                  value={editingField.min ?? ''}
                  onInput$={(e) => handleUpdate({ min: parseFloat((e.target as HTMLInputElement).value) || undefined })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Minimum"
                />
              </DSFormField>
              <DSFormField id="workflow-field-editor-max-value" label="Max Value">
                <input
                  id="workflow-field-editor-max-value"
                  type="number"
                  value={editingField.max ?? ''}
                  onInput$={(e) => handleUpdate({ max: parseFloat((e.target as HTMLInputElement).value) || undefined })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Maximum"
                />
              </DSFormField>
              <DSFormField id="workflow-field-editor-step" label="Step">
                <input
                  id="workflow-field-editor-step"
                  type="number"
                  value={editingField.step ?? ''}
                  onInput$={(e) => handleUpdate({ step: parseFloat((e.target as HTMLInputElement).value) || undefined })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="1"
                />
              </DSFormField>
              <DSFormField id="workflow-field-editor-prefix-suffix" label="Prefix/Suffix">
                <div class="flex gap-2">
                  <input
                    type="text"
                    value={editingField.prefix || ''}
                    onInput$={(e) => handleUpdate({ prefix: (e.target as HTMLInputElement).value })}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Prefix (₹, $)"
                  />
                  <input
                    type="text"
                    value={editingField.suffix || ''}
                    onInput$={(e) => handleUpdate({ suffix: (e.target as HTMLInputElement).value })}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Suffix (kg, L)"
                  />
                </div>
              </DSFormField>
            </div>
          </div>
        )}

        {editingField.type === 'textarea' && (
          <div class="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 class="font-medium text-gray-900 text-sm">Text Area Settings</h4>
            <div class="grid grid-cols-2 gap-4">
              <DSFormField id="workflow-field-editor-rows" label="Rows">
                <input
                  id="workflow-field-editor-rows"
                  type="number"
                  value={editingField.rows || 4}
                  onInput$={(e) => handleUpdate({ rows: parseInt((e.target as HTMLInputElement).value) || 4 })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="1"
                  max="20"
                />
              </DSFormField>
              <DSFormField id="workflow-field-editor-max-length" label="Max Length">
                <input
                  id="workflow-field-editor-max-length"
                  type="number"
                  value={editingField.maxLength ?? ''}
                  onInput$={(e) => handleUpdate({ maxLength: parseInt((e.target as HTMLInputElement).value) || undefined })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Character limit"
                />
              </DSFormField>
            </div>
          </div>
        )}

        {editingField.type === 'file_upload' && (
          <div class="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 class="font-medium text-gray-900 text-sm">File Upload Settings</h4>
            <div class="grid grid-cols-2 gap-4">
              <DSFormField id="workflow-field-editor-accept" label="Accepted File Types" hint="MIME types or file extensions separated by commas" class="col-span-2">
                <input
                  id="workflow-field-editor-accept"
                  type="text"
                  value={editingField.accept || ''}
                  onInput$={(e) => handleUpdate({ accept: (e.target as HTMLInputElement).value })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., image/*, .pdf, .doc, .docx"
                />
              </DSFormField>
              <DSFormField id="workflow-field-editor-max-files" label="Max Files">
                <input
                  id="workflow-field-editor-max-files"
                  type="number"
                  value={editingField.maxFiles ?? ''}
                  onInput$={(e) => handleUpdate({ maxFiles: parseInt((e.target as HTMLInputElement).value) || undefined })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="1"
                  placeholder="No limit"
                />
              </DSFormField>
              <DSFormField id="workflow-field-editor-max-size" label="Max Size per File (MB)">
                <input
                  id="workflow-field-editor-max-size"
                  type="number"
                  value={editingField.maxSizePerFile ?? ''}
                  onInput$={(e) => handleUpdate({ maxSizePerFile: parseInt((e.target as HTMLInputElement).value) || undefined })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="5"
                />
              </DSFormField>
              <div class="col-span-2">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingField.multiple || false}
                    onChange$={(e) => handleUpdate({ multiple: (e.target as HTMLInputElement).checked })}
                    class="h-4 w-4 text-blue-600 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700">Allow multiple files</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Options Editor for Radio, Checkbox, Dropdown */}
        {needsOptions && (
          <div class="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div class="flex justify-between items-center">
              <h4 class="font-medium text-gray-900 text-sm">Options Configuration</h4>
              <Btn
                size="sm"
                variant="primary"
                onClick$={addOption}
              >
                + Add Option
              </Btn>
            </div>

            {editingField.options && editingField.options.length > 0 ? (
              <div class="space-y-2">
                {editingField.options.map((option, index) => (
                  <div key={index} class="flex gap-2 items-center bg-white p-2 rounded border border-gray-200">
                    <span class="text-sm text-gray-500 w-6">{index + 1}.</span>
                    <input
                      type="text"
                      value={option.label}
                      onInput$={(e) => updateOption(index, { label: (e.target as HTMLInputElement).value })}
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Label (shown to user)"
                    />
                    <input
                      type="text"
                      value={String(option.value)}
                      onInput$={(e) => updateOption(index, { value: (e.target as HTMLInputElement).value })}
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      placeholder="Value (stored)"
                    />
                    <Btn
                      size="sm"
                      variant="ghost"
                      onClick$={() => removeOption(index)}
                      class="text-red-600 hover:bg-red-50"
                      title="Remove option"
                    >
                      ✕
                    </Btn>
                  </div>
                ))}
              </div>
            ) : (
              <div class="text-center py-8 text-sm text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                No options configured. Click "Add Option" to create one.
              </div>
            )}

            {/* API-driven dropdown */}
            {(editingField.type === 'dropdown' || editingField.type === 'select') && (
              <div class="mt-4 pt-4 border-t border-green-300">
                <label class="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={editingField.dataSource === 'api'}
                    onChange$={(e) => handleUpdate({ dataSource: (e.target as HTMLInputElement).checked ? 'api' : 'static' })}
                    class="h-4 w-4 text-green-600 rounded"
                  />
                  <span class="ml-2 text-sm font-medium text-gray-900">Load options from API</span>
                </label>

                {editingField.dataSource === 'api' && (
                  <div class="space-y-2 bg-white p-3 rounded border border-gray-200">
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">API Endpoint</label>
                      <input
                        type="text"
                        value={editingField.apiEndpoint || ''}
                        onInput$={(e) => handleUpdate({ apiEndpoint: (e.target as HTMLInputElement).value })}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        placeholder="/api/v1/options"
                      />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Display Field</label>
                        <input
                          type="text"
                          value={editingField.displayField || ''}
                          onInput$={(e) => handleUpdate({ displayField: (e.target as HTMLInputElement).value })}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="name"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Value Field</label>
                        <input
                          type="text"
                          value={editingField.valueField || ''}
                          onInput$={(e) => handleUpdate({ valueField: (e.target as HTMLInputElement).value })}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="id"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Advanced Settings */}
        <div class="border-t pt-4">
          <Btn
            size="sm"
            variant="ghost"
            onClick$={() => (showAdvanced.value = !showAdvanced.value)}
            class="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span class={`transition-transform ${showAdvanced.value ? 'rotate-90' : ''}`}>▶</span>
            Advanced Settings
          </Btn>

          {showAdvanced.value && (
            <div class="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Validation */}
              <div>
                <h5 class="font-medium text-sm mb-3">Validation Rules</h5>
                <div class="space-y-3">
                  <DSFormField id="workflow-field-editor-validation-message" label="Custom Error Message">
                    <input
                      id="workflow-field-editor-validation-message"
                      type="text"
                      value={editingField.validation?.message || ''}
                      onInput$={(e) => handleUpdate({
                        validation: {
                          ...editingField.validation,
                          message: (e.target as HTMLInputElement).value
                        }
                      })}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="This field is invalid"
                    />
                  </DSFormField>

                  {(editingField.type === 'text' || editingField.type === 'textarea') && (
                    <>
                      <div class="grid grid-cols-2 gap-2">
                        <DSFormField id="workflow-field-editor-validation-min-length" label="Min Length">
                          <input
                            id="workflow-field-editor-validation-min-length"
                            type="number"
                            value={editingField.validation?.minLength ?? ''}
                            onInput$={(e) => handleUpdate({
                              validation: {
                                ...editingField.validation,
                                minLength: parseInt((e.target as HTMLInputElement).value) || undefined
                              }
                            })}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </DSFormField>
                        <DSFormField id="workflow-field-editor-validation-max-length" label="Max Length">
                          <input
                            id="workflow-field-editor-validation-max-length"
                            type="number"
                            value={editingField.validation?.maxLength ?? ''}
                            onInput$={(e) => handleUpdate({
                              validation: {
                                ...editingField.validation,
                                maxLength: parseInt((e.target as HTMLInputElement).value) || undefined
                              }
                            })}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </DSFormField>
                      </div>

                      <DSFormField id="workflow-field-editor-validation-pattern" label="Pattern (Regex)">
                        <input
                          id="workflow-field-editor-validation-pattern"
                          type="text"
                          value={editingField.validation?.pattern || ''}
                          onInput$={(e) => handleUpdate({
                            validation: {
                              ...editingField.validation,
                              pattern: (e.target as HTMLInputElement).value
                            }
                          })}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                          placeholder="^[A-Za-z0-9]+$"
                        />
                      </DSFormField>
                    </>
                  )}

                  {editingField.type === 'date' && (
                    <div class="grid grid-cols-2 gap-2">
                      <DSFormField id="workflow-field-editor-validation-min-date" label="Min Date">
                        <input
                          id="workflow-field-editor-validation-min-date"
                          type="date"
                          value={editingField.validation?.minDate || ''}
                          onInput$={(e) => handleUpdate({
                            validation: {
                              ...editingField.validation,
                              minDate: (e.target as HTMLInputElement).value
                            }
                          })}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </DSFormField>
                      <DSFormField id="workflow-field-editor-validation-max-date" label="Max Date">
                        <input
                          id="workflow-field-editor-validation-max-date"
                          type="date"
                          value={editingField.validation?.maxDate || ''}
                          onInput$={(e) => handleUpdate({
                            validation: {
                              ...editingField.validation,
                              maxDate: (e.target as HTMLInputElement).value
                            }
                          })}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </DSFormField>
                    </div>
                  )}
                </div>
              </div>

              {/* Default Value */}
              <DSFormField id="workflow-field-editor-default-value" label="Default Value">
                <input
                  id="workflow-field-editor-default-value"
                  type="text"
                  value={editingField.defaultValue ?? ''}
                  onInput$={(e) => handleUpdate({ defaultValue: (e.target as HTMLInputElement).value })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Default value when field is first shown"
                />
              </DSFormField>
            </div>
          )}
        </div>

        {/* Preview */}
        <div class="border-t pt-4">
          <h4 class="font-medium text-gray-900 text-sm mb-3">Field Preview</h4>
          <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="block text-sm font-medium text-gray-700 mb-1">
              {editingField.label}
              {editingField.required && <span class="text-red-500 ml-1">*</span>}
            </div>

            {editingField.type === 'textarea' ? (
              <textarea
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={editingField.placeholder}
                rows={editingField.rows || 4}
                disabled
              />
            ) : editingField.type === 'dropdown' || editingField.type === 'select' ? (
              <select class="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled>
                <option value="">{editingField.placeholder || 'Select an option...'}</option>
                {editingField.options?.map((opt, i) => (
                  <option key={i} value={String(opt.value)}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={editingField.type === 'number' ? 'number' : editingField.type === 'email' ? 'email' : editingField.type === 'date' ? 'date' : 'text'}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={editingField.placeholder}
                disabled
              />
            )}

            {editingField.hint && (
              <p class="text-xs text-gray-500 mt-1">{editingField.hint}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
