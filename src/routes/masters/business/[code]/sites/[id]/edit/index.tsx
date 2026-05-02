// src/routes/business/[code]/sites/[id]/edit/index.tsx
import { component$, isServer, useSignal, $, useTask$ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { siteService } from '~/services';
import type { Site } from '~/services';
import { Alert, Btn, FormField, PageHeader, SectionCard } from '~/components/ds';

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const businessCode = loc.params.code;
  const siteId = loc.params.id;

  const site = useSignal<Site | null>(null);
  const formData = useSignal({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    is_active: true,
  });

  const errors = useSignal<Record<string, string>>({});
  const loading = useSignal(false);
  const initialLoading = useSignal(true);

  useTask$(async () => {
    if (isServer) {
      return;
    }
    try {
      const sites = await siteService.getMySites(businessCode);
      const foundSite = sites.find((s: Site) => s.id === siteId);

      if (!foundSite) {
        nav(`/masters/business/${businessCode}/sites`);
        return;
      }

      site.value = foundSite;
      formData.value = {
        name: foundSite.name,
        description: foundSite.description || '',
        latitude: foundSite.location?.lat.toString() || '',
        longitude: foundSite.location?.lng.toString() || '',
        address: foundSite.location?.address || '',
        is_active: foundSite.is_active !== false,
      };
    } catch (error) {
      console.error('Failed to load site:', error);
      nav(`/masters/business/${businessCode}/sites`);
    } finally {
      initialLoading.value = false;
    }
  });

  const validate = $(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.value.name.trim()) newErrors.name = 'Site name is required';
    if (formData.value.latitude && isNaN(parseFloat(formData.value.latitude))) {
      newErrors.latitude = 'Invalid latitude';
    }
    if (formData.value.longitude && isNaN(parseFloat(formData.value.longitude))) {
      newErrors.longitude = 'Invalid longitude';
    }

    errors.value = newErrors;
    return Object.keys(newErrors).length === 0;
  });

  const handleSubmit = $(async () => {
    if (!(await validate())) return;

    loading.value = true;
    errors.value = {};

    try {
      const location = formData.value.latitude && formData.value.longitude
        ? {
            lat: parseFloat(formData.value.latitude),
            lng: parseFloat(formData.value.longitude),
            address: formData.value.address || undefined,
          }
        : undefined;

      await siteService.updateSite(businessCode, siteId, {
        name: formData.value.name,
        description: formData.value.description || undefined,
        location,
        is_active: formData.value.is_active,
      });

      nav(`/masters/business/${businessCode}/sites`);
    } catch (error: any) {
      errors.value = { submit: error.message || 'Failed to update site' };
    } finally {
      loading.value = false;
    }
  });

  if (initialLoading.value) {
    return (
      <div class="flex items-center justify-center py-16">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-neutral-600">Loading site...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-6 py-2">
        <PageHeader title="Edit Site" subtitle="Update site information">
          <Btn q:slot="actions" variant="ghost" onClick$={() => nav(`/masters/business/${businessCode}/sites`)}>
            <i class="i-heroicons-arrow-left-solid mr-1 h-4 w-4 inline-block" aria-hidden="true"></i>
            Back to Sites
          </Btn>
        </PageHeader>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <SectionCard class="p-8">
              <form onSubmit$={handleSubmit} preventdefault:submit>
                <FormField id="biz-edit-site-name" label="Site Name" required error={errors.value.name} class="mb-6">
                  <input
                    id="biz-edit-site-name"
                    type="text"
                    value={formData.value.name}
                    required
                    aria-required="true"
                    aria-describedby={errors.value.name ? 'biz-edit-site-name-error' : ''}
                    onInput$={(e) => { formData.value = { ...formData.value, name: (e.target as HTMLInputElement).value }; }}
                    class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                  />
                </FormField>

                <FormField id="biz-edit-site-code" label="Site Code" hint="Code cannot be changed" class="mb-6">
                  <input
                    id="biz-edit-site-code"
                    type="text"
                    value={site.value?.code}
                    aria-describedby="biz-edit-site-code-hint"
                    disabled
                    class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-100 font-mono cursor-not-allowed"
                  />
                </FormField>

                <FormField id="biz-edit-site-description" label="Description" class="mb-6">
                  <textarea
                    id="biz-edit-site-description"
                    value={formData.value.description}
                    onInput$={(e) => { formData.value = { ...formData.value, description: (e.target as HTMLTextAreaElement).value }; }}
                    rows={4}
                    class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                  ></textarea>
                </FormField>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <FormField id="biz-edit-site-latitude" label="Latitude" error={errors.value.latitude}>
                    <input
                      id="biz-edit-site-latitude"
                      type="text"
                      value={formData.value.latitude}
                      aria-describedby={errors.value.latitude ? 'biz-edit-site-latitude-error' : ''}
                      onInput$={(e) => { formData.value = { ...formData.value, latitude: (e.target as HTMLInputElement).value }; }}
                      class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                    />
                  </FormField>

                  <FormField id="biz-edit-site-longitude" label="Longitude" error={errors.value.longitude}>
                    <input
                      id="biz-edit-site-longitude"
                      type="text"
                      value={formData.value.longitude}
                      aria-describedby={errors.value.longitude ? 'biz-edit-site-longitude-error' : ''}
                      onInput$={(e) => { formData.value = { ...formData.value, longitude: (e.target as HTMLInputElement).value }; }}
                      class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                    />
                  </FormField>
                </div>

                <FormField id="biz-edit-site-address" label="Address" class="mb-6">
                  <textarea
                    id="biz-edit-site-address"
                    value={formData.value.address}
                    onInput$={(e) => { formData.value = { ...formData.value, address: (e.target as HTMLTextAreaElement).value }; }}
                    rows={3}
                    class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                  ></textarea>
                </FormField>

                <div class="form-group mb-6">
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.value.is_active}
                      onChange$={(e) => { formData.value = { ...formData.value, is_active: (e.target as HTMLInputElement).checked }; }}
                      class="form-checkbox mr-3"
                    />
                    <span class="text-neutral-700 font-medium">Active</span>
                  </label>
                </div>

                {errors.value.submit && (
                  <Alert variant="error" class="mb-6 border-l-4">
                    <p class="text-error-800">{errors.value.submit}</p>
                  </Alert>
                )}

                <div class="flex gap-4 flex-col sm:flex-row">
                  <Btn type="submit" disabled={loading.value} class="flex-1 py-3 text-lg font-semibold">
                    {loading.value ? 'Saving...' : 'Save Changes'}
                  </Btn>
                  <Btn type="button" variant="secondary" onClick$={() => nav(`/masters/business/${businessCode}/sites`)} class="flex-1 py-3 text-lg font-semibold">
                    Cancel
                  </Btn>
                </div>
              </form>
            </SectionCard>
          </div>

          <div class="lg:col-span-1">
            <SectionCard class="border-color-interactive-primary/20 bg-color-interactive-primary/5">
              <h3 class="text-lg font-semibold text-primary-800 mb-4">Current Info</h3>
              <div class="space-y-3 text-sm">
                <div>
                  <p class="text-primary-600 font-medium">Created</p>
                  <p class="text-primary-800">
                    {site.value?.created_at ? new Date(site.value.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p class="text-primary-600 font-medium">Last Updated</p>
                  <p class="text-primary-800">
                    {site.value?.updated_at ? new Date(site.value.updated_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
    </div>
  );
});
