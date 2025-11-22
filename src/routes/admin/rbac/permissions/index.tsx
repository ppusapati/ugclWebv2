import { component$, useStore, $ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
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
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-dark-800">Manage Permissions</h2>
          <p class="text-dark-600 text-sm mt-1">
            Define granular access controls for the system
          </p>
        </div>
        <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick$={() => {
              state.showCreateModal = true;
              state.editingPermission = null;
            }}
          >
            + Create Permission
          </button>
        </div>

        {/* Success/Error Messages */}
        {state.success && (
          <div class="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {state.success}
          </div>
        )}
        {state.error && (
          <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {state.error}
          </div>
        )}

        {/* Filters */}
        <div class="bg-white border rounded-lg p-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by name or description..."
                value={state.searchTerm}
                onInput$={(e) => {
                  state.searchTerm = (e.target as HTMLInputElement).value;
                }}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Filter by Resource
              </label>
              <select
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        </div>

        {/* Permissions Grouped by Resource */}
        <div class="space-y-6">
          {Object.entries(groupedPermissions).map(([resource, permissions]) => (
            <div key={resource} class="bg-white border rounded-lg overflow-hidden shadow">
              <div class="px-6 py-3 bg-gray-50 border-b">
                <h3 class="text-lg font-semibold capitalize">{resource}</h3>
                <p class="text-sm text-gray-600">
                  {permissions.length} permission{permissions.length !== 1 ? "s" : ""}
                </p>
              </div>
              <table class="w-full">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {permissions.map((permission) => (
                    <tr key={permission.id} class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <code class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {permission.name}
                        </code>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                          {permission.action}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm text-gray-600">
                          {permission.description}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          class="text-blue-600 hover:text-blue-900 mr-4"
                          onClick$={() => {
                            state.editingPermission = { ...permission };
                            state.showCreateModal = true;
                          }}
                        >
                          Edit
                        </button>
                        <button
                          class="text-red-600 hover:text-red-900"
                          onClick$={() =>
                            handleDelete(permission.id, permission.name)
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {Object.keys(groupedPermissions).length === 0 && (
            <div class="bg-white border rounded-lg p-12 text-center text-gray-500">
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
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Resource *
                    </label>
                    <input
                      type="text"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={
                        state.editingPermission
                          ? state.editingPermission.resource
                          : state.newPermission.resource
                      }
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
                    <p class="text-xs text-gray-500 mt-1">
                      The resource this permission applies to. Use '*' for all resources (wildcard)
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Action *
                    </label>
                    <select
                      value={state.editingPermission ? state.editingPermission.action : state.newPermission.action}
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
                    <p class="text-xs text-gray-500 mt-1">
                      The action allowed. Use '*' for all actions (wildcard)
                    </p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Permission Name (auto-generated)
                    </label>
                    <input
                      type="text"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                      value={
                        state.editingPermission
                          ? state.editingPermission.name
                          : `${state.newPermission.resource}:${state.newPermission.action}`
                      }
                      disabled
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      Format: resource:action
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
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
                  </div>
                </div>

                <div class="flex justify-end gap-3 mt-6">
                  <button
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
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
                  </button>
                  <button
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    onClick$={
                      state.editingPermission ? handleUpdate : handleCreate
                    }
                  >
                    {state.editingPermission ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
});
