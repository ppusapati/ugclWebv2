// src/components/form-builder/FormBuilder.tsx
import { component$, useSignal, useStore, $, type PropFunction } from '@builder.io/qwik';
import type { FormDefinition, FormStep, FormField, Module, WorkflowDefinition, WorkflowConfig } from '~/types/workflow';
import type { BusinessVertical, Site } from '~/services/types';
import FieldEditor from './FieldEditor';
import { WorkflowPanel } from './workflow';

interface FormBuilderProps {
  initialDefinition?: FormDefinition;
  modules: Module[];
  workflows: WorkflowDefinition[];
  businessVerticals: BusinessVertical[];
  sites: Site[];
  onSave$: PropFunction<(definition: FormDefinition) => void>;
  onCancel$?: PropFunction<() => void>;
}

export default component$<FormBuilderProps>((props) => {
  const activeTab = useSignal<'basic' | 'steps' | 'workflow' | 'json'>('basic');
  const currentStepIndex = useSignal(0);

  const form = useStore<FormDefinition>({
    form_code: props.initialDefinition?.form_code || '',
    title: props.initialDefinition?.title || '',
    description: props.initialDefinition?.description || '',
    version: props.initialDefinition?.version || '1.0.0',
    module: props.initialDefinition?.module || '',
    accessible_verticals: props.initialDefinition?.accessible_verticals || [],
    type: props.initialDefinition?.type || 'multi_step',
    steps: props.initialDefinition?.steps || [{
      id: 'step_1',
      title: 'Step 1',
      description: '',
      fields: []
    }],
    validations: props.initialDefinition?.validations || {},
    workflow: props.initialDefinition?.workflow,
    permissions: props.initialDefinition?.permissions || {},
    ui_config: props.initialDefinition?.ui_config || {
      show_progress: true,
      allow_save_draft: true,
    }
  });

  const addStep = $(() => {
    const newStep: FormStep = {
      id: `step_${form.steps.length + 1}`,
      title: `Step ${form.steps.length + 1}`,
      description: '',
      fields: []
    };
    form.steps.push(newStep);
    currentStepIndex.value = form.steps.length - 1;
  });

  const deleteStep = $((index: number) => {
    if (form.steps.length > 1) {
      form.steps.splice(index, 1);
      if (currentStepIndex.value >= form.steps.length) {
        currentStepIndex.value = form.steps.length - 1;
      }
    }
  });

  const addField = $(() => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false
    };
    form.steps[currentStepIndex.value].fields.push(newField);
  });

  const deleteField = $((stepIndex: number, fieldIndex: number) => {
    form.steps[stepIndex].fields.splice(fieldIndex, 1);
  });

  const updateField = $((stepIndex: number, fieldIndex: number, updatedField: FormField) => {
    form.steps[stepIndex].fields[fieldIndex] = updatedField;
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const moveField = $((stepIndex: number, fieldIndex: number, direction: 'up' | 'down') => {
    const fields = form.steps[stepIndex].fields;
    const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;

    if (newIndex >= 0 && newIndex < fields.length) {
      [fields[fieldIndex], fields[newIndex]] = [fields[newIndex], fields[fieldIndex]];
    }
  });

  const exportJSON = $(() => {
    return JSON.stringify(form, null, 2);
  });

  const formJSON = useSignal<string>('');
  // Update formJSON whenever the tab is switched to 'json'
  if (typeof window !== 'undefined') {
    // This runs on client only
    if (activeTab.value === 'json') {
      exportJSON().then((json) => {
        formJSON.value = json;
      });
    }
  }

  const importJSON = $((json: string) => {
    try {
      const imported = JSON.parse(json) as FormDefinition;
      Object.assign(form, imported);
      return true;
    } catch (error) {
      console.error('Invalid JSON:', error);
      return false;
    }
  });

  return (
    <div class="form-builder min-h-screen bg-gray-50">
      <div class="mx-auto">
        {/* Header */}
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div class="flex gap-3">
              {props.onCancel$ && (
                <button
                  onClick$={props.onCancel$}
                  class="btn btn-secondary"
                >
                  Cancel
                </button>
              )}
              <button
                onClick$={() => props.onSave$(form)}
                class="btn btn-primary"
              >
                Save Form
              </button>
            </div>

          {/* Tabs */}
          <div class="flex gap-4 mt-6 border-b border-gray-200">
            <button
              class={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab.value === 'basic'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick$={() => (activeTab.value = 'basic')}
            >
              Basic Info
            </button>
            <button
              class={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab.value === 'steps'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick$={() => (activeTab.value = 'steps')}
            >
              Steps & Fields
            </button>
            <button
              class={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab.value === 'workflow'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick$={() => (activeTab.value = 'workflow')}
            >
              Workflow
            </button>
            <button
              class={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab.value === 'json'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick$={() => (activeTab.value = 'json')}
            >
              JSON Editor
            </button>
          </div>
        </div>

        {/* Basic Info Tab */}
        {activeTab.value === 'basic' && (
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-bold mb-6">Basic Information</h2>

            <div class="grid grid-cols-2 gap-12">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Form Code *
                </label>
                <input
                  type="text"
                  value={form.form_code}
                  onInput$={(e) => (form.form_code = (e.target as HTMLInputElement).value)}
                  class="form-input w-full"
                  placeholder="e.g., water, hr_nmr"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={form.version}
                  onInput$={(e) => (form.version = (e.target as HTMLInputElement).value)}
                  class="form-input w-full"
                  placeholder="1.0.0"
                />
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onInput$={(e) => (form.title = (e.target as HTMLInputElement).value)}
                  class="form-input w-full"
                  placeholder="e.g., Water Supply Form"
                  required
                />
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onInput$={(e) => (form.description = (e.target as HTMLTextAreaElement).value)}
                  class="form-input w-full"
                  rows={3}
                  placeholder="Brief description of the form"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Module *
                </label>
                <select
                  value={form.module}
                  onChange$={(e) => (form.module = (e.target as HTMLSelectElement).value as any)}
                  class="form-input w-full"
                  required
                >
                  <option value="">Select module</option>
                  {props.modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Form Type
                </label>
                <select
                  value={form.type}
                  onChange$={(e) => (form.type = (e.target as HTMLSelectElement).value as any)}
                  class="form-input w-full"
                >
                  <option value="single_page">Single Page</option>
                  <option value="multi_step">Multi-Step</option>
                </select>
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Accessible Business Verticals
                </label>
                <p class="text-sm text-gray-500 mb-3">
                  Select which business verticals can access this form
                </p>
                <div class="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                  {props.businessVerticals.length === 0 ? (
                    <p class="text-sm text-gray-500">No business verticals available</p>
                  ) : (
                    <div class="space-y-2">
                      {props.businessVerticals.map((bv) => {
                        const isChecked = form.accessible_verticals?.includes(bv.id) || false;
                        return (
                          <label key={bv.id} class="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange$={(e) => {
                                const checked = (e.target as HTMLInputElement).checked;
                                if (!form.accessible_verticals) {
                                  form.accessible_verticals = [];
                                }
                                if (checked) {
                                  // Add to array if not already present
                                  if (!form.accessible_verticals.includes(bv.id)) {
                                    form.accessible_verticals.push(bv.id);
                                  }
                                } else {
                                  // Remove from array
                                  const index = form.accessible_verticals.indexOf(bv.id);
                                  if (index > -1) {
                                    form.accessible_verticals.splice(index, 1);
                                  }
                                }
                              }}
                              class="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span class="text-sm text-gray-900">{bv.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p class="text-sm text-gray-500 mt-2">
                  {form.accessible_verticals?.length || 0} vertical(s) selected
                </p>
              </div>
            </div>

            <div class="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 class="font-medium text-blue-900 mb-2">UI Configuration</h3>
              <div class="space-y-3">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.ui_config?.show_progress}
                    onChange$={(e) => {
                      if (form.ui_config) {
                        form.ui_config.show_progress = (e.target as HTMLInputElement).checked;
                      }
                    }}
                    class="mr-2"
                  />
                  <span class="text-sm">Show progress indicator</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.ui_config?.allow_save_draft}
                    onChange$={(e) => {
                      if (form.ui_config) {
                        form.ui_config.allow_save_draft = (e.target as HTMLInputElement).checked;
                      }
                    }}
                    class="mr-2"
                  />
                  <span class="text-sm">Allow save as draft</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Steps & Fields Tab - Will be implemented in FieldEditor component */}
        {activeTab.value === 'steps' && (
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-bold">Steps & Fields</h2>
              <button
                onClick$={addStep}
                class="btn btn-primary"
              >
                <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-2"></i>
                Add Step
              </button>
            </div>

            {/* Step Tabs */}
            <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
              {form.steps.map((step, index) => (
                <div
                  key={step.id}
                  class={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer ${
                    currentStepIndex.value === index
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                  onClick$={() => (currentStepIndex.value = index)}
                >
                  <span>{step.title || `Step ${index + 1}`}</span>
                  {form.steps.length > 1 && (
                    <button
                      onClick$={(e) => {
                        e.stopPropagation();
                        deleteStep(index);
                      }}
                      class="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Current Step Editor */}
            {form.steps[currentStepIndex.value] && (
              <div>
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Step Title
                    </label>
                    <input
                      type="text"
                      value={form.steps[currentStepIndex.value].title}
                      onInput$={(e) => {
                        form.steps[currentStepIndex.value].title = (e.target as HTMLInputElement).value;
                      }}
                      class="form-input w-full"
                      placeholder="Step title"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Step ID
                    </label>
                    <input
                      type="text"
                      value={form.steps[currentStepIndex.value].id}
                      onInput$={(e) => {
                        form.steps[currentStepIndex.value].id = (e.target as HTMLInputElement).value;
                      }}
                      class="form-input w-full"
                      placeholder="step_id"
                    />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={form.steps[currentStepIndex.value].description}
                      onInput$={(e) => {
                        form.steps[currentStepIndex.value].description = (e.target as HTMLInputElement).value;
                      }}
                      class="form-input w-full"
                      placeholder="Step description"
                    />
                  </div>
                </div>

                {/* Fields List */}
                <div>
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="font-medium">Fields</h3>
                    <button
                      onClick$={addField}
                      class="btn btn-success"
                    >
                      <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-2"></i>
                      Add Field
                    </button>
                  </div>

                  {form.steps[currentStepIndex.value].fields.length === 0 ? (
                    <div class="text-center py-8 text-gray-500">
                      No fields yet. Click "Add Field" to create one.
                    </div>
                  ) : (
                    <div class="space-y-4">
                      {form.steps[currentStepIndex.value].fields.map((field, fieldIndex) => {
                        const handleFieldUpdate = $((updatedField: FormField) => {
                          updateField(currentStepIndex.value, fieldIndex, updatedField);
                        });
                        
                        const handleFieldDelete = $(() => {
                          deleteField(currentStepIndex.value, fieldIndex);
                        });
                        
                        return (
                          <FieldEditor
                            key={field.id}
                            field={field}
                            onUpdate$={handleFieldUpdate}
                            onDelete$={handleFieldDelete}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workflow Tab */}
        {activeTab.value === 'workflow' && (
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-bold mb-6">Workflow Configuration</h2>
            <WorkflowPanel
              workflows={props.workflows}
              workflow={form.workflow}
              onUpdate$={$((workflowConfig: WorkflowConfig | undefined) => {
                form.workflow = workflowConfig;
              })}
            />
          </div>
        )}

        {/* JSON Editor Tab */}
        {activeTab.value === 'json' && (
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-bold mb-6">JSON Editor</h2>
            <div class="mb-4">
              <button
                onClick$={async () => {
                  const json = await exportJSON();
                  navigator.clipboard.writeText(json);
                  alert('JSON copied to clipboard!');
                }}
                class="btn btn-primary mr-2"
              >
                Copy JSON
              </button>
              <button
                onClick$={async () => {
                  const json = prompt('Paste JSON here:');
                  if (json) {
                    importJSON(json);
                  }
                }}
                class="btn btn-success"
              >
                Import JSON
              </button>
            </div>
            <textarea
              value={formJSON.value}
              class="w-full h-96 font-mono text-sm p-4 border border-gray-300 rounded-lg"
              readOnly
            />
          </div>
        )}
      </div>
    </div>
  );
});
