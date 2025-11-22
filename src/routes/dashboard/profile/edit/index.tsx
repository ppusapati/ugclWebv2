// src/routes/profile/edit/index.tsx
import { component$, useSignal, $, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { authService } from '~/services';
import type { User } from '~/services';

export default component$(() => {
  const nav = useNavigate();

  const user = useSignal<User | null>(null);
  const formData = useSignal({
    name: '',
    email: '',
    phone: '',
  });

  const errors = useSignal<Record<string, string>>({});
  const loading = useSignal(false);
  const success = useSignal(false);
  const initialLoading = useSignal(true);

  // Load user data on mount
  useVisibleTask$(async () => {
    try {
      const currentUser = authService.getUser();
      if (!currentUser) {
        nav('/login');
        return;
      }

      user.value = currentUser;
      formData.value = {
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      };
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      initialLoading.value = false;
    }
  });

  const validatePhone = $((phone: string): boolean => {
    return /^\d{10}$/.test(phone);
  });

  const validateEmail = $((email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  });

  const validate = $(async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.value.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.value.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!(await validateEmail(formData.value.email))) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.value.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!(await validatePhone(formData.value.phone))) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
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
      const updatedUser = await authService.updateProfile({
        name: formData.value.name,
        email: formData.value.email,
        phone: formData.value.phone,
      });

      user.value = updatedUser;
      success.value = true;

      // Redirect to profile after 2 seconds
      setTimeout(() => {
        nav('/profile');
      }, 2000);
    } catch (error: any) {
      errors.value = {
        submit: error.message || 'Failed to update profile. Please try again.',
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
          <p class="text-dark-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container-md mx-auto">
        {/* Header */}
        <div class="mb-6">
          <button
            onClick$={() => nav('/profile')}
            class="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
          >
            <span>←</span> Back to Profile
          </button>
          <h1 class="text-3xl font-bold text-dark-800">Edit Profile</h1>
          <p class="text-dark-600 mt-2">Update your personal information</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div class="lg:col-span-2">
            <div class="card bg-white shadow-lg rounded-xl p-8">
              {success.value ? (
                <div class="text-center py-8">
                  <div class="text-success-500 text-6xl mb-4">✓</div>
                  <h3 class="text-2xl font-semibold text-dark-800 mb-2">
                    Profile Updated Successfully!
                  </h3>
                  <p class="text-dark-600">
                    Your changes have been saved. Redirecting...
                  </p>
                </div>
              ) : (
                <form onSubmit$={handleSubmit} preventdefault:submit>
                  {/* Name Field */}
                  <div class="form-group mb-6">
                    <label class="form-label text-dark-700 font-semibold mb-2">
                      Full Name <span class="text-danger-500">*</span>
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
                      class={`form-input w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.value.name
                          ? 'border-danger-500 focus:ring-danger-400'
                          : 'border-light-300 focus:ring-primary-400'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.value.name && (
                      <p class="form-error text-danger-600 text-sm mt-1">{errors.value.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div class="form-group mb-6">
                    <label class="form-label text-dark-700 font-semibold mb-2">
                      Email Address <span class="text-danger-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.value.email}
                      onInput$={(e) => {
                        formData.value = {
                          ...formData.value,
                          email: (e.target as HTMLInputElement).value,
                        };
                      }}
                      class={`form-input w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.value.email
                          ? 'border-danger-500 focus:ring-danger-400'
                          : 'border-light-300 focus:ring-primary-400'
                      }`}
                      placeholder="your.email@example.com"
                    />
                    {errors.value.email && (
                      <p class="form-error text-danger-600 text-sm mt-1">{errors.value.email}</p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div class="form-group mb-6">
                    <label class="form-label text-dark-700 font-semibold mb-2">
                      Phone Number <span class="text-danger-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.value.phone}
                      onInput$={(e) => {
                        const value = (e.target as HTMLInputElement).value
                          .replace(/\D/g, '')
                          .slice(0, 10);
                        formData.value = {
                          ...formData.value,
                          phone: value,
                        };
                      }}
                      class={`form-input w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.value.phone
                          ? 'border-danger-500 focus:ring-danger-400'
                          : 'border-light-300 focus:ring-primary-400'
                      }`}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                    />
                    {errors.value.phone && (
                      <p class="form-error text-danger-600 text-sm mt-1">{errors.value.phone}</p>
                    )}
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
                      class="btn-primary flex-1 py-3 text-lg font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading.value ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick$={() => nav('/profile')}
                      class="btn-light-300 flex-1 py-3 text-lg font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div class="lg:col-span-1">
            {/* Current Info Card */}
            <div class="card bg-primary-50 border border-primary-200 rounded-xl p-6 mb-6">
              <h3 class="text-lg font-semibold text-primary-800 mb-4">Current Information</h3>
              <div class="space-y-3 text-sm">
                <div>
                  <p class="text-primary-600 font-medium">Name</p>
                  <p class="text-primary-800">{user.value?.name}</p>
                </div>
                <div>
                  <p class="text-primary-600 font-medium">Email</p>
                  <p class="text-primary-800">{user.value?.email}</p>
                </div>
                <div>
                  <p class="text-primary-600 font-medium">Phone</p>
                  <p class="text-primary-800">{user.value?.phone}</p>
                </div>
                <div>
                  <p class="text-primary-600 font-medium">Role</p>
                  <p class="text-primary-800 capitalize">{user.value?.role}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div class="card bg-white shadow-lg rounded-xl p-6">
              <h3 class="text-lg font-semibold text-dark-800 mb-4">Quick Actions</h3>
              <div class="space-y-3">
                <button
                  onClick$={() => nav('/change-password')}
                  class="w-full text-left px-4 py-3 rounded-lg bg-light-50 hover:bg-light-100 transition flex items-center justify-between"
                >
                  <span class="text-dark-700">Change Password</span>
                  <span class="text-primary-600">→</span>
                </button>
                <button
                  onClick$={() => nav('/profile')}
                  class="w-full text-left px-4 py-3 rounded-lg bg-light-50 hover:bg-light-100 transition flex items-center justify-between"
                >
                  <span class="text-dark-700">View Full Profile</span>
                  <span class="text-primary-600">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
