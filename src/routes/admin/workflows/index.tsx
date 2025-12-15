// src/routes/admin/workflows/index.tsx
import { component$, useSignal, useVisibleTask$, $, useStore } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import WorkflowDesigner from '~/components/form-builder/workflow/WorkflowDesigner';
import { workflowService } from '~/services';
import type { WorkflowDefinition } from '~/types/workflow';

export default component$(() => {
  const workflows = useSignal<WorkflowDefinition[]>([]);
  const selectedWorkflow = useSignal<WorkflowDefinition | null>(null);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const showDesigner = useSignal(false);
  const isEditing = useSignal(false);

  const loadWorkflows = $(async () => {
    try {
      loading.value = true;
      const data = await workflowService.getAllWorkflows();
      workflows.value = data;
      error.value = null;
    } catch (err: any) {
      error.value = err.message || 'Failed to load workflows';
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadWorkflows();
  });

  const handleCreateNew = $(() => {
    selectedWorkflow.value = null;
    isEditing.value = false;
    showDesigner.value = true;
  });

  const handleEdit = $((workflow: WorkflowDefinition) => {
    selectedWorkflow.value = workflow;
    isEditing.value = true;
    showDesigner.value = true;
  });

  const handleSave = $(async (workflow: Partial<WorkflowDefinition>) => {
    try {
      if (isEditing.value && selectedWorkflow.value) {
        // Update existing workflow
        await workflowService.updateWorkflow(selectedWorkflow.value.id, workflow);
        alert('Workflow updated successfully!');
      } else {
        // Create new workflow
        await workflowService.createWorkflow(workflow as WorkflowDefinition);
        alert('Workflow created successfully!');
      }

      // Close designer and reload workflows
      showDesigner.value = false;
      selectedWorkflow.value = null;
      await loadWorkflows();
    } catch (err: any) {
      alert('Failed to save workflow: ' + err.message);
    }
  });

  const handleCancel = $(() => {
    showDesigner.value = false;
    selectedWorkflow.value = null;
  });

  const handleDelete = $(async (workflow: WorkflowDefinition) => {
    if (!confirm(`Are you sure you want to delete "${workflow.name}"?`)) {
      return;
    }

    try {
      await workflowService.deleteWorkflow(workflow.id);
      workflows.value = workflows.value.filter(w => w.id !== workflow.id);
      alert('Workflow deleted successfully!');
    } catch (err: any) {
      alert('Failed to delete workflow: ' + err.message);
    }
  });

  return (
    <div class="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Workflow Management</h1>
          <p class="text-gray-600 mt-1">Create and manage workflow state machines</p>
        </div>
        {!showDesigner.value && (
          <button
            onClick$={handleCreateNew}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create New Workflow
          </button>
        )}
      </div>

      {/* Show Designer or List */}
      {showDesigner.value ? (
        <div class="bg-white rounded-lg shadow-sm">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">
              {isEditing.value ? `Edit: ${selectedWorkflow.value?.name}` : 'Create New Workflow'}
            </h2>
          </div>
          <div class="p-6">
            <WorkflowDesigner
              workflow={selectedWorkflow.value ?? undefined}
              onSave$={handleSave}
              onCancel$={handleCancel}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Loading State */}
          {loading.value && (
            <div class="flex justify-center py-12">
              <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}

          {/* Error State */}
          {error.value && (
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error.value}
            </div>
          )}

          {/* Workflows Grid */}
          {!loading.value && !error.value && (
            <>
              {workflows.value.length === 0 ? (
                <div class="bg-white rounded-lg shadow-sm p-12 text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-gray-900">No workflows</h3>
                  <p class="mt-1 text-sm text-gray-500">
                    Get started by creating a new workflow
                  </p>
                </div>
              ) : (
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {workflows.value.map((workflow) => (
                    <div
                      key={workflow.id}
                      class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      {/* Card Header */}
                      <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                        <code class="text-xs text-gray-500 font-mono">{workflow.code}</code>
                      </div>

                      {/* Card Body */}
                      <div class="px-6 py-4">
                        {workflow.description && (
                          <p class="text-sm text-gray-600 mb-4">{workflow.description}</p>
                        )}

                        {/* Stats */}
                        <div class="grid grid-cols-2 gap-3 mb-4">
                          <div class="bg-blue-50 rounded-lg p-3">
                            <div class="text-xs text-blue-600 font-medium">States</div>
                            <div class="text-2xl font-bold text-blue-900">
                              {workflow.states?.length || 0}
                            </div>
                          </div>
                          <div class="bg-green-50 rounded-lg p-3">
                            <div class="text-xs text-green-600 font-medium">Transitions</div>
                            <div class="text-2xl font-bold text-green-900">
                              {workflow.transitions?.length || 0}
                            </div>
                          </div>
                        </div>

                        {/* Initial State */}
                        <div class="text-sm">
                          <span class="text-gray-500">Initial State:</span>
                          <span class="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                            {workflow.initial_state}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div class="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 rounded-b-lg">
                        <button
                          onClick$={() => handleEdit(workflow)}
                          class="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick$={() => handleDelete(workflow)}
                          class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              {workflows.value.length > 0 && (
                <div class="mt-6 text-sm text-gray-600">
                  {workflows.value.length} workflow{workflows.value.length !== 1 ? 's' : ''} total
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Workflow Management - Admin',
  meta: [
    {
      name: 'description',
      content: 'Manage workflow state machines',
    },
  ],
};
