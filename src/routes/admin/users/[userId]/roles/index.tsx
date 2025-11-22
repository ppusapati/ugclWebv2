import { component$, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { useLocation, useNavigate, routeLoader$ } from "@builder.io/qwik-city";
import PermissionGuard from "~/components/auth/PermissionGuard";
import { apiClient, createSSRApiClient } from "~/services";

interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  is_global: boolean;
}

interface BusinessVertical {
  id: string;
  name: string;
  code: string;
}

interface BusinessRole {
  id: string;
  name: string;
  description: string;
  level: number;
  business_vertical_id: string;
}

interface UserBusinessRole {
  id: string;
  user_id: string;
  business_role_id: string;
  business_vertical_id: string;
  assigned_at: string;
  business_role?: BusinessRole;
  vertical_name?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role_id?: string;
  global_role?: string;
  business_roles?: UserBusinessRole[];
}

// Load user and role data with SSR support
export const useUserRolesData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  const userId = requestEvent.params.userId;

  try {
    const [userData, rolesData, verticalsData] = await Promise.all([
      ssrApiClient.get<any>(`/admin/users/${userId}`),
      ssrApiClient.get<any>('/admin/roles'),
      ssrApiClient.get<any>('/admin/businesses'),
    ]);

    return {
      user: userData.user || userData,
      globalRoles: rolesData.data || rolesData.roles || [],
      businessVerticals: verticalsData.businesses || verticalsData.data || [],
    };
  } catch (error: any) {
    console.error('Failed to load user roles data:', error);
    return {
      user: null,
      globalRoles: [],
      businessVerticals: [],
    };
  }
});

export default component$(() => {
  const location = useLocation();
  const nav = useNavigate();
  const userId = location.params.userId;
  const initialData = useUserRolesData();

  const state = useStore({
    user: initialData.value.user as User | null,
    globalRoles: initialData.value.globalRoles as Role[],
    businessVerticals: initialData.value.businessVerticals as BusinessVertical[],
    businessRoles: [] as BusinessRole[],
    userBusinessRoles: (initialData.value.user?.business_roles || []) as UserBusinessRole[],
    showAssignModal: false,
    selectedVertical: "",
    selectedBusinessRole: "",
    error: "",
    success: "",
  });

  // Load business roles when vertical is selected
  useVisibleTask$(({ track }) => {
    track(() => state.selectedVertical);

    const loadBusinessRoles = async () => {
      if (!state.selectedVertical) {
        state.businessRoles = [];
        return;
      }

      try {
        const vertical = state.businessVerticals.find(
          (v) => v.id === state.selectedVertical
        );
        if (!vertical) return;

        const data = await apiClient.get<any>(`/business/${vertical.code}/roles`);
        state.businessRoles = data.roles || data.data || [];
      } catch (error) {
        console.error("Failed to load business roles:", error);
      }
    };

    if (state.selectedVertical) {
      loadBusinessRoles();
    }
  });

  // Update global role
  const handleUpdateGlobalRole = $(async (roleId: string) => {
    try {
      const updated = await apiClient.put<any>(`/admin/users/${userId}`, {
        ...state.user,
        role_id: roleId,
      });

      state.user = updated.user || updated;
      state.success = "Global role updated successfully";
      setTimeout(() => (state.success = ""), 3000);
    } catch (error: any) {
      state.error = error.message || "Failed to update global role";
    }
  });

  // Assign business role
  const handleAssignBusinessRole = $(async () => {
    if (!state.selectedBusinessRole || !state.selectedVertical) {
      state.error = "Please select both vertical and role";
      return;
    }

    try {
      const assigned = await apiClient.post<any>(`/users/${userId}/roles/assign`, {
        business_role_id: state.selectedBusinessRole,
        business_vertical_id: state.selectedVertical,
      });

      state.userBusinessRoles.push(assigned);
      state.showAssignModal = false;
      state.selectedVertical = "";
      state.selectedBusinessRole = "";
      state.success = "Business role assigned successfully";
      setTimeout(() => (state.success = ""), 3000);

      // Reload user data
      const userData = await apiClient.get<any>(`/admin/users/${userId}`);
      state.user = userData.user || userData;
      state.userBusinessRoles = state.user?.business_roles || [];
    } catch (error: any) {
      state.error = error.message || "Failed to assign business role";
    }
  });

  // Remove business role
  const handleRemoveBusinessRole = $(async (roleAssignmentId: string) => {
    if (!confirm("Are you sure you want to remove this business role?"))
      return;

    try {
      await apiClient.delete<any>(`/users/${userId}/roles/${roleAssignmentId}`);

      state.userBusinessRoles = state.userBusinessRoles.filter(
        (r) => r.id !== roleAssignmentId
      );
      state.success = "Business role removed successfully";
      setTimeout(() => (state.success = ""), 3000);
    } catch (error: any) {
      state.error = error.message || "Failed to remove business role";
    }
  });

  if (!state.user) {
    return (
      <PermissionGuard superAdminOnly>
        <div class="p-6">
          <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            User not found
          </div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard superAdminOnly>
      <div class="space-y-6 p-6">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <button
              class="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
              onClick$={() => nav("/admin/users")}
            >
              ← Back to Users
            </button>
            <h1 class="text-2xl font-bold">Role Assignment</h1>
            <p class="text-gray-600 text-sm mt-1">
              Managing roles for: <strong>{state.user.name}</strong> (
              {state.user.email})
            </p>
          </div>
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

        {/* Global Role Section */}
        <div class="bg-white border rounded-lg p-6 shadow">
          <h2 class="text-lg font-semibold mb-4">Global Role</h2>
          <div class="max-w-md">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Assign Global Role
            </label>
            <select
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={state.user.role_id || ""}
              onChange$={(e) => {
                const roleId = (e.target as HTMLSelectElement).value;
                handleUpdateGlobalRole(roleId);
              }}
            >
              <option value="">No Global Role</option>
              {state.globalRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {`${role.name} (Level ${role.level})`}
                </option>
              ))}
            </select>
            {state.user.global_role && (
              <p class="text-sm text-gray-600 mt-2">
                Current: <strong>{state.user.global_role}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Business Roles Section */}
        <div class="bg-white border rounded-lg shadow">
          <div class="px-6 py-4 border-b flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">Business Role Assignments</h2>
              <p class="text-sm text-gray-600 mt-1">
                Vertical-specific roles for this user
              </p>
            </div>
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              onClick$={() => {
                state.showAssignModal = true;
              }}
            >
              + Assign Business Role
            </button>
          </div>

          {state.userBusinessRoles.length > 0 ? (
            <table class="w-full">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vertical
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned At
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {state.userBusinessRoles.map((assignment) => (
                  <tr key={assignment.id} class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                        {assignment.vertical_name ||
                          state.businessVerticals.find(
                            (v) => v.id === assignment.business_vertical_id
                          )?.name ||
                          "Unknown"}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">
                        {assignment.business_role?.name || "Unknown Role"}
                      </div>
                      {assignment.business_role?.description && (
                        <div class="text-xs text-gray-500">
                          {assignment.business_role.description}
                        </div>
                      )}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">
                        Level {assignment.business_role?.level || "N/A"}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-600">
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        class="text-red-600 hover:text-red-900"
                        onClick$={() => handleRemoveBusinessRole(assignment.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div class="p-12 text-center text-gray-500">
              No business roles assigned yet.
            </div>
          )}
        </div>

        {/* Assign Business Role Modal */}
        {state.showAssignModal && (
          <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
              <div class="p-6">
                <h3 class="text-lg font-semibold mb-4">
                  Assign Business Role
                </h3>

                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Business Vertical *
                    </label>
                    <select
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={state.selectedVertical}
                      onChange$={(e) => {
                        state.selectedVertical = (
                          e.target as HTMLSelectElement
                        ).value;
                        state.selectedBusinessRole = "";
                      }}
                    >
                      <option value="">Select a vertical</option>
                      {state.businessVerticals.map((vertical) => (
                        <option key={vertical.id} value={vertical.id}>
                          {vertical.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {state.selectedVertical && (
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Business Role *
                      </label>
                      <select
                        class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={state.selectedBusinessRole}
                        onChange$={(e) => {
                          state.selectedBusinessRole = (
                            e.target as HTMLSelectElement
                          ).value;
                        }}
                      >
                        <option value="">Select a role</option>
                        {state.businessRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {`${role.name} (Level ${role.level})`}
                          </option>
                        ))}
                      </select>
                      {state.businessRoles.length === 0 && (
                        <p class="text-xs text-gray-500 mt-2">
                          No roles available for this vertical
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div class="flex justify-end gap-3 mt-6">
                  <button
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    onClick$={() => {
                      state.showAssignModal = false;
                      state.selectedVertical = "";
                      state.selectedBusinessRole = "";
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={
                      !state.selectedVertical || !state.selectedBusinessRole
                    }
                    onClick$={handleAssignBusinessRole}
                  >
                    Assign Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
});
