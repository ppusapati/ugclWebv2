// src/components/form-builder/workflow/WorkflowPanel.tsx
import { component$, useSignal, $, useTask$, type PropFunction } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import type { WorkflowDefinition, WorkflowConfig, AppForm } from '~/types/workflow';
import WorkflowDiagram from './WorkflowDiagram';

interface WorkflowPanelProps {
  workflows: WorkflowDefinition[];
  workflow?: WorkflowConfig;
  allForms?: AppForm[]; // Optional: list of all forms for usage tracking
  onUpdate$: PropFunction<(workflow: WorkflowConfig | undefined) => void>;
  onWorkflowsChange$?: PropFunction<() => void>;
}

export default component$<WorkflowPanelProps>((props) => {
  const nav = useNavigate();
  const mode = useSignal<'select' | 'view' | 'create' | 'edit'>('select');
  const selectedWorkflowId = useSignal<string | undefined>(undefined);
  const selectedWorkflow = useSignal<WorkflowDefinition | undefined>(undefined);

  // Initialize from props
  useTask$(({ track }) => {
    track(() => props.workflow);
    if (props.workflow) {
      const workflow = props.workflows.find(w => w.initial_state === props.workflow?.initial_state);
      if (workflow) {
        selectedWorkflowId.value = workflow.id;
        selectedWorkflow.value = workflow;
        mode.value = 'view';
      }
    }
  });

  const handleSelectWorkflow = $(async (workflowId: string | undefined) => {
    selectedWorkflowId.value = workflowId;

    if (!workflowId) {
      selectedWorkflow.value = undefined;
      mode.value = 'select';
      await props.onUpdate$(undefined);
      return;
    }

    const workflow = props.workflows.find(w => w.id === workflowId);
    if (workflow) {
      selectedWorkflow.value = workflow;
      mode.value = 'view';

      const workflowConfig: WorkflowConfig = {
        initial_state: workflow.initial_state,
        states: workflow.states.map(s => s.code),
        transitions: workflow.transitions,
      };
      await props.onUpdate$(workflowConfig);
    }
  });

  const handleCreateNew = $(async () => {
    await nav('/admin/workflows');
  });

  const handleCancel = $(() => {
    mode.value = selectedWorkflow.value ? 'view' : 'select';
  });

  // Compute workflow usage - which forms use each workflow
  const getWorkflowUsage = (workflowId: string): AppForm[] => {
    if (!props.allForms) return [];
    return props.allForms.filter(form => form.workflow_id === workflowId);
  };

  return (
    <div class="workflow-panel">
      {mode.value === 'select' && (
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Workflow</label>
            <select
              value={selectedWorkflowId.value || ''}
              onChange$={(e) => handleSelectWorkflow((e.target as HTMLSelectElement).value || undefined)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No workflow</option>
              {props.workflows.map((workflow) => {
                const usageCount = getWorkflowUsage(workflow.id).length;
                const usageText = usageCount > 0 ? ` (used by ${usageCount} form${usageCount > 1 ? 's' : ''})` : '';
                const optionText = `${workflow.name} - ${workflow.states.length} states${usageText}`;
                return (
                  <option key={workflow.id} value={workflow.id}>
                    {optionText}
                  </option>
                );
              })}
            </select>
          </div>

          <div class="text-sm text-gray-600">
            <p class="mb-2">
              <strong>Tip:</strong> You can reuse existing workflows across multiple forms.
              Select from the list above or create a new workflow.
            </p>
          </div>

          <button
            onClick$={handleCreateNew}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Manage Workflows
          </button>
        </div>
      )}

      {mode.value === 'view' && selectedWorkflow.value && (
        <div class="space-y-6">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-lg font-semibold">{selectedWorkflow.value.name}</h3>
              {selectedWorkflow.value.description && (
                <p class="text-sm text-gray-600 mt-1">{selectedWorkflow.value.description}</p>
              )}
            </div>
            <button
              onClick$={() => handleSelectWorkflow(undefined)}
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Change
            </button>
          </div>

          {/* Workflow usage information */}
          {(() => {
            const usedByForms = getWorkflowUsage(selectedWorkflow.value.id);
            return usedByForms.length > 0 && (
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="flex-1">
                    <h4 class="text-sm font-medium text-blue-900">Workflow Usage</h4>
                    <p class="text-sm text-blue-700 mt-1">
                      This workflow is currently used by{' '}
                      <strong>{String(usedByForms.length)}</strong> form(s):
                    </p>
                    <ul class="mt-2 space-y-1">
                      {usedByForms.map((form: AppForm) => (
                        <li key={form.id} class="text-sm text-blue-800">
                          • {form.title} ({form.code})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })()}

          <WorkflowDiagram
            states={selectedWorkflow.value.states}
            transitions={selectedWorkflow.value.transitions}
            initialState={selectedWorkflow.value.initial_state}
          />
        </div>
      )}

    </div>
  );
});
