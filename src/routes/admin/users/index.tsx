import { component$, useStore, $ } from "@builder.io/qwik";
import { routeLoader$, useNavigate } from "@builder.io/qwik-city";
import PermissionGuard from "~/components/auth/PermissionGuard";
import { Btn, FormField, PageHeader } from "~/components/ds";
import { apiClient, createSSRApiClient } from "~/services";
import { P9ETable, type ActionButton } from "~/components/table";

interface Role {
  id: string;
  name: string;
  display_name?: string;
  level?: number;
  is_global?: boolean;
  business_vertical_id?: string;
  business_vertical_name?: string;
}

interface BusinessRole {
  id: string;
  business_role_id?: string;
  role_id?: string;
  name: string;
  business_vertical_id?: string;
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

const normalizeRole = (role: any): Role => {
  const rawLevel = role?.level ?? role?.Level ?? role?.role_level ?? role?.RoleLevel;
  const parsedLevel = typeof rawLevel === "string" ? Number(rawLevel) : rawLevel;

  return {
    id: role?.id || role?.ID || role?.role_id || "",
    name: role?.name || role?.Name || role?.display_name || role?.DisplayName || "Unnamed Role",
    display_name: role?.display_name || role?.DisplayName,
    level: Number.isFinite(parsedLevel) ? parsedLevel : undefined,
    is_global: role?.is_global ?? role?.IsGlobal,
    business_vertical_id: role?.business_vertical_id || role?.BusinessVerticalID,
    business_vertical_name: role?.business_vertical?.name || role?.BusinessVertical?.Name,
  };
};

const normalizeBusinessVertical = (vertical: any): BusinessVertical => ({
  id: vertical?.id || vertical?.ID || "",
  name: vertical?.name || vertical?.Name || "",
  code: vertical?.code || vertical?.Code || "",
});

const normalizeBusinessRole = (role: any): BusinessRole => {
  const nestedBusinessRole = role?.business_role || role?.BusinessRole || {};
  const nestedVertical = nestedBusinessRole?.business_vertical || nestedBusinessRole?.BusinessVertical || {};

  return {
    id: role?.id || role?.ID || nestedBusinessRole?.id || nestedBusinessRole?.ID || "",
    business_role_id:
      role?.business_role_id ||
      role?.BusinessRoleID ||
      nestedBusinessRole?.id ||
      nestedBusinessRole?.ID,
    role_id: role?.role_id || role?.RoleID,
    name:
      role?.name ||
      role?.Name ||
      role?.display_name ||
      role?.DisplayName ||
      nestedBusinessRole?.display_name ||
      nestedBusinessRole?.DisplayName ||
      nestedBusinessRole?.name ||
      nestedBusinessRole?.Name ||
      "",
    business_vertical_id:
      role?.business_vertical_id ||
      role?.BusinessVerticalID ||
      nestedBusinessRole?.business_vertical_id ||
      nestedBusinessRole?.BusinessVerticalID,
    business_vertical_name:
      role?.business_vertical_name ||
      role?.BusinessVerticalName ||
      role?.business_name ||
      role?.BusinessName ||
      nestedVertical?.name ||
      nestedVertical?.Name,
  };
};

const normalizeUser = (user: any): User => {
  const businessRolesRaw = user?.business_roles ?? user?.BusinessRoles;

  return {
    id: user?.id || user?.ID || "",
    name: user?.name || user?.Name || "",
    email: user?.email || user?.Email || "",
    phone: user?.phone || user?.Phone || "",
    role_id: user?.role_id || user?.RoleID,
    global_role: user?.global_role || user?.GlobalRole,
    business_vertical_id: user?.business_vertical_id || user?.BusinessVerticalID,
    business_vertical_name: user?.business_vertical_name || user?.BusinessVerticalName,
    is_active: user?.is_active ?? user?.IsActive ?? true,
    created_at: user?.created_at || user?.CreatedAt,
    business_roles: Array.isArray(businessRolesRaw)
      ? businessRolesRaw.map(normalizeBusinessRole)
      : [],
  };
};

const buildUserUpdatePayload = (user: User) => {
  const payload: Record<string, string | boolean> = {
    name: user.name,
    email: user.email,
    phone: user.phone,
    is_active: user.is_active,
  };

  if (typeof user.role_id !== "undefined") {
    payload.role_id = user.role_id || "";
  }

  if (typeof user.business_vertical_id !== "undefined") {
    payload.business_vertical_id = user.business_vertical_id || "";
  }

  return payload;
};

const getRoleOptionLabel = (role: Role) => {
  const roleName = role.display_name || role.name;
  const roleLevel = typeof role.level === "number" ? `Level ${role.level}` : "Level not set";
  const scope = role.is_global ? "Global" : (role.business_vertical_name || "Business");
  return `${roleName} (${roleLevel} • ${scope})`;
};

export const useUsersData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const [usersResponse, rolesData, verticalsData] = await Promise.all([
      ssrApiClient.get<any>("/admin/users", { page: 1, limit: 1000 }),
      ssrApiClient.get<any>("/admin/roles/unified?include_business=true"),
      ssrApiClient.get<any>("/admin/businesses"),
    ]);

    const users = usersResponse?.data || usersResponse?.users || usersResponse || [];
    const roles = rolesData?.roles || rolesData?.data || rolesData || [];
    const verticals = verticalsData?.businesses || verticalsData?.data || verticalsData || [];

    return {
      users: Array.isArray(users) ? users.map(normalizeUser).filter((user) => user.id) : [],
      roles: Array.isArray(roles) ? roles.map(normalizeRole).filter((role) => role.id) : [],
      verticals: Array.isArray(verticals) ? verticals.map(normalizeBusinessVertical).filter((vertical) => vertical.id) : [],
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
  const nav = useNavigate();

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

  const getRoleNameById = (roleId?: string, businessRoles?: BusinessRole[], globalRole?: string) => {
    const resolvedRoles: string[] = [];

    // Resolve global role by role_id when present.
    if (roleId) {
      const role = state.roles.find((r) => r.id === roleId);
      if (role) {
        resolvedRoles.push(role.display_name || role.name);
      }
    }

    // Resolve business roles from assignment payload + role master list.
    for (const assignment of businessRoles || []) {
      const fromAssignment = assignment.name?.trim();
      if (fromAssignment) {
        resolvedRoles.push(fromAssignment);
        continue;
      }

      const candidateRoleId = assignment.business_role_id || assignment.role_id;
      if (candidateRoleId) {
        const matchedRole = state.roles.find((r) => r.id === candidateRoleId);
        if (matchedRole) {
          resolvedRoles.push(matchedRole.display_name || matchedRole.name);
        }
      }
    }

    const uniqueResolved = resolvedRoles.filter((value, index, array) => value && array.indexOf(value) === index);
    if (uniqueResolved.length > 0) {
      return uniqueResolved.join(", ");
    }

    if (globalRole) {
      return globalRole;
    }

    return "No Role";
  };

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
      state.users.push(normalizeUser(created.user || created));
      state.success = "User created successfully";
      await resetForm();
    } catch (error: any) {
      state.error = error.message || "Failed to create user";
    }
  });

  const handleUpdate = $(async () => {
    if (!state.editingUser) return;

    try {
      const selectedRole = state.roles.find((role) => role.id === (state.editingUser?.role_id || ""));
      const isBusinessRoleSelection = !!selectedRole && selectedRole.is_global === false;

      const updatePayload = buildUserUpdatePayload(state.editingUser);
      if (isBusinessRoleSelection) {
        delete (updatePayload as any).role_id;
      }

      const updated = await apiClient.put<any>(
        `/admin/users/${state.editingUser.id}`,
        updatePayload
      );

      if (isBusinessRoleSelection && selectedRole) {
        const selectedVerticalId =
          state.editingUser.business_vertical_id || selectedRole.business_vertical_id || "";

        if (selectedVerticalId) {
          const existingAssignment = (state.editingUser.business_roles || []).find(
            (assignment) => assignment.business_vertical_id === selectedVerticalId
          );

          if (existingAssignment && existingAssignment.business_role_id !== selectedRole.id) {
            await apiClient.delete<any>(`/users/${state.editingUser.id}/roles/${existingAssignment.id}`);
          }
        }

        const alreadyAssigned = (state.editingUser.business_roles || []).some(
          (assignment) => assignment.business_role_id === selectedRole.id
        );

        if (!alreadyAssigned) {
          await apiClient.post<any>(`/users/${state.editingUser.id}/roles/assign`, {
            business_role_id: selectedRole.id,
          });
        }
      }

      const reloadedUserData = await apiClient.get<any>(`/admin/users/${state.editingUser.id}`);
      const normalizedUpdatedUser = normalizeUser(reloadedUserData.user || reloadedUserData || updated.user || updated);

      const index = state.users.findIndex((u) => u.id === state.editingUser!.id);
      if (index !== -1) {
        state.users[index] = {
          ...state.users[index],
          ...normalizedUpdatedUser,
          id: normalizedUpdatedUser.id || state.users[index].id,
        };
      }

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
        ...buildUserUpdatePayload(user),
        is_active: !currentStatus,
      });
      const normalizedUpdatedUser = normalizeUser(updated.user || updated);

      const index = state.users.findIndex((u) => u.id === userId);
      if (index !== -1) {
        state.users[index] = {
          ...state.users[index],
          ...normalizedUpdatedUser,
          id: normalizedUpdatedUser.id || state.users[index].id,
          is_active: normalizedUpdatedUser.is_active,
        };
      }

      state.success = `User ${!currentStatus ? "activated" : "deactivated"} successfully`;
    } catch (error: any) {
      state.error = error.message || "Failed to update user status";
    }
  });

  const handleViewDetails = $(async (userId: string) => {
    try {
      // First, try to find user in already-loaded state
      const existingUser = state.users.find((u) => u.id === userId);
      if (existingUser) {
        state.viewingUser = existingUser;
        state.showDetailsModal = true;
        return;
      }

      // Fallback: fetch from API if not found in state
      const userData = await apiClient.get<any>(`/admin/users/${userId}`);
      const user = normalizeUser(userData.user || userData);
      state.viewingUser = user;
      state.showDetailsModal = true;
    } catch (error: any) {
      console.error('[View User Error]', error);
      state.error = error.message || "Failed to load user details";
    }
  });

  const filteredUsers = state.users.filter((u) => {
    const matchesSearch =
      !state.searchTerm ||
      u.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      u.phone?.includes(state.searchTerm);

    const hasBusinessRole = (u.business_roles || []).some((br) => br.business_role_id === state.selectedRole);
    const matchesRole = !state.selectedRole || u.role_id === state.selectedRole || hasBusinessRole;
    const matchesVertical = !state.selectedVertical || u.business_vertical_id === state.selectedVertical;

    return matchesSearch && matchesRole && matchesVertical;
  });

  const getRolesForVertical = (businessVerticalId?: string) => {
    const globalRoles = state.roles.filter((role) => role.is_global !== false);
    if (!businessVerticalId) {
      return globalRoles;
    }

    const businessRoles = state.roles.filter(
      (role) => role.is_global === false && role.business_vertical_id === businessVerticalId
    );

    return [...globalRoles, ...businessRoles];
  };

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
        <PageHeader title="User Management" subtitle="Manage system users, roles, and access">
          <Btn
            q:slot="actions"
            onClick$={() => {
              state.showCreateModal = true;
              state.editingUser = null;
            }}
          >
            + Create User
          </Btn>
        </PageHeader>

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
                <option key={role.id} value={role.id}>{getRoleOptionLabel(role)}</option>
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
            global_role: getRoleNameById(user.role_id, user.business_roles, user.global_role),
            business_vertical_name: user.business_vertical_name || "-",
            status_text: user.is_active ? "Active" : "Inactive",
            actions: [
              { type: "button", label: "View", onClick$: $(() => handleViewDetails(user.id)) } as ActionButton,
              {
                type: "button",
                label: "Manage Sites",
                onClick$: $(() => nav(`/admin/users/${user.id}/sites`)),
              } as ActionButton,
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
                <FormField id="user-full-name" label="Full Name" required>
                  <input
                    id="user-full-name"
                    class="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Full Name"
                    value={state.editingUser ? state.editingUser.name : state.newUser.name}
                    required
                    aria-required="true"
                    onInput$={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      if (state.editingUser) state.editingUser.name = value;
                      else state.newUser.name = value;
                    }}
                  />
                </FormField>
                <FormField id="user-email" label="Email" required>
                  <input
                    id="user-email"
                    class="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Email"
                    value={state.editingUser ? state.editingUser.email : state.newUser.email}
                    required
                    aria-required="true"
                    onInput$={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      if (state.editingUser) state.editingUser.email = value;
                      else state.newUser.email = value;
                    }}
                  />
                </FormField>
                <FormField id="user-phone" label="Phone">
                  <input
                    id="user-phone"
                    class="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Phone"
                    value={state.editingUser ? state.editingUser.phone : state.newUser.phone}
                    onInput$={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      if (state.editingUser) state.editingUser.phone = value;
                      else state.newUser.phone = value;
                    }}
                  />
                </FormField>
                {!state.editingUser && (
                  <FormField id="user-password" label="Password" required>
                    <input
                      id="user-password"
                      type="password"
                      class="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Password"
                      value={state.newUser.password}
                      required
                      aria-required="true"
                      onInput$={(e) => (state.newUser.password = (e.target as HTMLInputElement).value)}
                    />
                  </FormField>
                )}
                <FormField id="user-role" label="Role">
                  <select
                    id="user-role"
                    class="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={state.editingUser ? state.editingUser.role_id || "" : state.newUser.role_id}
                    onChange$={(e) => {
                      const value = (e.target as HTMLSelectElement).value;
                      if (state.editingUser) state.editingUser.role_id = value;
                      else state.newUser.role_id = value;
                    }}
                  >
                    <option value="">Select a role</option>
                    {getRolesForVertical(state.editingUser ? state.editingUser.business_vertical_id : state.newUser.business_vertical_id).map((role) => (
                      <option key={role.id} value={role.id}>{getRoleOptionLabel(role)}</option>
                    ))}
                  </select>
                </FormField>
                <FormField id="user-business-vertical" label="Business Vertical">
                  <select
                    id="user-business-vertical"
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
                </FormField>
              </div>
              <div class="flex justify-end gap-3 mt-6">
                <Btn variant="secondary" onClick$={resetForm}>Cancel</Btn>
                <Btn onClick$={state.editingUser ? handleUpdate : handleCreate}>
                  {state.editingUser ? "Update" : "Create"}
                </Btn>
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
                <Btn
                  onClick$={() => {
                    if (!state.viewingUser) return;
                    state.editingUser = { ...state.viewingUser };
                    state.showDetailsModal = false;
                    state.viewingUser = null;
                    state.showCreateModal = true;
                  }}
                >
                  Edit User
                </Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
});
