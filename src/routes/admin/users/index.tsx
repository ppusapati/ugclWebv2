import { component$, useStore, $ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import PermissionGuard from "~/components/auth/PermissionGuard";
import { apiClient, createSSRApiClient, userService } from "~/services";
import { P9ETable, type ActionButton } from "~/components/table";

interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
}

interface BusinessRole {
  id: string;
  name: string;
  business_vertical_id: string;
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

// Load data with SSR support
export const useUsersData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    // Load users with larger page size to get all users
    const [usersResponse, rolesData, verticalsData] = await Promise.all([
      ssrApiClient.get<any>('/admin/users', { page: 1, limit: 1000 }),
      ssrApiClient.get<any>('/admin/roles'),
      ssrApiClient.get<any>('/admin/businesses'),
    ]);

    // Handle different response structures
    const users = usersResponse?.data || usersResponse?.users || usersResponse || [];
    const roles = rolesData?.data || rolesData?.roles || rolesData || [];
    const verticals = verticalsData?.businesses || verticalsData?.data || verticalsData || [];

    console.log('Route Loader - usersResponse:', usersResponse);
    console.log('Route Loader - users array:', users);
    console.log('Route Loader - first user:', users[0]);

    const result = {
      users: Array.isArray(users) ? users : [],
      roles: Array.isArray(roles) ? roles : [],
      verticals: Array.isArray(verticals) ? verticals : [],
    };

    return result;
  } catch (error: any) {
    console.error('Failed to load users data:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      data: error.data
    });
    return {
      users: [],
      roles: [],
      verticals: [],
      error: error.message || 'Failed to load data'
    };
  }
});

export default component$(() => {
  const initialData = useUsersData();

  console.log('Component - initialData:', initialData.value);
  console.log('Component - users:', initialData.value.users);
  console.log('Component - first user structure:', initialData.value.users[0]);

  const state = useStore({
    users: initialData.value.users as User[],
    roles: initialData.value.roles as Role[],
    verticals: initialData.value.verticals as BusinessVertical[],
    loadingError: (initialData.value as any).error || '',
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
    passwordStrength: 0,
    showPassword: false,
  });

  // Password strength calculator
  const getPasswordStrength = $((password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  });

  const updatePasswordStrength = $(async () => {
    state.passwordStrength = await getPasswordStrength(state.newUser.password);
  });

  const getStrengthColor = () => {
    if (state.passwordStrength < 40) return 'red';
    if (state.passwordStrength < 70) return 'yellow';
    return 'green';
  };

  const getStrengthText = () => {
    if (state.passwordStrength < 40) return 'Weak';
    if (state.passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  // Create user
  const handleCreate = $(async () => {
    try {
      const created = await apiClient.post<any>(`/register`, state.newUser);

      state.users.push(created.user || created);
      state.showCreateModal = false;
      state.newUser = {
        name: "",
        email: "",
        phone: "",
        password: "",
        role_id: "",
        business_vertical_id: "",
        is_active: true,
      };
      state.success = "User created successfully";
      setTimeout(() => (state.success = ""), 3000);
    } catch (error: any) {
      state.error = error.message || "Failed to create user";
    }
  });

  // Update user
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

      const index = state.users.findIndex(
        (u) => u.id === state.editingUser!.id
      );
      if (index !== -1) {
        state.users[index] = updated.user || updated;
      }
      state.showCreateModal = false;
      state.editingUser = null;
      state.success = "User updated successfully";
      setTimeout(() => (state.success = ""), 3000);
    } catch (error: any) {
      state.error = error.message || "Failed to update user";
    }
  });

  // Toggle user active status
  const handleToggleActive = $(async (userId: string, currentStatus: boolean) => {
    try {
      const user = state.users.find((u) => u.id === userId);
      if (!user) return;

      const updated = await apiClient.put<any>(`/admin/users/${userId}`, {
        ...user,
        is_active: !currentStatus,
      });

      const index = state.users.findIndex((u) => u.id === userId);
      if (index !== -1) {
        state.users[index] = updated.user || updated;
      }
      state.success = `User ${!currentStatus ? "activated" : "deactivated"} successfully`;
      setTimeout(() => (state.success = ""), 3000);
    } catch (error: any) {
      state.error = error.message || "Failed to update user status";
    }
  });

  // View user details
  const handleViewDetails = $(async (userId: string) => {
    try {
      console.log('handleViewDetails - Fetching user with ID:', userId);
      const userData = await apiClient.get<any>(`/admin/users/${userId}`);
      console.log('handleViewDetails - Raw API response:', userData);
      
      // Transform PascalCase API response to lowercase fields
      const user: User = {
        id: userData.ID || userData.id || userId,
        name: userData.Name || userData.name || '',
        email: userData.Email || userData.email || '',
        phone: userData.Phone || userData.phone || '',
        role_id: userData.RoleID || userData.role_id,
        global_role: userData.GlobalRole || userData.global_role,
        business_vertical_id: userData.BusinessVerticalID || userData.business_vertical_id,
        business_vertical_name: userData.BusinessVerticalName || userData.business_vertical_name,
        is_active: userData.IsActive ?? userData.is_active ?? true,
        created_at: userData.CreatedAt || userData.created_at,
        business_roles: userData.BusinessRoles || userData.business_roles || [],
      };
      
      console.log('handleViewDetails - Transformed user object:', user);
      console.log('handleViewDetails - User ID:', user.id);
      console.log('handleViewDetails - User name:', user.name);
      
      state.viewingUser = user;
      state.showDetailsModal = true;
    } catch (error: any) {
      console.error('handleViewDetails - Error:', error);
      state.error = error.message || "Failed to load user details";
    }
  });

  // Filter users
  const filteredUsers = state.users.filter((u) => {
    const matchesSearch =
      !state.searchTerm ||
      u.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      u.phone?.includes(state.searchTerm);

    const matchesRole =
      !state.selectedRole || u.role_id === state.selectedRole;

    const matchesVertical =
      !state.selectedVertical ||
      u.business_vertical_id === state.selectedVertical;

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
            <p class="text-sm mt-2">If you believe this is an error, please check your authentication status.</p>
          </div>
        </div>
      }
    >
      <div class="space-y-6 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">User Management</h1>
            <p class="text-gray-600 text-sm mt-1">
              Manage system users, roles, and access
            </p>
          </div>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick$={() => {
              state.showCreateModal = true;
              state.editingUser = null;
            }}
          >
            + Create User
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
        {state.loadingError && (
          <div class="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <strong>Data Loading Error:</strong> {state.loadingError}
          </div>
        )}

        {/* Debug Info - Remove in production */}
        <div class="bg-gray-100 border rounded-lg p-4 text-sm">
          <h3 class="font-semibold mb-2">Debug Information:</h3>
          <div>Users loaded: {state.users.length}</div>
          <div>Roles loaded: {state.roles.length}</div>
          <div>Verticals loaded: {state.verticals.length}</div>
          <div>Filtered users: {filteredUsers.length}</div>
          {state.users.length === 0 && (
            <div class="mt-2 text-red-600">
              No users found. Check browser console for API errors.
            </div>
          )}
          {state.users.length > 0 && (
            <div class="mt-2">
              <strong>First user sample:</strong>
              <pre class="text-xs bg-white p-2 rounded mt-1">
                {JSON.stringify({
                  id: state.users[0]?.id,
                  name: state.users[0]?.name,
                  email: state.users[0]?.email,
                  keys: Object.keys(state.users[0] || {})
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Filters */}
        <div class="bg-white border rounded-lg p-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by name, email, or phone..."
                value={state.searchTerm}
                onInput$={(e) => {
                  state.searchTerm = (e.target as HTMLInputElement).value;
                }}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Filter by Role
              </label>
              <select
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={state.selectedRole}
                onChange$={(e) => {
                  state.selectedRole = (e.target as HTMLSelectElement).value;
                }}
              >
                <option value="">All Roles</option>
                {state.roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Filter by Vertical
              </label>
              <select
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={state.selectedVertical}
                onChange$={(e) => {
                  state.selectedVertical = (e.target as HTMLSelectElement).value;
                }}
              >
                <option value="">All Verticals</option>
                {state.verticals.map((vertical) => (
                  <option key={vertical.id} value={vertical.id}>
                    {vertical.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users Table with P9ETable */}
        <P9ETable
          title="Users"
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
              {
                type: 'button',
                label: 'View',
                onClick$: $(() => handleViewDetails(user.id)),
              } as ActionButton,
              {
                type: 'button',
                label: user.is_active ? 'Deactivate' : 'Activate',
                onClick$: $(() => handleToggleActive(user.id, user.is_active)),
                class: user.is_active
                  ? 'px-3 py-1 text-sm text-danger hover:text-orange-900 border border-orange-300 rounded hover:bg-orange-50'
                  : 'px-3 py-1 text-sm text-success hover:text-green-900 border border-green-300 rounded hover:bg-green-50'
              } as ActionButton,
            ],
          }))}
          defaultLimit={10}
          enableSearch={true}
          enableSort={true}
        />

        {/* Create/Edit Modal */}
        {state.showCreateModal && (
          <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
              <div class="p-6">
                <h3 class="text-lg font-semibold mb-4">
                  {state.editingUser ? "Edit User" : "Create New User"}
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
                        state.editingUser
                          ? state.editingUser.name
                          : state.newUser.name
                      }
                      onInput$={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        if (state.editingUser) {
                          state.editingUser.name = value;
                        } else {
                          state.newUser.name = value;
                        }
                      }}
                      placeholder="Full Name"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={
                        state.editingUser
                          ? state.editingUser.email
                          : state.newUser.email
                      }
                      onInput$={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        if (state.editingUser) {
                          state.editingUser.email = value;
                        } else {
                          state.newUser.email = value;
                        }
                      }}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={
                        state.editingUser
                          ? state.editingUser.phone
                          : state.newUser.phone
                      }
                      onInput$={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        if (state.editingUser) {
                          state.editingUser.phone = value;
                        } else {
                          state.newUser.phone = value;
                        }
                      }}
                      placeholder="1234567890"
                    />
                  </div>

                  {!state.editingUser && (
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <div class="relative">
                        <input
                          type={state.showPassword ? 'text' : 'password'}
                          class="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={state.newUser.password}
                          onInput$={async (e) => {
                            state.newUser.password = (
                              e.target as HTMLInputElement
                            ).value;
                            await updatePasswordStrength();
                          }}
                          placeholder="Minimum 8 characters"
                        />
                        <button
                          type="button"
                          onClick$={() => {
                            state.showPassword = !state.showPassword;
                          }}
                          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {state.showPassword ? (
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {state.newUser.password && (
                        <div class="mt-2">
                          <div class="flex justify-between text-xs mb-1">
                            <span class="text-gray-600">Password Strength:</span>
                            <span class={`font-semibold ${
                              getStrengthColor() === 'red' ? 'text-red-600' :
                              getStrengthColor() === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {getStrengthText()}
                            </span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div
                              class={`h-2 rounded-full transition-all duration-300 ${
                                getStrengthColor() === 'red' ? 'bg-red-500' :
                                getStrengthColor() === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={`width: ${state.passwordStrength}%`}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Global Role *
                    </label>
                    <select
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={
                        state.editingUser
                          ? state.editingUser.role_id || ""
                          : state.newUser.role_id
                      }
                      onChange$={(e) => {
                        const value = (e.target as HTMLSelectElement).value;
                        if (state.editingUser) {
                          state.editingUser.role_id = value;
                        } else {
                          state.newUser.role_id = value;
                        }
                      }}
                    >
                      <option value="">Select a role</option>
                      {state.roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {`${role.name} (Level ${role.level})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Business Vertical
                    </label>
                    <select
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={
                        state.editingUser
                          ? state.editingUser.business_vertical_id || ""
                          : state.newUser.business_vertical_id
                      }
                      onChange$={(e) => {
                        const value = (e.target as HTMLSelectElement).value;
                        if (state.editingUser) {
                          state.editingUser.business_vertical_id = value;
                        } else {
                          state.newUser.business_vertical_id = value;
                        }
                      }}
                    >
                      <option value="">None</option>
                      {state.verticals.map((vertical) => (
                        <option key={vertical.id} value={vertical.id}>
                          {vertical.name}
                        </option>
                      ))}
                    </select>
                    <p class="text-xs text-gray-500 mt-1">
                      Optional: Primary business vertical for this user
                    </p>
                  </div>

                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active_user"
                      class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      checked={
                        state.editingUser
                          ? state.editingUser.is_active
                          : state.newUser.is_active
                      }
                      onChange$={(e) => {
                        const checked = (e.target as HTMLInputElement).checked;
                        if (state.editingUser) {
                          state.editingUser.is_active = checked;
                        } else {
                          state.newUser.is_active = checked;
                        }
                      }}
                    />
                    <label for="is_active_user" class="ml-2 text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                </div>

                <div class="flex justify-end gap-3 mt-6">
                  <button
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    onClick$={() => {
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
                      state.passwordStrength = 0;
                      state.showPassword = false;
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    onClick$={state.editingUser ? handleUpdate : handleCreate}
                  >
                    {state.editingUser ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {state.showDetailsModal && state.viewingUser && (
          <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div class="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4">
              <div class="p-6">
                <h3 class="text-lg font-semibold mb-4">User Details</h3>

                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="text-sm font-medium text-gray-500">
                        Name
                      </label>
                      <p class="text-gray-900">{state.viewingUser.name}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500">
                        Email
                      </label>
                      <p class="text-gray-900">{state.viewingUser.email}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500">
                        Phone
                      </label>
                      <p class="text-gray-900">{state.viewingUser.phone}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500">
                        Status
                      </label>
                      <p>
                        <span
                          class={`px-2 py-1 text-xs rounded ${
                            state.viewingUser.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {state.viewingUser.is_active ? "Active" : "Inactive"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500">
                      Global Role
                    </label>
                    <p class="text-gray-900">
                      {state.viewingUser.global_role || "No Role Assigned"}
                    </p>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500">
                      Business Vertical
                    </label>
                    <p class="text-gray-900">
                      {state.viewingUser.business_vertical_name || "None"}
                    </p>
                  </div>

                  {state.viewingUser.business_roles &&
                    state.viewingUser.business_roles.length > 0 && (
                      <div>
                        <label class="text-sm font-medium text-gray-500 block mb-2">
                          Business Roles
                        </label>
                        <div class="flex flex-wrap gap-2">
                          {state.viewingUser.business_roles.map((role) => (
                            <span
                              key={role.id}
                              class="px-3 py-1 text-sm rounded bg-blue-100 text-blue-800"
                            >
                              {role.name}
                              {role.business_vertical_name &&
                                ` (${role.business_vertical_name})`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {state.viewingUser.created_at && (
                    <div>
                      <label class="text-sm font-medium text-gray-500">
                        Created At
                      </label>
                      <p class="text-gray-900">
                        {new Date(state.viewingUser.created_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Management Links Section */}
                <div class="mt-6 pt-6 border-t border-gray-200">
                  <label class="text-sm font-medium text-gray-700 block mb-3">
                    User Management
                  </label>
                  <div class="grid grid-cols-3 gap-3">
                    <a
                      href={`/admin/users/${state.viewingUser.id}/roles`}
                      class="px-4 py-3 text-center text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-300 rounded-lg hover:bg-indigo-100 hover:border-indigo-400 transition-colors"
                    >
                      <div class="flex flex-col items-center gap-1">
                        <span class="text-lg">👤</span>
                        <span>Manage Roles</span>
                      </div>
                    </a>
                    <a
                      href={`/admin/users/${state.viewingUser.id}/attributes`}
                      class="px-4 py-3 text-center text-sm font-medium text-purple-600 bg-purple-50 border border-purple-300 rounded-lg hover:bg-purple-100 hover:border-purple-400 transition-colors"
                    >
                      <div class="flex flex-col items-center gap-1">
                        <span class="text-lg">🏷️</span>
                        <span>Manage Attributes</span>
                      </div>
                    </a>
                    <a
                      href={`/admin/users/${state.viewingUser.id}/sites`}
                      class="px-4 py-3 text-center text-sm font-medium text-teal-600 bg-teal-50 border border-teal-300 rounded-lg hover:bg-teal-100 hover:border-teal-400 transition-colors"
                    >
                      <div class="flex flex-col items-center gap-1">
                        <span class="text-lg">📍</span>
                        <span>Manage Sites</span>
                      </div>
                    </a>
                  </div>
                </div>

                <div class="flex justify-end gap-3 mt-6">
                  <button
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    onClick$={() => {
                      state.showDetailsModal = false;
                      state.viewingUser = null;
                    }}
                  >
                    Close
                  </button>
                  <button
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    onClick$={() => {
                      if (state.viewingUser) {
                        state.editingUser = { ...state.viewingUser };
                        state.showDetailsModal = false;
                        state.viewingUser = null;
                        state.showCreateModal = true;
                      }
                    }}
                  >
                    Edit User
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
