// src/components/auth/permission-management.tsx
import { component$, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { authService } from '~/services/auth.service';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  business_vertical_id?: string;
  is_system_permission: boolean;
}

interface PermissionCategory {
  name: string;
  description: string;
  permissions: Permission[];
}

export const PermissionManagement = component$(() => {
  const state = useStore({
    permissions: [] as Permission[],
    categories: [] as PermissionCategory[],
    businesses: [] as any[],
    loading: true,
    showCreateModal: false,
    editingPermission: null as Permission | null,
    newPermission: {
      name: '',
      description: '',
      category: '',
      business_vertical_id: '',
    },
    error: '',
    success: '',
    selectedCategory: 'all',
    selectedBusiness: 'all',
  });

  useVisibleTask$(async () => {
    try {
      const token = authService.getToken();
      const apiKey = '87339ea3-1add-4689-ae57-3128ebd03c4f';

      // Fetch permissions
      const permissionsResponse = await fetch('http://localhost:8080/api/v1/admin/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': apiKey,
        },
      });
      const permissionsData = await permissionsResponse.json();
      state.permissions = permissionsData.permissions || [];

      // Fetch businesses
      const businessesResponse = await fetch('http://localhost:8080/api/v1/admin/businesses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': apiKey,
        },
      });
      const businessesData = await businessesResponse.json();
      state.businesses = businessesData.businesses || [];

      // Group permissions by category
      const categoryMap = new Map<string, PermissionCategory>();
      state.permissions.forEach(permission => {
        if (!categoryMap.has(permission.category)) {
          categoryMap.set(permission.category, {
            name: permission.category,
            description: `${permission.category} related permissions`,
            permissions: []
          });
        }
        categoryMap.get(permission.category)!.permissions.push(permission);
      });
      state.categories = Array.from(categoryMap.values());

      state.loading = false;
    } catch (error) {
      console.error('Failed to load permissions:', error);
      state.error = 'Failed to load data';
      state.loading = false;
    }
  });

  const handleCreatePermission = $(async () => {
    try {
      const token = authService.getToken();
      const response = await fetch('http://localhost:8080/api/v1/admin/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
        },
        body: JSON.stringify({
          ...state.newPermission,
          business_vertical_id: state.newPermission.business_vertical_id || null,
        }),
      });

      if (response.ok) {
        const newPermission = await response.json();
        state.permissions.push(newPermission.permission);
        
        // Update categories
        const categoryMap = new Map<string, PermissionCategory>();
        state.permissions.forEach(permission => {
          if (!categoryMap.has(permission.category)) {
            categoryMap.set(permission.category, {
              name: permission.category,
              description: `${permission.category} related permissions`,
              permissions: []
            });
          }
          categoryMap.get(permission.category)!.permissions.push(permission);
        });
        state.categories = Array.from(categoryMap.values());

        state.showCreateModal = false;
        state.newPermission = { name: '', description: '', category: '', business_vertical_id: '' };
        state.success = 'Permission created successfully';
      } else {
        state.error = 'Failed to create permission';
      }
    } catch (error) {
      state.error = 'Network error occurred';
    }
  });

  const handleDeletePermission = $(async (permissionId: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;

    try {
      const token = authService.getToken();
      const response = await fetch(`http://localhost:8080/api/v1/admin/permissions/${permissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
        },
      });

      if (response.ok) {
        state.permissions = state.permissions.filter(permission => permission.id !== permissionId);
        
        // Update categories
        const categoryMap = new Map<string, PermissionCategory>();
        state.permissions.forEach(permission => {
          if (!categoryMap.has(permission.category)) {
            categoryMap.set(permission.category, {
              name: permission.category,
              description: `${permission.category} related permissions`,
              permissions: []
            });
          }
          categoryMap.get(permission.category)!.permissions.push(permission);
        });
        state.categories = Array.from(categoryMap.values());

        state.success = 'Permission deleted successfully';
      } else {
        state.error = 'Failed to delete permission';
      }
    } catch (error) {
      state.error = 'Network error occurred';
    }
  });

  const filteredPermissions = state.permissions.filter(permission => {
    const categoryMatch = state.selectedCategory === 'all' || permission.category === state.selectedCategory;
    const businessMatch = state.selectedBusiness === 'all' || 
      (state.selectedBusiness === 'global' && !permission.business_vertical_id) ||
      permission.business_vertical_id === state.selectedBusiness;
    return categoryMatch && businessMatch;
  });

  if (state.loading) {
    return (
      <div class="flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div class="permission-management p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">Permission Management</h2>
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick$={() => { state.showCreateModal = true; }}
        >
          Create New Permission
        </button>
      </div>

      {/* Filters */}
      <div class="flex items-center space-x-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            class="border border-gray-300 rounded-md px-3 py-2"
            value={state.selectedCategory}
            onChange$={(e) => {
              state.selectedCategory = (e.target as HTMLSelectElement).value;
            }}
          >
            <option value="all">All Categories</option>
            {Array.from(new Set(state.permissions.map(p => p.category))).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Business Scope</label>
          <select
            class="border border-gray-300 rounded-md px-3 py-2"
            value={state.selectedBusiness}
            onChange$={(e) => {
              state.selectedBusiness = (e.target as HTMLSelectElement).value;
            }}
          >
            <option value="all">All Scopes</option>
            <option value="global">Global Permissions</option>
            {state.businesses.map(business => (
              <option key={business.id} value={business.id}>
                {`${business.name} (${business.code})`}
              </option>
            ))}
          </select>
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

      {/* Permissions by Category */}
      <div class="space-y-6">
        {state.categories
          .filter(category => 
            state.selectedCategory === 'all' || category.name === state.selectedCategory
          )
          .map((category) => {
            const categoryPermissions = category.permissions.filter(permission => {
              const businessMatch = state.selectedBusiness === 'all' || 
                (state.selectedBusiness === 'global' && !permission.business_vertical_id) ||
                permission.business_vertical_id === state.selectedBusiness;
              return businessMatch;
            });

            if (categoryPermissions.length === 0) return null;

            return (
              <div key={category.name} class="bg-white border rounded-lg overflow-hidden">
                <div class="bg-gray-50 px-6 py-4 border-b">
                  <h3 class="text-lg font-medium text-gray-900 capitalize">
                    {category.name} Permissions
                  </h3>
                  <p class="text-sm text-gray-600">{categoryPermissions.length} permissions</p>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Permission Name
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scope
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      {categoryPermissions.map((permission) => (
                        <tr key={permission.id}>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">{permission.name}</div>
                          </td>
                          <td class="px-6 py-4">
                            <div class="text-sm text-gray-500">{permission.description}</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              permission.business_vertical_id 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {permission.business_vertical_id 
                                ? state.businesses.find(b => b.id === permission.business_vertical_id)?.name || 'Business'
                                : 'Global'
                              }
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              permission.is_system_permission 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {permission.is_system_permission ? 'System' : 'Custom'}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              class="text-indigo-600 hover:text-indigo-900 mr-4"
                              onClick$={() => {
                                state.editingPermission = { ...permission };
                                state.showCreateModal = true;
                              }}
                            >
                              Edit
                            </button>
                            {!permission.is_system_permission && (
                              <button
                                class="text-red-600 hover:text-red-900"
                                onClick$={() => handleDeletePermission(permission.id)}
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
      </div>

      {/* Create/Edit Permission Modal */}
      {state.showCreateModal && (
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div class="mt-3">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                {state.editingPermission ? 'Edit Permission' : 'Create New Permission'}
              </h3>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Permission Name</label>
                  <input
                    type="text"
                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., read_reports, manage_users"
                    value={state.editingPermission ? state.editingPermission.name : state.newPermission.name}
                    onInput$={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      if (state.editingPermission) {
                        state.editingPermission.name = value;
                      } else {
                        state.newPermission.name = value;
                      }
                    }}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Describe what this permission allows"
                    value={state.editingPermission ? state.editingPermission.description : state.newPermission.description}
                    onInput$={(e) => {
                      const value = (e.target as HTMLTextAreaElement).value;
                      if (state.editingPermission) {
                        state.editingPermission.description = value;
                      } else {
                        state.newPermission.description = value;
                      }
                    }}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., admin, business, reports"
                    value={state.editingPermission ? state.editingPermission.category : state.newPermission.category}
                    onInput$={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      if (state.editingPermission) {
                        state.editingPermission.category = value;
                      } else {
                        state.newPermission.category = value;
                      }
                    }}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Business Scope</label>
                  <select
                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={state.editingPermission ? (state.editingPermission.business_vertical_id || '') : state.newPermission.business_vertical_id}
                    onChange$={(e) => {
                      const value = (e.target as HTMLSelectElement).value;
                      if (state.editingPermission) {
                        state.editingPermission.business_vertical_id = value || undefined;
                      } else {
                        state.newPermission.business_vertical_id = value;
                      }
                    }}
                  >
                    <option value="">Global Permission</option>
                    {state.businesses.map(business => (
                      <option key={business.id} value={business.id}>
                        {`${business.name} (${business.code})`}
                      </option>
                    ))}
                  </select>
                  <p class="mt-1 text-xs text-gray-500">
                    Global permissions apply to all businesses, business-specific permissions only apply to that business
                  </p>
                </div>
              </div>

              <div class="flex justify-end space-x-3 mt-6">
                <button
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  onClick$={() => {
                    state.showCreateModal = false;
                    state.editingPermission = null;
                    state.newPermission = { name: '', description: '', category: '', business_vertical_id: '' };
                  }}
                >
                  Cancel
                </button>
                <button
                  class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick$={handleCreatePermission}
                >
                  {state.editingPermission ? 'Update Permission' : 'Create Permission'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});