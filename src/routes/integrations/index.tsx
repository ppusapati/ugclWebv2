// src/routes/integrations/index.tsx
import { component$, useSignal, $, useStore } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead, useNavigate } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services';
import { integrationService } from '~/services/integration.service';
import type { ThirdPartyIntegration, IntegrationListResponse } from '~/types/integration';
import { Alert, Badge, Btn, FormField, PageHeader, SectionCard } from '~/components/ds';
import type { BadgeVariant } from '~/components/ds/badge';

export const useIntegrationsData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);
  try {
    const response = await ssrApiClient.get<IntegrationListResponse>('/admin/integrations');
    return { integrations: response.integrations || [], error: null as string | null };
  } catch (err: any) {
    return { integrations: [] as ThirdPartyIntegration[], error: err.message || 'Failed to load integrations' };
  }
});

const STATUS_BADGE: Record<string, BadgeVariant> = {
  active: 'success',
  inactive: 'neutral',
  suspended: 'error',
};

export default component$(() => {
  const initial = useIntegrationsData();
  const nav = useNavigate();
  const items = useSignal<ThirdPartyIntegration[]>(initial.value.integrations);
  const error = useSignal<string | null>(initial.value.error);
  const deletingId = useSignal<string | null>(null);
  const confirmDelete = useStore({ id: '', name: '' });
  const filters = useStore({
    search: '',
    status: 'all',
  });

  const reload = $(async () => {
    try {
      const res = await integrationService.list();
      items.value = res.integrations;
    } catch (e: any) {
      error.value = e.message || 'Failed to reload';
    }
  });

  const handleDelete = $(async () => {
    if (!confirmDelete.id) return;
    deletingId.value = confirmDelete.id;
    try {
      await integrationService.delete(confirmDelete.id);
      confirmDelete.id = '';
      confirmDelete.name = '';
      await reload();
    } catch (e: any) {
      error.value = e.message || 'Delete failed';
    } finally {
      deletingId.value = null;
    }
  });

  const handleToggleStatus = $(async (item: ThirdPartyIntegration) => {
    const next = item.status === 'active' ? 'inactive' : 'active';
    try {
      await integrationService.toggleStatus(item.id, next);
      await reload();
    } catch (e: any) {
      error.value = e.message || 'Status update failed';
    }
  });

  const filteredItems = items.value.filter((item) => {
    const query = filters.search.trim().toLowerCase();
    const matchesSearch = !query ||
      item.name.toLowerCase().includes(query) ||
      (item.description || '').toLowerCase().includes(query) ||
      (item.contact_email || '').toLowerCase().includes(query) ||
      (item.api_key_prefix || '').toLowerCase().includes(query);

    const matchesStatus = filters.status === 'all' || item.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  const activeCount = items.value.filter((item) => item.status === 'active').length;
  const suspendedCount = items.value.filter((item) => item.status === 'suspended').length;

  return (
    <div class="space-y-6 py-4">
      <PageHeader
        title="Third-Party Integrations"
        subtitle="Manage external partners: allowed callback URLs, permitted source IPs, and data scopes they may access."
      >
        <div q:slot="actions">
          <Btn onClick$={() => nav('/integrations/new')}>
            <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block"></i>
            New Integration
          </Btn>
        </div>
      </PageHeader>

      {error.value ? (
        <Alert variant="error">
          {error.value}
        </Alert>
      ) : null}

      <SectionCard>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Search Integrations" id="integration-search" labelFor="integration-search">
            <input
              id="integration-search"
              type="text"
              class="w-full px-4 py-2 border border-neutral-300 rounded-lg"
              placeholder="Search by name, description, contact, or key prefix..."
              value={filters.search}
              onInput$={(e) => {
                filters.search = (e.target as HTMLInputElement).value;
              }}
            />
          </FormField>

          <FormField label="Status" id="integration-status" labelFor="integration-status">
            <select
              id="integration-status"
              class="w-full px-4 py-2 border border-neutral-300 rounded-lg"
              value={filters.status}
              onChange$={(e) => {
                filters.status = (e.target as HTMLSelectElement).value;
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </FormField>
        </div>

        <div class="mt-4 flex items-center gap-2 flex-wrap text-sm text-neutral-600">
          <span class="font-medium">Showing:</span>
          <span>{filteredItems.length} integration{filteredItems.length !== 1 ? 's' : ''}</span>
          <Badge variant="success">{activeCount} Active</Badge>
          {suspendedCount > 0 ? <Badge variant="error">{suspendedCount} Suspended</Badge> : null}
          {filters.status !== 'all' ? (
            <Badge variant="info">{filters.status}</Badge>
          ) : null}
        </div>
      </SectionCard>

      {items.value.length === 0 ? (
        <SectionCard>
          <p class="text-color-text-secondary text-sm text-center py-8">
            No integrations configured yet. Click <strong>+ New Integration</strong> to add one.
          </p>
        </SectionCard>
      ) : (
        <SectionCard class="p-0 overflow-hidden">
          {filteredItems.length === 0 ? (
            <div class="text-center py-12 px-6">
              <i class="i-heroicons-circle-stack-solid h-16 w-16 inline-block text-light-300 mb-4" aria-hidden="true"></i>
              <h3 class="text-xl font-semibold text-neutral-800 mb-2">No Integrations Found</h3>
              <p class="text-neutral-600 mb-6">
                {filters.search || filters.status !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first integration'}
              </p>
              {!filters.search && filters.status === 'all' ? (
                <Btn onClick$={() => nav('/integrations/new')}>
                  <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block"></i>
                  New Integration
                </Btn>
              ) : null}
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-light-200">
                <thead class="bg-neutral-50">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Integration</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Status</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Allowed URLs</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Allowed IPs</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Scopes</th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Last Access</th>
                    <th class="px-6 py-4 text-right text-xs font-semibold text-neutral-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-light-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} class="hover:bg-neutral-50 transition">
                      <td class="px-6 py-4">
                        <div>
                          <div class="text-sm font-medium text-neutral-800 flex items-center gap-2">
                            <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-color-brand-primary-100 text-color-brand-primary-700 font-semibold text-xs">
                              {item.name.charAt(0).toUpperCase()}
                            </span>
                            <span>{item.name}</span>
                          </div>
                          {item.description ? (
                            <div class="text-xs text-neutral-500 mt-1">{item.description}</div>
                          ) : null}
                          {item.api_key_prefix ? (
                            <div class="text-xs text-neutral-500 mt-1 font-mono">Key: {item.api_key_prefix}…</div>
                          ) : null}
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <Badge variant={STATUS_BADGE[item.status] ?? 'neutral'}>{item.status}</Badge>
                      </td>
                      <td class="px-6 py-4 text-sm text-neutral-700">{item.allowed_urls?.length ?? 0}</td>
                      <td class="px-6 py-4 text-sm text-neutral-700">{item.allowed_ips?.length ?? 0}</td>
                      <td class="px-6 py-4 text-sm text-neutral-700">{item.data_scopes?.length ?? 0}</td>
                      <td class="px-6 py-4 text-sm text-neutral-700">
                        {item.last_accessed_at ? new Date(item.last_accessed_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2">
                          <Btn
                            variant="ghost"
                            size="sm"
                            onClick$={() => handleToggleStatus(item)}
                          >
                            {item.status === 'active' ? 'Disable' : 'Enable'}
                          </Btn>
                          <Btn
                            variant="secondary"
                            size="sm"
                            onClick$={() => nav(`/integrations/${item.id}`)}
                          >
                            <i class="i-heroicons-pencil-square-solid w-4 h-4 inline-block"></i>
                            Edit
                          </Btn>
                          <Btn
                            variant="danger"
                            size="sm"
                            onClick$={() => {
                              confirmDelete.id = item.id;
                              confirmDelete.name = item.name;
                            }}
                          >
                            <i class="i-heroicons-trash-solid w-4 h-4 inline-block"></i>
                            Delete
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete.id ? (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick$={(e) => {
            if ((e.target as HTMLElement).classList.contains('fixed')) {
              confirmDelete.id = '';
              confirmDelete.name = '';
            }
          }}
        >
          <div class="bg-color-surface-primary rounded-xl shadow-xl border border-color-border-primary p-6 w-full max-w-sm mx-4">
            <h3 class="text-lg font-semibold text-color-text-primary mb-2">Delete Integration?</h3>
            <p class="text-sm text-color-text-secondary mb-5">
              This will permanently remove <strong>{confirmDelete.name}</strong> and revoke its API key.
              This action cannot be undone.
            </p>
            <div class="flex gap-3 justify-end">
              <Btn
                variant="secondary"
                onClick$={() => { confirmDelete.id = ''; confirmDelete.name = ''; }}
              >
                Cancel
              </Btn>
              <Btn
                variant="danger"
                disabled={deletingId.value !== null}
                onClick$={handleDelete}
              >
                {deletingId.value ? 'Deleting…' : 'Delete'}
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Third-Party Integrations | Admin',
};
