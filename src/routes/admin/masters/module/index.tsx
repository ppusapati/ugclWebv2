import { component$, useSignal, $ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import PermissionGuard from "~/components/auth/PermissionGuard";
import { createSSRApiClient, apiClient } from "~/services";

interface Module {
  id: string;
  name: string;
  code: string;
  description: string;
  icon?: string;
  order?: number;
  is_active: boolean;
  schema_name?: string; // Database schema for form tables within this module
  created_at?: string;
}

// Server-side data loader - runs on every request
export const useModulesLoader = routeLoader$(async (requestEvent) => {
  try {
    console.log('[SSR] Fetching modules - token automatically extracted from cookies');

    // Create SSR-scoped API client - automatically handles cookies and baseUrl
    const api = createSSRApiClient(requestEvent);

    // Clean API call - no manual token or baseUrl handling needed!
    const response = await api.get<any>('/modules');

    console.log('[SSR] Fetched modules:', response);
    return response;
  } catch (error) {
    console.error('[SSR] Error loading modules:', error);
    return { modules: [], count: 0 };
  }
});

export default component$(() => {
  console.log('🚀 Module Component Rendered');

  // Get data from routeLoader$
  const modulesData = useModulesLoader();
  console.log('📦 Route Loader Data:', modulesData.value);

  const modules = useSignal<Module[]>(modulesData.value.modules || []);

  // UI state
  const showCreateModal = useSignal(false);
  const editingModule = useSignal<Module | null>(null);
  const newModule = useSignal<Partial<Module>>({
    name: "",
    code: "",
    description: "",
    icon: "",
    order: 0,
    is_active: true,
  });
  const error = useSignal("");
  const success = useSignal("");
  const loading = useSignal(false);

  // Create module
  const handleCreateModule = $(async () => {
    try {
      // Try /modules endpoint first
      const result = await apiClient.post<any>(`/admin/masters/modules`, newModule.value);
      

      // Handle different response structures
      let createdModule: Module;
      if (result.module) {
        // Response has {module: {...}}
        createdModule = result.module;
      } else if (result.data) {
        // Response has {data: {...}}
        createdModule = result.data;
        console.log('Created module from response.data:', createdModule);
      } else if (result.id) {
        // Response is the module itself
        createdModule = result as Module;
        console.log('Created module (direct):', createdModule);
      } else {
        console.warn('Unexpected create response structure:', result);
        // Reload all modules to be safe
        try {
          const response = await apiClient.get<any>(`/modules`);
          modules.value = response.modules || response.data || response || [];
        } catch {
          const response = await apiClient.get<any>(`/admin/masters/modules`);
          modules.value = response.modules || response.data || response || [];
        }
        showCreateModal.value = false;
        newModule.value = {
          name: "",
          code: "",
          description: "",
          icon: "",
          order: 0,
          is_active: true,
        };
        success.value = "Module created successfully";
        setTimeout(() => (success.value = ""), 3000);
        return;
      }

      modules.value = [...modules.value, createdModule];
      showCreateModal.value = false;
      newModule.value = {
        name: "",
        code: "",
        description: "",
        icon: "",
        order: 0,
        is_active: true,
      };
      success.value = "Module created successfully";
      setTimeout(() => (success.value = ""), 3000);
    } catch (err: any) {
      console.error('Create module error:', err);
      console.error('Error details:', {
        message: err?.message,
        status: err?.status,
        data: err?.data
      });
      error.value = err?.message || "Failed to create module";
      setTimeout(() => (error.value = ""), 5000);
    }
  });

  // Update module
  const handleUpdateModule = $(async () => {
    if (!editingModule.value) return;
    try {
      // Try /modules endpoint first
      let result;
      try {
        result = await apiClient.put<any>(`/modules/${editingModule.value.id}`, editingModule.value);
      } catch (e: any) {
        if (e.status === 404) {
          result = await apiClient.put<any>(`/admin/masters/modules/${editingModule.value.id}`, editingModule.value);
        } else {
          throw e;
        }
      }

      const updatedModule = result.module || result.data || result;
      const index = modules.value.findIndex((m: Module) => m.id === editingModule.value!.id);
      if (index !== -1) {
        const updated = [...modules.value];
        updated[index] = updatedModule;
        modules.value = updated;
      }
      showCreateModal.value = false;
      editingModule.value = null;
      success.value = "Module updated successfully";
      setTimeout(() => (success.value = ""), 3000);
    } catch (err: any) {
      console.error('Update module error:', err);
      error.value = err?.message || "Failed to update module";
      setTimeout(() => (error.value = ""), 5000);
    }
  });

  // Delete module
  const handleDeleteModule = $(async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;

    try {
      // Try /modules endpoint first
      try {
        await apiClient.delete(`/modules/${moduleId}`);
      } catch (e: any) {
        if (e.status === 404) {
          await apiClient.delete(`/admin/masters/modules/${moduleId}`);
        } else {
          throw e;
        }
      }
      modules.value = modules.value.filter((m: Module) => m.id !== moduleId);
      success.value = "Module deleted successfully";
      setTimeout(() => (success.value = ""), 3000);
    } catch (err: any) {
      console.error('Delete module error:', err);
      error.value = err?.message || "Network error occurred";
      setTimeout(() => (error.value = ""), 5000);
    }
  });

  return (
    <PermissionGuard
      superAdminOnly
      fallback={
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center p-8">
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p class="text-gray-600">You need super admin privileges to access this page.</p>
          </div>
        </div>
      }
    >
      <div class="space-y-6 p-6">
        {/* Loading indicator */}
        {loading.value && (
          <div class="flex items-center justify-center p-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">Loading modules...</span>
          </div>
        )}

        {!loading.value && (
          <>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">Module Master</h1>
          <button
            class="btn btn-secondary"
            onClick$={() => {
              showCreateModal.value = true;
              editingModule.value = null;
            }}
          >
            + Create Module
          </button>
        </div>

        {/* Success/Error Messages */}
        {success.value && (
          <div class="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success.value}
          </div>
        )}
        {error.value && (
          <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error.value}
          </div>
        )}

        {/* Modules Grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.value.map((module: Module) => (
            <div
              key={module.id}
              class="bg-white border rounded-lg p-6 shadow-sm border-none hover:shadow-md transition-shadow"
            >
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    {module.icon && (
                      <span class="text-2xl">
                        {module.icon.startsWith('i-') ? (
                          <i class={`${module.icon} w-6 h-6 inline-block`} />
                        ) : (
                          <span>{module.icon}</span>
                        )}
                      </span>
                    )}
                    <h3 class="text-lg font-semibold">{module.name}</h3>
                  </div>
                  <p class="text-sm text-gray-500 mt-1">
                    Code: {module.code}
                  </p>
                </div>
                <span
                  class={`px-2 py-1 text-xs rounded ${
                    module.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {module.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <p class="text-sm text-gray-600 mb-2">{module.description}</p>
              {module.schema_name && (
                <p class="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mb-4 font-mono">
                  DB Schema: {module.schema_name}
                </p>
              )}

              <div class="flex gap-2">
                <button
                  class="btn btn-primary"
                  onClick$={() => {
                    editingModule.value = { ...module };
                    showCreateModal.value = true;
                  }}
                >
                  <span class="flex items-center gap-1">
                    <i class="i-heroicons-pencil-square-solid w-4 h-4 inline-block text-white" />
                    Edit
                  </span>
                </button>
                <button
                  class="btn btn-danger"
                  onClick$={() => handleDeleteModule(module.id)}
                >
                  <span class="flex gap-1">
                    <i class="i-heroicons-trash-solid w-4 h-4 text-white inline-block" />
                    Delete
                  </span>
                </button>
              </div>
            </div>
          ))}

          {modules.value.length === 0 && (
            <div class="col-span-full text-center py-12 text-gray-500">
              No modules found. Create your first module to get started.
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal.value && (
          <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
              <div class="p-6">
                <h3 class="text-lg font-semibold mb-4">
                  {editingModule.value ? "Edit Module" : "Create New Module"}
                </h3>

                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Module Name *
                    </label>
                    <input
                      type="text"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={
                        editingModule.value
                          ? editingModule.value.name
                          : newModule.value.name
                      }
                      onInput$={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        if (editingModule.value) {
                          editingModule.value = { ...editingModule.value, name: value };
                        } else {
                          newModule.value = { ...newModule.value, name: value };
                        }
                      }}
                      placeholder="e.g., Water Management"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Module Code *
                    </label>
                    <input
                      type="text"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={
                        editingModule.value
                          ? editingModule.value.code
                          : newModule.value.code
                      }
                      onInput$={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        if (editingModule.value) {
                          editingModule.value = { ...editingModule.value, code: value };
                        } else {
                          newModule.value = { ...newModule.value, code: value };
                        }
                      }}
                      placeholder="e.g., WATER_MGMT"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      value={
                        editingModule.value
                          ? editingModule.value.description
                          : newModule.value.description
                      }
                      onInput$={(e) => {
                        const value = (e.target as HTMLTextAreaElement).value;
                        if (editingModule.value) {
                          editingModule.value = { ...editingModule.value, description: value };
                        } else {
                          newModule.value = { ...newModule.value, description: value };
                        }
                      }}
                      placeholder="Describe the module..."
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Icon (emoji)
                      </label>
                      <input
                        type="text"
                        class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={
                          editingModule.value
                            ? editingModule.value.icon || ""
                            : newModule.value.icon
                        }
                        onInput$={(e) => {
                          const value = (e.target as HTMLInputElement).value;
                          if (editingModule.value) {
                            editingModule.value = { ...editingModule.value, icon: value };
                          } else {
                            newModule.value = { ...newModule.value, icon: value };
                          }
                        }}
                        placeholder="💧"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={
                          editingModule.value
                            ? editingModule.value.order || 0
                            : newModule.value.order
                        }
                        onInput$={(e) => {
                          const value = parseInt(
                            (e.target as HTMLInputElement).value
                          );
                          if (editingModule.value) {
                            editingModule.value = { ...editingModule.value, order: value };
                          } else {
                            newModule.value = { ...newModule.value, order: value };
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      checked={
                        editingModule.value
                          ? editingModule.value.is_active
                          : newModule.value.is_active
                      }
                      onChange$={(e) => {
                        const checked = (e.target as HTMLInputElement).checked;
                        if (editingModule.value) {
                          editingModule.value = { ...editingModule.value, is_active: checked };
                        } else {
                          newModule.value = { ...newModule.value, is_active: checked };
                        }
                      }}
                    />
                    <label for="is_active" class="ml-2 text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                </div>

                <div class="flex justify-end gap-3 mt-6">
                  <button
                    class="btn bg-gray-200 text-gray-700 hover:bg-gray-300"
                    onClick$={() => {
                      showCreateModal.value = false;
                      editingModule.value = null;
                      newModule.value = {
                        id: "",
                        name: "",
                        code: "",
                        description: "",
                        icon: "",
                        order: 0,
                        is_active: true,
                      };
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    class="btn btn-primary"
                    onClick$={
                      editingModule.value
                        ? handleUpdateModule
                        : handleCreateModule
                    }
                  >
                    {editingModule.value ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </PermissionGuard>
  );
});
