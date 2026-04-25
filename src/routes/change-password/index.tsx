// src/routes/change-password/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { Alert, Btn, PageHeader, SectionCard } from '~/components/ds';
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
    <div class="space-y-6 py-2">
        <PageHeader title="Change Password" subtitle="Update your password to keep your account secure">
          <Btn q:slot="actions" variant="secondary" size="sm" onClick$={() => nav('/profile')}>
            <i class="i-heroicons-arrow-left w-4 h-4 inline-block mr-2"></i>
            Back to Profile
          </Btn>
        </PageHeader>

        <SectionCard class="max-w-2xl p-8">
          {success.value ? (
            <div class="text-center py-8">
              <i class="i-heroicons-check-circle-solid h-16 w-16 inline-block text-success-500 mb-4" aria-hidden="true"></i>
              <h3 class="text-2xl font-semibold text-neutral-800 mb-2">
                Password Changed Successfully!
              </h3>
              <p class="text-neutral-600">
                Your password has been updated. Redirecting...
              </p>
            </div>
          ) : (
            <form onSubmit$={handleSubmit} preventdefault:submit>
              {/* Current Password */}
              <div class="form-group mb-6">
                <label class="form-label text-neutral-700 font-semibold mb-2">
                  Current Password <span class="text-error-500">*</span>
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
                        ? 'border-error-500 focus:ring-error-400'
                        : 'border-neutral-300 focus:ring-primary-400'
                    }`}
                    placeholder="Enter your current password"
                  />
                  <Btn
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick$={() => {
                      showCurrentPassword.value = !showCurrentPassword.value;
                    }}
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <i
                      class={`${showCurrentPassword.value ? 'i-heroicons-eye-slash-solid' : 'i-heroicons-eye-solid'} h-5 w-5 inline-block`}
                      aria-hidden="true"
                    ></i>
                  </Btn>
                </div>
                {errors.value.currentPassword && (
                  <p class="form-error text-error-600 text-sm mt-1">
                    {errors.value.currentPassword}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div class="divider my-8"></div>

              {/* New Password */}
              <div class="form-group mb-6">
                <label class="form-label text-neutral-700 font-semibold mb-2">
                  New Password <span class="text-error-500">*</span>
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
                        ? 'border-error-500 focus:ring-error-400'
                        : 'border-neutral-300 focus:ring-primary-400'
                    }`}
                    placeholder="Create a strong new password"
                  />
                  <Btn
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick$={() => {
                      showNewPassword.value = !showNewPassword.value;
                    }}
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <i
                      class={`${showNewPassword.value ? 'i-heroicons-eye-slash-solid' : 'i-heroicons-eye-solid'} h-5 w-5 inline-block`}
                      aria-hidden="true"
                    ></i>
                  </Btn>
                </div>

                {/* Password Strength Indicator */}
                {formData.value.newPassword && (
                  <div class="mt-2">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-neutral-600">Password Strength:</span>
                      <span class={`text-${getStrengthColor()}-600 font-semibold`}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <div class="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        class={`bg-${getStrengthColor()}-500 h-2 rounded-full transition-all duration-300 w-[var(--progress-width)]`}
                        style={{ '--progress-width': `${passwordStrength.value}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {errors.value.newPassword && (
                  <p class="form-error text-error-600 text-sm mt-1">
                    {errors.value.newPassword}
                  </p>
                )}

                {/* Password Requirements */}
                <div class="mt-3 text-xs text-neutral-500">
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
                <label class="form-label text-neutral-700 font-semibold mb-2">
                  Confirm New Password <span class="text-error-500">*</span>
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
                        ? 'border-error-500 focus:ring-error-400'
                        : 'border-neutral-300 focus:ring-primary-400'
                    }`}
                    placeholder="Re-enter your new password"
                  />
                  <Btn
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick$={() => {
                      showConfirmPassword.value = !showConfirmPassword.value;
                    }}
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <i
                      class={`${showConfirmPassword.value ? 'i-heroicons-eye-slash-solid' : 'i-heroicons-eye-solid'} h-5 w-5 inline-block`}
                      aria-hidden="true"
                    ></i>
                  </Btn>
                </div>
                {errors.value.confirmPassword && (
                  <p class="form-error text-error-600 text-sm mt-1">
                    {errors.value.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Error */}
              {errors.value.submit && (
                <Alert variant="error" class="mb-6 border-l-4">
                  <p class="text-error-800">{errors.value.submit}</p>
                </Alert>
              )}

              {/* Action Buttons */}
              <div class="flex gap-4 flex-col sm:flex-row">
                <Btn
                  type="submit"
                  disabled={loading.value}
                  class="flex-1 py-3 text-lg font-semibold"
                >
                  {loading.value ? 'Changing Password...' : 'Change Password'}
                </Btn>
                <Btn
                  type="button"
                  variant="secondary"
                  onClick$={() => nav('/profile')}
                  class="flex-1 py-3 text-lg font-semibold"
                >
                  Cancel
                </Btn>
              </div>
            </form>
          )}
        </SectionCard>

        <SectionCard class="mt-6 max-w-2xl border-color-interactive-primary/20 bg-color-interactive-primary/5">
          <h3 class="mb-3 text-lg font-semibold text-info-800">Security Tips</h3>
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
        </SectionCard>
    </div>
  );
});
