// src/components/form-builder/FormBuilderComplete.tsx
import { component$, useSignal, useStore, $, useComputed$ } from '@builder.io/qwik';
import type { FormDefinition, FormStep, FormField, Module, WorkflowDefinition, WorkflowConfig } from '~/types/workflow';
import FieldEditorComplete from './workflow/FieldEditorComplete';
import { WorkflowPanel } from './workflow';

interface FormBuilderCompleteProps {
  initialDefinition?: FormDefinition;
  modules: Module[];
  workflows: WorkflowDefinition[];
  onSave: (definition: FormDefinition) => void;
  onCancel?: () => void;
}

export default component$<FormBuilderCompleteProps>((props) => {
  const activeTab = useSignal<'basic' | 'steps' | 'workflow' | 'preview'>('basic');
  const currentStepIndex = useSignal(0);
  const selectedFieldIndex = useSignal<number | null>(null);
  const selectedWorkflowId = useSignal<string | undefined>(undefined);

  const form = useStore<FormDefinition>({
    form_code: props.initialDefinition?.form_code || '',
    title: props.initialDefinition?.title || '',
    description: props.initialDefinition?.description || '',
    version: props.initialDefinition?.version || '1.0.0',
    module: props.initialDefinition?.module || '',
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
    selectedFieldIndex.value = form.steps[currentStepIndex.value].fields.length - 1;
  });

  const updateField = $((stepIndex: number, fieldIndex: number, updatedField: FormField) => {
    form.steps[stepIndex].fields[fieldIndex] = updatedField;
  });

  const deleteField = $((stepIndex: number, fieldIndex: number) => {
    form.steps[stepIndex].fields.splice(fieldIndex, 1);
    if (selectedFieldIndex.value === fieldIndex) {
      selectedFieldIndex.value = null;
    } else if (selectedFieldIndex.value !== null && selectedFieldIndex.value > fieldIndex) {
      selectedFieldIndex.value = selectedFieldIndex.value - 1;
    }
  });

  const moveField = $((stepIndex: number, fieldIndex: number, direction: 'up' | 'down') => {
    const fields = form.steps[stepIndex].fields;
    const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;

    if (newIndex >= 0 && newIndex < fields.length) {
      [fields[fieldIndex], fields[newIndex]] = [fields[newIndex], fields[fieldIndex]];
      if (selectedFieldIndex.value === fieldIndex) {
        selectedFieldIndex.value = newIndex;
      } else if (selectedFieldIndex.value === newIndex) {
        selectedFieldIndex.value = fieldIndex;
      }
    }
  });

  const selectedWorkflow = useComputed$(() => {
    return props.workflows.find(w => w.id === selectedWorkflowId.value);
  });

  const exportJSON = $(() => {
    return JSON.stringify(form, null, 2);
  });

  const handleSave = $(() => {
    // Add workflow to form definition if selected
    if (selectedWorkflow.value) {
      form.workflow = {
        initial_state: selectedWorkflow.value.initial_state,
        states: selectedWorkflow.value.states.map(s => s.code),
        transitions: selectedWorkflow.value.transitions,
      };
    }
    props.onSave(form);
  });

  return (
    <div class="form-builder bg-gray-50">
      <div class="max-w-7xl mx-auto">
        {/* Header */}
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Form Builder</h1>
              <p class="text-gray-600 mt-1">Create and manage dynamic forms with workflows</p>
            </div>
            <div class="flex gap-3">
              {props.onCancel && (
                <button
                  onClick$={props.onCancel}
                  class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                onClick$={handleSave}
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                💾 Save Form
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div class="flex gap-4 mt-6 border-b border-gray-200">
            <button
              class={`px-4 py-2 font-medium transition-colors ${
                activeTab.value === 'basic'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick$={() => (activeTab.value = 'basic')}
            >
              📝 Basic Info
            </button>
            <button
              class={`px-4 py-2 font-medium transition-colors ${
                activeTab.value === 'steps'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick$={() => (activeTab.value = 'steps')}
            >
              📋 Steps & Fields ({form.steps.reduce((acc, step) => acc + step.fields.length, 0)})
            </button>
            <button
              class={`px-4 py-2 font-medium transition-colors ${
                activeTab.value === 'workflow'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick$={() => (activeTab.value = 'workflow')}
            >
              🔄 Workflow {selectedWorkflow.value && `(${selectedWorkflow.value.name})`}
            </button>
            <button
              class={`px-4 py-2 font-medium transition-colors ${
                activeTab.value === 'preview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick$={() => (activeTab.value = 'preview')}
            >
              👁️ Preview & Export
            </button>
          </div>
        </div>

        {/* Basic Info Tab */}
        {activeTab.value === 'basic' && (
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-bold mb-6">Basic Information</h2>

            <div class="grid grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Form Code *
                </label>
                <input
                  type="text"
                  value={form.form_code}
                  onInput$={(e) => (form.form_code = (e.target as HTMLInputElement).value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., project_registration"
                  required
                />
                <p class="text-xs text-gray-500 mt-1">Unique identifier (lowercase, underscores only)</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={form.version}
                  onInput$={(e) => (form.version = (e.target as HTMLInputElement).value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Project Registration Form"
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  onChange$={(e) => (form.module = (e.target as HTMLSelectElement).value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select module</option>
                  {props.modules.map((module) => (
                    <option key={module.code} value={module.code}>
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="single_page">Single Page</option>
                  <option value="multi_step">Multi-Step</option>
                </select>
              </div>
            </div>

            <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 class="font-medium text-blue-900 mb-3">UI Configuration</h3>
              <div class="space-y-3">
                <label class="flex items-center p-2 rounded hover:bg-blue-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ui_config?.show_progress}
                    onChange$={(e) => {
                      if (form.ui_config) {
                        form.ui_config.show_progress = (e.target as HTMLInputElement).checked;
                      }
                    }}
                    class="h-4 w-4 text-blue-600 rounded"
                  />
                  <span class="ml-3 text-sm text-gray-900">Show progress indicator</span>
                </label>
                <label class="flex items-center p-2 rounded hover:bg-blue-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ui_config?.allow_save_draft}
                    onChange$={(e) => {
                      if (form.ui_config) {
                        form.ui_config.allow_save_draft = (e.target as HTMLInputElement).checked;
                      }
                    }}
                    class="h-4 w-4 text-blue-600 rounded"
                  />
                  <span class="ml-3 text-sm text-gray-900">Allow save as draft</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Steps & Fields Tab */}
        {activeTab.value === 'steps' && (
          <div class="grid grid-cols-4 gap-6">
            {/* Steps Sidebar */}
            <div class="bg-white rounded-lg shadow-sm p-4">
              <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold text-gray-900">Steps</h3>
                <button
                  onClick$={addStep}
                  class="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Add
                </button>
              </div>

              <div class="space-y-2">
                {form.steps.map((step, index) => (
                  <div
                    key={step.id}
                    class={`group p-3 border rounded-lg cursor-pointer transition-colors ${
                      currentStepIndex.value === index
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                    onClick$={() => {
                      currentStepIndex.value = index;
                      selectedFieldIndex.value = null;
                    }}
                  >
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="font-medium text-sm">{step.title || `Step ${index + 1}`}</div>
                        <div class="text-xs text-gray-500 mt-1">{step.fields.length} field{step.fields.length !== 1 ? 's' : ''}</div>
                      </div>
                      {form.steps.length > 1 && (
                        <button
                          onClick$={(e) => {
                            e.stopPropagation();
                            deleteStep(index);
                          }}
                          class="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div class="col-span-3 space-y-6">
              {/* Step Info */}
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="font-semibold text-gray-900 mb-4">Step Information</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Step Title</label>
                    <input
                      type="text"
                      value={form.steps[currentStepIndex.value].title}
                      onInput$={(e) => {
                        form.steps[currentStepIndex.value].title = (e.target as HTMLInputElement).value;
                      }}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Step title"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Step ID</label>
                    <input
                      type="text"
                      value={form.steps[currentStepIndex.value].id}
                      onInput$={(e) => {
                        form.steps[currentStepIndex.value].id = (e.target as HTMLInputElement).value;
                      }}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                      placeholder="step_id"
                    />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={form.steps[currentStepIndex.value].description}
                      onInput$={(e) => {
                        form.steps[currentStepIndex.value].description = (e.target as HTMLInputElement).value;
                      }}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Step description"
                    />
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="font-semibold text-gray-900">Fields</h3>
                  <button
                    onClick$={addField}
                    class="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    + Add Field
                  </button>
                </div>

                {form.steps[currentStepIndex.value].fields.length === 0 ? (
                  <div class="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <svg class="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No fields yet. Click "Add Field" to create one.</p>
                  </div>
                ) : (
                  <div class="space-y-3">
                    {form.steps[currentStepIndex.value].fields.map((field, fieldIndex) => (
                      <div key={field.id}>
                        {selectedFieldIndex.value === fieldIndex ? (
                          <FieldEditorComplete
                            field={field}
                            onUpdate={$((updatedField: FormField) => updateField(currentStepIndex.value, fieldIndex, updatedField))}
                            onDelete={$(() => deleteField(currentStepIndex.value, fieldIndex))}
                          />
                        ) : (
                          <div
                            onClick$={() => (selectedFieldIndex.value = fieldIndex)}
                            class="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer group"
                          >
                            <div class="flex justify-between items-start">
                              <div class="flex-1">
                                <div class="font-medium">{field.label || 'Untitled Field'}</div>
                                <div class="flex items-center gap-2 mt-1">
                                  <code class="text-xs bg-gray-200 px-2 py-0.5 rounded">{field.id}</code>
                                  <span class="text-xs text-gray-500">{field.type}</span>
                                  {field.required && (
                                    <span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Required</span>
                                  )}
                                </div>
                              </div>
                              <div class="flex gap-1 opacity-0 group-hover:opacity-100">
                                <button
                                  onClick$={(e) => {
                                    e.stopPropagation();
                                    moveField(currentStepIndex.value, fieldIndex, 'up');
                                  }}
                                  disabled={fieldIndex === 0}
                                  class="px-2 py-1 text-sm border rounded disabled:opacity-50 hover:bg-white"
                                  title="Move up"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick$={(e) => {
                                    e.stopPropagation();
                                    moveField(currentStepIndex.value, fieldIndex, 'down');
                                  }}
                                  disabled={fieldIndex === form.steps[currentStepIndex.value].fields.length - 1}
                                  class="px-2 py-1 text-sm border rounded disabled:opacity-50 hover:bg-white"
                                  title="Move down"
                                >
                                  ↓
                                </button>
                                <button
                                  onClick$={(e) => {
                                    e.stopPropagation();
                                    deleteField(currentStepIndex.value, fieldIndex);
                                  }}
                                  class="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Workflow Tab */}
        {activeTab.value === 'workflow' && (
          <div class="space-y-6">
            {/* Workflow Selection */}
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="font-semibold text-gray-900 mb-4">Select Workflow</h3>
              <select
                value={selectedWorkflowId.value || ''}
                onChange$={(e) => (selectedWorkflowId.value = (e.target as HTMLSelectElement).value || undefined)}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No workflow (form will not have states)</option>
                {props.workflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name} ({workflow.code}) - {workflow.states.length} states
                  </option>
                ))}
              </select>
              <p class="text-sm text-gray-600 mt-2">
                Select a workflow to manage form lifecycle through states and transitions.
              </p>
            </div>

            {/* Workflow Preview */}
            {selectedWorkflow.value && (
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="font-semibold text-gray-900 mb-4">Workflow Preview: {selectedWorkflow.value.name}</h3>

                <div class="grid grid-cols-2 gap-6">
                  <div>
                    <h4 class="text-sm font-medium text-gray-700 mb-2">States ({selectedWorkflow.value.states.length})</h4>
                    <div class="space-y-2">
                      {selectedWorkflow.value.states.map((state) => (
                        <div key={state.code} class="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span class={`px-2 py-1 rounded text-xs font-medium ${
                            state.color === 'gray' ? 'bg-gray-100 text-gray-700' :
                            state.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                            state.color === 'green' ? 'bg-green-100 text-green-700' :
                            state.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                            state.color === 'red' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {state.name}
                          </span>
                          <code class="text-xs text-gray-500">{state.code}</code>
                          {state.code === selectedWorkflow.value.initial_state && (
                            <span class="text-xs text-blue-600">Initial</span>
                          )}
                          {state.is_final && (
                            <span class="text-xs text-green-600">Final</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Transitions ({selectedWorkflow.value.transitions.length})</h4>
                    <div class="space-y-2">
                      {selectedWorkflow.value.transitions.map((transition, idx) => (
                        <div key={idx} class="p-2 bg-gray-50 rounded text-xs">
                          <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{transition.from}</span>
                            <span>→</span>
                            <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded">{transition.to}</span>
                          </div>
                          <div class="mt-1 text-gray-600">Action: {transition.label || transition.action}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <p class="text-sm text-gray-600 mt-4 p-3 bg-blue-50 rounded">
                  This workflow will be attached to your form. Forms will start in the "{selectedWorkflow.value.initial_state}" state.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Preview & Export Tab */}
        {activeTab.value === 'preview' && (
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-bold mb-6">Form Preview & Export</h2>

            {/* Summary */}
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="p-4 bg-blue-50 rounded-lg">
                <div class="text-2xl font-bold text-blue-700">{form.steps.length}</div>
                <div class="text-sm text-blue-600">Step{form.steps.length !== 1 ? 's' : ''}</div>
              </div>
              <div class="p-4 bg-green-50 rounded-lg">
                <div class="text-2xl font-bold text-green-700">
                  {form.steps.reduce((acc, step) => acc + step.fields.length, 0)}
                </div>
                <div class="text-sm text-green-600">Total Fields</div>
              </div>
              <div class="p-4 bg-purple-50 rounded-lg">
                <div class="text-2xl font-bold text-purple-700">
                  {selectedWorkflow.value ? selectedWorkflow.value.states.length : 0}
                </div>
                <div class="text-sm text-purple-600">Workflow States</div>
              </div>
            </div>

            {/* JSON Export */}
            <div>
              <div class="flex justify-between items-center mb-4">
                <h3 class="font-medium">JSON Definition</h3>
                <button
                  onClick$={async () => {
                    const json = await exportJSON();
                    navigator.clipboard.writeText(json);
                    alert('JSON copied to clipboard!');
                  }}
                  class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  📋 Copy JSON
                </button>
              </div>
              <textarea
                value={exportJSON()}
                class="w-full h-96 font-mono text-sm p-4 border border-gray-300 rounded-lg bg-gray-50"
                readOnly
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
