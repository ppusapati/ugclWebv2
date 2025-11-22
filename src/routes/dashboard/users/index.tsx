import { component$, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { P9ETable } from '~/components/table';
import { userService } from '~/services/user.service';
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
    <div class="mx-auto container px-4 py-6">
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold">User Management</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Manage system users and their roles
          </p>
        </div>
        <button
          onClick$={() => nav('/dashboard/admin/users/new')}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span> Add User
        </button>
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
            { key: 'is_active', label: 'Status'},
            { key: 'actions', label: 'Actions'},
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
    </div>
  );
});
