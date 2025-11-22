// src/routes/change-password/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { authService } from '~/services';

export default component$(() => {
  const nav = useNavigate();

  const formData = useSignal({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const errors = useSignal<Record<string, string>>({});
  const loading = useSignal(false);
  const success = useSignal(false);
  const showCurrentPassword = useSignal(false);
  const showNewPassword = useSignal(false);
  const showConfirmPassword = useSignal(false);
  const passwordStrength = useSignal(0);

  const getPasswordStrength = $((password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  });

  const validate = $(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.value.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.value.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.value.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (formData.value.newPassword === formData.value.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (!formData.value.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.value.newPassword !== formData.value.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      await authService.changePassword({
        current_password: formData.value.currentPassword,
        new_password: formData.value.newPassword,
      });

      success.value = true;

      // Clear form
      formData.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };

      // Redirect to profile after 2 seconds
      setTimeout(() => {
        nav('/profile');
      }, 2000);
    } catch (error: any) {
      errors.value = {
        submit: error.message || 'Failed to change password. Please check your current password.',
      };
    } finally {
      loading.value = false;
    }
  });

  const updatePasswordStrength = $(async () => {
    passwordStrength.value = await getPasswordStrength(formData.value.newPassword);
  });

  const getStrengthColor = () => {
    if (passwordStrength.value < 40) return 'danger';
    if (passwordStrength.value < 70) return 'warning';
    return 'success';
  };

  const getStrengthText = () => {
    if (passwordStrength.value < 40) return 'Weak';
    if (passwordStrength.value < 70) return 'Medium';
    return 'Strong';
  };

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
          <h1 class="text-3xl font-bold text-dark-800">Change Password</h1>
          <p class="text-dark-600 mt-2">Update your password to keep your account secure</p>
        </div>

        {/* Change Password Card */}
        <div class="card bg-white shadow-lg rounded-xl p-8 max-w-2xl">
          {success.value ? (
            <div class="text-center py-8">
              <div class="text-success-500 text-6xl mb-4">✓</div>
              <h3 class="text-2xl font-semibold text-dark-800 mb-2">
                Password Changed Successfully!
              </h3>
              <p class="text-dark-600">
                Your password has been updated. Redirecting...
              </p>
            </div>
          ) : (
            <form onSubmit$={handleSubmit} preventdefault:submit>
              {/* Current Password */}
              <div class="form-group mb-6">
                <label class="form-label text-dark-700 font-semibold mb-2">
                  Current Password <span class="text-danger-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type={showCurrentPassword.value ? 'text' : 'password'}
                    value={formData.value.currentPassword}
                    onInput$={(e) => {
                      formData.value = {
                        ...formData.value,
                        currentPassword: (e.target as HTMLInputElement).value,
                      };
                    }}
                    class={`form-input w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.value.currentPassword
                        ? 'border-danger-500 focus:ring-danger-400'
                        : 'border-light-300 focus:ring-primary-400'
                    }`}
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick$={() => {
                      showCurrentPassword.value = !showCurrentPassword.value;
                    }}
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  >
                    {showCurrentPassword.value ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.value.currentPassword && (
                  <p class="form-error text-danger-600 text-sm mt-1">
                    {errors.value.currentPassword}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div class="divider my-8"></div>

              {/* New Password */}
              <div class="form-group mb-6">
                <label class="form-label text-dark-700 font-semibold mb-2">
                  New Password <span class="text-danger-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type={showNewPassword.value ? 'text' : 'password'}
                    value={formData.value.newPassword}
                    onInput$={async (e) => {
                      formData.value = {
                        ...formData.value,
                        newPassword: (e.target as HTMLInputElement).value,
                      };
                      await updatePasswordStrength();
                    }}
                    class={`form-input w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.value.newPassword
                        ? 'border-danger-500 focus:ring-danger-400'
                        : 'border-light-300 focus:ring-primary-400'
                    }`}
                    placeholder="Create a strong new password"
                  />
                  <button
                    type="button"
                    onClick$={() => {
                      showNewPassword.value = !showNewPassword.value;
                    }}
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  >
                    {showNewPassword.value ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.value.newPassword && (
                  <div class="mt-2">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-dark-600">Password Strength:</span>
                      <span class={`text-${getStrengthColor()}-600 font-semibold`}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <div class="w-full bg-light-200 rounded-full h-2">
                      <div
                        class={`bg-${getStrengthColor()}-500 h-2 rounded-full transition-all duration-300`}
                        style={`width: ${passwordStrength.value}%`}
                      ></div>
                    </div>
                  </div>
                )}

                {errors.value.newPassword && (
                  <p class="form-error text-danger-600 text-sm mt-1">
                    {errors.value.newPassword}
                  </p>
                )}

                {/* Password Requirements */}
                <div class="mt-3 text-xs text-dark-500">
                  <p class="font-semibold mb-1">Password must contain:</p>
                  <ul class="list-disc list-inside space-y-1">
                    <li>At least 8 characters</li>
                    <li>Mix of uppercase and lowercase letters</li>
                    <li>At least one number</li>
                    <li>At least one special character</li>
                  </ul>
                </div>
              </div>

              {/* Confirm New Password */}
              <div class="form-group mb-6">
                <label class="form-label text-dark-700 font-semibold mb-2">
                  Confirm New Password <span class="text-danger-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type={showConfirmPassword.value ? 'text' : 'password'}
                    value={formData.value.confirmPassword}
                    onInput$={(e) => {
                      formData.value = {
                        ...formData.value,
                        confirmPassword: (e.target as HTMLInputElement).value,
                      };
                    }}
                    class={`form-input w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.value.confirmPassword
                        ? 'border-danger-500 focus:ring-danger-400'
                        : 'border-light-300 focus:ring-primary-400'
                    }`}
                    placeholder="Re-enter your new password"
                  />
                  <button
                    type="button"
                    onClick$={() => {
                      showConfirmPassword.value = !showConfirmPassword.value;
                    }}
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  >
                    {showConfirmPassword.value ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.value.confirmPassword && (
                  <p class="form-error text-danger-600 text-sm mt-1">
                    {errors.value.confirmPassword}
                  </p>
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
                  {loading.value ? 'Changing Password...' : 'Change Password'}
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

        {/* Security Tips */}
        <div class="card bg-info-50 border border-info-200 rounded-xl p-6 mt-6 max-w-2xl">
          <h3 class="text-lg font-semibold text-info-800 mb-3">Security Tips</h3>
          <ul class="space-y-2 text-sm text-info-700">
            <li class="flex items-start gap-2">
              <span class="text-info-600">•</span>
              <span>Don't share your password with anyone</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-info-600">•</span>
              <span>Use a unique password that you don't use anywhere else</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-info-600">•</span>
              <span>Change your password regularly (every 3-6 months)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-info-600">•</span>
              <span>Avoid using personal information in your password</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
});
