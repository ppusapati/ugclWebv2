import { component$, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { DynamicForm, type FormField } from '~/components/form_generator';
import { userService } from '~/services/user.service';
import { roleService } from '~/services/role.service';
import type { User, UpdateUserRequest } from '~/services/types';

type UserEditForm = {
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
};

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const userId = loc.params.id;

  const state = useStore<{
    user: User | null;
    roles: any[];
    loading: boolean;
    submitting: boolean;
    error: string;
    success: string;
  }>({
    user: null,
    roles: [],
    loading: true,
    submitting: false,
    error: '',
    success: '',
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
      state.error = error.message || 'Failed to load user';
    } finally {
      state.loading = false;
    }
  });

  const handleSubmit = $(async (data: any) => {
    state.submitting = true;
    state.error = '';
    state.success = '';

    try {
      const updateData: Partial<UpdateUserRequest> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        is_active: data.is_active,
      };

      await userService.updateUser(userId, updateData);
      state.success = 'User updated successfully!';

      setTimeout(() => {
        nav(`/dashboard/admin/users/${userId}`);
      }, 1500);
    } catch (error: any) {
      state.error = error.message || 'Failed to update user';
    } finally {
      state.submitting = false;
    }
  });

  if (state.loading) {
    return (
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-lg">Loading...</div>
      </div>
    );
  }

  if (state.error && !state.user) {
    return (
      <div class="max-w-2xl mx-auto px-4 py-8">
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {state.error}
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

  const user = state.user!;

  const formSchema: FormField<UserEditForm>[] = [
    {
      type: 'text',
      name: 'name',
      label: 'Full Name',
      required: true,
      placeholder: 'Enter full name',
    },
    {
      type: 'text',
      name: 'email',
      label: 'Email',
      required: true,
      placeholder: 'user@example.com',
    },
    {
      type: 'text',
      name: 'phone',
      label: 'Phone Number',
      required: true,
      placeholder: '10-digit phone number',
    },
    {
      type: 'select',
      name: 'role',
      label: 'Role',
      required: true,
      options: state.roles.map(r => ({
        label: r.display_name || r.name,
        value: r.name,
      })),
    },
    {
      type: 'checkbox',
      name: 'is_active',
      label: 'Active Status',
    },
  ];

  return (
    <div class="max-w-2xl mx-auto px-4 py-8">
      <div class="mb-6">
        <button
          onClick$={() => nav(`/dashboard/admin/users/${userId}`)}
          class="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <span>←</span> Back to User Details
        </button>
      </div>

      <div class="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6">
        <h1 class="text-2xl font-bold mb-6">Edit User</h1>

        {state.error && (
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {state.error}
          </div>
        )}

        {state.success && (
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {state.success}
          </div>
        )}

        <DynamicForm
          formFields={formSchema}
          formLoader={{
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            is_active: user.is_active ?? true,
          }}
          onClick$={handleSubmit}
          submitButtonText={state.submitting ? 'Updating...' : 'Update User'}
          submitButtonDisabled={state.submitting}
        />
      </div>
    </div>
  );
});
