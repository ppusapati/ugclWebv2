import { component$, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { DynamicForm, type FormField } from '~/components/form_generator';
import { userService } from '~/services/user.service';
import { roleService } from '~/services/role.service';
import type { RegisterRequest } from '~/services/types';

type UserForm = RegisterRequest;

export default component$(() => {
  const nav = useNavigate();

  const state = useStore({
    loading: false,
    error: '',
    success: '',
    roles: [] as any[],
    loadingRoles: true,
  });

  // Fetch available roles
  useVisibleTask$(async () => {
    try {
      const response = await roleService.getGlobalRoles({ page: 1, page_size: 100 });
      state.roles = response.data || [];
    } catch (error: any) {
      console.error('Failed to load roles:', error);
      state.roles = [
        { id: 'admin', name: 'Admin' },
        { id: 'project_coordinator', name: 'Project Coordinator' },
        { id: 'engineer', name: 'Engineer' },
        { id: 'user', name: 'User' },
      ];
    } finally {
      state.loadingRoles = false;
    }
  });

  const formSchema: FormField<UserForm>[] = [
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
      type: 'password',
      name: 'password',
      label: 'Password',
      required: true,
      placeholder: 'Minimum 8 characters',
    },
    {
      type: 'select',
      name: 'role',
      label: 'Role',
      required: true,
      options: state.roles.map(r => ({ label: r.display_name || r.name, value: r.name })),
    },
  ];

  const handleSubmit = $(async (data: any) => {
    state.loading = true;
    state.error = '';
    state.success = '';

    try {
      await userService.createUser(data);
      state.success = 'User created successfully!';

      setTimeout(() => {
        nav('/dashboard/admin/users');
      }, 1500);
    } catch (error: any) {
      state.error = error.message || 'Failed to create user';
    } finally {
      state.loading = false;
    }
  });

  return (
    <div class="max-w-2xl mx-auto px-4 py-8">
      <div class="mb-6">
        <button
          onClick$={() => nav('/dashboard/admin/users')}
          class="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <span>←</span> Back to Users
        </button>
      </div>

      <div class="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6">
        <h1 class="text-2xl font-bold mb-6">Create New User</h1>

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

        {!state.loadingRoles ? (
          <DynamicForm
            formFields={formSchema}
            formLoader={{
              name: '',
              email: '',
              phone: '',
              password: '',
              role: '',
            }}
            onClick$={handleSubmit}
            submitButtonText={state.loading ? 'Creating...' : 'Create User'}
            submitButtonDisabled={state.loading}
          />
        ) : (
          <div class="text-center py-8">Loading...</div>
        )}
      </div>
    </div>
  );
});
