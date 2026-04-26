// src/routes/integrations/index.tsx
import { component$, useSignal, $, useStore } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead, useNavigate } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services';
import { integrationService } from '~/services/integration.service';
import type { ThirdPartyIntegration, IntegrationListResponse } from '~/types/integration';
import { Alert, Badge, Btn, PageHeader, SectionCard } from '~/components/ds';
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

  return (
    <div class="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
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

      {items.value.length === 0 ? (
        <SectionCard>
          <p class="text-color-text-secondary text-sm text-center py-8">
            No integrations configured yet. Click <strong>+ New Integration</strong> to add one.
          </p>
        </SectionCard>
      ) : (
        <div class="space-y-3">
          {items.value.map((item) => (
            <SectionCard key={item.id} class="hover:shadow-md transition-shadow">
              <div class="flex items-start gap-4">
                {/* Icon */}
                <div class="flex-shrink-0 h-10 w-10 rounded-lg bg-color-brand-primary-100 flex items-center justify-center text-color-brand-primary-700 font-bold text-lg">
                  {item.name.charAt(0).toUpperCase()}
                </div>

                {/* Details */}
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="font-semibold text-color-text-primary">{item.name}</h3>
                    <Badge variant={STATUS_BADGE[item.status] ?? 'neutral'}>
                      {item.status}
                    </Badge>
                  </div>
                  {item.description ? (
                    <p class="mt-0.5 text-sm text-color-text-secondary line-clamp-1">{item.description}</p>
                  ) : null}
                  <div class="mt-2 flex flex-wrap gap-3 text-xs text-color-text-tertiary">
                    <span>
                      <strong class="text-color-text-secondary">{item.allowed_urls?.length ?? 0}</strong> allowed URL{item.allowed_urls?.length !== 1 ? 's' : ''}
                    </span>
                    <span>
                      <strong class="text-color-text-secondary">{item.allowed_ips?.length ?? 0}</strong> allowed IP{item.allowed_ips?.length !== 1 ? 's' : ''}
                    </span>
                    <span>
                      <strong class="text-color-text-secondary">{item.data_scopes?.length ?? 0}</strong> data scope{item.data_scopes?.length !== 1 ? 's' : ''}
                    </span>
                    {item.api_key_prefix ? (
                      <span>Key: <code class="font-mono bg-color-surface-secondary px-1 rounded">{item.api_key_prefix}…</code></span>
                    ) : null}
                    {item.last_accessed_at ? (
                      <span>Last access: {new Date(item.last_accessed_at).toLocaleDateString()}</span>
                    ) : null}
                  </div>
                </div>

                {/* Actions */}
                <div class="flex items-center gap-2 flex-shrink-0">
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
              </div>
            </SectionCard>
          ))}
        </div>
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
