import { component$, useStore, $ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import PermissionGuard from "~/components/auth/PermissionGuard";
import { apiClient, createSSRApiClient } from "~/services";
import { P9ETable, type ActionButton } from "~/components/table";

interface Role {
  id: string;
  name: string;
  level: number;
}

interface BusinessRole {
  id: string;
  name: string;
  business_vertical_name?: string;
}

interface BusinessVertical {
  id: string;
  name: string;
  code: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role_id?: string;
  global_role?: string;
  business_vertical_id?: string;
  business_vertical_name?: string;
  is_active: boolean;
  created_at?: string;
  business_roles?: BusinessRole[];
}

export const useUsersData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const [usersResponse, rolesData, verticalsData] = await Promise.all([
      ssrApiClient.get<any>("/admin/users", { page: 1, limit: 1000 }),
      ssrApiClient.get<any>("/admin/roles"),
      ssrApiClient.get<any>("/admin/businesses"),
    ]);

    const users = usersResponse?.data || usersResponse?.users || usersResponse || [];
    const roles = rolesData?.data || rolesData?.roles || rolesData || [];
    const verticals = verticalsData?.businesses || verticalsData?.data || verticalsData || [];

    return {
      users: Array.isArray(users) ? users : [],
      roles: Array.isArray(roles) ? roles : [],
      verticals: Array.isArray(verticals) ? verticals : [],
      error: "",
    };
  } catch (error: any) {
    return {
      users: [],
      roles: [],
      verticals: [],
      error: error.message || "Failed to load data",
    };
  }
});

export default component$(() => {
  const initialData = useUsersData();

  const state = useStore({
    users: initialData.value.users as User[],
    roles: initialData.value.roles as Role[],
    verticals: initialData.value.verticals as BusinessVertical[],
    loadingError: (initialData.value as any).error || "",
    showCreateModal: false,
    showDetailsModal: false,
    editingUser: null as User | null,
    viewingUser: null as User | null,
    newUser: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role_id: "",
      business_vertical_id: "",
      is_active: true,
    },
    searchTerm: "",
    selectedRole: "",
    selectedVertical: "",
    error: "",
    success: "",
  });

  const resetForm = $(() => {
    state.showCreateModal = false;
    state.editingUser = null;
    state.newUser = {
      name: "",
      email: "",
      phone: "",
      password: "",
      role_id: "",
      business_vertical_id: "",
      is_active: true,
    };
  });

  const handleCreate = $(async () => {
    try {
      const created = await apiClient.post<any>("/register", state.newUser);
      state.users.push(created.user || created);
      state.success = "User created successfully";
      await resetForm();
    } catch (error: any) {
      state.error = error.message || "Failed to create user";
    }
  });

  const handleUpdate = $(async () => {
    if (!state.editingUser) return;

    try {
      const updated = await apiClient.put<any>(`/admin/users/${state.editingUser.id}`, {
        name: state.editingUser.name,
        email: state.editingUser.email,
        phone: state.editingUser.phone,
        role_id: state.editingUser.role_id,
        business_vertical_id: state.editingUser.business_vertical_id,
        is_active: state.editingUser.is_active,
      });

      const index = state.users.findIndex((u) => u.id === state.editingUser!.id);
      if (index !== -1) state.users[index] = updated.user || updated;

      state.success = "User updated successfully";
      await resetForm();
    } catch (error: any) {
      state.error = error.message || "Failed to update user";
    }
  });

  const handleToggleActive = $(async (userId: string, currentStatus: boolean) => {
    try {
      const user = state.users.find((u) => u.id === userId);
      if (!user) return;

      const updated = await apiClient.put<any>(`/admin/users/${userId}`, {
        ...user,
        is_active: !currentStatus,
      });

      const index = state.users.findIndex((u) => u.id === userId);
      if (index !== -1) state.users[index] = updated.user || updated;

      state.success = `User ${!currentStatus ? "activated" : "deactivated"} successfully`;
    } catch (error: any) {
      state.error = error.message || "Failed to update user status";
    }
  });

  const handleViewDetails = $(async (userId: string) => {
    try {
      const userData = await apiClient.get<any>(`/admin/users/${userId}`);
      const user: User = {
        id: userData.ID || userData.id || userId,
        name: userData.Name || userData.name || "",
        email: userData.Email || userData.email || "",
        phone: userData.Phone || userData.phone || "",
        role_id: userData.RoleID || userData.role_id,
        global_role: userData.GlobalRole || userData.global_role,
        business_vertical_id: userData.BusinessVerticalID || userData.business_vertical_id,
        business_vertical_name: userData.BusinessVerticalName || userData.business_vertical_name,
        is_active: userData.IsActive ?? userData.is_active ?? true,
        created_at: userData.CreatedAt || userData.created_at,
        business_roles: userData.BusinessRoles || userData.business_roles || [],
      };
      state.viewingUser = user;
      state.showDetailsModal = true;
    } catch (error: any) {
      state.error = error.message || "Failed to load user details";
    }
  });

  const filteredUsers = state.users.filter((u) => {
    const matchesSearch =
      !state.searchTerm ||
      u.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      u.phone?.includes(state.searchTerm);

    const matchesRole = !state.selectedRole || u.role_id === state.selectedRole;
    const matchesVertical = !state.selectedVertical || u.business_vertical_id === state.selectedVertical;

    return matchesSearch && matchesRole && matchesVertical;
  });

  return (
    <PermissionGuard
      superAdminOnly
      fallback={
        <div class="p-6">
          <div class="bg-red-100 border border-red-400 text-red-700 rounded p-4">
            <h2 class="font-bold">Access Denied</h2>
            <p>You need super admin privileges to access this page.</p>
          </div>
        </div>
      }
    >
      <div class="space-y-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">User Management</h1>
            <p class="text-gray-600 text-sm mt-1">Manage system users, roles, and access</p>
          </div>
          <button
            class="btn btn-primary"
            onClick$={() => {
              state.showCreateModal = true;
              state.editingUser = null;
            }}
          >
            + Create User
          </button>
        </div>

        {state.success && <div class="p-4 bg-green-100 border border-green-400 text-green-700 rounded">{state.success}</div>}
        {state.error && <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">{state.error}</div>}
        {state.loadingError && <div class="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">{state.loadingError}</div>}

        <div class="bg-white border rounded-lg p-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Search by name, email, or phone..."
              value={state.searchTerm}
              onInput$={(e) => (state.searchTerm = (e.target as HTMLInputElement).value)}
            />
            <select
              class="w-full border border-gray-300 rounded-md px-3 py-2"
              value={state.selectedRole}
              onChange$={(e) => (state.selectedRole = (e.target as HTMLSelectElement).value)}
            >
              <option value="">All Roles</option>
              {state.roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            <select
              class="w-full border border-gray-300 rounded-md px-3 py-2"
              value={state.selectedVertical}
              onChange$={(e) => (state.selectedVertical = (e.target as HTMLSelectElement).value)}
            >
              <option value="">All Verticals</option>
              {state.verticals.map((vertical) => (
                <option key={vertical.id} value={vertical.id}>{vertical.name}</option>
              ))}
            </select>
          </div>
        </div>

        <P9ETable
          header={[
            { key: "name", label: "User", type: "text" },
            { key: "email", label: "Email", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "global_role", label: "Global Role", type: "text" },
            { key: "business_vertical_name", label: "Business Vertical", type: "text" },
            { key: "status_text", label: "Status", type: "text" },
            { key: "actions", label: "Actions", type: "text" },
          ]}
          data={filteredUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            global_role: user.global_role || "No Role",
            business_vertical_name: user.business_vertical_name || "-",
            status_text: user.is_active ? "Active" : "Inactive",
            actions: [
              { type: "button", label: "View", onClick$: $(() => handleViewDetails(user.id)) } as ActionButton,
              {
                type: "button",
                label: user.is_active ? "Deactivate" : "Activate",
                onClick$: $(() => handleToggleActive(user.id, user.is_active)),
                class: user.is_active
                  ? "px-3 py-1 text-sm text-danger hover:text-orange-900 border border-orange-300 rounded hover:bg-orange-50"
                  : "px-3 py-1 text-sm text-success hover:text-green-900 border border-green-300 rounded hover:bg-green-50",
              } as ActionButton,
            ],
          }))}
          defaultLimit={10}
          enableSearch={true}
          title="User Management"
        />

        {state.showCreateModal && (
          <div class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
              <h3 class="text-lg font-semibold mb-4">{state.editingUser ? "Edit User" : "Create User"}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  class="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Full Name"
                  value={state.editingUser ? state.editingUser.name : state.newUser.name}
                  onInput$={(e) => {
                    const value = (e.target as HTMLInputElement).value;
                    if (state.editingUser) state.editingUser.name = value;
                    else state.newUser.name = value;
                  }}
                />
                <input
                  class="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Email"
                  value={state.editingUser ? state.editingUser.email : state.newUser.email}
                  onInput$={(e) => {
                    const value = (e.target as HTMLInputElement).value;
                    if (state.editingUser) state.editingUser.email = value;
                    else state.newUser.email = value;
                  }}
                />
                <input
                  class="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Phone"
                  value={state.editingUser ? state.editingUser.phone : state.newUser.phone}
                  onInput$={(e) => {
                    const value = (e.target as HTMLInputElement).value;
                    if (state.editingUser) state.editingUser.phone = value;
                    else state.newUser.phone = value;
                  }}
                />
                {!state.editingUser && (
                  <input
                    type="password"
                    class="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Password"
                    value={state.newUser.password}
                    onInput$={(e) => (state.newUser.password = (e.target as HTMLInputElement).value)}
                  />
                )}
                <select
                  class="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={state.editingUser ? state.editingUser.role_id || "" : state.newUser.role_id}
                  onChange$={(e) => {
                    const value = (e.target as HTMLSelectElement).value;
                    if (state.editingUser) state.editingUser.role_id = value;
                    else state.newUser.role_id = value;
                  }}
                >
                  <option value="">Select a role</option>
                  {state.roles.map((role) => (
                    <option key={role.id} value={role.id}>{`${role.name} (Level ${role.level})`}</option>
                  ))}
                </select>
                <select
                  class="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={state.editingUser ? state.editingUser.business_vertical_id || "" : state.newUser.business_vertical_id}
                  onChange$={(e) => {
                    const value = (e.target as HTMLSelectElement).value;
                    if (state.editingUser) state.editingUser.business_vertical_id = value;
                    else state.newUser.business_vertical_id = value;
                  }}
                >
                  <option value="">None</option>
                  {state.verticals.map((vertical) => (
                    <option key={vertical.id} value={vertical.id}>{vertical.name}</option>
                  ))}
                </select>
              </div>
              <div class="flex justify-end gap-3 mt-6">
                <button class="px-4 py-2 bg-gray-200 rounded" onClick$={resetForm}>Cancel</button>
                <button class="px-4 py-2 bg-blue-600 text-white rounded" onClick$={state.editingUser ? handleUpdate : handleCreate}>
                  {state.editingUser ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {state.showDetailsModal && state.viewingUser && (
          <div class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
              <h3 class="text-lg font-semibold mb-4">User Details</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span class="text-gray-500">Name:</span> {state.viewingUser.name}</div>
                <div><span class="text-gray-500">Email:</span> {state.viewingUser.email}</div>
                <div><span class="text-gray-500">Phone:</span> {state.viewingUser.phone}</div>
                <div><span class="text-gray-500">Status:</span> {state.viewingUser.is_active ? "Active" : "Inactive"}</div>
                <div><span class="text-gray-500">Global Role:</span> {state.viewingUser.global_role || "No Role Assigned"}</div>
                <div><span class="text-gray-500">Business Vertical:</span> {state.viewingUser.business_vertical_name || "None"}</div>
              </div>
              <div class="flex justify-end gap-3 mt-6">
                <button
                  class="px-4 py-2 bg-gray-200 rounded"
                  onClick$={() => {
                    state.showDetailsModal = false;
                    state.viewingUser = null;
                  }}
                >
                  Close
                </button>
                <button
                  class="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick$={() => {
                    if (!state.viewingUser) return;
                    state.editingUser = { ...state.viewingUser };
                    state.showDetailsModal = false;
                    state.viewingUser = null;
                    state.showCreateModal = true;
                  }}
                >
                  Edit User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
});
