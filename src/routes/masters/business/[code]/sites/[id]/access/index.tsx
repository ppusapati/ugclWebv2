// src/routes/business/[code]/sites/[id]/access/index.tsx
import { component$, isServer, useSignal, useTask$, $ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { siteService, userService } from '~/services';
import type { UserSiteAccess, User } from '~/services';
import { Alert, Badge, Btn, DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeaderCell, DataTableRow, FormField, PageHeader, SectionCard } from '~/components/ds';

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

  useTask$(async () => {
    if (isServer) {
      return;
    }

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
      <div class="flex items-center justify-center py-16">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-neutral-600">Loading site access...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-6 py-2">
        <PageHeader title="Site Access Management" subtitle="Manage user access to this site">
          <Btn q:slot="actions" variant="ghost" onClick$={() => nav(`/masters/business/${businessCode}/sites`)}>
            <i class="i-heroicons-arrow-left-solid mr-1 h-4 w-4 inline-block" aria-hidden="true"></i>
            Back to Sites
          </Btn>
          <Btn q:slot="actions" onClick$={() => { showAssignForm.value = !showAssignForm.value; }}>
            + Assign Access
          </Btn>
        </PageHeader>

        {error.value && (
          <Alert variant="error" class="mb-6 border-l-4">
            <p class="text-error-800">{error.value}</p>
          </Alert>
        )}

        {/* Assign Access Form */}
        {showAssignForm.value && (
          <SectionCard class="mb-6">
            <h3 class="text-xl font-bold text-neutral-800 mb-4">Assign User Access</h3>

            <FormField id="access-user-select" label="Select User" class="mb-4">
              <select
                id="access-user-select"
                value={selectedUserId.value}
                onChange$={(e) => { selectedUserId.value = (e.target as HTMLSelectElement).value; }}
                class="form-select w-full px-4 py-3 border border-neutral-300 rounded-lg"
              >
                <option value="">-- Select User --</option>
                {users.value.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {`${user.name} (${user.email})`}
                  </option>
                ))}
              </select>
            </FormField>

            <div class="mb-4">
              <FormField id="access-permissions" label="Permissions">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.value.read}
                    onChange$={(e) => { permissions.value = { ...permissions.value, read: (e.target as HTMLInputElement).checked }; }}
                    class="form-checkbox mr-2"
                  />
                  <span class="text-neutral-700">Read</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.value.create}
                    onChange$={(e) => { permissions.value = { ...permissions.value, create: (e.target as HTMLInputElement).checked }; }}
                    class="form-checkbox mr-2"
                  />
                  <span class="text-neutral-700">Create</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.value.update}
                    onChange$={(e) => { permissions.value = { ...permissions.value, update: (e.target as HTMLInputElement).checked }; }}
                    class="form-checkbox mr-2"
                  />
                  <span class="text-neutral-700">Update</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.value.delete}
                    onChange$={(e) => { permissions.value = { ...permissions.value, delete: (e.target as HTMLInputElement).checked }; }}
                    class="form-checkbox mr-2"
                  />
                  <span class="text-neutral-700">Delete</span>
                </label>
              </div>
              </FormField>
            </div>

            <div class="flex gap-4">
              <Btn
                onClick$={handleAssignAccess}
                disabled={assigning.value}
              >
                {assigning.value ? 'Assigning...' : 'Assign Access'}
              </Btn>
              <Btn
                onClick$={() => { showAssignForm.value = false; }}
                variant="secondary"
              >
                Cancel
              </Btn>
            </div>
          </SectionCard>
        )}

        {/* Access Table */}
        <SectionCard>
          {siteAccess.value.length === 0 ? (
            <div class="text-center py-12">
              <i class="i-heroicons-lock-closed-solid h-16 w-16 inline-block text-light-300 mb-4" aria-hidden="true"></i>
              <h3 class="text-xl font-semibold text-neutral-800 mb-2">No Access Assigned</h3>
              <p class="text-neutral-600 mb-6">Assign users access to this site to get started</p>
              <Btn
                onClick$={() => { showAssignForm.value = true; }}
              >
                Assign Access
              </Btn>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <DataTable>
                <DataTableHead>
                  <DataTableRow>
                    <DataTableHeaderCell>User</DataTableHeaderCell>
                    <DataTableHeaderCell class="text-center">Read</DataTableHeaderCell>
                    <DataTableHeaderCell class="text-center">Create</DataTableHeaderCell>
                    <DataTableHeaderCell class="text-center">Update</DataTableHeaderCell>
                    <DataTableHeaderCell class="text-center">Delete</DataTableHeaderCell>
                    <DataTableHeaderCell>Granted</DataTableHeaderCell>
                    <DataTableHeaderCell class="text-right">Actions</DataTableHeaderCell>
                  </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                  {siteAccess.value.map((access) => (
                    <DataTableRow key={access.id} class="hover:bg-neutral-50 transition">
                      <DataTableCell>
                        <div>
                          <div class="text-sm font-medium text-neutral-800">{access.user?.name}</div>
                          <div class="text-xs text-neutral-500">{access.user?.email}</div>
                        </div>
                      </DataTableCell>
                      <DataTableCell class="text-center">
                        <Badge variant={access.permissions.read ? 'success' : 'error'}>{access.permissions.read ? 'Yes' : 'No'}</Badge>
                      </DataTableCell>
                      <DataTableCell class="text-center">
                        <Badge variant={access.permissions.create ? 'success' : 'error'}>{access.permissions.create ? 'Yes' : 'No'}</Badge>
                      </DataTableCell>
                      <DataTableCell class="text-center">
                        <Badge variant={access.permissions.update ? 'success' : 'error'}>{access.permissions.update ? 'Yes' : 'No'}</Badge>
                      </DataTableCell>
                      <DataTableCell class="text-center">
                        <Badge variant={access.permissions.delete ? 'success' : 'error'}>{access.permissions.delete ? 'Yes' : 'No'}</Badge>
                      </DataTableCell>
                      <DataTableCell class="text-xs text-neutral-600">
                        {access.granted_at ? new Date(access.granted_at).toLocaleDateString() : 'N/A'}
                      </DataTableCell>
                      <DataTableCell class="text-right">
                        <Btn
                          onClick$={() => handleRevokeAccess(access.id)}
                          variant="danger"
                          size="sm"
                          title="Revoke Access"
                        >
                          Revoke
                        </Btn>
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          )}
        </SectionCard>
    </div>
  );
});
