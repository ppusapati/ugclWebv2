// src/components/auth/user-role-assignment.tsx
import { component$, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { authService, type User, type BusinessVertical } from '~/services/auth.service';

interface UserWithRoles extends User {
  business_roles: Array<{
    business_vertical_id: string;
    business_name: string;
    roles: string[];
    permissions: string[];
  }>;
}

export const UserRoleAssignment = component$(() => {
  const state = useStore({
    users: [] as UserWithRoles[],
    businesses: [] as BusinessVertical[],
    roles: [] as any[],
    loading: true,
    showAssignModal: false,
    selectedUser: null as UserWithRoles | null,
    selectedBusiness: '',
    selectedRoles: [] as string[],
    error: '',
    success: '',
    searchTerm: '',
  });

  useVisibleTask$(async () => {
    try {
      const token = authService.getToken();
      const apiKey = '87339ea3-1add-4689-ae57-3128ebd03c4f';

      // Fetch users with their roles
      const usersResponse = await fetch('http://localhost:8080/api/v1/admin/users-with-roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': apiKey,
        },
      });
      const usersData = await usersResponse.json();
      state.users = usersData.users || [];

      // Fetch businesses
      const businessesResponse = await fetch('http://localhost:8080/api/v1/admin/businesses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': apiKey,
        },
      });
      const businessesData = await businessesResponse.json();
      state.businesses = businessesData.businesses || [];

      // Fetch roles
      const rolesResponse = await fetch('http://localhost:8080/api/v1/admin/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': apiKey,
        },
      });
      const rolesData = await rolesResponse.json();
      state.roles = rolesData.roles || [];

      state.loading = false;
    } catch (error) {
      console.error('Failed to load data:', error);
      state.error = 'Failed to load data';
      state.loading = false;
    }
  });

  const handleAssignRoles = $(async () => {
    if (!state.selectedUser || !state.selectedBusiness || state.selectedRoles.length === 0) {
      state.error = 'Please select user, business, and at least one role';
      return;
    }

    try {
      const token = authService.getToken();
      const response = await fetch('http://localhost:8080/api/v1/admin/assign-user-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
        },
        body: JSON.stringify({
          user_id: state.selectedUser.id,
          business_vertical_id: state.selectedBusiness,
          roles: state.selectedRoles,
        }),
      });

      if (response.ok) {
        // Refresh users data
        const usersResponse = await fetch('http://localhost:8080/api/v1/admin/users-with-roles', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
          },
        });
        const usersData = await usersResponse.json();
        state.users = usersData.users || [];

        state.showAssignModal = false;
        state.selectedUser = null;
        state.selectedBusiness = '';
        state.selectedRoles = [];
        state.success = 'Roles assigned successfully';
      } else {
        state.error = 'Failed to assign roles';
      }
    } catch (error) {
      state.error = 'Network error occurred';
    }
  });

  const handleRemoveUserRole = $(async (userId: string, businessId: string, roleToRemove: string) => {
    if (!confirm('Are you sure you want to remove this role?')) return;

    try {
      const token = authService.getToken();
      const response = await fetch('http://localhost:8080/api/v1/admin/remove-user-role', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
        },
        body: JSON.stringify({
          user_id: userId,
          business_vertical_id: businessId,
          role: roleToRemove,
        }),
      });

      if (response.ok) {
        // Refresh users data
        const usersResponse = await fetch('http://localhost:8080/api/v1/admin/users-with-roles', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
          },
        });
        const usersData = await usersResponse.json();
        state.users = usersData.users || [];
        state.success = 'Role removed successfully';
      } else {
        state.error = 'Failed to remove role';
      }
    } catch (error) {
      state.error = 'Network error occurred';
    }
  });

  const filteredUsers = state.users.filter(user => 
    user.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    user.phone.includes(state.searchTerm)
  );

  if (state.loading) {
    return (
      <div class="flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div class="user-role-assignment p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">User Role Assignment</h2>
        <div class="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search users..."
            class="px-4 py-2 border border-gray-300 rounded-md"
            value={state.searchTerm}
            onInput$={(e) => {
              state.searchTerm = (e.target as HTMLInputElement).value;
            }}
          />
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick$={() => { state.showAssignModal = true; }}
          >
            Assign Roles
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {state.success && (
        <div class="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {state.success}
        </div>
      )}
      {state.error && (
        <div class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {state.error}
        </div>
      )}

      {/* Users Table */}
      <div class="bg-white border rounded-lg overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business Access
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-700">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{user.name}</div>
                      <div class="text-sm text-gray-500">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{user.email}</div>
                  <div class="text-sm text-gray-500">{user.phone}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="space-y-2">
                    {user.business_roles?.map((businessRole) => (
                      <div key={businessRole.business_vertical_id} class="border border-gray-200 rounded p-2">
                        <div class="text-sm font-medium text-gray-900 mb-1">
                          {businessRole.business_name}
                        </div>
                        <div class="flex flex-wrap gap-1">
                          {businessRole.roles.map((role) => (
                            <span
                              key={role}
                              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-red-100 hover:text-red-800"
                              onClick$={() => handleRemoveUserRole(user.id, businessRole.business_vertical_id, role)}
                              title="Click to remove this role"
                            >
                              {role} ×
                            </span>
                          ))}
                        </div>
                        {businessRole.permissions.length > 0 && (
                          <div class="mt-1">
                            <div class="text-xs text-gray-500 mb-1">Permissions:</div>
                            <div class="flex flex-wrap gap-1">
                              {businessRole.permissions.slice(0, 3).map((permission) => (
                                <span key={permission} class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                  {permission}
                                </span>
                              ))}
                              {businessRole.permissions.length > 3 && (
                                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                  +{businessRole.permissions.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {(!user.business_roles || user.business_roles.length === 0) && (
                      <span class="text-sm text-gray-500 italic">No business access assigned</span>
                    )}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    class="text-indigo-600 hover:text-indigo-900"
                    onClick$={() => {
                      state.selectedUser = user;
                      state.showAssignModal = true;
                    }}
                  >
                    Assign Roles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Roles Modal */}
      {state.showAssignModal && (
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div class="mt-3">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Assign Roles {state.selectedUser && `to ${state.selectedUser.name}`}
              </h3>
              
              <div class="space-y-4">
                {!state.selectedUser && (
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Select User</label>
                    <select
                      class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      onChange$={(e) => {
                        const userId = (e.target as HTMLSelectElement).value;
                        state.selectedUser = state.users.find(u => u.id === userId) || null;
                      }}
                    >
                      <option value="">Choose a user...</option>
                      {state.users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {`${user.name} (${user.email})`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label class="block text-sm font-medium text-gray-700">Business Vertical</label>
                  <select
                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={state.selectedBusiness}
                    onChange$={(e) => {
                      state.selectedBusiness = (e.target as HTMLSelectElement).value;
                      state.selectedRoles = [];
                    }}
                  >
                    <option value="">Choose a business...</option>
                    {state.businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {`${business.name} (${business.code})`}
                      </option>
                    ))}
                  </select>
                </div>

                {state.selectedBusiness && (
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-3">Select Roles</label>
                    <div class="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded p-3">
                      {state.roles
                        .filter(role => !role.business_vertical_id || role.business_vertical_id === state.selectedBusiness)
                        .map((role) => (
                        <label key={role.id} class="flex items-center">
                          <input
                            type="checkbox"
                            class="rounded border-gray-300 text-blue-600"
                            checked={state.selectedRoles.includes(role.id)}
                            onChange$={() => {
                              const index = state.selectedRoles.indexOf(role.id);
                              if (index > -1) {
                                state.selectedRoles.splice(index, 1);
                              } else {
                                state.selectedRoles.push(role.id);
                              }
                            }}
                          />
                          <div class="ml-3">
                            <span class="text-sm font-medium text-gray-700">{role.name}</span>
                            <p class="text-xs text-gray-500">{role.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div class="flex justify-end space-x-3 mt-6">
                <button
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  onClick$={() => {
                    state.showAssignModal = false;
                    state.selectedUser = null;
                    state.selectedBusiness = '';
                    state.selectedRoles = [];
                  }}
                >
                  Cancel
                </button>
                <button
                  class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick$={handleAssignRoles}
                >
                  Assign Roles
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});