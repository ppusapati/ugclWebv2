// src/components/form-builder/FormBuilderComplete.tsx
import { component$, useSignal, useStore, $, useComputed$, type PropFunction } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { Badge, Btn, FormField } from '~/components/ds';
import type { FormDefinition, FormStep, FormField as WorkflowFormField, Module, WorkflowDefinition } from '~/types/workflow';
import FieldEditorComplete from './workflow/FieldEditorComplete';

interface FormBuilderCompleteProps {
  initialDefinition?: FormDefinition;
  modules: Module[];
  workflows: WorkflowDefinition[];
  onSave$: PropFunction<(definition: FormDefinition) => void>;
  onCancel$?: PropFunction<() => void>;
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
    const newField: WorkflowFormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false
    };
    form.steps[currentStepIndex.value].fields.push(newField);
    selectedFieldIndex.value = form.steps[currentStepIndex.value].fields.length - 1;
  });

  const updateField = $((stepIndex: number, fieldIndex: number, updatedField: WorkflowFormField) => {
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

  const handleSave = $(async () => {
    // Add workflow to form definition if selected
    if (selectedWorkflow.value) {
      form.workflow = {
        initial_state: selectedWorkflow.value.initial_state,
        states: selectedWorkflow.value.states.map(s => s.code),
        transitions: selectedWorkflow.value.transitions,
      };
    }
    // Pass form with workflow_id attached for the save handler
    const formWithWorkflowId = {
      ...form,
      workflow_id: selectedWorkflowId.value,
    };
    await props.onSave$(formWithWorkflowId as any);
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
              {props.onCancel$ && (
                <Btn
                  onClick$={props.onCancel$}
                  variant="secondary"
                  class="rounded"
                >
                  Cancel
                </Btn>
              )}
              <Btn
                onClick$={handleSave}
                class="rounded"
              >
                <i class="i-heroicons-bookmark-square-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                Save Form
              </Btn>
            </div>
          </div>

          {/* Tabs */}
          <div class="flex gap-4 mt-6 border-b border-gray-200">
            <Btn
              variant={activeTab.value === 'basic' ? 'primary' : 'ghost'}
              size="sm"
              class={`rounded-b-none ${
                activeTab.value === 'basic'
                  ? 'border-b-2 border-blue-600'
                  : ''
              }`}
              onClick$={() => (activeTab.value = 'basic')}
            >
              <i class="i-heroicons-document-text-solid h-4 w-4 inline-block" aria-hidden="true"></i>
              Basic Info
            </Btn>
            <Btn
              variant={activeTab.value === 'steps' ? 'primary' : 'ghost'}
              size="sm"
              class={`rounded-b-none ${
                activeTab.value === 'steps'
                  ? 'border-b-2 border-blue-600'
                  : ''
              }`}
              onClick$={() => (activeTab.value = 'steps')}
            >
              <i class="i-heroicons-clipboard-document-list-solid h-4 w-4 inline-block" aria-hidden="true"></i>
              Steps & Fields ({form.steps.reduce((acc, step) => acc + step.fields.length, 0)})
            </Btn>
            <Btn
              variant={activeTab.value === 'workflow' ? 'primary' : 'ghost'}
              size="sm"
              class={`rounded-b-none ${
                activeTab.value === 'workflow'
                  ? 'border-b-2 border-blue-600'
                  : ''
              }`}
              onClick$={() => (activeTab.value = 'workflow')}
            >
              <i class="i-heroicons-arrow-path-rounded-square-solid h-4 w-4 inline-block" aria-hidden="true"></i>
              Workflow {selectedWorkflow.value && `(${selectedWorkflow.value.name})`}
            </Btn>
            <Btn
              variant={activeTab.value === 'preview' ? 'primary' : 'ghost'}
              size="sm"
              class={`rounded-b-none ${
                activeTab.value === 'preview'
                  ? 'border-b-2 border-blue-600'
                  : ''
              }`}
              onClick$={() => (activeTab.value = 'preview')}
            >
              <i class="i-heroicons-eye-solid h-4 w-4 inline-block" aria-hidden="true"></i>
              Preview & Export
            </Btn>
          </div>
        </div>

        {/* Basic Info Tab */}
        {activeTab.value === 'basic' && (
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-bold mb-6">Basic Information</h2>

            <div class="grid grid-cols-2 gap-6">
              <div>
                <FormField id="complete-form-code" label="Form Code" required>
                  <input
                    id="complete-form-code"
                    type="text"
                    value={form.form_code}
                    onInput$={(e) => (form.form_code = (e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., project_registration"
                    required
                  />
                </FormField>
                <p class="text-xs text-gray-500 mt-1">Unique identifier (lowercase, underscores only)</p>
              </div>

              <div>
                <FormField id="complete-form-version" label="Version">
                  <input
                    id="complete-form-version"
                    type="text"
                    value={form.version}
                    onInput$={(e) => (form.version = (e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1.0.0"
                  />
                </FormField>
              </div>

              <div class="col-span-2">
                <FormField id="complete-form-title" label="Title" required>
                  <input
                    id="complete-form-title"
                    type="text"
                    value={form.title}
                    onInput$={(e) => (form.title = (e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Project Registration Form"
                    required
                  />
                </FormField>
              </div>

              <div class="col-span-2">
                <FormField id="complete-form-description" label="Description">
                  <textarea
                    id="complete-form-description"
                    value={form.description}
                    onInput$={(e) => (form.description = (e.target as HTMLTextAreaElement).value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Brief description of the form"
                  />
                </FormField>
              </div>

              <div>
                <FormField id="complete-form-module" label="Module" required>
                  <select
                    id="complete-form-module"
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
                </FormField>
              </div>

              <div>
                <FormField id="complete-form-type" label="Form Type">
                  <select
                    id="complete-form-type"
                    value={form.type}
                    onChange$={(e) => (form.type = (e.target as HTMLSelectElement).value as any)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="single_page">Single Page</option>
                    <option value="multi_step">Multi-Step</option>
                  </select>
                </FormField>
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
                <Btn
                  onClick$={addStep}
                  size="sm"
                  class="rounded"
                >
                  + Add
                </Btn>
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
                        <Btn
                          onClick$={(e) => {
                            e.stopPropagation();
                            deleteStep(index);
                          }}
                          variant="danger"
                          size="sm"
                          class="opacity-0 group-hover:opacity-100 min-w-0 px-2"
                        >
                          ✕
                        </Btn>
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
                    <FormField id="complete-step-title" label="Step Title">
                      <input
                        id="complete-step-title"
                        type="text"
                        value={form.steps[currentStepIndex.value].title}
                        onInput$={(e) => {
                          form.steps[currentStepIndex.value].title = (e.target as HTMLInputElement).value;
                        }}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Step title"
                      />
                    </FormField>
                  </div>
                  <div>
                    <FormField id="complete-step-id" label="Step ID">
                      <input
                        id="complete-step-id"
                        type="text"
                        value={form.steps[currentStepIndex.value].id}
                        onInput$={(e) => {
                          form.steps[currentStepIndex.value].id = (e.target as HTMLInputElement).value;
                        }}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        placeholder="step_id"
                      />
                    </FormField>
                  </div>
                  <div class="col-span-2">
                    <FormField id="complete-step-description" label="Description">
                      <input
                        id="complete-step-description"
                        type="text"
                        value={form.steps[currentStepIndex.value].description}
                        onInput$={(e) => {
                          form.steps[currentStepIndex.value].description = (e.target as HTMLInputElement).value;
                        }}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Step description"
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="font-semibold text-gray-900">Fields</h3>
                  <Btn
                    onClick$={addField}
                    size="sm"
                    class="rounded"
                  >
                    + Add Field
                  </Btn>
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
                            onUpdate$={$((updatedField: WorkflowFormField) => updateField(currentStepIndex.value, fieldIndex, updatedField))}
                            onDelete$={$(() => deleteField(currentStepIndex.value, fieldIndex))}
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
                                    <Badge variant="error" class="text-xs px-2 py-0.5">Required</Badge>
                                  )}
                                </div>
                              </div>
                              <div class="flex gap-1 opacity-0 group-hover:opacity-100">
                                <Btn
                                  onClick$={(e) => {
                                    e.stopPropagation();
                                    moveField(currentStepIndex.value, fieldIndex, 'up');
                                  }}
                                  disabled={fieldIndex === 0}
                                  variant="secondary"
                                  size="sm"
                                  class="px-2 disabled:opacity-50"
                                  title="Move up"
                                >
                                  ↑
                                </Btn>
                                <Btn
                                  onClick$={(e) => {
                                    e.stopPropagation();
                                    moveField(currentStepIndex.value, fieldIndex, 'down');
                                  }}
                                  disabled={fieldIndex === form.steps[currentStepIndex.value].fields.length - 1}
                                  variant="secondary"
                                  size="sm"
                                  class="px-2 disabled:opacity-50"
                                  title="Move down"
                                >
                                  ↓
                                </Btn>
                                <Btn
                                  onClick$={(e) => {
                                    e.stopPropagation();
                                    deleteField(currentStepIndex.value, fieldIndex);
                                  }}
                                  variant="danger"
                                  size="sm"
                                  class="px-2"
                                  title="Delete"
                                >
                                  🗑️
                                </Btn>
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
              <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold text-gray-900">Select Workflow</h3>
                <Link
                  href="/admin/workflows"
                  class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Manage Workflows
                </Link>
              </div>
              <select
                value={selectedWorkflowId.value || ''}
                onChange$={(e) => (selectedWorkflowId.value = (e.target as HTMLSelectElement).value || undefined)}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No workflow (form will not have states)</option>
                {props.workflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {`${workflow.name} (${workflow.code}) - ${workflow.states.length} states`}
                  </option>
                ))}
              </select>
              <p class="text-sm text-gray-600 mt-2">
                Select a workflow to manage form lifecycle through states and transitions.
                {props.workflows.length === 0 && (
                  <span class="text-orange-600 ml-1">
                    No workflows available. Click "Create New Workflow" to create one first.
                  </span>
                )}
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
                          <Badge variant={
                            state.color === 'blue' ? 'info' :
                            state.color === 'green' ? 'success' :
                            state.color === 'yellow' ? 'warning' :
                            state.color === 'red' ? 'error' :
                            'neutral'
                          } class="text-xs font-medium px-2 py-1">
                            {state.name}
                          </Badge>
                          <code class="text-xs text-gray-500">{state.code}</code>
                          {state.code === selectedWorkflow.value?.initial_state && (
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
                            <Badge variant="info" class="px-2 py-0.5">{transition.from}</Badge>
                            <i class="i-heroicons-arrow-right-solid h-3.5 w-3.5 inline-block text-gray-500" aria-hidden="true"></i>
                            <Badge variant="success" class="px-2 py-0.5">{transition.to}</Badge>
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
                <Btn
                  onClick$={async () => {
                    const json = await exportJSON();
                    navigator.clipboard.writeText(json);
                    alert('JSON copied to clipboard!');
                  }}
                  size="sm"
                  class="rounded"
                >
                  <i class="i-heroicons-clipboard-document-list-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                  Copy JSON
                </Btn>
              </div>
              <textarea
                value={JSON.stringify(form, null, 2)}
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
