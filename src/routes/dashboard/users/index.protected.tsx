/**
 * EXAMPLE: User Management with Permission Guards
 * This file demonstrates how to apply permission-based access control
 * Copy patterns from here to apply to other screens
 */

import { component$, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { P9ETable } from '~/components/table';
import { userService } from '~/services/user.service';
import { PermissionGuard } from '~/components/auth/PermissionGuard';
import { RouteGuard } from '~/components/auth/RouteGuard';
import type { User } from '~/services/types';

export default component$(() => {
  const nav = useNavigate();

  const state = useStore<{
    data: User[];
    loading: boolean;
    error: string;
    page: number;
    limit: number;
    total: number;
    deleting: string | null;
  }>({
    data: [],
    loading: true,
    error: '',
    page: 0,
    limit: 10,
    total: 0,
    deleting: null,
  });

  const fetchUsers = $(async (page = state.page, limit = state.limit) => {
    state.loading = true;
    state.error = '';

    try {
      const response = await userService.getUsers({
        page: page + 1,
        page_size: limit,
      });

      state.data = response.data || [];
      state.page = (response.page ?? 1) - 1;
      state.total = response.total ?? state.data.length;
    } catch (error: any) {
      state.error = error.message || 'Failed to load users';
    } finally {
      state.loading = false;
    }
  });

  useVisibleTask$(async () => {
    await fetchUsers(state.page, state.limit);
  });

  const handleDelete = $(async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    state.deleting = userId;
    try {
      await userService.deleteUser(userId);
      await fetchUsers(state.page, state.limit);
    } catch (error: any) {
      alert(error.message || 'Failed to delete user');
    } finally {
      state.deleting = null;
    }
  });

  const handleView = $((userId: string) => {
    nav(`/dashboard/admin/users/${userId}`);
  });

  const handleEdit = $((userId: string) => {
    nav(`/dashboard/admin/users/${userId}/edit`);
  });

  return (
    // PATTERN 1: Route-level protection
    // Wrap entire component to protect the route
    <RouteGuard
      anyPermissions={['read_users', 'manage_users']}
      redirectTo="/dashboard"
      showUnauthorizedMessage={true}
    >
      <div class="mx-auto container px-4 py-6">
        <div class="mb-6 flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold">User Management</h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Manage system users and their roles
            </p>
          </div>

          {/* PATTERN 2: Component-level protection - Hide button if no permission */}
          <PermissionGuard permission="create_users">
            <button
              onClick$={() => nav('/dashboard/admin/users/new')}
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <span>+</span> Add User
            </button>
          </PermissionGuard>
        </div>

        {state.error && (
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {state.error}
          </div>
        )}

        <div class="bg-white dark:bg-dark-800 rounded-lg shadow-md overflow-hidden">
          <P9ETable
            header={[
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'role', label: 'Role' },
              {
                key: 'is_active',
                label: 'Status',
                // render: (val) => (
                //   <span
                //     class={`px-2 py-1 rounded-full text-xs font-semibold ${
                //       val ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                //     }`}
                //   >
                //     {val ? 'Active' : 'Inactive'}
                //   </span>
                // ),
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (_val, row) => (  
                  <div class="flex gap-2">
                    {/* PATTERN 3: Action-level protection - Individual buttons */}

                    {/* Allow view for anyone with read OR update permission */}
                    <PermissionGuard anyPermissions={['read_users', 'update_users']}>
                      <button
                        onClick$={() => handleView(row.id)}
                        class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        View
                      </button>
                    </PermissionGuard>

                    {/* Only users with update permission can edit */}
                    <PermissionGuard permission="update_users">
                      <button
                        onClick$={() => handleEdit(row.id)}
                        class="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                      >
                        Edit
                      </button>
                    </PermissionGuard>

                    {/* Only users with delete permission can delete */}
                    <PermissionGuard permission="delete_users">
                      <button
                        onClick$={() => handleDelete(row.id)}
                        disabled={state.deleting === row.id}
                        class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                      >
                        {state.deleting === row.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </PermissionGuard>
                  </div>
                ),
              },
            ]}
            data={state.data}
            defaultLimit={10}
            title="All Users"
            enableSearch
            enableSort
            serverPagination={true}
            totalCount={state.total}
            onPageChange$={$((p, l) => fetchUsers(p, l))}
          />
        </div>

        {/* PATTERN 4: Section-level protection */}
        <PermissionGuard superAdminOnly>
          <div class="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 class="font-semibold text-yellow-800 mb-2">Super Admin Tools</h3>
            <p class="text-sm text-yellow-700">
              These tools are only visible to super administrators.
            </p>
            <div class="mt-3 flex gap-2">
              <button class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm">
                Bulk Import
              </button>
              <button class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm">
                System Cleanup
              </button>
            </div>
          </div>
        </PermissionGuard>

        {/* PATTERN 5: Fallback content when permission denied */}
        <PermissionGuard
          permission="view_user_analytics"
          fallback={
            <div class="mt-6 bg-gray-100 rounded-lg p-6 text-center">
              <p class="text-gray-600">
                You need 'view_user_analytics' permission to see user statistics.
              </p>
            </div>
          }
        >
          <div class="mt-6 bg-white rounded-lg shadow p-6">
            <h3 class="font-semibold text-lg mb-4">User Analytics</h3>
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center">
                <p class="text-3xl font-bold text-blue-600">{state.total}</p>
                <p class="text-sm text-gray-600">Total Users</p>
              </div>
              <div class="text-center">
                <p class="text-3xl font-bold text-green-600">
                  {state.data.filter(u => u.is_active).length}
                </p>
                <p class="text-sm text-gray-600">Active</p>
              </div>
              <div class="text-center">
                <p class="text-3xl font-bold text-gray-600">
                  {state.data.filter(u => !u.is_active).length}
                </p>
                <p class="text-sm text-gray-600">Inactive</p>
              </div>
            </div>
          </div>
        </PermissionGuard>
      </div>
    </RouteGuard>
  );
});

/**
 * ADDITIONAL PATTERNS:
 *
 * PATTERN 6: Role-based protection
 * <PermissionGuard role="admin">
 *   <AdminPanel />
 * </PermissionGuard>
 *
 * PATTERN 7: Multiple roles (OR logic)
 * <PermissionGuard anyRoles={['admin', 'manager']}>
 *   <ManagementTools />
 * </PermissionGuard>
 *
 * PATTERN 8: Multiple permissions (AND logic)
 * <PermissionGuard allPermissions={['read_reports', 'export_reports']}>
 *   <ExportButton />
 * </PermissionGuard>
 *
 * PATTERN 9: Business-specific permissions
 * <PermissionGuard permission="manage_sites" businessId={selectedBusinessId}>
 *   <SiteManagement />
 * </PermissionGuard>
 *
 * PATTERN 10: Hide instead of removing from DOM
 * <PermissionGuard permission="admin_panel" hideIfDenied={true}>
 *   <div>Content hidden but still in DOM</div>
 * </PermissionGuard>
 */
