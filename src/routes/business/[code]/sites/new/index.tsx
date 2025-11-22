// src/routes/business/[code]/sites/new/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { siteService } from '~/services';

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

      nav(`/business/${businessCode}/sites`);
    } catch (error: any) {
      errors.value = { submit: error.message || 'Failed to create site' };
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container-md mx-auto">
        <div class="mb-6">
          <button
            onClick$={() => nav(`/business/${businessCode}/sites`)}
            class="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
          >
            <span>←</span> Back to Sites
          </button>
          <h1 class="text-3xl font-bold text-dark-800">Create Site</h1>
          <p class="text-dark-600 mt-2">Add a new site to {businessCode}</p>
        </div>

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
                class="form-input w-full px-4 py-3 border border-light-300 rounded-lg"
                placeholder="e.g., Main Office"
              />
              {errors.value.name && <p class="form-error text-danger-600 text-sm mt-1">{errors.value.name}</p>}
            </div>

            <div class="form-group mb-6">
              <label class="form-label text-dark-700 font-semibold mb-2">
                Site Code <span class="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.value.code}
                onInput$={(e) => { formData.value = { ...formData.value, code: (e.target as HTMLInputElement).value.toLowerCase() }; }}
                class="form-input w-full px-4 py-3 border border-light-300 rounded-lg font-mono"
                placeholder="e.g., main-office"
              />
              {errors.value.code && <p class="form-error text-danger-600 text-sm mt-1">{errors.value.code}</p>}
            </div>

            <div class="form-group mb-6">
              <label class="form-label text-dark-700 font-semibold mb-2">Description</label>
              <textarea
                value={formData.value.description}
                onInput$={(e) => { formData.value = { ...formData.value, description: (e.target as HTMLTextAreaElement).value }; }}
                rows={4}
                class="form-input w-full px-4 py-3 border border-light-300 rounded-lg"
                placeholder="Brief description of this site"
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
                  placeholder="e.g., 28.6139"
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
                  placeholder="e.g., 77.2090"
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
                placeholder="Full address of the site"
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
              <button type="submit" disabled={loading.value} class="btn-primary flex-1 py-3 text-lg font-semibold rounded-lg disabled:opacity-50">
                {loading.value ? 'Creating...' : 'Create Site'}
              </button>
              <button type="button" onClick$={() => nav(`/business/${businessCode}/sites`)} class="btn-light-300 flex-1 py-3 text-lg font-semibold rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});
