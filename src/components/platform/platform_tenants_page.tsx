import { $, component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { Btn } from '~/components/ds/btn';
import {
  platformService,
  PlatformApiError,
  type PlatformTenant,
} from '~/services/platform.service';

type WizardStep = 'closed' | 'create' | 'provision' | 'seed';

export const PlatformTenantsPage = component$(() => {
  const nav = useNavigate();

  const state = useStore({
    loading: true,
    error: '',
    tenants: [] as PlatformTenant[],
    adminName: '',
    adminEmail: '',

    wizard: 'closed' as WizardStep,
    wizardError: '',
    wizardBusy: false,
    activeTenant: null as PlatformTenant | null,

    newTenantName: '',
    newTenantSlug: '',

    seedAdminName: '',
    seedAdminEmail: '',
    seedAdminPhone: '',
    seedAdminPassword: '',
  });

  const loadTenants = $(async () => {
    state.loading = true;
    state.error = '';
    try {
      state.tenants = await platformService.listTenants();
    } catch (err) {
      if (err instanceof PlatformApiError && err.status === 401) {
        await nav('/platform/login');
        return;
      }
      state.error =
        err instanceof PlatformApiError ? err.message : 'Failed to load tenants';
    } finally {
      state.loading = false;
    }
  });

  useVisibleTask$(() => {
    if (!platformService.isAuthenticated()) {
      nav('/platform/login');
      return;
    }
    const admin = platformService.currentAdmin();
    state.adminName = admin?.name || '';
    state.adminEmail = admin?.email || '';
    loadTenants();
  });

  const handleLogout = $(() => {
    platformService.logout();
    nav('/platform/login');
  });

  const openCreateWizard = $(() => {
    state.wizard = 'create';
    state.wizardError = '';
    state.activeTenant = null;
    state.newTenantName = '';
    state.newTenantSlug = '';
  });

  const closeWizard = $(() => {
    state.wizard = 'closed';
    state.activeTenant = null;
    state.wizardError = '';
  });

  const handleCreate = $(async () => {
    if (state.wizardBusy) return;
    const name = state.newTenantName.trim();
    const slug = state.newTenantSlug.trim();
    if (!name || !slug) {
      state.wizardError = 'Name and slug are required';
      return;
    }

    state.wizardBusy = true;
    state.wizardError = '';
    try {
      const tenant = await platformService.createTenant({ name, slug });
      state.activeTenant = tenant;
      state.wizard = 'provision';
      state.tenants = [tenant, ...state.tenants];
    } catch (err) {
      state.wizardError =
        err instanceof PlatformApiError ? err.message : 'Failed to create tenant';
    } finally {
      state.wizardBusy = false;
    }
  });

  const handleProvision = $(async () => {
    if (state.wizardBusy || !state.activeTenant) return;

    state.wizardBusy = true;
    state.wizardError = '';
    try {
      const tenant = await platformService.provisionTenant(state.activeTenant.id);
      state.activeTenant = tenant;
      state.tenants = state.tenants.map((t) => (t.id === tenant.id ? tenant : t));
      state.wizard = 'seed';
      state.seedAdminName = '';
      state.seedAdminEmail = '';
      state.seedAdminPhone = '';
      state.seedAdminPassword = '';
    } catch (err) {
      state.wizardError =
        err instanceof PlatformApiError
          ? err.message
          : 'Failed to provision tenant schema';
    } finally {
      state.wizardBusy = false;
    }
  });

  const handleSeedAdmin = $(async () => {
    if (state.wizardBusy || !state.activeTenant) return;
    if (!state.seedAdminPhone.trim() || !state.seedAdminPassword) {
      state.wizardError = 'Admin phone and password are required';
      return;
    }

    state.wizardBusy = true;
    state.wizardError = '';
    try {
      const tenant = await platformService.seedTenantAdmin(state.activeTenant.id, {
        admin_name: state.seedAdminName.trim(),
        admin_email: state.seedAdminEmail.trim() || undefined,
        admin_phone: state.seedAdminPhone.trim(),
        admin_password: state.seedAdminPassword,
      });
      state.activeTenant = tenant;
      state.tenants = state.tenants.map((t) => (t.id === tenant.id ? tenant : t));
      state.wizard = 'closed';
    } catch (err) {
      state.wizardError =
        err instanceof PlatformApiError ? err.message : 'Failed to seed tenant admin';
    } finally {
      state.wizardBusy = false;
    }
  });

  const resumeTenant = $((tenant: PlatformTenant) => {
    state.activeTenant = tenant;
    state.wizardError = '';
    if (tenant.status === 'provisioning') {
      state.wizard = 'provision';
    } else {
      state.seedAdminName = '';
      state.seedAdminEmail = '';
      state.seedAdminPhone = '';
      state.seedAdminPassword = '';
      state.wizard = 'seed';
    }
  });

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-700';
      case 'provisioning':
        return 'bg-warning-100 text-warning-700';
      case 'failed':
        return 'bg-danger-100 text-danger-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div class="min-h-screen bg-neutral-50 p-6">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="h-2-bold text-neutral-900">Platform Tenants</h1>
            <p class="text-sm text-neutral-500">
              Signed in as {state.adminName} ({state.adminEmail})
            </p>
          </div>
          <div class="flex gap-2">
            <Btn variant="secondary" onClick$={handleLogout}>
              Log out
            </Btn>
            <Btn onClick$={openCreateWizard}>New Tenant</Btn>
          </div>
        </div>

        {state.error && (
          <div class="rounded-lg border border-danger-300 bg-danger-50 px-3 py-2 text-sm text-danger-700 mb-4">
            {state.error}
          </div>
        )}

        {state.wizard !== 'closed' && (
          <div class="rounded-2xl border border-neutral-200 bg-white shadow-md p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-neutral-900">
                {state.wizard === 'create' && 'Step 1 of 3 — Create tenant'}
                {state.wizard === 'provision' && 'Step 2 of 3 — Provision schema'}
                {state.wizard === 'seed' && 'Step 3 of 3 — Seed tenant admin'}
              </h2>
              <button
                type="button"
                class="text-neutral-400 hover:text-neutral-600 text-sm"
                onClick$={closeWizard}
              >
                Close
              </button>
            </div>

            {state.wizardError && (
              <div class="rounded-lg border border-danger-300 bg-danger-50 px-3 py-2 text-sm text-danger-700 mb-4">
                {state.wizardError}
              </div>
            )}

            {state.wizard === 'create' && (
              <div class="flex flex-col gap-3">
                <div class="form-group">
                  <label class="form-label-muted mb-2" for="tenant-name">
                    Tenant name
                  </label>
                  <input
                    id="tenant-name"
                    type="text"
                    class="form-input w-full box-border"
                    placeholder="e.g. Acme Construction"
                    value={state.newTenantName}
                    onInput$={(e) => {
                      state.newTenantName = (e.target as HTMLInputElement).value;
                    }}
                  />
                </div>
                <div class="form-group">
                  <label class="form-label-muted mb-2" for="tenant-slug">
                    Slug (used as the login Organization ID)
                  </label>
                  <input
                    id="tenant-slug"
                    type="text"
                    class="form-input w-full box-border"
                    placeholder="e.g. acme"
                    value={state.newTenantSlug}
                    onInput$={(e) => {
                      state.newTenantSlug = (e.target as HTMLInputElement).value;
                    }}
                  />
                </div>
                <Btn disabled={state.wizardBusy} onClick$={handleCreate}>
                  {state.wizardBusy ? 'Creating...' : 'Create Tenant'}
                </Btn>
              </div>
            )}

            {state.wizard === 'provision' && state.activeTenant && (
              <div class="flex flex-col gap-3">
                <p class="text-sm text-neutral-600">
                  Creates and fully migrates the Postgres schema{' '}
                  <code class="bg-neutral-100 px-1 rounded">
                    {state.activeTenant.schema_name}
                  </code>{' '}
                  for <strong>{state.activeTenant.name}</strong>. This can take a
                  couple of minutes.
                </p>
                <Btn disabled={state.wizardBusy} onClick$={handleProvision}>
                  {state.wizardBusy ? 'Provisioning… please wait' : 'Provision Schema'}
                </Btn>
              </div>
            )}

            {state.wizard === 'seed' && state.activeTenant && (
              <div class="flex flex-col gap-3">
                <p class="text-sm text-neutral-600">
                  Create the first super_admin login for{' '}
                  <strong>{state.activeTenant.name}</strong>.
                </p>
                <div class="form-group">
                  <label class="form-label-muted mb-2" for="seed-admin-name">
                    Admin name
                  </label>
                  <input
                    id="seed-admin-name"
                    type="text"
                    class="form-input w-full box-border"
                    value={state.seedAdminName}
                    onInput$={(e) => {
                      state.seedAdminName = (e.target as HTMLInputElement).value;
                    }}
                  />
                </div>
                <div class="form-group">
                  <label class="form-label-muted mb-2" for="seed-admin-email">
                    Admin email (optional)
                  </label>
                  <input
                    id="seed-admin-email"
                    type="email"
                    class="form-input w-full box-border"
                    value={state.seedAdminEmail}
                    onInput$={(e) => {
                      state.seedAdminEmail = (e.target as HTMLInputElement).value;
                    }}
                  />
                </div>
                <div class="form-group">
                  <label class="form-label-muted mb-2" for="seed-admin-phone">
                    Admin phone (login identifier)
                  </label>
                  <input
                    id="seed-admin-phone"
                    type="text"
                    class="form-input w-full box-border"
                    value={state.seedAdminPhone}
                    onInput$={(e) => {
                      state.seedAdminPhone = (e.target as HTMLInputElement).value;
                    }}
                  />
                </div>
                <div class="form-group">
                  <label class="form-label-muted mb-2" for="seed-admin-password">
                    Admin password
                  </label>
                  <input
                    id="seed-admin-password"
                    type="password"
                    class="form-input w-full box-border"
                    value={state.seedAdminPassword}
                    onInput$={(e) => {
                      state.seedAdminPassword = (e.target as HTMLInputElement).value;
                    }}
                  />
                </div>
                <Btn disabled={state.wizardBusy} onClick$={handleSeedAdmin}>
                  {state.wizardBusy ? 'Seeding...' : 'Seed Admin & Activate'}
                </Btn>
              </div>
            )}
          </div>
        )}

        <div class="rounded-2xl border border-neutral-200 bg-white shadow-md overflow-hidden">
          {state.loading ? (
            <div class="p-6 text-center text-neutral-500">Loading tenants…</div>
          ) : state.tenants.length === 0 ? (
            <div class="p-6 text-center text-neutral-500">No tenants yet.</div>
          ) : (
            <table class="w-full text-sm">
              <thead class="bg-neutral-50 text-neutral-500 text-left">
                <tr>
                  <th class="px-4 py-3 font-medium">Name</th>
                  <th class="px-4 py-3 font-medium">Slug</th>
                  <th class="px-4 py-3 font-medium">Schema</th>
                  <th class="px-4 py-3 font-medium">Status</th>
                  <th class="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {state.tenants.map((tenant) => (
                  <tr key={tenant.id} class="border-t border-neutral-100">
                    <td class="px-4 py-3 font-medium text-neutral-900">
                      {tenant.name}
                    </td>
                    <td class="px-4 py-3 text-neutral-600">{tenant.slug}</td>
                    <td class="px-4 py-3 text-neutral-600">
                      {tenant.schema_name}
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(tenant.status)}`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      {tenant.status !== 'active' && (
                        <button
                          type="button"
                          class="text-primary-600 hover:underline text-sm"
                          onClick$={() => resumeTenant(tenant)}
                        >
                          Resume setup
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
});
