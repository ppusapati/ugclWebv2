// src/routes/admin/businesses/[id]/edit/index.tsx
import { component$, useSignal, $, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { businessService, authService } from '~/services';
import type { BusinessVertical } from '~/services';

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const businessId = loc.params.id;

  const business = useSignal<BusinessVertical | null>(null);
  const formData = useSignal({
    name: '',
    description: '',
    settings: '{}',
    is_active: true,
  });

  const errors = useSignal<Record<string, string>>({});
  const loading = useSignal(false);
  const initialLoading = useSignal(true);

  useVisibleTask$(async () => {
    const user = authService.getUser();
    if (!user?.is_super_admin) {
      nav('/dashboard');
      return;
    }

    try {
      const response = await businessService.getAllBusinesses();
      const foundBusiness = response.data.find(b => b.id === businessId);

      if (!foundBusiness) {
        nav('/admin/businesses');
        return;
      }

      business.value = foundBusiness;
      formData.value = {
        name: foundBusiness.name,
        description: foundBusiness.description || '',
        settings: foundBusiness.settings
          ? JSON.stringify(foundBusiness.settings, null, 2)
          : '{}',
        is_active: foundBusiness.is_active !== false,
      };
    } catch (error) {
      console.error('Failed to load business:', error);
      nav('/admin/businesses');
    } finally {
      initialLoading.value = false;
    }
  });

  const validate = $(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.value.name.trim()) {
      newErrors.name = 'Business name is required';
    }

    if (formData.value.settings.trim()) {
      try {
        JSON.parse(formData.value.settings);
      } catch {
        newErrors.settings = 'Settings must be valid JSON';
      }
    }

    errors.value = newErrors;
    return Object.keys(newErrors).length === 0;
  });

  const handleSubmit = $(async (e: Event) => {
    e.preventDefault();

    if (!(await validate())) {
      return;
    }

    loading.value = true;
    errors.value = {};

    try {
      const settings = formData.value.settings.trim()
        ? JSON.parse(formData.value.settings)
        : undefined;

      await businessService.updateBusiness(businessId, {
        name: formData.value.name,
        description: formData.value.description || undefined,
        settings,
        is_active: formData.value.is_active,
      });

      nav('/admin/businesses');
    } catch (error: any) {
      errors.value = {
        submit: error.message || 'Failed to update business. Please try again.',
      };
    } finally {
      loading.value = false;
    }
  });

  if (initialLoading.value) {
    return (
      <div class="min-h-screen bg-light-50 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-dark-600">Loading business...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container-md mx-auto">
        <div class="mb-6">
          <button
            onClick$={() => nav('/admin/businesses')}
            class="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
          >
            <span>←</span> Back to Businesses
          </button>
          <h1 class="text-3xl font-bold text-dark-800">Edit Business Vertical</h1>
          <p class="text-dark-600 mt-2">Update business vertical information</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <div class="card bg-white shadow-lg rounded-xl p-8">
              <form onSubmit$={handleSubmit} preventdefault:submit>
                <div class="form-group mb-6">
                  <label class="form-label text-dark-700 font-semibold mb-2">
                    Business Name <span class="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.value.name}
                    onInput$={(e) => {
                      formData.value = {
                        ...formData.value,
                        name: (e.target as HTMLInputElement).value,
                      };
                    }}
                    class={`form-input w-full px-4 py-3 border rounded-lg ${
                      errors.value.name
                        ? 'border-danger-500'
                        : 'border-light-300 focus:ring-2 focus:ring-primary-400'
                    }`}
                    placeholder="e.g., Solar Operations"
                  />
                  {errors.value.name && (
                    <p class="form-error text-danger-600 text-sm mt-1">{errors.value.name}</p>
                  )}
                </div>

                <div class="form-group mb-6">
                  <label class="form-label text-dark-700 font-semibold mb-2">
                    Business Code
                  </label>
                  <input
                    type="text"
                    value={business.value?.code}
                    disabled
                    class="form-input w-full px-4 py-3 border border-light-300 rounded-lg bg-light-100 font-mono cursor-not-allowed"
                  />
                  <p class="text-xs text-dark-500 mt-1">Code cannot be changed after creation</p>
                </div>

                <div class="form-group mb-6">
                  <label class="form-label text-dark-700 font-semibold mb-2">Description</label>
                  <textarea
                    value={formData.value.description}
                    onInput$={(e) => {
                      formData.value = {
                        ...formData.value,
                        description: (e.target as HTMLTextAreaElement).value,
                      };
                    }}
                    rows={4}
                    class="form-input w-full px-4 py-3 border border-light-300 rounded-lg focus:ring-2 focus:ring-primary-400"
                    placeholder="Brief description of this business vertical"
                  ></textarea>
                </div>

                <div class="form-group mb-6">
                  <label class="form-label text-dark-700 font-semibold mb-2">
                    Settings (JSON)
                  </label>
                  <textarea
                    value={formData.value.settings}
                    onInput$={(e) => {
                      formData.value = {
                        ...formData.value,
                        settings: (e.target as HTMLTextAreaElement).value,
                      };
                    }}
                    rows={8}
                    class={`form-input w-full px-4 py-3 border rounded-lg font-mono text-sm ${
                      errors.value.settings
                        ? 'border-danger-500'
                        : 'border-light-300 focus:ring-2 focus:ring-primary-400'
                    }`}
                    placeholder='{"key": "value"}'
                  ></textarea>
                  {errors.value.settings && (
                    <p class="form-error text-danger-600 text-sm mt-1">{errors.value.settings}</p>
                  )}
                </div>

                <div class="form-group mb-6">
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.value.is_active}
                      onChange$={(e) => {
                        formData.value = {
                          ...formData.value,
                          is_active: (e.target as HTMLInputElement).checked,
                        };
                      }}
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
                  <button
                    type="submit"
                    disabled={loading.value}
                    class="btn-primary flex-1 py-3 text-lg font-semibold rounded-lg disabled:opacity-50"
                  >
                    {loading.value ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick$={() => nav('/admin/businesses')}
                    class="btn-light-300 flex-1 py-3 text-lg font-semibold rounded-lg"
                  >
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
                    {business.value?.created_at
                      ? new Date(business.value.created_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p class="text-primary-600 font-medium">Last Updated</p>
                  <p class="text-primary-800">
                    {business.value?.updated_at
                      ? new Date(business.value.updated_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p class="text-primary-600 font-medium">Users</p>
                  <p class="text-primary-800">{business.value?.user_count || 0}</p>
                </div>
                <div>
                  <p class="text-primary-600 font-medium">Roles</p>
                  <p class="text-primary-800">{business.value?.role_count || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
