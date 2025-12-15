// src/components/auth/business-access-control.tsx
import { component$, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { authService } from '~/services/auth.service';

interface BusinessAccess {
  business_id: string;
  business_name: string;
  business_code: string;
  user_count: number;
  admin_count: number;
  roles: Array<{
    id: string;
    name: string;
    user_count: number;
  }>;
  permissions: string[];
}

export const BusinessAccessControl = component$(() => {
  const state = useStore({
    businesses: [] as BusinessAccess[],
    selectedBusiness: null as BusinessAccess | null,
    users: [] as any[],
    roles: [] as any[],
    loading: true,
    showUserModal: false,
    showRoleModal: false,
    error: '',
    success: '',
    newUserAccess: {
      user_id: '',
      roles: [] as string[],
    },
    searchTerm: '',
  });

  useVisibleTask$(async () => {
    try {
      const token = authService.getToken();
      const apiKey = '87339ea3-1add-4689-ae57-3128ebd03c4f';

      // Fetch business access data
      const businessesResponse = await fetch('http://localhost:8080/api/v1/admin/business-access', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': apiKey,
        },
      });
      const businessesData = await businessesResponse.json();
      state.businesses = businessesData.businesses || [];

      // Fetch all users for assignment
      const usersResponse = await fetch('http://localhost:8080/api/v1/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': apiKey,
        },
      });
      const usersData = await usersResponse.json();
      state.users = usersData.users || [];

      // Fetch all roles
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
      console.error('Failed to load business access data:', error);
      state.error = 'Failed to load data';
      state.loading = false;
    }
  });

  const handleGrantUserAccess = $(async () => {
    if (!state.selectedBusiness || !state.newUserAccess.user_id || state.newUserAccess.roles.length === 0) {
      state.error = 'Please select user and at least one role';
      return;
    }

    try {
      const token = authService.getToken();
      const response = await fetch('http://localhost:8080/api/v1/admin/grant-business-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
        },
        body: JSON.stringify({
          user_id: state.newUserAccess.user_id,
          business_id: state.selectedBusiness.business_id,
          roles: state.newUserAccess.roles,
        }),
      });

      if (response.ok) {
        // Refresh business access data
        const businessesResponse = await fetch('http://localhost:8080/api/v1/admin/business-access', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
          },
        });
        const businessesData = await businessesResponse.json();
        state.businesses = businessesData.businesses || [];

        state.showUserModal = false;
        state.newUserAccess = { user_id: '', roles: [] };
        state.success = 'User access granted successfully';
      } else {
        state.error = 'Failed to grant user access';
      }
    } catch {
      state.error = 'Network error occurred';
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRevokeAccess = $(async (userId: string, businessId: string) => {
    if (!confirm('Are you sure you want to revoke all access for this user?')) return;

    try {
      const token = authService.getToken();
      const response = await fetch('http://localhost:8080/api/v1/admin/revoke-business-access', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
        },
        body: JSON.stringify({
          user_id: userId,
          business_id: businessId,
        }),
      });

      if (response.ok) {
        // Refresh business access data
        const businessesResponse = await fetch('http://localhost:8080/api/v1/admin/business-access', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
          },
        });
        const businessesData = await businessesResponse.json();
        state.businesses = businessesData.businesses || [];

        state.success = 'User access revoked successfully';
      } else {
        state.error = 'Failed to revoke user access';
      }
    } catch {
      state.error = 'Network error occurred';
    }
  });

  const filteredBusinesses = state.businesses.filter(business =>
    business.business_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    business.business_code.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  if (state.loading) {
    return (
      <div class="flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div class="business-access-control p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">Business Access Control</h2>
        <div class="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search businesses..."
            class="px-4 py-2 border border-gray-300 rounded-md"
            value={state.searchTerm}
            onInput$={(e) => {
              state.searchTerm = (e.target as HTMLInputElement).value;
            }}
          />
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

      {/* Business Cards */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBusinesses.map((business) => (
          <div key={business.business_id} class="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{business.business_name}</h3>
                <p class="text-sm text-gray-500">Code: {business.business_code}</p>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-blue-600">{business.user_count}</div>
                <div class="text-xs text-gray-500">Total Users</div>
              </div>
            </div>

            {/* Stats */}
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="text-center p-3 bg-green-50 rounded">
                <div class="text-lg font-semibold text-green-600">{business.admin_count}</div>
                <div class="text-xs text-green-700">Admins</div>
              </div>
              <div class="text-center p-3 bg-blue-50 rounded">
                <div class="text-lg font-semibold text-blue-600">{business.roles.length}</div>
                <div class="text-xs text-blue-700">Active Roles</div>
              </div>
            </div>

            {/* Roles */}
            <div class="mb-4">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Active Roles:</h4>
              <div class="flex flex-wrap gap-1">
                {business.roles.slice(0, 3).map((role) => (
                  <span key={role.id} class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {role.name} ({role.user_count})
                  </span>
                ))}
                {business.roles.length > 3 && (
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                    +{business.roles.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div class="flex space-x-2">
              <button
                class="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                onClick$={() => {
                  state.selectedBusiness = business;
                  state.showUserModal = true;
                }}
              >
                Grant Access
              </button>
              <button
                class="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                onClick$={() => {
                  state.selectedBusiness = business;
                  // Navigate to detailed business management
                  window.location.href = `/admin/business/${business.business_id}/manage`;
                }}
              >
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Grant User Access Modal */}
      {state.showUserModal && state.selectedBusiness && (
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div class="mt-3">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Grant Access to {state.selectedBusiness.business_name}
              </h3>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Select User</label>
                  <select
                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={state.newUserAccess.user_id}
                    onChange$={(e) => {
                      state.newUserAccess.user_id = (e.target as HTMLSelectElement).value;
                    }}
                  >
                    <option value="">Choose a user...</option>
                    {state.users
                      .filter(user => !user.business_access?.some((access: any) => 
                        access.business_id === state.selectedBusiness?.business_id
                      ))
                      .map((user) => (
                      <option key={user.id} value={user.id}>
                        {`${user.name} (${user.email})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-3">Select Roles</label>
                  <div class="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded p-3">
                    {state.roles
                      .filter(role => !role.business_vertical_id || role.business_vertical_id === state.selectedBusiness?.business_id)
                      .map((role) => (
                      <label key={role.id} class="flex items-center">
                        <input
                          type="checkbox"
                          class="rounded border-gray-300 text-blue-600"
                          checked={state.newUserAccess.roles.includes(role.id)}
                          onChange$={() => {
                            const index = state.newUserAccess.roles.indexOf(role.id);
                            if (index > -1) {
                              state.newUserAccess.roles.splice(index, 1);
                            } else {
                              state.newUserAccess.roles.push(role.id);
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
              </div>

              <div class="flex justify-end space-x-3 mt-6">
                <button
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  onClick$={() => {
                    state.showUserModal = false;
                    state.selectedBusiness = null;
                    state.newUserAccess = { user_id: '', roles: [] };
                  }}
                >
                  Cancel
                </button>
                <button
                  class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick$={handleGrantUserAccess}
                >
                  Grant Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Summary */}
      <div class="mt-8 bg-white border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">Access Summary</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-blue-50 rounded">
            <div class="text-2xl font-bold text-blue-600">
              {state.businesses.length}
            </div>
            <div class="text-sm text-blue-700">Total Businesses</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded">
            <div class="text-2xl font-bold text-green-600">
              {state.businesses.reduce((sum, b) => sum + b.user_count, 0)}
            </div>
            <div class="text-sm text-green-700">Total Users</div>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded">
            <div class="text-2xl font-bold text-yellow-600">
              {state.businesses.reduce((sum, b) => sum + b.admin_count, 0)}
            </div>
            <div class="text-sm text-yellow-700">Total Admins</div>
          </div>
          <div class="text-center p-4 bg-purple-50 rounded">
            <div class="text-2xl font-bold text-purple-600">
              {state.businesses.reduce((sum, b) => sum + b.roles.length, 0)}
            </div>
            <div class="text-sm text-purple-700">Active Roles</div>
          </div>
        </div>
      </div>
    </div>
  );
});