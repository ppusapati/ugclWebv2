// src/routes/business/[code]/sites/[id]/access/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { siteService, userService } from '~/services';
import type { UserSiteAccess, User } from '~/services';

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const businessCode = loc.params.code;
  const siteId = loc.params.id;

  const siteAccess = useSignal<UserSiteAccess[]>([]);
  const users = useSignal<User[]>([]);
  const loading = useSignal(true);
  const error = useSignal('');

  const showAssignForm = useSignal(false);
  const selectedUserId = useSignal('');
  const permissions = useSignal({
    read: true,
    create: false,
    update: false,
    delete: false,
  });
  const assigning = useSignal(false);

  useVisibleTask$(async () => {
    await loadSiteAccess();
    await loadUsers();
  });

  const loadSiteAccess = $(async () => {
    try {
      const data = await siteService.getSiteUsers(businessCode, siteId);
      siteAccess.value = data;
    } catch (err: any) {
      error.value = err.message || 'Failed to load site access';
    }
  });

  const loadUsers = $(async () => {
    try {
      const response = await userService.getBusinessUsers(businessCode);
      users.value = response.data || [];
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      loading.value = false;
    }
  });

  const handleAssignAccess = $(async () => {
    if (!selectedUserId.value) {
      error.value = 'Please select a user';
      return;
    }

    assigning.value = true;
    error.value = '';

    try {
      await siteService.assignSiteAccess(businessCode, {
        user_id: selectedUserId.value,
        site_id: siteId,
        permissions: permissions.value,
      });

      await loadSiteAccess();
      showAssignForm.value = false;
      selectedUserId.value = '';
      permissions.value = { read: true, create: false, update: false, delete: false };
    } catch (err: any) {
      error.value = err.message || 'Failed to assign access';
    } finally {
      assigning.value = false;
    }
  });

  const handleRevokeAccess = $(async (accessId: string) => {
    if (!confirm('Are you sure you want to revoke this access?')) return;

    try {
      await siteService.revokeSiteAccess(businessCode, accessId);
      siteAccess.value = siteAccess.value.filter(sa => sa.id !== accessId);
    } catch (err: any) {
      error.value = err.message || 'Failed to revoke access';
    }
  });

  if (loading.value) {
    return (
      <div class="min-h-screen bg-light-50 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-dark-600">Loading site access...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container-lg mx-auto">
        <div class="mb-6">
          <button
            onClick$={() => nav(`/business/${businessCode}/sites`)}
            class="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
          >
            <span>←</span> Back to Sites
          </button>
          <div class="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 class="text-3xl font-bold text-dark-800">Site Access Management</h1>
              <p class="text-dark-600 mt-2">Manage user access to this site</p>
            </div>
            <button
              onClick$={() => { showAssignForm.value = !showAssignForm.value; }}
              class="btn-primary px-6 py-3 rounded-lg font-semibold"
            >
              + Assign Access
            </button>
          </div>
        </div>

        {error.value && (
          <div class="alert-danger rounded-lg p-4 mb-6 bg-danger-50 border-l-4 border-danger-500">
            <p class="text-danger-800">{error.value}</p>
          </div>
        )}

        {/* Assign Access Form */}
        {showAssignForm.value && (
          <div class="card bg-white shadow-lg rounded-xl p-6 mb-6">
            <h3 class="text-xl font-bold text-dark-800 mb-4">Assign User Access</h3>

            <div class="form-group mb-4">
              <label class="form-label text-dark-700 font-semibold mb-2">Select User</label>
              <select
                value={selectedUserId.value}
                onChange$={(e) => { selectedUserId.value = (e.target as HTMLSelectElement).value; }}
                class="form-select w-full px-4 py-3 border border-light-300 rounded-lg"
              >
                <option value="">-- Select User --</option>
                {users.value.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {`${user.name} (${user.email})`}
                  </option>
                ))}
              </select>
            </div>

            <div class="mb-4">
              <label class="form-label text-dark-700 font-semibold mb-3 block">Permissions</label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.value.read}
                    onChange$={(e) => { permissions.value = { ...permissions.value, read: (e.target as HTMLInputElement).checked }; }}
                    class="form-checkbox mr-2"
                  />
                  <span class="text-dark-700">Read</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.value.create}
                    onChange$={(e) => { permissions.value = { ...permissions.value, create: (e.target as HTMLInputElement).checked }; }}
                    class="form-checkbox mr-2"
                  />
                  <span class="text-dark-700">Create</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.value.update}
                    onChange$={(e) => { permissions.value = { ...permissions.value, update: (e.target as HTMLInputElement).checked }; }}
                    class="form-checkbox mr-2"
                  />
                  <span class="text-dark-700">Update</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.value.delete}
                    onChange$={(e) => { permissions.value = { ...permissions.value, delete: (e.target as HTMLInputElement).checked }; }}
                    class="form-checkbox mr-2"
                  />
                  <span class="text-dark-700">Delete</span>
                </label>
              </div>
            </div>

            <div class="flex gap-4">
              <button
                onClick$={handleAssignAccess}
                disabled={assigning.value}
                class="btn-primary px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {assigning.value ? 'Assigning...' : 'Assign Access'}
              </button>
              <button
                onClick$={() => { showAssignForm.value = false; }}
                class="btn-light-300 px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Access Table */}
        <div class="card bg-white shadow-lg rounded-xl p-6">
          {siteAccess.value.length === 0 ? (
            <div class="text-center py-12">
              <div class="text-6xl text-light-300 mb-4">🔐</div>
              <h3 class="text-xl font-semibold text-dark-800 mb-2">No Access Assigned</h3>
              <p class="text-dark-600 mb-6">Assign users access to this site to get started</p>
              <button
                onClick$={() => { showAssignForm.value = true; }}
                class="btn-primary px-6 py-3 rounded-lg"
              >
                Assign Access
              </button>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-light-200">
                <thead class="bg-light-50">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">User</th>
                    <th class="px-6 py-4 text-center text-xs font-semibold text-dark-700 uppercase">Read</th>
                    <th class="px-6 py-4 text-center text-xs font-semibold text-dark-700 uppercase">Create</th>
                    <th class="px-6 py-4 text-center text-xs font-semibold text-dark-700 uppercase">Update</th>
                    <th class="px-6 py-4 text-center text-xs font-semibold text-dark-700 uppercase">Delete</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase">Granted</th>
                    <th class="px-6 py-4 text-right text-xs font-semibold text-dark-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-light-200">
                  {siteAccess.value.map((access) => (
                    <tr key={access.id} class="hover:bg-light-50 transition">
                      <td class="px-6 py-4">
                        <div>
                          <div class="text-sm font-medium text-dark-800">{access.user?.name}</div>
                          <div class="text-xs text-dark-500">{access.user?.email}</div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-center">
                        {access.permissions.read ? <span class="text-success-600">✓</span> : <span class="text-danger-600">✗</span>}
                      </td>
                      <td class="px-6 py-4 text-center">
                        {access.permissions.create ? <span class="text-success-600">✓</span> : <span class="text-danger-600">✗</span>}
                      </td>
                      <td class="px-6 py-4 text-center">
                        {access.permissions.update ? <span class="text-success-600">✓</span> : <span class="text-danger-600">✗</span>}
                      </td>
                      <td class="px-6 py-4 text-center">
                        {access.permissions.delete ? <span class="text-success-600">✓</span> : <span class="text-danger-600">✗</span>}
                      </td>
                      <td class="px-6 py-4 text-xs text-dark-600">
                        {access.granted_at ? new Date(access.granted_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td class="px-6 py-4 text-right">
                        <button
                          onClick$={() => handleRevokeAccess(access.id)}
                          class="text-danger-600 hover:text-danger-700 px-3 py-1 text-sm"
                          title="Revoke Access"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
