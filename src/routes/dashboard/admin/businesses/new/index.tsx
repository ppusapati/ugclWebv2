// src/routes/admin/businesses/new/index.tsx
import { component$, useSignal, $, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { businessService, authService } from '~/services';

export default component$(() => {
  const nav = useNavigate();

  const formData = useSignal({
    name: '',
    code: '',
    description: '',
    settings: '{}',
    is_active: true,
  });

  const errors = useSignal<Record<string, string>>({});
  const loading = useSignal(false);

  // Check admin access
  useVisibleTask$(async () => {
    const user = authService.getUser();
    if (!user?.is_super_admin) {
      nav('/dashboard');
    }
  });

  const validate = $(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.value.name.trim()) {
      newErrors.name = 'Business name is required';
    }

    if (!formData.value.code.trim()) {
      newErrors.code = 'Business code is required';
    } else if (!/^[a-z0-9_-]+$/.test(formData.value.code)) {
      newErrors.code = 'Code must contain only lowercase letters, numbers, hyphens, and underscores';
    }

    // Validate JSON settings
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

      await businessService.createBusiness({
        name: formData.value.name,
        code: formData.value.code.toLowerCase(),
        description: formData.value.description || undefined,
        settings,
        is_active: formData.value.is_active,
      });

      nav('/admin/businesses');
    } catch (error: any) {
      errors.value = {
        submit: error.message || 'Failed to create business. Please try again.',
      };
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container-md mx-auto">
        {/* Header */}
        <div class="mb-6">
          <button
            onClick$={() => nav('/admin/businesses')}
            class="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
          >
            <span>←</span> Back to Businesses
          </button>
          <h1 class="text-3xl font-bold text-dark-800">Create Business Vertical</h1>
          <p class="text-dark-600 mt-2">Add a new business vertical to the system</p>
        </div>

        {/* Form Card */}
        <div class="card bg-white shadow-lg rounded-xl p-8">
          <form onSubmit$={handleSubmit} preventdefault:submit>
            {/* Business Name */}
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

            {/* Business Code */}
            <div class="form-group mb-6">
              <label class="form-label text-dark-700 font-semibold mb-2">
                Business Code <span class="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.value.code}
                onInput$={(e) => {
                  const value = (e.target as HTMLInputElement).value.toLowerCase();
                  formData.value = {
                    ...formData.value,
                    code: value,
                  };
                }}
                class={`form-input w-full px-4 py-3 border rounded-lg font-mono ${
                  errors.value.code
                    ? 'border-danger-500'
                    : 'border-light-300 focus:ring-2 focus:ring-primary-400'
                }`}
                placeholder="e.g., solar-ops"
              />
              <p class="text-xs text-dark-500 mt-1">
                Lowercase letters, numbers, hyphens, and underscores only
              </p>
              {errors.value.code && (
                <p class="form-error text-danger-600 text-sm mt-1">{errors.value.code}</p>
              )}
            </div>

            {/* Description */}
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

            {/* Settings (JSON) */}
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
                rows={6}
                class={`form-input w-full px-4 py-3 border rounded-lg font-mono text-sm ${
                  errors.value.settings
                    ? 'border-danger-500'
                    : 'border-light-300 focus:ring-2 focus:ring-primary-400'
                }`}
                placeholder='{"key": "value"}'
              ></textarea>
              <p class="text-xs text-dark-500 mt-1">
                Optional: Configuration settings in JSON format
              </p>
              {errors.value.settings && (
                <p class="form-error text-danger-600 text-sm mt-1">{errors.value.settings}</p>
              )}
            </div>

            {/* Active Status */}
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
              <p class="text-xs text-dark-500 mt-1 ml-8">
                Inactive businesses won't be accessible to users
              </p>
            </div>

            {/* Submit Error */}
            {errors.value.submit && (
              <div class="alert-danger rounded-lg p-4 mb-6 bg-danger-50 border-l-4 border-danger-500">
                <p class="text-danger-800">{errors.value.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div class="flex gap-4 flex-col sm:flex-row">
              <button
                type="submit"
                disabled={loading.value}
                class="btn-primary flex-1 py-3 text-lg font-semibold rounded-lg disabled:opacity-50"
              >
                {loading.value ? 'Creating...' : 'Create Business'}
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
    </div>
  );
});
