import { $, component$, useStore } from '@builder.io/qwik';
import { routeLoader$, useLocation, useNavigate } from '@builder.io/qwik-city';
import PermissionGuard from '~/components/auth/PermissionGuard';
import { Alert, Badge, Btn, FormField, PageHeader, SectionCard } from '~/components/ds';
import { apiClient, createSSRApiClient } from '~/services';
import type { Role, RoleAssignment, User } from '~/services/types';

export const useUserRolesData = routeLoader$(async requestEvent => {
  const api = createSSRApiClient(requestEvent);
  const userId = requestEvent.params.userId;

  try {
    const [userResponse, roleResponse, assignments] = await Promise.all([
      api.get<{ user?: User } & User>(`/admin/users/${userId}`),
      api.get<{ data: Role[] }>('/admin/rbac/roles?limit=200'),
      api.get<RoleAssignment[]>(`/admin/rbac/users/${userId}/assignments`),
    ]);
    return {
      user: userResponse.user || userResponse,
      roles: roleResponse.data || [],
      assignments,
      error: '',
    };
  } catch (error: any) {
    return {
      user: null,
      roles: [] as Role[],
      assignments: [] as RoleAssignment[],
      error: error.message || 'Failed to load role assignments',
    };
  }
});

export default component$(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const initial = useUserRolesData();
  const userId = location.params.userId;
  const state = useStore({
    user: initial.value.user as User | null,
    roles: initial.value.roles as Role[],
    assignments: initial.value.assignments as RoleAssignment[],
    selectedRoleId: '',
    filterScope: 'all' as 'all' | 'global' | 'business_vertical',
    saving: false,
    error: initial.value.error,
    success: '',
  });

  const reloadAssignments = $(async () => {
    state.assignments = await apiClient.get<RoleAssignment[]>(
      `/admin/rbac/users/${userId}/assignments`
    );
  });

  const assignRole = $(async () => {
    if (!state.selectedRoleId || state.saving) return;
    state.saving = true;
    state.error = '';
    state.success = '';
    try {
      await apiClient.post(`/admin/rbac/users/${userId}/assignments`, {
        role_id: state.selectedRoleId,
      });
      await reloadAssignments();
      state.selectedRoleId = '';
      state.success = 'Role assignment saved';
    } catch (error: any) {
      state.error = error.message || 'Failed to assign role';
    } finally {
      state.saving = false;
    }
  });

  const removeAssignment = $(async (assignment: RoleAssignment) => {
    if (!confirm(`Remove ${assignment.role.display_name} from this user?`)) return;
    state.error = '';
    state.success = '';
    try {
      await apiClient.delete(
        `/admin/rbac/users/${userId}/assignments/${assignment.id}`
      );
      await reloadAssignments();
      state.success = 'Role assignment removed';
    } catch (error: any) {
      state.error = error.message || 'Failed to remove role assignment';
    }
  });

  const assignedRoleIds = new Set(state.assignments.map(assignment => assignment.role_id));
  const availableRoles = state.roles.filter(role => {
    if (!role.is_active || assignedRoleIds.has(role.id)) return false;
    return state.filterScope === 'all' || role.scope_type === state.filterScope;
  });

  return (
    <PermissionGuard permission="manage_roles">
      <div class="space-y-6 p-6">
        <PageHeader
          title="Role Assignments"
          subtitle={state.user ? `${state.user.name} (${state.user.email})` : 'User not found'}
        >
          <div q:slot="actions" class="flex gap-2">
            <Btn variant="secondary" onClick$={() => navigate(`/users/${userId}/sites`)}>
              Manage Sites
            </Btn>
            <Btn variant="secondary" onClick$={() => navigate('/users')}>
              Back to Users
            </Btn>
          </div>
        </PageHeader>

        {state.error && <Alert variant="error">{state.error}</Alert>}
        {state.success && <Alert variant="success">{state.success}</Alert>}

        {state.user && (
          <SectionCard>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr_auto] md:items-end">
              <FormField id="assignment-scope" label="Scope">
                <select
                  id="assignment-scope"
                  value={state.filterScope}
                  onChange$={event => {
                    state.filterScope = (event.target as HTMLSelectElement).value as typeof state.filterScope;
                    state.selectedRoleId = '';
                  }}
                  class="w-full rounded border border-neutral-300 px-3 py-2"
                >
                  <option value="all">All scopes</option>
                  <option value="global">Global</option>
                  <option value="business_vertical">Business vertical</option>
                </select>
              </FormField>

              <FormField id="assignment-role" label="Role">
                <select
                  id="assignment-role"
                  value={state.selectedRoleId}
                  onChange$={event => {
                    state.selectedRoleId = (event.target as HTMLSelectElement).value;
                  }}
                  class="w-full rounded border border-neutral-300 px-3 py-2"
                >
                  <option value="">Select a role</option>
                  {availableRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {`${role.display_name} - ${role.scope_type === 'global'
                        ? 'Global'
                        : role.business_vertical?.name || 'Business vertical'} (Level ${role.level})`}
                    </option>
                  ))}
                </select>
              </FormField>

              <Btn
                variant="primary"
                disabled={!state.selectedRoleId || state.saving}
                onClick$={assignRole}
              >
                {state.saving ? 'Assigning...' : 'Assign Role'}
              </Btn>
            </div>
          </SectionCard>
        )}

        <SectionCard>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-neutral-200">
              <thead class="bg-neutral-50">
                <tr>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-neutral-600">Role</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-neutral-600">Scope</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-neutral-600">Vertical</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-neutral-600">Level</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-neutral-600">Assigned</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold uppercase text-neutral-600">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200 bg-white">
                {state.assignments.map(assignment => (
                  <tr key={assignment.id}>
                    <td class="px-5 py-4 font-medium text-neutral-900">
                      {assignment.role.display_name}
                    </td>
                    <td class="px-5 py-4">
                      <Badge variant={assignment.role.scope_type === 'global' ? 'success' : 'info'}>
                        {assignment.role.scope_type === 'global' ? 'Global' : 'Business'}
                      </Badge>
                    </td>
                    <td class="px-5 py-4 text-neutral-700">
                      {assignment.role.business_vertical?.name || '-'}
                    </td>
                    <td class="px-5 py-4 text-neutral-700">{assignment.role.level}</td>
                    <td class="px-5 py-4 text-neutral-700">
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </td>
                    <td class="px-5 py-4 text-right">
                      <Btn size="sm" variant="danger" onClick$={() => removeAssignment(assignment)}>
                        Remove
                      </Btn>
                    </td>
                  </tr>
                ))}
                {state.assignments.length === 0 && (
                  <tr>
                    <td colSpan={6} class="px-5 py-12 text-center text-neutral-500">
                      No active role assignments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </PermissionGuard>
  );
});
