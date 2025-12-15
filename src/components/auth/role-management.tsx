// src/components/auth/role-management.tsx
import { component$, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { authService } from '~/services/auth.service';

interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    business_vertical_id?: string;
    is_system_role: boolean;
}

interface Permission {
    id: string;
    name: string;
    description: string;
    category: string;
}

export const RoleManagement = component$(() => {
    const state = useStore({
        roles: [] as Role[],
        permissions: [] as Permission[],
        loading: true,
        showCreateModal: false,
        editingRole: null as Role | null,
        newRole: {
            name: '',
            description: '',
            permissions: [] as string[],
            business_vertical_id: '',
        },
        error: '',
        success: '',
    });

    useVisibleTask$(async () => {
        try {
            const token = authService.getToken();
            const apiKey = '87339ea3-1add-4689-ae57-3128ebd03c4f';

            // Fetch roles
            const rolesResponse = await fetch('http://localhost:8080/api/v1/admin/roles', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-api-key': apiKey,
                },
            });
            const rolesData = await rolesResponse.json();
            state.roles = rolesData.roles || [];

            // Fetch permissions
            const permissionsResponse = await fetch('http://localhost:8080/api/v1/admin/permissions', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-api-key': apiKey,
                },
            });
            const permissionsData = await permissionsResponse.json();
            state.permissions = permissionsData.permissions || [];

            state.loading = false;
        } catch (error) {
            console.error('Failed to load roles and permissions:', error);
            state.error = 'Failed to load data';
            state.loading = false;
        }
    });

    const handleCreateRole = $(async () => {
        try {
            const token = authService.getToken();
            const response = await fetch('http://localhost:8080/api/v1/admin/roles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
                },
                body: JSON.stringify(state.newRole),
            });

            if (response.ok) {
                const newRole = await response.json();
                state.roles.push(newRole.role);
                state.showCreateModal = false;
                state.newRole = { name: '', description: '', permissions: [], business_vertical_id: '' };
                state.success = 'Role created successfully';
            } else {
                state.error = 'Failed to create role';
            }
        } catch {
            state.error = 'Network error occurred';
        }
    });

    const handleDeleteRole = $(async (roleId: string) => {
        if (!confirm('Are you sure you want to delete this role?')) return;

        try {
            const token = authService.getToken();
            const response = await fetch(`http://localhost:8080/api/v1/admin/roles/${roleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
                },
            });

            if (response.ok) {
                state.roles = state.roles.filter(role => role.id !== roleId);
                state.success = 'Role deleted successfully';
            } else {
                state.error = 'Failed to delete role';
            }
        } catch {
            state.error = 'Network error occurred';
        }
    });

    const togglePermission = $((permissionId: string) => {
        const permissions = state.editingRole ?
            [...state.editingRole.permissions] :
            [...state.newRole.permissions];

        const index = permissions.indexOf(permissionId);
        if (index > -1) {
            permissions.splice(index, 1);
        } else {
            permissions.push(permissionId);
        }

        if (state.editingRole) {
            state.editingRole.permissions = permissions;
        } else {
            state.newRole.permissions = permissions;
        }
    });

    // Group permissions by category
    const groupedPermissions = state.permissions.reduce((acc, permission) => {
        if (!acc[permission.category]) {
            acc[permission.category] = [];
        }
        acc[permission.category].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    if (state.loading) {
        return (
            <div class="flex items-center justify-center p-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div class="role-management p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold">Role Management</h2>
                <button
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick$={() => { state.showCreateModal = true; }}
                >
                    Create New Role
                </button>
            </div>

            {/* Success/Error Messages */}
            {state.success && (
                <div class="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    {state.success}
                </div>
            )}
            {state.error && (
                <div class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {state.error}
                </div>
            )}

            {/* Roles Table */}
            <div class="bg-white border rounded-lg overflow-hidden">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role Name
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Permissions
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {state.roles.map((role) => (
                            <tr key={role.id}>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">{role.name}</div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-sm text-gray-500">{role.description}</div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex flex-wrap gap-1">
                                        {role.permissions.slice(0, 3).map((permission) => (
                                            <span key={permission} class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {permission}
                                            </span>
                                        ))}
                                        {role.permissions.length > 3 && (
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                +{role.permissions.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.is_system_role
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-green-100 text-green-800'
                                        }`}>
                                        {role.is_system_role ? 'System' : 'Custom'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        class="text-indigo-600 hover:text-indigo-900 mr-4"
                                        onClick$={() => {
                                            state.editingRole = { ...role };
                                            state.showCreateModal = true;
                                        }}
                                    >
                                        Edit
                                    </button>
                                    {!role.is_system_role && (
                                        <button
                                            class="text-red-600 hover:text-red-900"
                                            onClick$={() => handleDeleteRole(role.id)}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Role Modal */}
            {state.showCreateModal && (
                <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                        <div class="mt-3">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">
                                {state.editingRole ? 'Edit Role' : 'Create New Role'}
                            </h3>

                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Role Name</label>
                                    <input
                                        type="text"
                                        class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        value={state.editingRole ? state.editingRole.name : state.newRole.name}
                                        onInput$={(e) => {
                                            const value = (e.target as HTMLInputElement).value;
                                            if (state.editingRole) {
                                                state.editingRole.name = value;
                                            } else {
                                                state.newRole.name = value;
                                            }
                                        }}
                                    />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        rows={3}
                                        value={state.editingRole ? state.editingRole.description : state.newRole.description}
                                        onInput$={(e) => {
                                            const value = (e.target as HTMLTextAreaElement).value;
                                            if (state.editingRole) {
                                                state.editingRole.description = value;
                                            } else {
                                                state.newRole.description = value;
                                            }
                                        }}
                                    />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                                    <div class="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-4">
                                        {Object.entries(groupedPermissions).map(([category, permissions]) => (
                                            <div key={category} class="mb-4">
                                                <h4 class="font-medium text-gray-900 mb-2 capitalize">{category}</h4>
                                                <div class="space-y-2">
                                                    {permissions.map((permission) => (
                                                        <label key={permission.id} class="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                                checked={
                                                                    state.editingRole
                                                                        ? state.editingRole.permissions.includes(permission.id)
                                                                        : state.newRole.permissions.includes(permission.id)
                                                                }
                                                                onChange$={() => togglePermission(permission.id)}
                                                            />
                                                            <div class="ml-3">
                                                                <span class="text-sm font-medium text-gray-700">{permission.name}</span>
                                                                <p class="text-xs text-gray-500">{permission.description}</p>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-end space-x-3 mt-6">
                                <button
                                    class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                    onClick$={() => {
                                        state.showCreateModal = false;
                                        state.editingRole = null;
                                        state.newRole = { name: '', description: '', permissions: [], business_vertical_id: '' };
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    onClick$={handleCreateRole}
                                >
                                    {state.editingRole ? 'Update Role' : 'Create Role'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});