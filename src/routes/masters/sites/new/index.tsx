// src/routes/admin/masters/sites/new/index.tsx
import { component$, isServer, useSignal, $, useTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { apiClient } from '~/services';
import GeofenceMap from '~/components/geofence/GeofenceMap';
import type { Geofence } from '~/utils/geofence';
import { stringifyGeofence } from '~/utils/geofence';
import { Alert, Btn, FormField, PageHeader, SectionCard } from '~/components/ds';

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
  useTask$(async () => {
    if (isServer) {
      return;
    }

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

      nav('/masters/sites');
    } catch (error: any) {
      errors.value = { submit: error.message || 'Failed to create site' };
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="space-y-6 py-2">
        <div class="mb-6">
          <Btn variant="ghost" class="mb-4" onClick$={() => nav('/masters/sites')}>
            <i class="i-heroicons-arrow-left-solid mr-1 h-4 w-4 inline-block" aria-hidden="true"></i>
            Back to Sites
          </Btn>
          <PageHeader title="Create Site" subtitle="Add a new site to the system" />
        </div>

        <SectionCard class="p-8">
          <form onSubmit$={handleSubmit} preventdefault:submit>
            <FormField id="site-name" label="Site Name" required error={errors.value.name} class="mb-6">
              <input
                id="site-name"
                type="text"
                value={formData.value.name}
                onInput$={(e) => { formData.value = { ...formData.value, name: (e.target as HTMLInputElement).value }; }}
                required
                aria-required="true"
                aria-describedby={errors.value.name ? 'site-name-error' : ''}
                class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                placeholder="e.g., Main Office"
              />
            </FormField>

            <FormField id="site-code" label="Site Code" required error={errors.value.code} class="mb-6">
              <input
                id="site-code"
                type="text"
                value={formData.value.code}
                onInput$={(e) => { formData.value = { ...formData.value, code: (e.target as HTMLInputElement).value.toUpperCase() }; }}
                required
                aria-required="true"
                aria-describedby={errors.value.code ? 'site-code-error' : ''}
                class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg font-mono"
                placeholder="e.g., main-office"
              />
            </FormField>

            <FormField id="site-business-vertical" label="Business Vertical" required error={errors.value.businessVerticalId} class="mb-6">
              <select
                id="site-business-vertical"
                value={formData.value.businessVerticalId}
                required
                aria-required="true"
                aria-describedby={errors.value.businessVerticalId ? 'site-business-vertical-error' : ''}
                onChange$={(e) => {
                  formData.value = {
                    ...formData.value,
                    businessVerticalId: (e.target as HTMLSelectElement).value
                  };
                }}
                class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
              >
                <option value="">Select Business Vertical</option>
                {businessVerticals.value.map((bv) => (
                  <option key={bv.id} value={bv.id}>
                    {`${bv.name} (${bv.code})`}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="site-description" label="Description" class="mb-6">
              <textarea
                id="site-description"
                value={formData.value.description}
                onInput$={(e) => { formData.value = { ...formData.value, description: (e.target as HTMLTextAreaElement).value }; }}
                rows={4}
                class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                placeholder="Brief description of this site"
              ></textarea>
            </FormField>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FormField id="site-latitude" label="Latitude" error={errors.value.latitude}>
                <input
                  id="site-latitude"
                  type="text"
                  value={formData.value.latitude}
                  onInput$={(e) => { formData.value = { ...formData.value, latitude: (e.target as HTMLInputElement).value }; }}
                  aria-describedby={errors.value.latitude ? 'site-latitude-error' : ''}
                  class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                  placeholder="e.g., 28.6139"
                />
              </FormField>

              <FormField id="site-longitude" label="Longitude" error={errors.value.longitude}>
                <input
                  id="site-longitude"
                  type="text"
                  value={formData.value.longitude}
                  onInput$={(e) => { formData.value = { ...formData.value, longitude: (e.target as HTMLInputElement).value }; }}
                  aria-describedby={errors.value.longitude ? 'site-longitude-error' : ''}
                  class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                  placeholder="e.g., 77.2090"
                />
              </FormField>
            </div>

            <FormField id="site-address" label="Address" class="mb-6">
              <textarea
                id="site-address"
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

            {/* Geofencing Section */}
            <div class="form-group mb-6 border-t border-neutral-300 pt-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <label class="form-label text-neutral-700 font-semibold mb-1">
                    Geofencing (Optional)
                  </label>
                  <p class="text-sm text-neutral-600">Define the geographical boundary for this site</p>
                </div>
                <Btn
                  type="button"
                  onClick$={() => { showGeofenceSection.value = !showGeofenceSection.value; }}
                  variant="secondary"
                >
                  {showGeofenceSection.value ? 'Hide Map' : 'Show Map'}
                </Btn>
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
                      <p class="text-success-800 text-sm inline-flex items-center gap-1">
                        <i class="i-heroicons-check-circle-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                        Geofence defined with {geofence.value.coordinates.length} points
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {errors.value.submit && (
              <Alert variant="error" class="mb-6 border-l-4">
                <p class="text-error-800">{errors.value.submit}</p>
              </Alert>
            )}

            <div class="flex gap-4 flex-col sm:flex-row">
              <Btn type="submit" disabled={loading.value} class="flex-1 py-3 text-lg rounded-lg">
                {loading.value ? 'Creating...' : 'Create Site'}
              </Btn>
              <Btn type="button" variant="secondary" onClick$={() => nav('/masters/sites')} class="flex-1 py-3 text-lg rounded-lg">
                Cancel
              </Btn>
            </div>
          </form>
        </SectionCard>
    </div>
  );
});
