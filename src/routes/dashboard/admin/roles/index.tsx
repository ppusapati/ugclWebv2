// src/routes/admin/roles/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { roleService, authService } from '~/services';
import type { Role, Permission } from '~/services';

export default component$(() => {
  const nav = useNavigate();

  const roles = useSignal<Role[]>([]);
  const permissions = useSignal<Permission[]>([]);
  const loading = useSignal(true);
  const error = useSignal('');

  const showRoleModal = useSignal(false);
  const editingRole = useSignal<Role | null>(null);
  const roleForm = useSignal({
    name: '',
    display_name: '',
    description: '',
    level: 3,
    is_global: true,
    permission_ids: [] as string[],
  });
  const saving = useSignal(false);

  useVisibleTask$(async () => {
    const user = authService.getUser();
    if (!user?.is_super_admin) {
      nav('/dashboard');
      return;
    }

    await loadRoles();
    await loadPermissions();
  });

  const loadRoles = $(async () => {
    try {
      const response = await roleService.getGlobalRoles();
      roles.value = response.data || [];
    } catch (err: any) {
      error.value = err.message || 'Failed to load roles';
    } finally {
      loading.value = false;
    }
  });

  const loadPermissions = $(async () => {
    try {
      permissions.value = await roleService.getPermissions();
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  });

  const openCreateModal = $(() => {
    editingRole.value = null;
    roleForm.value = {
      name: '',
      display_name: '',
      description: '',
      level: 3,
      is_global: true,
      permission_ids: [],
    };
    showRoleModal.value = true;
  });

  const openEditModal = $((role: Role) => {
    editingRole.value = role;
    roleForm.value = {
      name: role.name,
      display_name: role.display_name || '',
      description: role.description || '',
      level: role.level,
      is_global: role.is_global,
      permission_ids: role.permissions?.map(p => p.id) || [],
    };
    showRoleModal.value = true;
  });

  const handleSaveRole = $(async () => {
    saving.value = true;
    error.value = '';

    try {
      if (editingRole.value) {
        await roleService.updateGlobalRole(editingRole.value.id, roleForm.value);
      } else {
        await roleService.createGlobalRole(roleForm.value);
      }

      await loadRoles();
      showRoleModal.value = false;
    } catch (err: any) {
      error.value = err.message || 'Failed to save role';
    } finally {
      saving.value = false;
    }
  });

  const handleDeleteRole = $(async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      await roleService.deleteGlobalRole(roleId);
      roles.value = roles.value.filter(r => r.id !== roleId);
    } catch (err: any) {
      error.value = err.message || 'Failed to delete role';
    }
  });

  const groupedPermissions = $(() => {
    const grouped: Record<string, Permission[]> = {};
    permissions.value.forEach(p => {
      const resource = p.resource || 'general';
      if (!grouped[resource]) grouped[resource] = [];
      grouped[resource].push(p);
    });
    return grouped;
  });

  if (loading.value) {
    return (
      <div class="min-h-screen bg-light-50 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-dark-600">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container-lg mx-auto">
        <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold text-dark-800">Global Roles Management</h1>
            <p class="text-dark-600 mt-2">Manage system-wide roles and permissions</p>
          </div>
          <button onClick$={openCreateModal} class="btn-primary px-6 py-3 rounded-lg font-semibold">
            + Create Role
          </button>
        </div>

        {error.value && (
          <div class="alert-danger rounded-lg p-4 mb-6 bg-danger-50 border-l-4 border-danger-500">
            <p class="text-danger-800">{error.value}</p>
          </div>
        )}

        <div class="card bg-white shadow-lg rounded-xl p-6">
          {roles.value.length === 0 ? (
            <div class="text-center py-12">
              <div class="text-6xl text-light-300 mb-4">👥</div>
              <h3 class="text-xl font-semibold text-dark-800 mb-2">No Roles Yet</h3>
              <p class="text-dark-600 mb-6">Create your first role</p>
              <button onClick$={openCreateModal} class="btn-primary px-6 py-3 rounded-lg">Create Role</button>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-light-200">
                <thead class="bg-light-50">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">Role Name</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">Level</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">Type</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">Permissions</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">Users</th>
                    <th class="px-6 py-4 text-right text-xs font-semibold text-dark-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-light-200">
                  {roles.value.map((role) => (
                    <tr key={role.id} class="hover:bg-light-50 transition">
                      <td class="px-6 py-4">
                        <div>
                          <div class="text-sm font-medium text-dark-800">{role.display_name || role.name}</div>
                          {role.description && <div class="text-xs text-dark-500">{role.description}</div>}
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="badge-primary text-xs">Level {role.level}</span>
                      </td>
                      <td class="px-6 py-4">
                        {role.is_global ? (
                          <span class="badge-success text-xs">Global</span>
                        ) : (
                          <span class="badge-info text-xs">Business</span>
                        )}
                      </td>
                      <td class="px-6 py-4 text-sm text-dark-700">{role.permissions?.length || 0}</td>
                      <td class="px-6 py-4 text-sm text-dark-700">{role.user_count || 0}</td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2">
                          <button
                            onClick$={() => openEditModal(role)}
                            class="text-primary-600 hover:text-primary-700 px-3 py-1 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick$={() => handleDeleteRole(role.id)}
                            class="text-danger-600 hover:text-danger-700 px-3 py-1 text-sm"
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
        {showRoleModal.value && (
          <div class="fixed inset-0 bg-dark-950/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 class="text-2xl font-bold text-dark-800 mb-6">
                {editingRole.value ? 'Edit Role' : 'Create Role'}
              </h3>

              <div class="form-group mb-4">
                <label class="form-label text-dark-700 font-semibold mb-2">Role Name *</label>
                <input
                  type="text"
                  value={roleForm.value.name}
                  onInput$={(e) => { roleForm.value = { ...roleForm.value, name: (e.target as HTMLInputElement).value }; }}
                  class="form-input w-full px-4 py-3 border border-light-300 rounded-lg"
                  placeholder="e.g., admin"
                />
              </div>

              <div class="form-group mb-4">
                <label class="form-label text-dark-700 font-semibold mb-2">Display Name</label>
                <input
                  type="text"
                  value={roleForm.value.display_name}
                  onInput$={(e) => { roleForm.value = { ...roleForm.value, display_name: (e.target as HTMLInputElement).value }; }}
                  class="form-input w-full px-4 py-3 border border-light-300 rounded-lg"
                  placeholder="e.g., Administrator"
                />
              </div>

              <div class="form-group mb-4">
                <label class="form-label text-dark-700 font-semibold mb-2">Description</label>
                <textarea
                  value={roleForm.value.description}
                  onInput$={(e) => { roleForm.value = { ...roleForm.value, description: (e.target as HTMLTextAreaElement).value }; }}
                  rows={3}
                  class="form-input w-full px-4 py-3 border border-light-300 rounded-lg"
                  placeholder="Role description"
                ></textarea>
              </div>

              <div class="form-group mb-4">
                <label class="form-label text-dark-700 font-semibold mb-2">Level *</label>
                <select
                  value={roleForm.value.level}
                  onChange$={(e) => { roleForm.value = { ...roleForm.value, level: parseInt((e.target as HTMLSelectElement).value) }; }}
                  class="form-select w-full px-4 py-3 border border-light-300 rounded-lg"
                >
                  <option value={0}>Level 0 - Super Admin</option>
                  <option value={1}>Level 1 - System Admin</option>
                  <option value={2}>Level 2 - Business Admin</option>
                  <option value={3}>Level 3 - Manager</option>
                  <option value={4}>Level 4 - Supervisor</option>
                  <option value={5}>Level 5 - Operator</option>
                </select>
              </div>

              <div class="form-group mb-6">
                <label class="form-label text-dark-700 font-semibold mb-3 block">Permissions</label>
                <div class="max-h-64 overflow-y-auto border border-light-300 rounded-lg p-4">
                  {Object.entries(groupedPermissions()).map(([resource, perms]: [string, any[]]) => (
                    <div key={resource} class="mb-4">
                      <h4 class="text-sm font-semibold text-dark-700 mb-2 capitalize">{resource}</h4>
                      <div class="space-y-2">
                        {perms.map((perm: any) => (
                          <label key={perm.id} class="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={roleForm.value.permission_ids.includes(perm.id)}
                              onChange$={(e) => {
                                const checked = (e.target as HTMLInputElement).checked;
                                if (checked) {
                                  roleForm.value = { ...roleForm.value, permission_ids: [...roleForm.value.permission_ids, perm.id] };
                                } else {
                                  roleForm.value = { ...roleForm.value, permission_ids: roleForm.value.permission_ids.filter(id => id !== perm.id) };
                                }
                              }}
                              class="form-checkbox mr-2"
                            />
                            <span class="text-sm text-dark-700">{perm.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div class="flex gap-4">
                <button
                  onClick$={handleSaveRole}
                  disabled={saving.value}
                  class="btn-primary flex-1 py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {saving.value ? 'Saving...' : 'Save Role'}
                </button>
                <button
                  onClick$={() => { showRoleModal.value = false; }}
                  disabled={saving.value}
                  class="btn-light-300 flex-1 py-3 rounded-lg font-semibold"
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
