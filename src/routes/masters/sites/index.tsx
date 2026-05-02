// src/routes/admin/masters/sites/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import type { Site } from '~/services';
import { createSSRApiClient } from '~/services';
import { Alert, Badge, Btn, DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeaderCell, DataTableRow, PageHeader, SectionCard } from '~/components/ds';

export const useAdminSitesData = routeLoader$(async (requestEvent) => {
  const ssrApiClient = createSSRApiClient(requestEvent);

  try {
    const response = await ssrApiClient.get<any>('/admin/sites', {
      page: 1,
      limit: 100,
      include: 'business_vertical',
    });

    return { response };
  } catch (error: any) {
    return {
      error: error?.message || 'Failed to fetch',
      status: error?.status,
    };
  }
});

export default component$(() => {
  const nav = useNavigate();
  const initialData = useAdminSitesData();

  const initialResponse = (initialData.value as any)?.response;
  const initialSites = initialResponse?.data || initialResponse?.sites || [];
  const initialTotal =
    initialResponse?.total ??
    initialResponse?.pagination?.total ??
    initialResponse?.meta?.total ??
    initialSites.length ??
    0;

  const sites = useSignal<Site[]>(initialSites);
  const loading = useSignal(false);
  const error = useSignal((initialData.value as any)?.error || '');
  const showDeleteModal = useSignal(false);
  const siteToDelete = useSignal<Site | null>(null);
  const deleting = useSignal(false);
  const total = useSignal(initialTotal);
  

  const confirmDelete = $((site: Site) => {
    siteToDelete.value = site;
    showDeleteModal.value = true;
  });

  const handleDelete = $(async () => {
    if (!siteToDelete.value) return;

    try {
      deleting.value = true;
      // Note: Delete is not implemented for admin, would need business context
      // For now, just reload the list
      error.value = 'Delete functionality requires business context';
      showDeleteModal.value = false;
      siteToDelete.value = null;
    } catch (err: any) {
      error.value = err.message || 'Failed to delete site';
    } finally {
      deleting.value = false;
    }
  });
  if (loading.value) {
    return (
      <div class="flex items-center justify-center py-16">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-neutral-600">Loading sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-6">
        <PageHeader
          title="All Sites"
          subtitle={`Manage sites across all business verticals (${total.value} total)`}
        >
          <Btn
            q:slot="actions"
            variant="primary"
            onClick$={() => nav('/masters/sites/new')}
          >
            + Add Site
          </Btn>
        </PageHeader>

        {error.value && (
          <Alert variant="error" class="mb-6 border-l-4">
            <p class="text-error-800">{error.value}</p>
          </Alert>
        )}

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SectionCard>
            <div class="text-sm text-neutral-600">Total Sites</div>
            <div class="text-3xl font-bold text-primary-600 mt-2">{sites.value.length}</div>
          </SectionCard>
          <SectionCard>
            <div class="text-sm text-neutral-600">Active</div>
            <div class="text-3xl font-bold text-success-600 mt-2">
              {sites.value.filter(s => s.is_active !== false).length}
            </div>
          </SectionCard>
          <SectionCard>
            <div class="text-sm text-neutral-600">Inactive</div>
            <div class="text-3xl font-bold text-warning-600 mt-2">
              {sites.value.filter(s => s.is_active === false).length}
            </div>
          </SectionCard>
          <SectionCard>
            <div class="text-sm text-neutral-600">With Location</div>
            <div class="text-3xl font-bold text-info-600 mt-2">
              {sites.value.filter(s => s.location).length}
            </div>
          </SectionCard>
        </div>

        <SectionCard>
          {sites.value.length === 0 ? (
            <div class="text-center py-12">
              <i class="i-heroicons-map-pin-solid h-16 w-16 inline-block text-light-300 mb-4" aria-hidden="true"></i>
              <h3 class="text-xl font-semibold text-neutral-800 mb-2">No Sites Yet</h3>
              <p class="text-neutral-600 mb-6">Create your first site to get started</p>
              <Btn onClick$={() => nav('/masters/sites/new')}>
                Add Site
              </Btn>
            </div>
          ) : (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeaderCell>Site Name</DataTableHeaderCell>
                  <DataTableHeaderCell>Code</DataTableHeaderCell>
                  <DataTableHeaderCell>Business Vertical</DataTableHeaderCell>
                  <DataTableHeaderCell>Location</DataTableHeaderCell>
                  <DataTableHeaderCell>Status</DataTableHeaderCell>
                  <DataTableHeaderCell class="text-right">Actions</DataTableHeaderCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {sites.value.map((site) => (
                  <DataTableRow key={site.id}>
                    <DataTableCell>
                      <div class="flex flex-col">
                        <div class="text-sm font-medium text-neutral-800">{site.name}</div>
                        {site.description && (
                          <div class="text-xs text-neutral-500 mt-1">
                            {site.description.slice(0, 60)}
                            {site.description.length > 60 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <span class="badge-light-300 text-xs font-mono">{site.code}</span>
                    </DataTableCell>
                    <DataTableCell>
                      <div class="text-sm text-neutral-800">
                        {(site as any).business_vertical_name || 'N/A'}
                      </div>
                      <div class="text-xs text-neutral-500">
                        {(site as any).business_vertical_code || ''}
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      {site.location ? (
                        <div class="text-xs text-neutral-600">
                          <div>{site.location.lat}, {site.location.lng}</div>
                          {site.location.address && (
                            <div class="text-neutral-500">{site.location.address.slice(0, 30)}...</div>
                          )}
                        </div>
                      ) : (
                        <span class="text-xs text-neutral-400">No location</span>
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      {site.is_active !== false ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="error">Inactive</Badge>
                      )}
                    </DataTableCell>
                    <DataTableCell class="text-right">
                      <div class="flex justify-end gap-2">

                          <Btn
                            size="sm"
                            variant="primary"
                            onClick$={() => nav(`/masters/sites/${site.id}/edit`)}
                            title="Edit"
                          >
                            <span class="flex items-center gap-1">
                              <i class="i-heroicons-pencil-square-solid w-4 h-4 inline-block text-white" />
                              Edit
                            </span>
                          </Btn>
                          <Btn
                            size="sm"
                            variant="danger"
                            onClick$={() => confirmDelete(site)}
                            title="Delete"
                          >
                            <span class="flex gap-1">
                              <i class="i-heroicons-trash-solid w-4 h-4 text-white inline-block" />
                              Delete
                            </span>
                          </Btn>
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </SectionCard>

        {showDeleteModal.value && (
          <div class="fixed inset-0 bg-neutral-950/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
              <h3 class="text-2xl font-bold text-neutral-800 mb-4">Confirm Delete</h3>
              <p class="text-neutral-600 mb-2">Are you sure you want to delete this site:</p>
              <p class="font-semibold text-neutral-800 mb-6">"{siteToDelete.value?.name}"?</p>
              <p class="text-sm text-error-600 mb-6">
                This action cannot be undone. All associated data will be removed.
              </p>
              <div class="flex gap-4">
                <Btn
                  variant="danger"
                  onClick$={handleDelete}
                  disabled={deleting.value}
                  class="flex-1"
                >
                  {deleting.value ? 'Deleting...' : 'Delete'}
                </Btn>
                <Btn
                  variant="secondary"
                  onClick$={() => {
                    showDeleteModal.value = false;
                    siteToDelete.value = null;
                  }}
                  disabled={deleting.value}
                  class="flex-1"
                >
                  Cancel
                </Btn>
              </div>
            </div>
          </div>
        )}
    </div>
  );
});
