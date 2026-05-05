// src/routes/admin/workflows/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { Badge, Btn, PageHeader, SectionCard } from '~/components/ds';
import WorkflowDesigner from '~/components/form-builder/workflow/WorkflowDesigner';
import { createSSRApiClient, workflowService } from '~/services';
import type { WorkflowDefinition } from '~/types/workflow';

export const useWorkflowsData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const response = await ssrApiClient.get<{ workflows: WorkflowDefinition[] }>('/admin/workflows');
    return {
      workflows: response?.workflows || [],
      error: null as string | null,
    };
  } catch (err: any) {
    return {
      workflows: [] as WorkflowDefinition[],
      error: err.message || 'Failed to load workflows',
    };
  }
});

export default component$(() => {
  const initialData = useWorkflowsData();
  const workflows = useSignal<WorkflowDefinition[]>(initialData.value.workflows || []);
  const selectedWorkflow = useSignal<WorkflowDefinition | null>(null);
  const loading = useSignal(false);
  const error = useSignal<string | null>(initialData.value.error || null);
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
    <div class="space-y-6">
      <PageHeader title="Workflow Management" subtitle="Create and manage workflow state machines" tourId="workflows-page-header">
        {!showDesigner.value && (
          <Btn q:slot="actions" onClick$={handleCreateNew} class="flex items-center gap-2" data-tour-id="workflows-create-button">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create New Workflow
          </Btn>
        )}
      </PageHeader>

      {/* Show Designer or List */}
      {showDesigner.value ? (
        <SectionCard class="p-0 overflow-hidden" data-tour-id="workflows-designer">
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
        </SectionCard>
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
            <div data-tour-id="workflows-content">
              {workflows.value.length === 0 ? (
                <SectionCard class="p-12 text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-gray-900">No workflows</h3>
                  <p class="mt-1 text-sm text-gray-500">
                    Get started by creating a new workflow
                  </p>
                </SectionCard>
              ) : (
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour-id="workflows-grid">
                  {workflows.value.map((workflow) => (
                    <SectionCard
                      key={workflow.id}
                      class="p-0 overflow-hidden hover:shadow-md transition-shadow"
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

                        {((workflow.business_vertical_codes && workflow.business_vertical_codes.length > 0) ||
                          (workflow.metadata?.business_vertical_codes && workflow.metadata.business_vertical_codes.length > 0)) && (
                          <div class="mb-4">
                            <div class="text-xs text-gray-500 font-medium mb-2">Business Verticals</div>
                            <div class="flex flex-wrap gap-1">
                              {(workflow.business_vertical_codes || workflow.metadata?.business_vertical_codes || []).map((code) => (
                                <Badge key={code} variant="info">{code}</Badge>
                              ))}
                            </div>
                          </div>
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
                          <span class="ml-2">
                            <Badge variant="neutral">{workflow.initial_state}</Badge>
                          </span>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div class="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 rounded-b-lg">
                        <Btn
                          size="sm"
                          variant="primary"
                          onClick$={() => handleEdit(workflow)}
                        >
                          Edit
                        </Btn>
                        <Btn
                          size="sm"
                          variant="danger"
                          onClick$={() => handleDelete(workflow)}
                        >
                          Delete
                        </Btn>
                      </div>
                    </SectionCard>
                  ))}
                </div>
              )}

              {/* Summary */}
              {workflows.value.length > 0 && (
                <div class="mt-6 text-sm text-gray-600">
                  {workflows.value.length} workflow{workflows.value.length !== 1 ? 's' : ''} total
                </div>
              )}
            </div>
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
