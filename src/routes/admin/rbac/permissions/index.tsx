import { component$, useStore, $ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import {
  Badge,
  Btn,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  FormField,
  PageHeader,
  SectionCard,
} from "~/components/ds";
import { apiClient, createSSRApiClient } from "~/services";

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  created_at?: string;
}

// Load permissions with SSR
export const usePermissions = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const permissions = await ssrApiClient.get<Permission[]>('/admin/permissions');
    return permissions || [];
  } catch (error: any) {
    console.error('Failed to load permissions:', error);
    return [];
  }
});

export default component$(() => {
  const permissionsData = usePermissions();

  const state = useStore({
    permissions: permissionsData.value,
    showCreateModal: false,
    editingPermission: null as Permission | null,
    newPermission: {
      name: "",
      description: "",
      resource: "",
      action: "",
    },
    searchTerm: "",
    selectedResource: "",
    error: "",
    success: "",
  });

  // Create permission
  const handleCreate = $(async () => {
    // Generate permission name from resource and action
    const generatedName = `${state.newPermission.resource}:${state.newPermission.action}`;

    try {
      const created = await apiClient.post<Permission>('/admin/permissions', {
        ...state.newPermission,
        name: generatedName,
      });

      state.permissions.push(created);
      state.showCreateModal = false;
      state.newPermission = {
        name: "",
        description: "",
        resource: "",
        action: "",
      };
      state.success = "Permission created successfully";
      setTimeout(() => (state.success = ""), 3000);
    } catch (error: any) {
      console.error("Failed to create permission:", error);
      state.error = error.message || "Failed to create permission";
    }
  });

  // Update permission
  const handleUpdate = $(async () => {
    if (!state.editingPermission) return;

    try {
      const updated = await apiClient.put<Permission>(
        `/admin/permissions/${state.editingPermission.id}`,
        state.editingPermission
      );

      const index = state.permissions.findIndex(
        (p) => p.id === state.editingPermission!.id
      );
      if (index !== -1) {
        state.permissions[index] = updated;
      }
      state.showCreateModal = false;
      state.editingPermission = null;
      state.success = "Permission updated successfully";
      setTimeout(() => (state.success = ""), 3000);
    } catch (error: any) {
      console.error("Failed to update permission:", error);
      state.error = error.message || "Failed to update permission";
    }
  });

  // Delete permission
  const handleDelete = $(async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete permission "${name}"?`))
      return;

    try {
      await apiClient.delete<{ message: string }>(`/admin/permissions/${id}`);

      state.permissions = state.permissions.filter((p) => p.id !== id);
      state.success = "Permission deleted successfully";
      setTimeout(() => (state.success = ""), 3000);
    } catch (error: any) {
      console.error("Failed to delete permission:", error);
      state.error = error.message || "Failed to delete permission. It may be in use by roles.";
    }
  });

  // Filter permissions
  const filteredPermissions = state.permissions.filter((p) => {
    const matchesSearch =
      !state.searchTerm ||
      p.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(state.searchTerm.toLowerCase());

    const matchesResource =
      !state.selectedResource || p.resource === state.selectedResource;

    return matchesSearch && matchesResource;
  });

  // Group permissions by resource
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Get unique resources for filter dropdown
  const uniqueResources = [
    ...new Set(state.permissions.map((p) => p.resource)),
  ].sort();

  return (
    <div class="space-y-6">
      <PageHeader title="Manage Permissions" subtitle="Define granular access controls for the system">
        <Btn
          q:slot="actions"
          onClick$={() => {
            state.showCreateModal = true;
            state.editingPermission = null;
          }}
        >
          + Create Permission
        </Btn>
      </PageHeader>

        {/* Success/Error Messages */}
        {state.success && (
          <div class="rounded-lg border border-color-semantic-success-300 bg-color-semantic-success-100 px-4 py-3 text-sm text-color-semantic-success-700">
            {state.success}
          </div>
        )}
        {state.error && (
          <div class="rounded-lg border border-color-semantic-error-300 bg-color-semantic-error-100 px-4 py-3 text-sm text-color-semantic-error-700">
            {state.error}
          </div>
        )}

        {/* Filters */}
        <SectionCard title="Filters" subtitle="Search permissions by name, description, or resource.">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="mb-2 block text-sm font-medium text-color-text-secondary">
                Search
              </label>
              <input
                type="text"
                class="w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-3 py-2 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none"
                placeholder="Search by name or description..."
                value={state.searchTerm}
                onInput$={(e) => {
                  state.searchTerm = (e.target as HTMLInputElement).value;
                }}
              />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-color-text-secondary">
                Filter by Resource
              </label>
              <select
                class="w-full rounded-lg border border-color-border-primary bg-color-surface-primary px-3 py-2 text-sm text-color-text-primary focus:border-color-interactive-primary focus:outline-none"
                value={state.selectedResource}
                onChange$={(e) => {
                  state.selectedResource = (e.target as HTMLSelectElement).value;
                }}
              >
                <option value="">All Resources</option>
                {uniqueResources.map((resource) => (
                  <option key={resource} value={resource}>
                    {resource}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Permissions Grouped by Resource */}
        <div class="space-y-6">
          {Object.entries(groupedPermissions).map(([resource, permissions]) => (
            <SectionCard key={resource} title={resource} subtitle={`${permissions.length} permission${permissions.length !== 1 ? "s" : ""}`} class="overflow-hidden">
              <div class="mb-4 flex items-center justify-between gap-3 border-b border-color-border-primary px-6 py-4">
                <div>
                  <h3 class="text-lg font-semibold capitalize text-color-text-primary">{resource}</h3>
                  <p class="text-sm text-color-text-secondary">
                  {permissions.length} permission{permissions.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <DataTable class="rounded-none border-0 bg-transparent">
                <DataTableHead>
                  <tr>
                    <DataTableHeaderCell>Name</DataTableHeaderCell>
                    <DataTableHeaderCell>Action</DataTableHeaderCell>
                    <DataTableHeaderCell>Description</DataTableHeaderCell>
                    <DataTableHeaderCell>Actions</DataTableHeaderCell>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {permissions.map((permission) => (
                    <DataTableRow key={permission.id}>
                      <DataTableCell class="whitespace-nowrap">
                        <code class="rounded bg-color-surface-secondary px-2 py-1 text-sm font-mono text-color-text-primary">
                          {permission.name}
                        </code>
                      </DataTableCell>
                      <DataTableCell class="whitespace-nowrap">
                        <Badge variant="info">{permission.action}</Badge>
                      </DataTableCell>
                      <DataTableCell>
                        <div class="text-sm text-color-text-secondary">
                          {permission.description}
                        </div>
                      </DataTableCell>
                      <DataTableCell class="whitespace-nowrap">
                        <div class="flex gap-2">
                          <Btn
                            size="sm"
                            variant="primary"
                            onClick$={() => {
                              state.editingPermission = { ...permission };
                              state.showCreateModal = true;
                            }}
                          >
                            Edit
                          </Btn>
                          <Btn
                            size="sm"
                            variant="danger"
                            onClick$={() =>
                              handleDelete(permission.id, permission.name)
                            }
                          >
                            Delete
                          </Btn>
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </SectionCard>
          ))}

          {Object.keys(groupedPermissions).length === 0 && (
            <div class="rounded-xl border border-color-border-primary bg-color-surface-primary p-12 text-center text-color-text-tertiary">
              No permissions found.
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {state.showCreateModal && (
          <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
              <div class="p-6">
                <h3 class="text-lg font-semibold mb-4">
                  {state.editingPermission
                    ? "Edit Permission"
                    : "Create Permission"}
                </h3>

                <div class="space-y-4">
                  <FormField id="perm-resource" label="Resource" required hint="The resource this permission applies to. Use '*' for all resources (wildcard)">
                    <input
                      id="perm-resource"
                      type="text"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={
                        state.editingPermission
                          ? state.editingPermission.resource
                          : state.newPermission.resource
                      }
                      required
                      aria-required="true"
                      aria-describedby="perm-resource-hint"
                      onInput$={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        if (state.editingPermission) {
                          state.editingPermission.resource = value;
                          state.editingPermission.name = `${value}:${state.editingPermission.action}`;
                        } else {
                          state.newPermission.resource = value;
                        }
                      }}
                      placeholder="e.g., project, user, report, or * for all"
                    />
                  </FormField>

                  <FormField id="perm-action" label="Action" required hint="The action allowed. Use '*' for all actions (wildcard)">
                    <select
                      id="perm-action"
                      value={state.editingPermission ? state.editingPermission.action : state.newPermission.action}
                      required
                      aria-required="true"
                      aria-describedby="perm-action-hint"
                      onChange$={(e) => {
                        const value = (e.target as HTMLSelectElement).value;
                        if (state.editingPermission) {
                          state.editingPermission.action = value;
                          state.editingPermission.name = `${state.editingPermission.resource}:${value}`;
                        } else {
                          state.newPermission.action = value;
                        }
                      }}
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select action</option>
                      <option value="*">* (All Actions - Wildcard)</option>
                      <option value="read">Read</option>
                      <option value="create">Create</option>
                      <option value="update">Update</option>
                      <option value="delete">Delete</option>
                      <option value="manage">Manage</option>
                    </select>
                  </FormField>
                  <FormField id="perm-name" label="Permission Name (auto-generated)" hint="Format: resource:action">
                    <input
                      id="perm-name"
                      type="text"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                      value={
                        state.editingPermission
                          ? state.editingPermission.name
                          : `${state.newPermission.resource}:${state.newPermission.action}`
                      }
                      aria-describedby="perm-name-hint"
                      disabled
                    />
                  </FormField>

                  <FormField id="perm-description" label="Description">
                    <textarea
                      id="perm-description"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      value={
                        state.editingPermission
                          ? state.editingPermission.description
                          : state.newPermission.description
                      }
                      onInput$={(e) => {
                        const value = (e.target as HTMLTextAreaElement).value;
                        if (state.editingPermission) {
                          state.editingPermission.description = value;
                        } else {
                          state.newPermission.description = value;
                        }
                      }}
                      placeholder="Describe what this permission allows..."
                    />
                  </FormField>
                </div>

                <div class="flex justify-end gap-3 mt-6">
                  <Btn
                    variant="secondary"
                    onClick$={() => {
                      state.showCreateModal = false;
                      state.editingPermission = null;
                      state.newPermission = {
                        name: "",
                        description: "",
                        resource: "",
                        action: "",
                      };
                    }}
                  >
                    Cancel
                  </Btn>
                  <Btn
                    onClick$={
                      state.editingPermission ? handleUpdate : handleCreate
                    }
                  >
                    {state.editingPermission ? "Update" : "Create"}
                  </Btn>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
});
