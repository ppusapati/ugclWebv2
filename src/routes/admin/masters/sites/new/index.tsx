// src/routes/admin/masters/sites/new/index.tsx
import { component$, useSignal, $, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { apiClient } from '~/services';
import GeofenceMap from '~/components/geofence/GeofenceMap';
import type { Geofence } from '~/utils/geofence';
import { stringifyGeofence } from '~/utils/geofence';

interface BusinessVertical {
  id: string;
  name: string;
  code: string;
}

export default component$(() => {
  const nav = useNavigate();
  const businessVerticals = useSignal<BusinessVertical[]>([]);

  const formData = useSignal({
    name: '',
    code: '',
    description: '',
    businessVerticalId: '',
    latitude: '',
    longitude: '',
    address: '',
    is_active: true,
  });

  const geofence = useSignal<Geofence | null>(null);
  const errors = useSignal<Record<string, string>>({});
  const loading = useSignal(false);
  const showGeofenceSection = useSignal(false);

  // Load business verticals on mount
  useVisibleTask$(async () => {
    try {
      const response = await apiClient.get<{ data: BusinessVertical[] }>('/admin/businesses');
      businessVerticals.value = response.data || [];
    } catch (err) {
      console.error('Failed to load business verticals:', err);
    }
  });

  const validate = $(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.value.name.trim()) newErrors.name = 'Site name is required';
    if (!formData.value.code.trim()) {
      newErrors.code = 'Site code is required';
    } else if (!/^[A-Z0-9_-]+$/.test(formData.value.code)) {
      newErrors.code = 'Code must contain only uppercase letters, numbers, hyphens, underscores';
    }
    if (!formData.value.businessVerticalId) {
      newErrors.businessVerticalId = 'Business vertical is required';
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

  const handleGeofenceChange = $((newGeofence: Geofence) => {
    geofence.value = newGeofence;
  });

  const handleSubmit = $(async (e: Event) => {
    e.preventDefault();
    if (!(await validate())) return;

    loading.value = true;
    errors.value = {};

    try {
      const location = formData.value.latitude && formData.value.longitude
        ? JSON.stringify({
            lat: parseFloat(formData.value.latitude),
            lng: parseFloat(formData.value.longitude),
            address: formData.value.address || undefined,
          })
        : undefined;

      const payload = {
        ...formData.value,
        location,
        geofence: geofence.value ? stringifyGeofence(geofence.value) : undefined,
      };

      console.log('Creating site with payload:', payload);
      // Create site with admin API endpoint
      await apiClient.post('/admin/sites', payload);

      nav('/admin/masters/sites');
    } catch (error: any) {
      errors.value = { submit: error.message || 'Failed to create site' };
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container mx-auto">
        <div class="mb-6">
          <button
            onClick$={() => nav('/admin/masters/sites')}
            class="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
          >
            <span>←</span> Back to Sites
          </button>
          <h1 class="text-3xl font-bold text-dark-800">Create Site</h1>
          <p class="text-dark-600 mt-2">Add a new site to the system</p>
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
                onInput$={(e) => { formData.value = { ...formData.value, code: (e.target as HTMLInputElement).value.toUpperCase() }; }}
                class="form-input w-full px-4 py-3 border border-light-300 rounded-lg font-mono"
                placeholder="e.g., main-office"
              />
              {errors.value.code && <p class="form-error text-danger-600 text-sm mt-1">{errors.value.code}</p>}
            </div>

            <div class="form-group mb-6">
              <label class="form-label text-dark-700 font-semibold mb-2">
                Business Vertical <span class="text-danger-500">*</span>
              </label>
              <select
                value={formData.value.businessVerticalId}
                onChange$={(e) => {
                  formData.value = {
                    ...formData.value,
                    businessVerticalId: (e.target as HTMLSelectElement).value
                  };
                }}
                class="form-input w-full px-4 py-3 border border-light-300 rounded-lg"
              >
                <option value="">Select Business Vertical</option>
                {businessVerticals.value.map((bv) => (
                  <option key={bv.id} value={bv.id}>
                    {`${bv.name} (${bv.code})`}
                  </option>
                ))}
              </select>
              {errors.value.business_vertical_id && (
                <p class="form-error text-danger-600 text-sm mt-1">
                  {errors.value.business_vertical_id}
                </p>
              )}
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

            {/* Geofencing Section */}
            <div class="form-group mb-6 border-t border-light-300 pt-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <label class="form-label text-dark-700 font-semibold mb-1">
                    Geofencing (Optional)
                  </label>
                  <p class="text-sm text-dark-600">Define the geographical boundary for this site</p>
                </div>
                <button
                  type="button"
                  onClick$={() => { showGeofenceSection.value = !showGeofenceSection.value; }}
                  class="btn btn-secondary px-4 py-2"
                >
                  {showGeofenceSection.value ? 'Hide Map' : 'Show Map'}
                </button>
              </div>

              {showGeofenceSection.value && (
                <div class="mt-4">
                  <GeofenceMap
                    initialCenter={
                      formData.value.latitude && formData.value.longitude
                        ? {
                            lat: parseFloat(formData.value.latitude),
                            lng: parseFloat(formData.value.longitude)
                          }
                        : undefined
                    }
                    onGeofenceChange$={handleGeofenceChange}
                    height="600px"
                  />
                  {geofence.value && geofence.value.coordinates.length > 0 && (
                    <div class="mt-3 bg-success-50 border border-success-200 rounded-lg p-3">
                      <p class="text-success-800 text-sm">
                        ✓ Geofence defined with {geofence.value.coordinates.length} points
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {errors.value.submit && (
              <div class="alert-danger rounded-lg p-4 mb-6 bg-danger-50 border-l-4 border-danger-500">
                <p class="text-danger-800">{errors.value.submit}</p>
              </div>
            )}

            <div class="flex gap-4 flex-col sm:flex-row">
              <button type="submit" disabled={loading.value} class="btn btn-primary flex-1 py-3 text-lg rounded-lg disabled:opacity-50">
                {loading.value ? 'Creating...' : 'Create Site'}
              </button>
              <button type="button" onClick$={() => nav('/admin/masters/sites')} class="btn btn-secondary flex-1 py-3 text-lg rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});
