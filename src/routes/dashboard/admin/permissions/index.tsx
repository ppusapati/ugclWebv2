import { component$, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { roleService } from '~/services/role.service';
import { authService } from '~/services/auth-enhanced.service';
import type { Permission } from '~/services/types';

export default component$(() => {
  const nav = useNavigate();

  const state = useStore<{
    permissions: Permission[];
    groupedPermissions: Record<string, Permission[]>;
    loading: boolean;
    error: string;
    showModal: boolean;
    newPermission: {
      name: string;
      resource: string;
      action: string;
      description: string;
    };
    saving: boolean;
    searchTerm: string;
    filterResource: string;
  }>({
    permissions: [],
    groupedPermissions: {},
    loading: true,
    error: '',
    showModal: false,
    newPermission: {
      name: '',
      resource: '',
      action: '',
      description: '',
    },
    saving: false,
    searchTerm: '',
    filterResource: '',
  });

  useVisibleTask$(async () => {
    const user = authService.getUser();
    if (!user?.is_super_admin) {
      nav('/dashboard');
      return;
    }

    await loadPermissions();
  });

  const loadPermissions = $(async () => {
    state.loading = true;
    state.error = '';

    try {
      const permissions = await roleService.getPermissions();
      state.permissions = permissions;
      groupPermissions();
    } catch (error: any) {
      state.error = error.message || 'Failed to load permissions';
    } finally {
      state.loading = false;
    }
  });

  const groupPermissions = $(() => {
    const grouped: Record<string, Permission[]> = {};

    state.permissions.forEach(perm => {
      const resource = perm.resource || 'general';
      if (!grouped[resource]) {
        grouped[resource] = [];
      }
      grouped[resource].push(perm);
    });

    state.groupedPermissions = grouped;
  });

  const openCreateModal = $(() => {
    state.newPermission = {
      name: '',
      resource: '',
      action: '',
      description: '',
    };
    state.showModal = true;
  });

  const handleCreate = $(async () => {
    state.saving = true;
    state.error = '';

    try {
      await roleService.createPermission(state.newPermission);
      await loadPermissions();
      state.showModal = false;
    } catch (error: any) {
      state.error = error.message || 'Failed to create permission';
    } finally {
      state.saving = false;
    }
  });

  const filteredResources = $(() => {
    let resources = Object.keys(state.groupedPermissions);

    if (state.filterResource) {
      resources = resources.filter(r =>
        r.toLowerCase().includes(state.filterResource.toLowerCase())
      );
    }

    return resources;
  });

  const getFilteredPermissions = $((resource: string) => {
    const perms = state.groupedPermissions[resource] || [];

    if (!state.searchTerm) return perms;

    return perms.filter(p =>
      p.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      p.action.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(state.searchTerm.toLowerCase()))
    );
  });

  if (state.loading) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="text-4xl mb-4">⏳</div>
          <p>Loading permissions...</p>
        </div>
      </div>
    );
  }

  const uniqueResources = Object.keys(state.groupedPermissions);
  const uniqueActions = [...new Set(state.permissions.map(p => p.action))];

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-dark-900 py-8 px-4">
      <div class="max-w-7xl mx-auto">
        {/* Header */}
        <div class="mb-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Permission Management
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
              Manage system permissions and access controls
            </p>
          </div>
          <button
            onClick$={openCreateModal}
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            + Create Permission
          </button>
        </div>

        {/* Error Display */}
        {state.error && (
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {state.error}
          </div>
        )}

        {/* Filters */}
        <div class="bg-white dark:bg-dark-800 rounded-lg shadow-md p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Permissions
              </label>
              <input
                type="text"
                value={state.searchTerm}
                onInput$={(e) => {
                  state.searchTerm = (e.target as HTMLInputElement).value;
                }}
                placeholder="Search by name, action, or description"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Resource
              </label>
              <select
                value={state.filterResource}
                onChange$={(e) => {
                  state.filterResource = (e.target as HTMLSelectElement).value;
                }}
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <option value="">All Resources</option>
                {uniqueResources.map(resource => (
                  <option key={resource} value={resource}>
                    {resource}
                  </option>
                ))}
              </select>
            </div>
            <div class="flex items-end">
              <div class="text-center w-full bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-gray-400">Total Permissions</p>
                <p class="text-2xl font-bold text-blue-600">{state.permissions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Grid */}
        <div class="space-y-6">
          {filteredResources().map((resource) => {
            const permissions = getFilteredPermissions(resource);
            if (permissions.length === 0) return null;

            return (
              <div
                key={resource}
                class="bg-white dark:bg-dark-800 rounded-lg shadow-md overflow-hidden"
              >
                {/* Resource Header */}
                <div class="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
                  <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold text-white capitalize">
                      {resource}
                    </h2>
                    <span class="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-semibold">
                      {permissions.length} permissions
                    </span>
                  </div>
                </div>

                {/* Permissions Table */}
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-dark-700">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                          Permission Name
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                          Action
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {permissions.map((perm) => (
                        <tr key={perm.id} class="hover:bg-gray-50 dark:hover:bg-dark-700">
                          <td class="px-6 py-4">
                            <div class="text-sm font-medium text-gray-900 dark:text-white">
                              {perm.name}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              ID: {perm.id}
                            </div>
                          </td>
                          <td class="px-6 py-4">
                            <span
                              class={`px-2 py-1 rounded-full text-xs font-semibold ${
                                perm.action === 'read'
                                  ? 'bg-green-100 text-green-800'
                                  : perm.action === 'create'
                                  ? 'bg-blue-100 text-blue-800'
                                  : perm.action === 'update'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : perm.action === 'delete'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {perm.action}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {perm.description || '-'}
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

        {/* Create Permission Modal */}
        {state.showModal && (
          <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white dark:bg-dark-800 rounded-xl shadow-xl p-8 max-w-md w-full">
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Create New Permission
              </h3>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Permission Name *
                  </label>
                  <input
                    type="text"
                    value={state.newPermission.name}
                    onInput$={(e) => {
                      state.newPermission.name = (e.target as HTMLInputElement).value;
                    }}
                    placeholder="e.g., read_reports"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Resource *
                  </label>
                  <input
                    type="text"
                    value={state.newPermission.resource}
                    onInput$={(e) => {
                      state.newPermission.resource = (e.target as HTMLInputElement).value;
                    }}
                    placeholder="e.g., reports, users, admin"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Action *
                  </label>
                  <select
                    value={state.newPermission.action}
                    onChange$={(e) => {
                      state.newPermission.action = (e.target as HTMLSelectElement).value;
                    }}
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    <option value="">Select action</option>
                    {uniqueActions.map(action => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                    <option value="read">read</option>
                    <option value="create">create</option>
                    <option value="update">update</option>
                    <option value="delete">delete</option>
                    <option value="manage">manage</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={state.newPermission.description}
                    onInput$={(e) => {
                      state.newPermission.description = (e.target as HTMLTextAreaElement).value;
                    }}
                    rows={3}
                    placeholder="Describe what this permission allows"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  ></textarea>
                </div>
              </div>

              <div class="flex gap-4 mt-6">
                <button
                  onClick$={handleCreate}
                  disabled={state.saving || !state.newPermission.name || !state.newPermission.resource || !state.newPermission.action}
                  class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state.saving ? 'Creating...' : 'Create Permission'}
                </button>
                <button
                  onClick$={() => { state.showModal = false; }}
                  disabled={state.saving}
                  class="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold"
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
