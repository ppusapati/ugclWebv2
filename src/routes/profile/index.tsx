import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import { Alert, Btn, FormField, PageHeader, SectionCard } from '~/components/ds';
import { authService } from '~/services';
import { notificationService } from '~/services/notification.service';
import type { LoginHistoryEntry, ProfileResponse } from '~/services';

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^a-zA-Z0-9]/.test(password),
  };
}

function getPasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
  return Math.min(strength, 100);
}

function getStrengthText(strength: number): string {
  if (strength < 40) return 'Weak';
  if (strength < 70) return 'Medium';
  return 'Strong';
}

function getStrengthTextClass(strength: number): string {
  if (strength < 40) return 'text-error-600';
  if (strength < 70) return 'text-warning-700';
  return 'text-success-700';
}

function getStrengthBarClass(strength: number): string {
  if (strength < 40) return 'bg-error-500';
  if (strength < 70) return 'bg-warning-500';
  return 'bg-success-500';
}

function getPushStatusTone(state: string): string {
  switch (state) {
    case 'granted':
    case 'active':
      return 'text-success-700';
    case 'denied':
    case 'inactive':
      return 'text-error-600';
    case 'default':
    case 'pending':
      return 'text-warning-700';
    default:
      return 'text-neutral-600';
  }
}

export default component$(() => {
  const loc = useLocation();

  const loading = useSignal(true);
  const profileSaving = useSignal(false);
  const passwordSaving = useSignal(false);
  const isEditing = useSignal(false);
  const showPasswordForm = useSignal(false);
  const success = useSignal('');
  const error = useSignal('');
  const loginHistory = useSignal<LoginHistoryEntry[]>([]);

  const profileInfo = useSignal({
    role: '',
    isSuperAdmin: false,
    permissions: [] as string[],
    businessRoles: [] as Array<Record<string, any>>,
    accessScope: '',
    activeStatus: false,
  });

  const formData = useSignal({
    name: '',
    email: '',
    phone: '',
  });

  const passwordData = useSignal({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const originalFormData = useSignal({
    name: '',
    email: '',
    phone: '',
  });

  const profileErrors = useSignal<Record<string, string>>({});
  const passwordErrors = useSignal<Record<string, string>>({});
  const passwordStrength = useSignal(0);
  const showCurrentPassword = useSignal(false);
  const showNewPassword = useSignal(false);
  const showConfirmPassword = useSignal(false);
  const pushStatusLoading = useSignal(false);
  const pushStatusMessage = useSignal('');
  const pushStatus = useSignal({
    supported: false,
    permission: 'unsupported' as NotificationPermission | 'unsupported',
    serviceWorkerRegistered: false,
    subscriptionActive: false,
    endpoint: '',
  });

  const refreshPushStatus = $(async (message?: string) => {
    pushStatusLoading.value = true;
    pushStatusMessage.value = '';

    try {
      const next = await notificationService.getWebPushStatus();
      pushStatus.value = {
        ...next,
        endpoint: next.endpoint || '',
      };
      if (message) {
        pushStatusMessage.value = message;
      }
    } catch (err: any) {
      pushStatusMessage.value = err?.message || 'Failed to inspect push notification status';
    } finally {
      pushStatusLoading.value = false;
    }
  });

  const enablePushNotifications = $(async () => {
    pushStatusLoading.value = true;
    pushStatusMessage.value = '';

    try {
      const result = await notificationService.enableWebPush();

      if (result.status === 'enabled') {
        await refreshPushStatus('Push notifications are configured for this browser.');
        return;
      }

      await refreshPushStatus(
        result.permission === 'denied'
          ? 'Browser notifications are blocked for this site. Re-enable notifications from the browser site settings, then click Check Again and Enable Push Notifications.'
          : 'This browser did not grant notification permission. Allow notifications when prompted, then try again.'
      );
    } catch (err: any) {
      pushStatusMessage.value = err?.message || 'Failed to enable push notifications';
      pushStatusLoading.value = false;
    }
  });

  const sendTestPushNotification = $(async () => {
    pushStatusLoading.value = true;
    pushStatusMessage.value = '';

    try {
      await notificationService.sendTestWebPush({
        title: 'UGCL Push Test',
        body: 'Push notifications are working for this browser.',
        url: '/chat',
      });
      await refreshPushStatus('Test push dispatched. If permission is granted and subscription is active, you should receive it shortly.');
    } catch (err: any) {
      pushStatusMessage.value = err?.message || 'Failed to send test push notification';
      pushStatusLoading.value = false;
    }
  });

  const validateProfile = $(() => {
    const nextErrors: Record<string, string> = {};

    if (!formData.value.name.trim()) {
      nextErrors.name = 'Name is required';
    }

    if (!formData.value.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (!formData.value.phone.trim()) {
      nextErrors.phone = 'Phone number is required';
    }

    profileErrors.value = nextErrors;
    return Object.keys(nextErrors).length === 0;
  });

  const validatePassword = $(() => {
    const nextErrors: Record<string, string> = {};
    const checks = getPasswordChecks(passwordData.value.newPassword);

    if (!passwordData.value.currentPassword) {
      nextErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.value.newPassword) {
      nextErrors.newPassword = 'New password is required';
    } else if (!checks.minLength || !checks.hasUpper || !checks.hasLower || !checks.hasNumber || !checks.hasSpecial) {
      nextErrors.newPassword = 'Password must meet all listed security requirements';
    } else if (passwordData.value.newPassword === passwordData.value.currentPassword) {
      nextErrors.newPassword = 'New password must be different from current password';
    }

    if (!passwordData.value.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm the new password';
    } else if (passwordData.value.confirmPassword !== passwordData.value.newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    passwordErrors.value = nextErrors;
    return Object.keys(nextErrors).length === 0;
  });

  const loadProfile = $(async () => {
    loading.value = true;
    error.value = '';

    try {
      const profile = await authService.getProfile() as ProfileResponse;

      const nextFormData = {
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      };

      formData.value = nextFormData;
      originalFormData.value = nextFormData;

      profileInfo.value = {
        role: profile.global_role || profile.role || '',
        isSuperAdmin: profile.is_super_admin === true,
        permissions: Array.isArray(profile.permissions) ? profile.permissions : [],
        businessRoles: Array.isArray(profile.business_roles) ? profile.business_roles : [],
        accessScope: profile.access_scope || 'global/basic',
        activeStatus: profile.is_active === true,
      };

      loginHistory.value = Array.isArray(profile.recent_logins)
        ? profile.recent_logins.slice(0, 5)
        : [];
    } catch (err: any) {
      error.value = err?.message || 'Failed to load profile';
    } finally {
      loading.value = false;
    }
  });

  const handleSubmit = $(async (event: Event) => {
    event.preventDefault();
    success.value = '';
    error.value = '';

    if (!(await validateProfile())) {
      return;
    }

    profileSaving.value = true;

    try {
      await authService.updateProfile({
        name: formData.value.name.trim(),
        email: formData.value.email.trim(),
        phone: formData.value.phone.trim(),
      });

      originalFormData.value = {
        name: formData.value.name.trim(),
        email: formData.value.email.trim(),
        phone: formData.value.phone.trim(),
      };

      await loadProfile();
      success.value = 'Profile updated successfully';
    } catch (err: any) {
      error.value = err?.message || 'Failed to update profile';
    } finally {
      profileSaving.value = false;
      isEditing.value = false;
    }
  });

  const handleChangePassword = $(async (event: Event) => {
    event.preventDefault();
    success.value = '';
    error.value = '';

    if (!(await validatePassword())) {
      return;
    }

    passwordSaving.value = true;

    try {
      await authService.changePassword({
        current_password: passwordData.value.currentPassword,
        new_password: passwordData.value.newPassword,
      });

      passwordData.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
      passwordStrength.value = 0;
      passwordErrors.value = {};
      showPasswordForm.value = false;
      success.value = 'Password changed successfully';
    } catch (err: any) {
      error.value = err?.message || 'Failed to change password';
    } finally {
      passwordSaving.value = false;
    }
  });

  useVisibleTask$(async () => {
    if (loc.url.searchParams.get('section') === 'password') {
      showPasswordForm.value = true;
    }
    await loadProfile();
    await refreshPushStatus();
  });

  if (loading.value) {
    return (
      <div class="flex items-center justify-center py-16">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-neutral-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const passwordChecks = getPasswordChecks(passwordData.value.newPassword);
  const confirmHasValue = passwordData.value.confirmPassword.trim().length > 0;
  const passwordsMatch = passwordData.value.newPassword === passwordData.value.confirmPassword;

  return (
    <div class="space-y-6 py-2">
      <PageHeader title="My Profile" subtitle="Manage your personal details and account security">
        <Btn
          q:slot="actions"
          variant="secondary"
          onClick$={() => {
            success.value = '';
            error.value = '';
            showPasswordForm.value = !showPasswordForm.value;
            isEditing.value = false;
            profileErrors.value = {};
            passwordErrors.value = {};
          }}
        >
          {showPasswordForm.value ? 'Back to Profile Form' : 'Change Password'}
        </Btn>
        {!showPasswordForm.value && !isEditing.value && (
          <Btn q:slot="actions" onClick$={() => {
            success.value = '';
            error.value = '';
            isEditing.value = true;
          }}>
            Edit
          </Btn>
        )}
      </PageHeader>

      {error.value && (
        <Alert variant="error" class="border-l-4">
          <p class="text-error-800">{error.value}</p>
        </Alert>
      )}

      {success.value && (
        <Alert variant="success" class="border-l-4">
          <p class="text-success-800">{success.value}</p>
        </Alert>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {showPasswordForm.value ? (
          <SectionCard class="lg:col-span-2 p-6">
            <h2 class="text-lg font-semibold text-neutral-800 mb-4">Update Password</h2>
            <form onSubmit$={handleChangePassword} preventdefault:submit class="space-y-5">
              <FormField id="password-current" label="Current Password" required error={passwordErrors.value.currentPassword}>
                <div class="relative">
                  <input
                    id="password-current"
                    type={showCurrentPassword.value ? 'text' : 'password'}
                    class="form-input pr-11"
                    value={passwordData.value.currentPassword}
                    onInput$={(e) => {
                      passwordData.value = {
                        ...passwordData.value,
                        currentPassword: (e.target as HTMLInputElement).value,
                      };
                    }}
                  />
                  <Btn
                    type="button"
                    size="sm"
                    variant="ghost"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                    onClick$={() => {
                      showCurrentPassword.value = !showCurrentPassword.value;
                    }}
                  >
                    <i class={[showCurrentPassword.value ? 'i-heroicons-eye-slash-solid' : 'i-heroicons-eye-solid', 'h-5 w-5 inline-block']} aria-hidden="true"></i>
                  </Btn>
                </div>
              </FormField>

              <FormField id="password-new" label="New Password" required error={passwordErrors.value.newPassword}>
                <div class="relative">
                  <input
                    id="password-new"
                    type={showNewPassword.value ? 'text' : 'password'}
                    class="form-input pr-11"
                    value={passwordData.value.newPassword}
                    onInput$={(e) => {
                      const nextPassword = (e.target as HTMLInputElement).value;
                      passwordData.value = {
                        ...passwordData.value,
                        newPassword: nextPassword,
                      };
                      passwordStrength.value = getPasswordStrength(nextPassword);
                    }}
                  />
                  <Btn
                    type="button"
                    size="sm"
                    variant="ghost"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                    onClick$={() => {
                      showNewPassword.value = !showNewPassword.value;
                    }}
                  >
                    <i class={[showNewPassword.value ? 'i-heroicons-eye-slash-solid' : 'i-heroicons-eye-solid', 'h-5 w-5 inline-block']} aria-hidden="true"></i>
                  </Btn>
                </div>
              </FormField>

              {passwordData.value.newPassword && (
                <div class="space-y-3">
                  <div>
                    <div class="flex items-center justify-between text-xs mb-1">
                      <span class="text-neutral-600">Password Strength</span>
                      <span class={[getStrengthTextClass(passwordStrength.value), 'font-semibold']}>
                        {getStrengthText(passwordStrength.value)}
                      </span>
                    </div>
                    <div class="h-2 rounded-full bg-neutral-200">
                      <div
                        class={[getStrengthBarClass(passwordStrength.value), 'h-2 rounded-full transition-all duration-300']}
                        style={{ width: `${passwordStrength.value}%` }}
                      ></div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <p class={passwordChecks.minLength ? 'text-success-700' : 'text-neutral-600'}>
                      {passwordChecks.minLength ? '✓' : '•'} At least 8 characters
                    </p>
                    <p class={passwordChecks.hasUpper ? 'text-success-700' : 'text-neutral-600'}>
                      {passwordChecks.hasUpper ? '✓' : '•'} One uppercase letter
                    </p>
                    <p class={passwordChecks.hasLower ? 'text-success-700' : 'text-neutral-600'}>
                      {passwordChecks.hasLower ? '✓' : '•'} One lowercase letter
                    </p>
                    <p class={passwordChecks.hasNumber ? 'text-success-700' : 'text-neutral-600'}>
                      {passwordChecks.hasNumber ? '✓' : '•'} One number
                    </p>
                    <p class={passwordChecks.hasSpecial ? 'text-success-700' : 'text-neutral-600'}>
                      {passwordChecks.hasSpecial ? '✓' : '•'} One special character
                    </p>
                  </div>
                </div>
              )}

              <FormField id="password-confirm" label="Confirm Password" required error={passwordErrors.value.confirmPassword}>
                <div class="relative">
                  <input
                    id="password-confirm"
                    type={showConfirmPassword.value ? 'text' : 'password'}
                    class="form-input pr-11"
                    value={passwordData.value.confirmPassword}
                    onInput$={(e) => {
                      passwordData.value = {
                        ...passwordData.value,
                        confirmPassword: (e.target as HTMLInputElement).value,
                      };
                    }}
                  />
                  <Btn
                    type="button"
                    size="sm"
                    variant="ghost"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                    onClick$={() => {
                      showConfirmPassword.value = !showConfirmPassword.value;
                    }}
                  >
                    <i class={[showConfirmPassword.value ? 'i-heroicons-eye-slash-solid' : 'i-heroicons-eye-solid', 'h-5 w-5 inline-block']} aria-hidden="true"></i>
                  </Btn>
                </div>
              </FormField>

              {confirmHasValue && (
                <p class={passwordsMatch ? 'text-xs text-success-700' : 'text-xs text-error-600'}>
                  {passwordsMatch ? 'Passwords match.' : 'Passwords do not match.'}
                </p>
              )}

              <div class="flex gap-3">
                <Btn type="submit" disabled={passwordSaving.value || (confirmHasValue && !passwordsMatch)}>
                  {passwordSaving.value ? 'Updating...' : 'Update Password'}
                </Btn>
                <Btn
                  type="button"
                  variant="secondary"
                  onClick$={() => {
                    showPasswordForm.value = false;
                    passwordErrors.value = {};
                    passwordData.value = {
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    };
                    passwordStrength.value = 0;
                  }}
                >
                  Cancel
                </Btn>
              </div>
            </form>
          </SectionCard>
        ) : (
          <SectionCard class="lg:col-span-2 p-6">
            <form onSubmit$={handleSubmit} preventdefault:submit class="space-y-5">
              <FormField id="profile-name" label="Full Name" required error={profileErrors.value.name}>
                <input
                  id="profile-name"
                  type="text"
                  class="form-input"
                  value={formData.value.name}
                  disabled={!isEditing.value}
                  onInput$={(e) => {
                    formData.value = {
                      ...formData.value,
                      name: (e.target as HTMLInputElement).value,
                    };
                  }}
                  placeholder="Enter your full name"
                />
              </FormField>

              <FormField id="profile-email" label="Email" required error={profileErrors.value.email}>
                <input
                  id="profile-email"
                  type="email"
                  class="form-input"
                  value={formData.value.email}
                  disabled={!isEditing.value}
                  onInput$={(e) => {
                    formData.value = {
                      ...formData.value,
                      email: (e.target as HTMLInputElement).value,
                    };
                  }}
                  placeholder="Enter your email"
                />
              </FormField>

              <FormField id="profile-phone" label="Phone" required error={profileErrors.value.phone}>
                <input
                  id="profile-phone"
                  type="tel"
                  class="form-input"
                  value={formData.value.phone}
                  disabled={!isEditing.value}
                  onInput$={(e) => {
                    formData.value = {
                      ...formData.value,
                      phone: (e.target as HTMLInputElement).value,
                    };
                  }}
                  placeholder="Enter your phone number"
                />
              </FormField>

              <div class="flex flex-col sm:flex-row gap-3 pt-2">
                {isEditing.value && (
                  <Btn type="submit" disabled={profileSaving.value} class="sm:min-w-40">
                    {profileSaving.value ? 'Saving...' : 'Save Changes'}
                  </Btn>
                )}
                {isEditing.value && (
                  <Btn
                    type="button"
                    variant="secondary"
                    onClick$={() => {
                      formData.value = { ...originalFormData.value };
                      profileErrors.value = {};
                      error.value = '';
                      success.value = '';
                      isEditing.value = false;
                    }}
                  >
                    Cancel
                  </Btn>
                )}
              </div>
            </form>
          </SectionCard>
        )}

        <SectionCard class="p-6">
          <h2 class="text-lg font-semibold text-neutral-800 mb-4">Account Info</h2>
          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-neutral-600">Role</span>
              <span class="font-medium text-neutral-800">{profileInfo.value.role || 'User'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-neutral-600">Access</span>
              <span class={profileInfo.value.isSuperAdmin ? 'text-warning-700 font-semibold' : 'text-neutral-800'}>
                {profileInfo.value.accessScope}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-neutral-600">Permission Count</span>
              <span class="font-medium text-neutral-800">{profileInfo.value.permissions.length}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-neutral-600">Business Roles</span>
              <span class="font-medium text-neutral-800">{profileInfo.value.businessRoles.length}</span>
            </div>
            <div>
              <span class="text-neutral-600">Status</span>
              <p class="mt-1 text-neutral-800">{profileInfo.value.activeStatus ? 'Active' : 'Inactive'}</p>
            </div>
            <div>
              <span class="text-neutral-600">Permissions</span>
              {profileInfo.value.permissions.length === 0 ? (
                <p class="mt-1 text-neutral-500">No permissions assigned.</p>
              ) : (
                <div class="mt-2 flex flex-wrap gap-2">
                  {profileInfo.value.permissions.slice(0, 8).map((permission) => (
                    <span key={permission} class="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
                      {permission}
                    </span>
                  ))}
                  {profileInfo.value.permissions.length > 8 && (
                    <span class="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
                      +{profileInfo.value.permissions.length - 8} more
                    </span>
                  )}
                </div>
              )}
            </div>

            <div class="pt-2 border-t border-color-border-secondary">
              <span class="text-neutral-600">Last 5 Logins</span>
              {loginHistory.value.length === 0 ? (
                <p class="mt-1 text-neutral-500">No recent login records found.</p>
              ) : (
                <div class="mt-2 space-y-2">
                  {loginHistory.value.map((log, index) => (
                    <div key={`login-${index}-${log.id}`} class="rounded-lg border border-color-border-secondary p-2">
                      <p class="text-xs text-neutral-800 font-medium">{formatDateTime(log.timestamp)}</p>
                      <p class="text-xs text-neutral-600">IP: {log.ip_address || 'N/A'}</p>
                      <p class="text-xs text-neutral-600">Device: {log.user_agent || 'N/A'}</p>
                      <p class="text-xs text-neutral-600">Status: {log.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard class="p-6">
          <div class="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-neutral-800">Push Notifications</h2>
              <p class="mt-1 text-sm text-neutral-500">
                Verify browser permission, service worker registration, and active push subscription.
              </p>
            </div>
            <Btn
              size="sm"
              variant="secondary"
              onClick$={() => refreshPushStatus('Push notification status refreshed.')}
              disabled={pushStatusLoading.value}
            >
              {pushStatusLoading.value ? 'Checking...' : 'Refresh'}
            </Btn>
          </div>

          {pushStatusMessage.value && (
            <Alert
              variant={pushStatus.value.subscriptionActive ? 'success' : pushStatus.value.permission === 'denied' ? 'warning' : 'info'}
              class="mb-4"
            >
              <p>{pushStatusMessage.value}</p>
            </Alert>
          )}

          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-3">
              <span class="text-neutral-600">Browser Support</span>
              <span class={pushStatus.value.supported ? 'font-medium text-success-700' : 'font-medium text-error-600'}>
                {pushStatus.value.supported ? 'Supported' : 'Unsupported'}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-neutral-600">Permission</span>
              <span class={[getPushStatusTone(pushStatus.value.permission), 'font-medium']}>
                {pushStatus.value.permission}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-neutral-600">Service Worker</span>
              <span class={pushStatus.value.serviceWorkerRegistered ? 'font-medium text-success-700' : 'font-medium text-warning-700'}>
                {pushStatus.value.serviceWorkerRegistered ? 'Registered' : 'Not registered'}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-neutral-600">Push Subscription</span>
              <span class={[getPushStatusTone(pushStatus.value.subscriptionActive ? 'active' : 'inactive'), 'font-medium']}>
                {pushStatus.value.subscriptionActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {pushStatus.value.endpoint && (
              <div class="rounded-lg border border-color-border-secondary bg-color-surface-secondary p-3">
                <p class="text-xs font-medium text-neutral-600">Subscription Endpoint</p>
                <p class="mt-1 break-all text-xs text-neutral-500">{pushStatus.value.endpoint}</p>
              </div>
            )}

            {pushStatus.value.supported && pushStatus.value.permission !== 'granted' && (
              <Alert variant="warning">
                <p>
                  {pushStatus.value.permission === 'denied'
                    ? 'Browser notifications are blocked for this site. Use the lock or site-settings icon in the address bar to allow notifications, then click Check Again.'
                    : 'Browser notifications are not fully enabled yet. Allow notifications to receive push alerts when the app is closed.'}
                </p>
              </Alert>
            )}

            <div class="flex flex-wrap gap-3 pt-2">
              <Btn
                onClick$={enablePushNotifications}
                disabled={pushStatusLoading.value || !pushStatus.value.supported}
              >
                {pushStatus.value.permission === 'denied'
                  ? 'Re-enable Browser Notifications'
                  : pushStatus.value.subscriptionActive
                    ? 'Re-register Push'
                    : 'Enable Push Notifications'}
              </Btn>
              <Btn
                variant="secondary"
                onClick$={sendTestPushNotification}
                disabled={pushStatusLoading.value || !pushStatus.value.subscriptionActive}
              >
                Send Test Push
              </Btn>
              <Btn
                variant="ghost"
                onClick$={() => refreshPushStatus()}
                disabled={pushStatusLoading.value}
              >
                Check Again
              </Btn>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
});
