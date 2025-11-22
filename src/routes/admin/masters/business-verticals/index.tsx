import { component$, $, useSignal } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import PermissionGuard from "~/components/auth/PermissionGuard";
import { apiClient, createSSRApiClient } from "~/services";

interface BusinessVertical {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  settings?: string;
  created_at?: string;
}

// Server-side data loader - runs on every request
export const useVerticalLoader = routeLoader$(async (requestEvent) => {
  try {
    console.log('[SSR] Fetching business verticals - token automatically extracted from cookies');

    // Create SSR-scoped API client - automatically handles cookies and baseUrl
    const api = createSSRApiClient(requestEvent);

    // Clean API call - no manual token or baseUrl handling needed!
    const response = await api.get<any>('/admin/businesses');

    console.log('[SSR] Fetched verticals:', response);
    return response;
  } catch (error) {
    console.error('[SSR] Error loading verticals:', error);
    return { verticals: [], count: 0 };
  }
});

export default component$(() => {
  console.log('🚀 Business Verticals Component Rendered');

  // Get data from routeLoader$
  const verticalsData = useVerticalLoader();
  console.log('📦 Route Loader Data:', verticalsData.value);

  // Handle different response structures: { data: [...] } or { verticals: [...] }
  const initialVerticals = verticalsData.value.data || verticalsData.value.verticals || [];
  const verticals = useSignal<BusinessVertical[]>(initialVerticals);

  // UI state
  const showCreateModal = useSignal(false);
  const editingVertical = useSignal<BusinessVertical | null>(null);
  const newVertical = useSignal<Partial<BusinessVertical>>({
    name: "",
    code: "",
    description: "",
    is_active: true,
  });
  const error = useSignal("");
  const success = useSignal("");
  const loading = useSignal(false);

  // Create business vertical
  const handleCreate = $(async () => {
    try {
      let result;
      try {
        result = await apiClient.post<any>(`/admin/businesses`, newVertical.value);
      } catch (e: any) {
        throw e;
      }

      // Handle different response structures
      let createdVertical: BusinessVertical;
      if (result.vertical) {
        // Response has {vertical: {...}}
        createdVertical = result.vertical;
      } else if (result.data) {
        // Response has {data: {...}}
        createdVertical = result.data;
        console.log('Created vertical from response.data:', createdVertical);
      } else if (result.id) {
        // Response is the vertical itself
        createdVertical = result as BusinessVertical;
        console.log('Created vertical (direct):', createdVertical);
      } else {
        console.warn('Unexpected create response structure:', result);
        // Reload all verticals to be safe
        const response = await apiClient.get<any>(`/admin/businesses`);
        verticals.value = response.data || response.verticals || response || [];
        showCreateModal.value = false;
        newVertical.value = {
          name: "",
          code: "",
          description: "",
          is_active: true,
        };
        success.value = "Business vertical created successfully";
        setTimeout(() => (success.value = ""), 3000);
        return;
      }

      verticals.value = [...verticals.value, createdVertical];
      showCreateModal.value = false;
      newVertical.value = {
        name: "",
        code: "",
        description: "",
        is_active: true,
      };
      success.value = "Business vertical created successfully";
      setTimeout(() => (success.value = ""), 3000);
    } catch (err: any) {
      console.error('Create vertical error:', err);
      console.error('Error details:', {
        message: err?.message,
        status: err?.status,
        data: err?.data
      });
      error.value = err?.message || "Failed to create business vertical";
      setTimeout(() => (error.value = ""), 5000);
    }
  });

  // Update business vertical
  const handleUpdate = $(async () => {
    if (!editingVertical.value) return;
    try {
      // Try /admin/businesses endpoint first
      let result;
      try {
        result = await apiClient.put<any>(`/admin/businesses/${editingVertical.value.id}`, editingVertical.value);
      } catch (e: any) {
        if (e.status === 404) {
          result = await apiClient.put<any>(`/admin/masters/businesses/${editingVertical.value.id}`, editingVertical.value);
        } else {
          throw e;
        }
      }

      const updatedVertical = result.vertical || result.data || result;
      const index = verticals.value.findIndex((v: BusinessVertical) => v.id === editingVertical.value!.id);
      if (index !== -1) {
        const updated = [...verticals.value];
        updated[index] = updatedVertical;
        verticals.value = updated;
      }
      showCreateModal.value = false;
      editingVertical.value = null;
      success.value = "Business vertical updated successfully";
      setTimeout(() => (success.value = ""), 3000);
    } catch (err: any) {
      console.error('Update vertical error:', err);
      error.value = err?.message || "Failed to update vertical";
      setTimeout(() => (error.value = ""), 5000);
    }
  });

  // Delete business vertical
  const handleDelete = $(async (id: string) => {
    if (!confirm("Are you sure you want to delete this business vertical?")) return;

    try {
      // Try /admin/businesses endpoint first
      try {
        await apiClient.delete(`/admin/businesses/${id}`);
      } catch (e: any) {
        if (e.status === 404) {
          await apiClient.delete(`/admin/masters/businesses/${id}`);
        } else {
          throw e;
        }
      }
      verticals.value = verticals.value.filter((v: BusinessVertical) => v.id !== id);
      success.value = "Business vertical deleted successfully";
      setTimeout(() => (success.value = ""), 3000);
    } catch (err: any) {
      console.error('Delete vertical error:', err);
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
            <span class="ml-3 text-gray-600">Loading business verticals...</span>
          </div>
        )}

        {!loading.value && (
          <>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">Business Verticals</h1>
            <p class="text-gray-600 text-sm mt-1">
              Manage your organization's business units (WATER, SOLAR, HO, etc.)
            </p>
          </div>
          <button
            class="inline-flex items-center justify-center px-4 py-2 bg-secondary-600 text-white rounded-md font-medium text-sm hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-colors border-none"
            onClick$={() => {
              showCreateModal.value = true;
              editingVertical.value = null;
            }}
          >
            + Create Business Vertical
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

        {/* Business Verticals Table */}
        <div class="bg-white border rounded-lg overflow-hidden shadow">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {verticals.value.map((vertical) => (
                <tr key={vertical.id} class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      {vertical.name}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                      {vertical.code}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-600">
                      {vertical.description}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class={`px-2 py-1 text-xs rounded ${
                        vertical.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {vertical.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm gap-1 flex">
                    <button
                      class="btn btn-primary"
                      onClick$={() => {
                        editingVertical.value = { ...vertical };
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
                      onClick$={() => handleDelete(vertical.id)}
                    >
                     <span class="flex gap-1">
                    <i class="i-heroicons-trash-solid w-4 h-4 text-white inline-block" />
                    Delete
                  </span>

                    </button>
                  </td>
                </tr>
              ))}
              {verticals.value.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    class="px-6 py-12 text-center text-gray-500"
                  >
                    No business verticals found. Create your first one to get
                    started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal.value && (
          <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
              <div class="p-6">
                <h3 class="text-lg font-semibold mb-4">
                  {editingVertical.value
                    ? "Edit Business Vertical"
                    : "Create New Business Vertical"}
                </h3>

                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={
                        editingVertical.value
                          ? editingVertical.value.name
                          : newVertical.value.name
                      }
                      onInput$={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        if (editingVertical.value) {
                          editingVertical.value = { ...editingVertical.value, name: value };
                        } else {
                          newVertical.value = { ...newVertical.value, name: value };
                        }
                      }}
                      placeholder="e.g., Water Works"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Code *
                    </label>
                    <input
                      type="text"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={
                        editingVertical.value
                          ? editingVertical.value.code
                          : newVertical.value.code
                      }
                      onInput$={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        if (editingVertical.value) {
                          editingVertical.value = { ...editingVertical.value, code: value };
                        } else {
                          newVertical.value = { ...newVertical.value, code: value };
                        }
                      }}
                      placeholder="e.g., WATER"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      Unique identifier for this vertical (uppercase)
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
                        editingVertical.value
                          ? editingVertical.value.description
                          : newVertical.value.description
                      }
                      onInput$={(e) => {
                        const value = (e.target as HTMLTextAreaElement).value;
                        if (editingVertical.value) {
                          editingVertical.value = { ...editingVertical.value, description: value };
                        } else {
                          newVertical.value = { ...newVertical.value, description: value };
                        }
                      }}
                      placeholder="Describe this business vertical..."
                    />
                  </div>

                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active_vertical"
                      class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      checked={
                        editingVertical.value
                          ? editingVertical.value.is_active
                          : newVertical.value.is_active
                      }
                      onChange$={(e) => {
                        const checked = (e.target as HTMLInputElement).checked;
                        if (editingVertical.value) {
                          editingVertical.value = { ...editingVertical.value, is_active: checked };
                        } else {
                          newVertical.value = { ...newVertical.value, is_active: checked };
                        }
                      }}
                    />
                    <label
                      for="is_active_vertical"
                      class="ml-2 text-sm text-gray-700"
                    >
                      Active
                    </label>
                  </div>
                </div>

                <div class="flex justify-end gap-3 mt-6">
                  <button
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    onClick$={() => {
                      showCreateModal.value = false;
                      editingVertical.value = null;
                      newVertical.value = {
                        name: "",
                        code: "",
                        description: "",
                        is_active: true,
                      };
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    onClick$={editingVertical.value ? handleUpdate : handleCreate}
                  >
                    {editingVertical.value ? "Update" : "Create"}
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
