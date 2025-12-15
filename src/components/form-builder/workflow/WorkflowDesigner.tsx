// src/components/form-builder/workflow/WorkflowDesigner.tsx
import { component$, useStore, useSignal, $, useComputed$, type PropFunction } from '@builder.io/qwik';
import type { WorkflowDefinition, WorkflowState, WorkflowTransitionDef } from '~/types/workflow';
import StateEditor from './StateEditor';
import TransitionEditor from './TransitionEditor';
import WorkflowDiagram from './WorkflowDiagram';
import ValidationSummary from './ValidationSummary';
import { validateWorkflow } from './validation';

interface WorkflowDesignerProps {
  workflow?: WorkflowDefinition;
  onSave$: PropFunction<(workflow: Partial<WorkflowDefinition>) => void>;
  onCancel$?: PropFunction<() => void>;
}

export default component$<WorkflowDesignerProps>((props) => {
  const activeTab = useSignal<'info' | 'states' | 'transitions' | 'diagram' | 'preview'>('info');
  const selectedStateIndex = useSignal<number | null>(null);
  const selectedTransitionIndex = useSignal<number | null>(null);
  const showValidation = useSignal(false);

  const workflow = useStore<Partial<WorkflowDefinition>>({
    code: props.workflow?.code || '',
    name: props.workflow?.name || '',
    description: props.workflow?.description || '',
    version: props.workflow?.version || '1.0.0',
    initial_state: props.workflow?.initial_state || 'draft',
    states: props.workflow?.states || [
      {
        code: 'draft',
        name: 'Draft',
        description: 'Initial draft state',
        color: 'gray',
        icon: 'edit',
        is_final: false,
      },
    ],
    transitions: props.workflow?.transitions || [],
    is_active: props.workflow?.is_active ?? true,
  });

  const addState = $(() => {
    const newState: WorkflowState = {
      code: `state_${workflow.states!.length + 1}`,
      name: `State ${workflow.states!.length + 1}`,
      description: '',
      color: 'blue',
      icon: 'star',
      is_final: false,
    };
    workflow.states!.push(newState);
    selectedStateIndex.value = workflow.states!.length - 1;
  });

  const deleteState = $((index: number) => {
    const stateCode = workflow.states![index].code;

    // Remove transitions involving this state
    workflow.transitions = workflow.transitions!.filter(
      t => t.from !== stateCode && t.to !== stateCode
    );

    workflow.states!.splice(index, 1);

    if (selectedStateIndex.value === index) {
      selectedStateIndex.value = null;
    } else if (selectedStateIndex.value! > index) {
      selectedStateIndex.value = selectedStateIndex.value! - 1;
    }
  });

  const updateState = $((index: number, state: WorkflowState) => {
    workflow.states![index] = state;
  });

  const addTransition = $(() => {
    const newTransition: WorkflowTransitionDef = {
      from: '',
      to: '',
      action: '',
      label: '',
      permission: '',
      requires_comment: false,
    };
    if (!workflow.transitions) {
      workflow.transitions = [];
    }
    workflow.transitions.push(newTransition);
    selectedTransitionIndex.value = workflow.transitions.length - 1;
  });

  const deleteTransition = $((index: number) => {
    workflow.transitions!.splice(index, 1);
    if (selectedTransitionIndex.value === index) {
      selectedTransitionIndex.value = null;
    } else if (selectedTransitionIndex.value! > index) {
      selectedTransitionIndex.value = selectedTransitionIndex.value! - 1;
    }
  });

  const updateTransition = $((index: number, transition: WorkflowTransitionDef) => {
    workflow.transitions![index] = transition;
  });

  const exportJSON = useComputed$(() => {
    return JSON.stringify(workflow, null, 2);
  });

  const validation = useComputed$(() => {
    return validateWorkflow(workflow);
  });

  const handleSave = $(async () => {
    const validationResult = validateWorkflow(workflow);
    if (!validationResult.valid) {
      showValidation.value = true;
      activeTab.value = 'info'; // Go to the first tab to show errors
      return;
    }
    showValidation.value = false;
    await props.onSave$(workflow);
  });

  const handleValidate = $(() => {
    showValidation.value = true;
  });

  return (
    <div class="workflow-designer min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        {/* Header */}
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Workflow Designer</h1>
              <p class="text-gray-600 mt-1">Configure workflow states and transitions</p>
              {validation.value && !validation.value.valid && (
                <div class="flex items-center gap-2 mt-2">
                  <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                    {validation.value.errors.length} Error{validation.value.errors.length !== 1 ? 's' : ''}
                  </span>
                  {validation.value.warnings.length > 0 && (
                    <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
                      {validation.value.warnings.length} Warning{validation.value.warnings.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div class="flex gap-3">
              <button
                onClick$={handleValidate}
                class="px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                title="Validate workflow configuration"
              >
                ✓ Validate
              </button>
              {props.onCancel$ && (
                <button
                  onClick$={props.onCancel$}
                  class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                onClick$={handleSave}
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={validation.value && !validation.value.valid}
                title={validation.value && !validation.value.valid ? 'Fix errors before saving' : 'Save workflow'}
              >
                💾 Save Workflow
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div class="flex gap-4 mt-6 border-b border-gray-200">
            <button
              class={`px-4 py-2 font-medium transition-colors ${
                activeTab.value === 'info'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick$={() => (activeTab.value = 'info')}
            >
              📝 Basic Info
            </button>
            <button
              class={`px-4 py-2 font-medium transition-colors ${
                activeTab.value === 'states'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick$={() => (activeTab.value = 'states')}
            >
              🔵 States ({workflow.states?.length || 0})
            </button>
            <button
              class={`px-4 py-2 font-medium transition-colors ${
                activeTab.value === 'transitions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick$={() => (activeTab.value = 'transitions')}
            >
              ➡️ Transitions ({workflow.transitions?.length || 0})
            </button>
            <button
              class={`px-4 py-2 font-medium transition-colors ${
                activeTab.value === 'diagram'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick$={() => (activeTab.value = 'diagram')}
            >
              📊 Diagram
            </button>
            <button
              class={`px-4 py-2 font-medium transition-colors ${
                activeTab.value === 'preview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick$={() => (activeTab.value = 'preview')}
            >
              👁️ Preview
            </button>
          </div>
        </div>

        {/* Validation Summary */}
        {showValidation.value && validation.value && (
          <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
            <ValidationSummary
              validation={validation.value}
              onClose$={$(() => (showValidation.value = false))}
            />
          </div>
        )}

        {/* Basic Info Tab */}
        {activeTab.value === 'info' && (
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-bold mb-6">Workflow Information</h2>

            <div class="grid grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Code *
                </label>
                <input
                  type="text"
                  value={workflow.code}
                  onInput$={(e) => (workflow.code = (e.target as HTMLInputElement).value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., standard_approval"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={workflow.version}
                  onInput$={(e) => (workflow.version = (e.target as HTMLInputElement).value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="1.0.0"
                />
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  value={workflow.name}
                  onInput$={(e) => (workflow.name = (e.target as HTMLInputElement).value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Standard Approval Workflow"
                  required
                />
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={workflow.description}
                  onInput$={(e) => (workflow.description = (e.target as HTMLTextAreaElement).value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Brief description of this workflow"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Initial State *
                </label>
                <select
                  value={workflow.initial_state}
                  onChange$={(e) => (workflow.initial_state = (e.target as HTMLSelectElement).value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {workflow.states?.map((state) => (
                    <option key={state.code} value={state.code}>
                      {`${state.name} (${state.code})`}
                    </option>
                  ))}
                </select>
              </div>

              <div class="flex items-center">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    checked={workflow.is_active}
                    onChange$={(e) => (workflow.is_active = (e.target as HTMLInputElement).checked)}
                    class="mr-2"
                  />
                  <span class="text-sm font-medium">Active Workflow</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* States Tab */}
        {activeTab.value === 'states' && (
          <div class="grid grid-cols-3 gap-6">
            {/* States List */}
            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold">States</h2>
                <button
                  onClick$={addState}
                  class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  + Add
                </button>
              </div>

              <div class="space-y-2">
                {workflow.states?.map((state, index) => (
                  <button
                    key={state.code}
                    type="button"
                    onClick$={() => (selectedStateIndex.value = index)}
                    class={`w-full text-left px-3 py-2 rounded border ${
                      selectedStateIndex.value === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div class="font-medium">{state.name}</div>
                    <div class="text-sm text-gray-500">{state.code}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* State Editor */}
            <div class="col-span-2">
              {selectedStateIndex.value !== null && workflow.states?.[selectedStateIndex.value] ? (
                <StateEditor
                  state={workflow.states[selectedStateIndex.value]}
                  onUpdate$={$((state: WorkflowState) => updateState(selectedStateIndex.value!, state))}
                  onDelete$={$(() => deleteState(selectedStateIndex.value!))}
                  canDelete={workflow.states!.length > 1}
                />
              ) : (
                <div class="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
                  Select a state to edit or create a new one
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transitions Tab */}
        {activeTab.value === 'transitions' && (
          <div class="grid grid-cols-3 gap-6">
            {/* Transitions List */}
            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold">Transitions</h2>
                <button
                  onClick$={addTransition}
                  class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  + Add
                </button>
              </div>

              <div class="space-y-2">
                {workflow.transitions?.map((transition, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick$={() => (selectedTransitionIndex.value = index)}
                    class={`w-full text-left px-3 py-2 rounded border ${
                      selectedTransitionIndex.value === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div class="font-medium">{transition.label || transition.action || 'Untitled'}</div>
                    <div class="text-sm text-gray-500">
                      {transition.from} → {transition.to}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Transition Editor */}
            <div class="col-span-2">
              {selectedTransitionIndex.value !== null && workflow.transitions?.[selectedTransitionIndex.value] ? (
                <TransitionEditor
                  transition={workflow.transitions[selectedTransitionIndex.value]}
                  states={workflow.states || []}
                  onUpdate$={$((transition: WorkflowTransitionDef) => updateTransition(selectedTransitionIndex.value!, transition))}
                  onDelete$={$(() => deleteTransition(selectedTransitionIndex.value!))}
                />
              ) : (
                <div class="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
                  Select a transition to edit or create a new one
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagram Tab */}
        {activeTab.value === 'diagram' && (
          <WorkflowDiagram
            states={workflow.states || []}
            transitions={workflow.transitions || []}
            initialState={workflow.initial_state || ''}
            onStateClick$={$((state: WorkflowState) => {
              const index = workflow.states?.findIndex(s => s.code === state.code);
              if (index !== undefined && index >= 0) {
                selectedStateIndex.value = index;
                activeTab.value = 'states';
              }
            })}
            onTransitionClick$={$((transition: WorkflowTransitionDef) => {
              const index = workflow.transitions?.findIndex(
                t => t.from === transition.from && t.to === transition.to && t.action === transition.action
              );
              if (index !== undefined && index >= 0) {
                selectedTransitionIndex.value = index;
                activeTab.value = 'transitions';
              }
            })}
          />
        )}

        {/* Preview Tab */}
        {activeTab.value === 'preview' && (
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-bold mb-6">Workflow Preview</h2>

            {/* Workflow Summary */}
            <div class="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 class="font-medium mb-2">{workflow.name}</h3>
              <p class="text-sm text-gray-600 mb-2">{workflow.description}</p>
              <div class="flex gap-4 text-sm">
                <span>
                  <strong>Code:</strong> {workflow.code}
                </span>
                <span>
                  <strong>Initial State:</strong> {workflow.initial_state}
                </span>
                <span>
                  <strong>States:</strong> {workflow.states?.length || 0}
                </span>
                <span>
                  <strong>Transitions:</strong> {workflow.transitions?.length || 0}
                </span>
              </div>
            </div>

            {/* States */}
            <div class="mb-8">
              <h3 class="font-medium mb-4">States</h3>
              <div class="grid grid-cols-4 gap-3">
                {workflow.states?.map((state) => (
                  <div key={state.code} class="p-3 border rounded-lg">
                    <div
                      class={`px-2 py-1 rounded text-sm font-medium inline-block mb-2 ${
                        state.color === 'gray' ? 'bg-gray-100 text-gray-700' :
                        state.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                        state.color === 'green' ? 'bg-green-100 text-green-700' :
                        state.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                        state.color === 'red' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {state.icon && `${state.icon} `}
                      {state.name}
                    </div>
                    <div class="text-xs text-gray-500">{state.code}</div>
                    {state.is_final && (
                      <div class="text-xs text-gray-500 italic mt-1">Final State</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Transitions */}
            <div>
              <h3 class="font-medium mb-4">Transitions</h3>
              <div class="space-y-2">
                {workflow.transitions?.map((transition, index) => (
                  <div key={index} class="flex items-center gap-3 p-3 border rounded-lg">
                    <span class="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                      {workflow.states?.find(s => s.code === transition.from)?.name || transition.from}
                    </span>
                    <span class="text-gray-400">→</span>
                    <span class="px-2 py-1 bg-green-100 text-green-700 text-sm rounded">
                      {workflow.states?.find(s => s.code === transition.to)?.name || transition.to}
                    </span>
                    <div class="ml-auto flex items-center gap-3">
                      <button class="px-3 py-1 bg-blue-600 text-white text-sm rounded">
                        {transition.label || transition.action}
                      </button>
                      {transition.permission && (
                        <span class="text-xs text-gray-500">🔒 {transition.permission}</span>
                      )}
                      {transition.requires_comment && (
                        <span class="text-xs text-gray-500">💬 Comment required</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* JSON Export */}
            <div class="mt-8">
              <div class="flex justify-between items-center mb-4">
                <h3 class="font-medium">JSON Definition</h3>
                <button
                  onClick$={() => {
                    navigator.clipboard.writeText(exportJSON.value);
                    alert('JSON copied to clipboard!');
                  }}
                  class="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  Copy JSON
                </button>
              </div>
              <textarea
                value={exportJSON.value}
                class="w-full h-64 font-mono text-sm p-4 border border-gray-300 rounded-lg bg-gray-50"
                readOnly
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
