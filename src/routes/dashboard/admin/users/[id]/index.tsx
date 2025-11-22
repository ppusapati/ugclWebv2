import { component$, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { userService } from '~/services/user.service';
import { roleService } from '~/services/role.service';
import type { User, Role } from '~/services/types';

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const userId = loc.params.id;

  const state = useStore<{
    user: User | null;
    roles: Role[];
    loading: boolean;
    error: string;
    deleting: boolean;
  }>({
    user: null,
    roles: [],
    loading: true,
    error: '',
    deleting: false,
  });

  useVisibleTask$(async () => {
    try {
      const [user, rolesResponse] = await Promise.all([
        userService.getUserById(userId),
        roleService.getGlobalRoles({ page: 1, page_size: 100 }),
      ]);
      state.user = user;
      state.roles = rolesResponse.data || [];
    } catch (error: any) {
      state.error = error.message || 'Failed to load user details';
    } finally {
      state.loading = false;
    }
  });

  const handleDelete = $(async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    state.deleting = true;
    try {
      await userService.deleteUser(userId);
      nav('/dashboard/admin/users');
    } catch (error: any) {
      alert(error.message || 'Failed to delete user');
      state.deleting = false;
    }
  });

  const toggleStatus = $(async () => {
    if (!state.user) return;

    try {
      const updated = await userService.toggleUserStatus(
        userId,
        !state.user.is_active
      );
      state.user = updated;
    } catch (error: any) {
      alert(error.message || 'Failed to update user status');
    }
  });

  if (state.loading) {
    return (
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-lg">Loading user details...</div>
      </div>
    );
  }

  if (state.error || !state.user) {
    return (
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {state.error || 'User not found'}
        </div>
        <button
          onClick$={() => nav('/dashboard/admin/users')}
          class="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Users
        </button>
      </div>
    );
  }

  const user = state.user;
  const userRole = state.roles.find(r => r.id === user.role || r.name === user.role);

  return (
    <div class="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div class="mb-6 flex justify-between items-center">
        <button
          onClick$={() => nav('/dashboard/admin/users')}
          class="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <span>←</span> Back to Users
        </button>
        <div class="flex gap-3">
          <button
            onClick$={() => nav(`/dashboard/admin/users/${userId}/edit`)}
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit User
          </button>
          <button
            onClick$={handleDelete}
            disabled={state.deleting}
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {state.deleting ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </div>

      {/* User Details Card */}
      <div class="bg-white dark:bg-dark-800 rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div class="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold">{user.name}</h1>
              <p class="text-blue-100 mt-1">{user.email}</p>
            </div>
            <div class="text-right">
              <div
                class={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  user.is_active
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}
              >
                {user.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div class="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 class="text-xl font-semibold mb-4">Basic Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-600 dark:text-gray-400">User ID</label>
                <p class="font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <label class="text-sm text-gray-600 dark:text-gray-400">Phone</label>
                <p class="font-semibold">{user.phone}</p>
              </div>
              <div>
                <label class="text-sm text-gray-600 dark:text-gray-400">Email</label>
                <p class="font-semibold">{user.email}</p>
              </div>
              <div>
                <label class="text-sm text-gray-600 dark:text-gray-400">Status</label>
                <div class="flex items-center gap-3">
                  <span class="font-semibold">
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick$={toggleStatus}
                    class="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Toggle Status
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Role Information */}
          <div>
            <h2 class="text-xl font-semibold mb-4">Role & Permissions</h2>
            <div class="space-y-3">
              <div>
                <label class="text-sm text-gray-600 dark:text-gray-400">Global Role</label>
                <p class="font-semibold text-lg">
                  {userRole?.display_name || user.role || 'No role assigned'}
                </p>
                {userRole?.description && (
                  <p class="text-sm text-gray-600 mt-1">{userRole.description}</p>
                )}
              </div>

              {user.is_super_admin && (
                <div class="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p class="font-semibold text-yellow-800">Super Admin</p>
                  <p class="text-sm text-yellow-700">
                    This user has full system access.
                  </p>
                </div>
              )}

              {user.business_roles && user.business_roles.length > 0 && (
                <div>
                  <label class="text-sm text-gray-600 dark:text-gray-400">
                    Business Roles
                  </label>
                  <div class="mt-2 space-y-2">
                    {user.business_roles.map((br: any) => (
                      <div
                        key={br.business_vertical_id}
                        class="flex items-center justify-between bg-gray-50 dark:bg-dark-700 p-3 rounded"
                      >
                        <div>
                          <p class="font-semibold">
                            {br.business_vertical?.name || 'Unknown Business'}
                          </p>
                          <p class="text-sm text-gray-600">
                            Roles: {br.roles?.join(', ') || 'None'}
                          </p>
                        </div>
                        {br.is_admin && (
                          <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            Admin
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h2 class="text-xl font-semibold mb-4">Metadata</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-600 dark:text-gray-400">Created At</label>
                <p class="text-sm">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label class="text-sm text-gray-600 dark:text-gray-400">Updated At</label>
                <p class="text-sm">
                  {user.updated_at
                    ? new Date(user.updated_at).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
