// src/routes/business/[code]/sites/[id]/edit/index.tsx
import { component$, useSignal, $, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { siteService } from '~/services';
import type { Site } from '~/services';

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

  useVisibleTask$(async () => {
    try {
      console.log('Loading site with ID:', siteId);
      const foundSite = await siteService.getSitebyID(siteId);
      // const foundSite = response //.find(s => s.id === siteId);
      console.log('Found site:', foundSite);
      if (!foundSite) {
        nav(`/business/${businessCode}/sites`);
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
      nav(`/business/${businessCode}/sites`);
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

      await siteService.updateSite(businessCode, siteId, {
        name: formData.value.name,
        description: formData.value.description || undefined,
        location,
        is_active: formData.value.is_active,
      });

      nav(`/business/${businessCode}/sites`);
    } catch (error: any) {
      errors.value = { submit: error.message || 'Failed to update site' };
    } finally {
      loading.value = false;
    }
  });

  if (initialLoading.value) {
    return (
      <div class="min-h-screen bg-light-50 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-dark-600">Loading site...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container mx-auto">
        <div class="mb-6">
          <button
            onClick$={() => nav(`/business/${businessCode}/sites`)}
            class="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
          >
            <span>←</span> Back to Sites
          </button>
          <h1 class="text-3xl font-bold text-dark-800">Edit Site</h1>
          <p class="text-dark-600 mt-2">Update site information</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <div class="card bg-white shadow-lg rounded-xl p-8">
              <form onSubmit$={handleSubmit} preventdefault:submit>
                <div class="form-group mb-6">
                  <label class="form-label text-dark-700 font-semibold mb-2">
                    Site Name <span class="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.value.name}
                    onInput$={(e) => { formData.value = { ...formData.value, name: (e.target as HTMLInputElement).value }; }}
                    class="form-input"
                  />
                  {errors.value.name && <p class="form-error text-danger-600 text-sm mt-1">{errors.value.name}</p>}
                </div>

                <div class="form-group mb-6">
                  <label class="form-label text-dark-700 font-semibold mb-2">Site Code</label>
                  <input
                    type="text"
                    value={site.value?.code}
                    disabled
                    class="form-input w-full px-4 py-3 border border-light-300 rounded-lg bg-light-100 font-mono cursor-not-allowed"
                  />
                  <p class="text-xs text-dark-500 mt-1">Code cannot be changed</p>
                </div>

                <div class="form-group mb-6">
                  <label class="form-label text-dark-700 font-semibold mb-2">Description</label>
                  <textarea
                    value={formData.value.description}
                    onInput$={(e) => { formData.value = { ...formData.value, description: (e.target as HTMLTextAreaElement).value }; }}
                    rows={4}
                    class="form-input w-full px-4 py-3 border border-light-300 rounded-lg"
                  ></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div class="form-group">
                    <label class="form-label text-dark-700 font-semibold mb-2">Latitude</label>
                    <input
                      type="text"
                      value={formData.value.latitude}
                      onInput$={(e) => { formData.value = { ...formData.value, latitude: (e.target as HTMLInputElement).value }; }}
                      class="form-input w-full px-4 py-3 border border-light-300 rounded-lg"
                    />
                    {errors.value.latitude && <p class="form-error text-danger-600 text-sm mt-1">{errors.value.latitude}</p>}
                  </div>

                  <div class="form-group">
                    <label class="form-label text-dark-700 font-semibold mb-2">Longitude</label>
                    <input
                      type="text"
                      value={formData.value.longitude}
                      onInput$={(e) => { formData.value = { ...formData.value, longitude: (e.target as HTMLInputElement).value }; }}
                      class="form-input w-full px-4 py-3 border border-light-300 rounded-lg"
                    />
                    {errors.value.longitude && <p class="form-error text-danger-600 text-sm mt-1">{errors.value.longitude}</p>}
                  </div>
                </div>

                <div class="form-group mb-6">
                  <label class="form-label text-dark-700 font-semibold mb-2">Address</label>
                  <textarea
                    value={formData.value.address}
                    onInput$={(e) => { formData.value = { ...formData.value, address: (e.target as HTMLTextAreaElement).value }; }}
                    rows={3}
                    class="form-input w-full px-4 py-3 border border-light-300 rounded-lg"
                  ></textarea>
                </div>

                <div class="form-group mb-6">
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.value.is_active}
                      onChange$={(e) => { formData.value = { ...formData.value, is_active: (e.target as HTMLInputElement).checked }; }}
                      class="form-checkbox mr-3"
                    />
                    <span class="text-dark-700 font-medium">Active</span>
                  </label>
                </div>

                {errors.value.submit && (
                  <div class="alert-danger rounded-lg p-4 mb-6 bg-danger-50 border-l-4 border-danger-500">
                    <p class="text-danger-800">{errors.value.submit}</p>
                  </div>
                )}

                <div class="flex gap-4 flex-col sm:flex-row">
                  <button type="submit" disabled={loading.value} class="btn btn-info">
                    {loading.value ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick$={() => nav(`/business/${businessCode}/sites`)} class="btn btn-dark">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div class="lg:col-span-1">
            <div class="card bg-primary-50 border border-primary-200 rounded-xl p-6">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
