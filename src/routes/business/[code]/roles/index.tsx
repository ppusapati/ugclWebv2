import { component$, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { roleService } from '~/services/role.service';
import { businessService } from '~/services/business.service';
import type { Role, Permission, BusinessVertical } from '~/services/types';

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const businessCode = loc.params.code;

  const state = useStore<{
    business: BusinessVertical | null;
    roles: Role[];
    permissions: Permission[];
    loading: boolean;
    error: string;
    showModal: boolean;
    editingRole: Role | null;
    roleForm: {
      name: string;
      display_name: string;
      description: string;
      level: number;
      permission_ids: string[];
      is_global: boolean;
    };
    saving: boolean;
  }>({
    business: null,
    roles: [],
    permissions: [],
    loading: true,
    error: '',
    showModal: false,
    editingRole: null,
    roleForm: {
      name: '',
      display_name: '',
      description: '',
      level: 3,
      permission_ids: [],
      is_global: false,
    },
    saving: false,
  });

  const loadBusiness = $(async () => {
    try {
      // Fallback: fetch all businesses and find by code
      const businesses = await businessService.getAllBusinesses();
      state.business = businesses.data?.find(b => b.code === businessCode) || null;
    } catch (error: any) {
      state.error = error.message || 'Failed to load business';
    }
  });

  const loadRoles = $(async () => {
    state.loading = true;
    try {
      state.roles = await roleService.getBusinessRoles(businessCode);
    } catch (error: any) {
      state.error = error.message || 'Failed to load roles';
    } finally {
      state.loading = false;
    }
  });

  const loadPermissions = $(async () => {
    try {
      state.permissions = await roleService.getPermissions();
    } catch {
      console.error('Failed to load permissions');
    }
  });

  useVisibleTask$(async () => {
    await Promise.all([loadBusiness(), loadRoles(), loadPermissions()]);
  });

  const openCreateModal = $(() => {
    state.editingRole = null;
    state.roleForm = {
      name: '',
      display_name: '',
      description: '',
      level: 3,
      permission_ids: [],
      is_global: false,
    };
    state.showModal = true;
  });

  const openEditModal = $((role: Role) => {
    state.editingRole = role;
    state.roleForm = {
      name: role.name,
      display_name: role.display_name || '',
      description: role.description || '',
      level: role.level,
      permission_ids: role.permissions?.map(p => p.id) || [],
      is_global: role.is_global || false,
    };
    state.showModal = true;
  });

  const handleSave = $(async () => {
    state.saving = true;
    state.error = '';

    try {
      if (state.editingRole) {
        await roleService.updateBusinessRole(
          businessCode,
          state.editingRole.id,
          state.roleForm
          
        );
      } else {
        await roleService.createBusinessRole(businessCode, state.roleForm);
      }

      await loadRoles();
      state.showModal = false;
    } catch (error: any) {
      state.error = error.message || 'Failed to save role';
    } finally {
      state.saving = false;
    }
  });

  const handleDelete = $(async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      await roleService.deleteBusinessRole(businessCode, roleId);
      await loadRoles();
    } catch (error: any) {
      state.error = error.message || 'Failed to delete role';
    }
  });

  const groupedPermissions = $(() => {
    const grouped: Record<string, Permission[]> = {};
    state.permissions.forEach(p => {
      const resource = p.resource || 'general';
      if (!grouped[resource]) grouped[resource] = [];
      grouped[resource].push(p);
    });
    return grouped;
  });

  if (state.loading) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="text-4xl mb-4">⏳</div>
          <p>Loading business roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-dark-900 py-8 px-4">
      <div class="max-w-7xl mx-auto">
        {/* Header */}
        <div class="mb-6">
          <button
            onClick$={() => nav(`/business/${businessCode}/sites`)}
            class="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            <span>←</span> Back to {state.business?.name || 'Business'}
          </button>

          <div class="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                Business Roles
              </h1>
              <p class="text-gray-600 dark:text-gray-400 mt-2">
                Manage roles for {state.business?.name}
              </p>
            </div>
            <button
              onClick$={openCreateModal}
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              + Create Role
            </button>
          </div>
        </div>

        {/* Error */}
        {state.error && (
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {state.error}
          </div>
        )}

        {/* Roles List */}
        <div class="bg-white dark:bg-dark-800 rounded-lg shadow-md overflow-hidden">
          {state.roles.length === 0 ? (
            <div class="text-center py-12">
              <div class="text-6xl mb-4">👥</div>
              <h3 class="text-xl font-semibold mb-2">No Roles Yet</h3>
              <p class="text-gray-600 mb-6">Create your first business role</p>
              <button
                onClick$={openCreateModal}
                class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Role
              </button>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Role Name
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Level
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Permissions
                    </th>
                    <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {state.roles.map((role) => (
                    <tr key={role.id} class="hover:bg-gray-50 dark:hover:bg-dark-700">
                      <td class="px-6 py-4">
                        <div>
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {role.display_name || role.name}
                          </div>
                          {role.description && (
                            <div class="text-xs text-gray-500">{role.description}</div>
                          )}
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          Level {role.level}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {role.permissions?.length || 0} permissions
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2">
                          <button
                            onClick$={() => openEditModal(role)}
                            class="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick$={() => handleDelete(role.id)}
                            class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
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

        {/* Role Modal */}
        {state.showModal && (
          <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white dark:bg-dark-800 rounded-xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 class="text-2xl font-bold mb-6">
                {state.editingRole ? 'Edit Role' : 'Create Role'}
              </h3>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Role Name *</label>
                  <input
                    type="text"
                    value={state.roleForm.name}
                    onInput$={(e) => {
                      state.roleForm.name = (e.target as HTMLInputElement).value;
                    }}
                    class="w-full px-4 py-2 border rounded-lg"
                    placeholder="e.g., manager"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Display Name</label>
                  <input
                    type="text"
                    value={state.roleForm.display_name}
                    onInput$={(e) => {
                      state.roleForm.display_name = (e.target as HTMLInputElement).value;
                    }}
                    class="w-full px-4 py-2 border rounded-lg"
                    placeholder="e.g., Business Manager"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={state.roleForm.description}
                    onInput$={(e) => {
                      state.roleForm.description = (e.target as HTMLTextAreaElement).value;
                    }}
                    rows={3}
                    class="w-full px-4 py-2 border rounded-lg"
                    placeholder="Role description"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Level *</label>
                  <select
                    value={state.roleForm.level}
                    onChange$={(e) => {
                      state.roleForm.level = parseInt((e.target as HTMLSelectElement).value);
                    }}
                    class="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value={1}>Level 1 - Admin</option>
                    <option value={2}>Level 2 - Manager</option>
                    <option value={3}>Level 3 - Supervisor</option>
                    <option value={4}>Level 4 - Operator</option>
                    <option value={5}>Level 5 - User</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-3">Permissions</label>
                  <div class="max-h-64 overflow-y-auto border rounded-lg p-4">
                    {Object.entries(groupedPermissions()).map(([resource, perms]: [string, any[]]) => (
                      <div key={resource} class="mb-4">
                        <h4 class="text-sm font-semibold mb-2 capitalize">{resource}</h4>
                        <div class="space-y-2">
                          {perms.map((perm: any) => (
                            <label key={perm.id} class="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={state.roleForm.permission_ids.includes(perm.id)}
                                onChange$={(e) => {
                                  const checked = (e.target as HTMLInputElement).checked;
                                  if (checked) {
                                    state.roleForm.permission_ids = [
                                      ...state.roleForm.permission_ids,
                                      perm.id,
                                    ];
                                  } else {
                                    state.roleForm.permission_ids =
                                      state.roleForm.permission_ids.filter(id => id !== perm.id);
                                  }
                                }}
                                class="mr-2"
                              />
                              <span class="text-sm">{perm.name}</span>
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
                  onClick$={handleSave}
                  disabled={state.saving}
                  class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {state.saving ? 'Saving...' : 'Save Role'}
                </button>
                <button
                  onClick$={() => { state.showModal = false; }}
                  disabled={state.saving}
                  class="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
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
