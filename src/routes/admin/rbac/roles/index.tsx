// src/routes/admin/rbac/roles/index.tsx
/**
 * Unified Roles Management Page
 * Manages both Global Roles and Business Roles in a single interface
 */
import { component$, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { apiClient, createSSRApiClient } from '~/services';

interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

interface BusinessVertical {
  id: string;
  code: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  display_name?: string;
  description?: string;
  level: number;
  is_active: boolean;
  is_global: boolean;
  business_vertical_id?: string;
  business_vertical?: BusinessVertical;
  permissions?: Permission[];
  user_count?: number;
}

// Load initial data with routeLoader$
export const useRolesData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const [verticalsData, permissionsData] = await Promise.all([
      ssrApiClient.get<{ businesses?: BusinessVertical[]; data?: BusinessVertical[] }>('/admin/businesses'),
      ssrApiClient.get<Permission[]>('/admin/permissions'),
    ]);

    const verticals = verticalsData.businesses || verticalsData.data || [];
    const permissions = permissionsData || [];

    return {
      verticals,
      permissions,
    };
  } catch (error: any) {
    console.error('Failed to load roles data:', error);
    return {
      verticals: [],
      permissions: [],
    };
  }
});

export default component$(() => {
  const initialData = useRolesData();

  const state = useStore({
    roles: [] as Role[],
    verticals: initialData.value.verticals,
    permissions: initialData.value.permissions,

    // Filters
    filterType: 'all' as 'all' | 'global' | 'business',
    filterVerticalId: '',
    searchQuery: '',

    // UI state
    error: '',
    showModal: false,
    editingRole: null as Role | null,
    newRole: {
      name: '',
      display_name: '',
      description: '',
      level: 3,
      is_global: true,
      business_vertical_id: '',
      permission_ids: [] as string[],
    },
    saving: false,
    loading: false,
  });

  // Load all roles (both global and business) using unified endpoint
  const loadAllRoles = $(async () => {
    state.loading = true;
    try {
      const response = await apiClient.get<{ roles: Role[]; total: number }>(
        '/admin/roles/unified?include_business=true'
      );
      state.roles = response.roles || [];
    } catch (error: any) {
      state.error = error.message || 'Failed to load roles';
      console.error('Failed to load roles:', error);
    } finally {
      state.loading = false;
    }
  });

  // Load roles on mount
  useVisibleTask$(async () => {
    await loadAllRoles();
  });

  const openCreateModal = $(() => {
    state.editingRole = null;
    state.newRole = {
      name: '',
      display_name: '',
      description: '',
      level: 3,
      is_global: true,
      business_vertical_id: '',
      permission_ids: [],
    };
    state.showModal = true;
  });

  const openEditModal = $((role: Role) => {
    state.editingRole = role;
    state.newRole = {
      name: role.name,
      display_name: role.display_name || '',
      description: role.description || '',
      level: role.level,
      is_global: role.is_global,
      business_vertical_id: role.business_vertical_id || '',
      permission_ids: role.permissions?.map(p => p.id) || [],
    };
    state.showModal = true;
  });

  const handleSaveRole = $(async () => {
    state.saving = true;
    state.error = '';

    try {
      if (state.newRole.is_global) {
        // Save global role
        if (state.editingRole) {
          await apiClient.put(`/admin/roles/${state.editingRole.id}`, state.newRole);
        } else {
          await apiClient.post('/admin/roles', state.newRole);
        }
      } else {
        // Save business role
        if (!state.newRole.business_vertical_id) {
          throw new Error('Business vertical is required for business roles');
        }
        const vertical = state.verticals.find(v => v.id === state.newRole.business_vertical_id);
        if (!vertical) throw new Error('Vertical not found');

        if (state.editingRole) {
          await apiClient.put(`/business/${vertical.code}/roles/${state.editingRole.id}`, state.newRole);
        } else {
          await apiClient.post(`/business/${vertical.code}/roles`, state.newRole);
        }
      }

      await loadAllRoles();
      state.showModal = false;
    } catch (err: any) {
      state.error = err.message || 'Failed to save role';
    } finally {
      state.saving = false;
    }
  });

  const handleDeleteRole = $(async (role: Role) => {
    if (!confirm(`Are you sure you want to delete the role "${role.display_name || role.name}"?`)) return;

    try {
      if (role.is_global) {
        await apiClient.delete(`/admin/roles/${role.id}`);
      } else {
        const vertical = state.verticals.find(v => v.id === role.business_vertical_id);
        if (!vertical) throw new Error('Vertical not found');
        await apiClient.delete(`/business/${vertical.code}/roles/${role.id}`);
      }

      state.roles = state.roles.filter(r => r.id !== role.id);
    } catch (err: any) {
      state.error = err.message || 'Failed to delete role';
    }
  });

  // Filter roles based on selected filters
  const getFilteredRoles = () => {
    let filtered = state.roles;

    // Filter by type
    if (state.filterType === 'global') {
      filtered = filtered.filter(r => r.is_global);
    } else if (state.filterType === 'business') {
      filtered = filtered.filter(r => !r.is_global);
    }

    // Filter by vertical (for business roles)
    if (state.filterVerticalId && state.filterType !== 'global') {
      filtered = filtered.filter(r => r.business_vertical_id === state.filterVerticalId);
    }

    // Filter by search query
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        (r.name?.toLowerCase().includes(query)) ||
        (r.display_name?.toLowerCase().includes(query)) ||
        (r.description?.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  // Group permissions by resource
  const getGroupedPermissions = () => {
    const grouped: Record<string, Permission[]> = {};
    state.permissions.forEach(p => {
      const resource = p.resource || 'general';
      if (!grouped[resource]) grouped[resource] = [];
      grouped[resource].push(p);
    });
    return grouped;
  };

  const filteredRoles = getFilteredRoles();

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container mx-auto max-w-7xl">
        <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold text-dark-800">Roles Management</h1>
            <p class="text-dark-600 mt-2">Manage global and business-specific roles</p>
          </div>
          <button onClick$={openCreateModal} class="btn-primary px-6 py-3 rounded-lg font-semibold">
            + Create Role
          </button>
        </div>

        {state.error && (
          <div class="alert-danger rounded-lg p-4 mb-6 bg-red-50 border-l-4 border-red-500">
            <p class="text-red-800">{state.error}</p>
          </div>
        )}

        {/* Filters */}
        <div class="card bg-white shadow-lg rounded-xl p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <label class="block text-sm font-medium text-dark-700 mb-2">Role Type</label>
              <select
                value={state.filterType}
                onChange$={(e) => {
                  state.filterType = (e.target as HTMLSelectElement).value as any;
                  if (state.filterType === 'global') {
                    state.filterVerticalId = '';
                  }
                }}
                class="w-full px-4 py-2 border border-light-300 rounded-lg"
              >
                <option value="all">All Roles</option>
                <option value="global">Global Roles Only</option>
                <option value="business">Business Roles Only</option>
              </select>
            </div>

            {/* Vertical Filter (only for business roles) */}
            <div>
              <label class="block text-sm font-medium text-dark-700 mb-2">Business Vertical</label>
              <select
                value={state.filterVerticalId}
                onChange$={(e) => {
                  state.filterVerticalId = (e.target as HTMLSelectElement).value;
                }}
                disabled={state.filterType === 'global'}
                class="w-full px-4 py-2 border border-light-300 rounded-lg disabled:opacity-50 disabled:bg-gray-100"
              >
                <option value="">All Verticals</option>
                {state.verticals.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label class="block text-sm font-medium text-dark-700 mb-2">Search</label>
              <input
                type="text"
                value={state.searchQuery}
                onInput$={(e) => {
                  state.searchQuery = (e.target as HTMLInputElement).value;
                }}
                placeholder="Search by name or description..."
                class="w-full px-4 py-2 border border-light-300 rounded-lg"
              />
            </div>
          </div>

          {/* Filter Summary */}
          <div class="mt-4 flex items-center gap-2 text-sm text-dark-600">
            <span class="font-medium">Showing:</span>
            <span>{filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''}</span>
            {state.filterType !== 'all' && (
              <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {state.filterType === 'global' ? 'Global Only' : 'Business Only'}
              </span>
            )}
            {state.filterVerticalId && (
              <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                {state.verticals.find(v => v.id === state.filterVerticalId)?.name}
              </span>
            )}
          </div>
        </div>

        {/* Roles Table */}
        <div class="card bg-white shadow-lg rounded-xl p-6">
          {state.loading ? (
            <div class="text-center py-12">
              <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
              <p class="text-dark-600">Loading roles...</p>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div class="text-center py-12">
              <div class="text-6xl text-light-300 mb-4">👥</div>
              <h3 class="text-xl font-semibold text-dark-800 mb-2">No Roles Found</h3>
              <p class="text-dark-600 mb-6">
                {state.searchQuery || state.filterType !== 'all' || state.filterVerticalId
                  ? 'Try adjusting your filters'
                  : 'Create your first role'}
              </p>
              {!state.searchQuery && state.filterType === 'all' && !state.filterVerticalId && (
                <button onClick$={openCreateModal} class="btn-primary px-6 py-3 rounded-lg">Create Role</button>
              )}
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-light-200">
                <thead class="bg-light-50">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">Role Name</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">Type</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">Vertical</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">Level</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">Permissions</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">Status</th>
                    <th class="px-6 py-4 text-right text-xs font-semibold text-dark-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-light-200">
                  {filteredRoles.map((role) => (
                    <tr key={role.id} class="hover:bg-light-50 transition">
                      <td class="px-6 py-4">
                        <div>
                          <div class="text-sm font-medium text-dark-800">{role.display_name || role.name}</div>
                          {role.description && <div class="text-xs text-dark-500 mt-1">{role.description}</div>}
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        {role.is_global ? (
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Global
                          </span>
                        ) : (
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Business
                          </span>
                        )}
                      </td>
                      <td class="px-6 py-4 text-sm text-dark-700">
                        {role.is_global ? (
                          <span class="text-gray-400">-</span>
                        ) : (
                          role.business_vertical?.name || 'Unknown'
                        )}
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Level {role.level}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm text-dark-700">{role.permissions?.length || 0}</td>
                      <td class="px-6 py-4">
                        {role.is_active ? (
                          <span class="text-green-600 text-sm font-medium">Active</span>
                        ) : (
                          <span class="text-gray-400 text-sm">Inactive</span>
                        )}
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2">
                          <button
                            onClick$={() => openEditModal(role)}
                            class="text-blue-600 hover:text-blue-700 px-3 py-1 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick$={() => handleDeleteRole(role)}
                            class="text-red-600 hover:text-red-700 px-3 py-1 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {state.showModal && (
          <div class="fixed inset-0 bg-dark-950/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 class="text-2xl font-bold text-dark-800 mb-6">
                {state.editingRole ? 'Edit Role' : 'Create Role'}
              </h3>

              {state.error && (
                <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {state.error}
                </div>
              )}

              <div class="space-y-4">
                {/* Role Type Selection (only for new roles) */}
                {!state.editingRole && (
                  <div>
                    <label class="block text-sm font-medium text-dark-700 mb-2">Role Type *</label>
                    <div class="flex gap-4">
                      <label class="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          checked={state.newRole.is_global}
                          onChange$={() => {
                            state.newRole.is_global = true;
                            state.newRole.business_vertical_id = '';
                          }}
                          class="mr-2"
                        />
                        <span class="text-sm">Global Role (System-wide)</span>
                      </label>
                      <label class="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          checked={!state.newRole.is_global}
                          onChange$={() => {
                            state.newRole.is_global = false;
                          }}
                          class="mr-2"
                        />
                        <span class="text-sm">Business Role (Vertical-specific)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Business Vertical (only for business roles) */}
                {!state.newRole.is_global && (
                  <div>
                    <label class="block text-sm font-medium text-dark-700 mb-2">Business Vertical *</label>
                    <select
                      value={state.newRole.business_vertical_id}
                      onChange$={(e) => {
                        state.newRole.business_vertical_id = (e.target as HTMLSelectElement).value;
                      }}
                      class="w-full px-4 py-3 border border-light-300 rounded-lg"
                    >
                      <option value="">Select Business Vertical</option>
                      {state.verticals.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label class="block text-sm font-medium text-dark-700 mb-2">Role Name *</label>
                  <input
                    type="text"
                    value={state.newRole.name}
                    onInput$={(e) => { state.newRole.name = (e.target as HTMLInputElement).value; }}
                    class="w-full px-4 py-3 border border-light-300 rounded-lg"
                    placeholder="e.g., admin"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-dark-700 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={state.newRole.display_name}
                    onInput$={(e) => { state.newRole.display_name = (e.target as HTMLInputElement).value; }}
                    class="w-full px-4 py-3 border border-light-300 rounded-lg"
                    placeholder="e.g., Administrator"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-dark-700 mb-2">Description</label>
                  <textarea
                    value={state.newRole.description}
                    onInput$={(e) => { state.newRole.description = (e.target as HTMLTextAreaElement).value; }}
                    rows={3}
                    class="w-full px-4 py-3 border border-light-300 rounded-lg"
                    placeholder="Role description"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-sm font-medium text-dark-700 mb-2">Level *</label>
                  <select
                    value={state.newRole.level}
                    onChange$={(e) => { state.newRole.level = parseInt((e.target as HTMLSelectElement).value); }}
                    class="w-full px-4 py-3 border border-light-300 rounded-lg"
                  >
                    <option value={0}>Level 0 - Super Admin</option>
                    <option value={1}>Level 1 - System Admin</option>
                    <option value={2}>Level 2 - Business Admin</option>
                    <option value={3}>Level 3 - Manager</option>
                    <option value={4}>Level 4 - Supervisor</option>
                    <option value={5}>Level 5 - Operator</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-dark-700 mb-3">Permissions</label>
                  <div class="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p class="text-xs text-blue-800">
                      💡 <strong>Wildcard Support:</strong> Permissions with '*' grant access to all actions/resources.
                      Examples: <code class="bg-blue-100 px-1 rounded">*:*</code> (full access),
                      <code class="bg-blue-100 px-1 rounded">user:*</code> (all user actions),
                      <code class="bg-blue-100 px-1 rounded">*:read</code> (read all resources)
                    </p>
                  </div>
                  <div class="max-h-64 overflow-y-auto border border-light-300 rounded-lg p-4">
                    {Object.entries(getGroupedPermissions()).map(([resource, perms]) => (
                      <div key={resource} class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                          <h4 class="text-sm font-semibold text-dark-700 capitalize">
                            {resource === '*' ? '⭐ All Resources (Wildcard)' : resource}
                          </h4>
                          <button
                            type="button"
                            onClick$={() => {
                              const permIds = perms.map((p: any) => p.id);
                              const allSelected = permIds.every((id: string) => state.newRole.permission_ids.includes(id));
                              if (allSelected) {
                                state.newRole.permission_ids = state.newRole.permission_ids.filter(id => !permIds.includes(id));
                              } else {
                                state.newRole.permission_ids = [...new Set([...state.newRole.permission_ids, ...permIds])];
                              }
                            }}
                            class="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {perms.every((p: any) => state.newRole.permission_ids.includes(p.id)) ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div class="space-y-2">
                          {perms.map((perm: any) => (
                            <label key={perm.id} class="flex items-center cursor-pointer hover:bg-light-50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={state.newRole.permission_ids.includes(perm.id)}
                                onChange$={(e) => {
                                  const checked = (e.target as HTMLInputElement).checked;
                                  if (checked) {
                                    state.newRole.permission_ids = [...state.newRole.permission_ids, perm.id];
                                  } else {
                                    state.newRole.permission_ids = state.newRole.permission_ids.filter(id => id !== perm.id);
                                  }
                                }}
                                class="mr-2"
                              />
                              <span class={`text-sm ${perm.name.includes('*') ? 'font-semibold text-blue-700' : 'text-dark-700'}`}>
                                {perm.name}
                                {perm.name.includes('*') && <span class="ml-1 text-xs text-blue-500">(wildcard)</span>}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div class="flex gap-4 mt-6">
                <button
                  onClick$={handleSaveRole}
                  disabled={state.saving}
                  class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                >
                  {state.saving ? 'Saving...' : 'Save Role'}
                </button>
                <button
                  onClick$={() => { state.showModal = false; state.error = ''; }}
                  disabled={state.saving}
                  class="flex-1 px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
