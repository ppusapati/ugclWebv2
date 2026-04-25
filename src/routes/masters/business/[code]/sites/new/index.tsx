// src/routes/business/[code]/sites/new/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { siteService } from '~/services';
import { Alert, Btn, FormField, PageHeader, SectionCard } from '~/components/ds';

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const businessCode = loc.params.code;

  const formData = useSignal({
    name: '',
    code: '',
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    is_active: true,
  });

  const errors = useSignal<Record<string, string>>({});
  const loading = useSignal(false);

  const validate = $(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.value.name.trim()) newErrors.name = 'Site name is required';
    if (!formData.value.code.trim()) {
      newErrors.code = 'Site code is required';
    } else if (!/^[a-z0-9_-]+$/.test(formData.value.code)) {
      newErrors.code = 'Code must contain only lowercase letters, numbers, hyphens, underscores';
    }

    if (formData.value.latitude && isNaN(parseFloat(formData.value.latitude))) {
      newErrors.latitude = 'Invalid latitude';
    }
    if (formData.value.longitude && isNaN(parseFloat(formData.value.longitude))) {
      newErrors.longitude = 'Invalid longitude';
    }

    errors.value = newErrors;
    return Object.keys(newErrors).length === 0;
  });

  const handleSubmit = $(async (e: Event) => {
    e.preventDefault();
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

      await siteService.createSite(businessCode, {
        name: formData.value.name,
        code: formData.value.code.toLowerCase(),
        description: formData.value.description || undefined,
        business_vertical_id: businessCode,
        location,
        is_active: formData.value.is_active,
      });

      nav(`/masters/business/${businessCode}/sites`);
    } catch (error: any) {
      errors.value = { submit: error.message || 'Failed to create site' };
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="space-y-6 py-2">
        <PageHeader title="Create Site" subtitle={`Add a new site to ${businessCode}`}>
          <Btn q:slot="actions" variant="ghost" onClick$={() => nav(`/masters/business/${businessCode}/sites`)}>
            <i class="i-heroicons-arrow-left-solid mr-1 h-4 w-4 inline-block" aria-hidden="true"></i>
            Back to Sites
          </Btn>
        </PageHeader>

        <SectionCard class="p-8">
          <form onSubmit$={handleSubmit} preventdefault:submit>
            <FormField id="biz-site-name" label="Site Name" required error={errors.value.name} class="mb-6">
              <input
                id="biz-site-name"
                type="text"
                value={formData.value.name}
                required
                aria-required="true"
                aria-describedby={errors.value.name ? 'biz-site-name-error' : ''}
                onInput$={(e) => { formData.value = { ...formData.value, name: (e.target as HTMLInputElement).value }; }}
                class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                placeholder="e.g., Main Office"
              />
            </FormField>

            <FormField id="biz-site-code" label="Site Code" required error={errors.value.code} class="mb-6">
              <input
                id="biz-site-code"
                type="text"
                value={formData.value.code}
                required
                aria-required="true"
                aria-describedby={errors.value.code ? 'biz-site-code-error' : ''}
                onInput$={(e) => { formData.value = { ...formData.value, code: (e.target as HTMLInputElement).value.toLowerCase() }; }}
                class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg font-mono"
                placeholder="e.g., main-office"
              />
            </FormField>

            <FormField id="biz-site-description" label="Description" class="mb-6">
              <textarea
                id="biz-site-description"
                value={formData.value.description}
                onInput$={(e) => { formData.value = { ...formData.value, description: (e.target as HTMLTextAreaElement).value }; }}
                rows={4}
                class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                placeholder="Brief description of this site"
              ></textarea>
            </FormField>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FormField id="biz-site-latitude" label="Latitude" error={errors.value.latitude}>
                <input
                  id="biz-site-latitude"
                  type="text"
                  value={formData.value.latitude}
                  aria-describedby={errors.value.latitude ? 'biz-site-latitude-error' : ''}
                  onInput$={(e) => { formData.value = { ...formData.value, latitude: (e.target as HTMLInputElement).value }; }}
                  class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                  placeholder="e.g., 28.6139"
                />
              </FormField>

              <FormField id="biz-site-longitude" label="Longitude" error={errors.value.longitude}>
                <input
                  id="biz-site-longitude"
                  type="text"
                  value={formData.value.longitude}
                  aria-describedby={errors.value.longitude ? 'biz-site-longitude-error' : ''}
                  onInput$={(e) => { formData.value = { ...formData.value, longitude: (e.target as HTMLInputElement).value }; }}
                  class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                  placeholder="e.g., 77.2090"
                />
              </FormField>
            </div>

            <FormField id="biz-site-address" label="Address" class="mb-6">
              <textarea
                id="biz-site-address"
                value={formData.value.address}
                onInput$={(e) => { formData.value = { ...formData.value, address: (e.target as HTMLTextAreaElement).value }; }}
                rows={3}
                class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                placeholder="Full address of the site"
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
                {loading.value ? 'Creating...' : 'Create Site'}
              </Btn>
              <Btn type="button" variant="secondary" onClick$={() => nav(`/masters/business/${businessCode}/sites`)} class="flex-1 py-3 text-lg font-semibold">
                Cancel
              </Btn>
            </div>
          </form>
        </SectionCard>
    </div>
  );
});
