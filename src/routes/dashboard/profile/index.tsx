// src/routes/profile/index.tsx
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { authService, businessService } from '~/services';
import type { User, BusinessVertical } from '~/services';

export default component$(() => {
  const nav = useNavigate();

  const user = useSignal<User | null>(null);
  const businesses = useSignal<BusinessVertical[]>([]);
  const loading = useSignal(true);

  useVisibleTask$(async () => {
    try {
      const currentUser = authService.getUser();
      if (!currentUser) {
        nav('/login');
        return;
      }

      user.value = currentUser;

      // Fetch user's businesses
      try {
        const userBusinesses = await businessService.getMyBusinesses();
        businesses.value = userBusinesses;
      } catch (error) {
        console.error('Failed to load businesses:', error);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      loading.value = false;
    }
  });

  if (loading.value) {
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
      <div class="container mx-auto">
        {/* Header */}
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-dark-800">My Profile</h1>
          <p class="text-dark-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <div class="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div class="card bg-white shadow-lg rounded-xl p-8">
              <div class="flex justify-between items-start mb-6">
                <h2 class="text-2xl font-bold text-dark-800">Personal Information</h2>
                <button
                  onClick$={() => nav('/profile/edit')}
                  class="btn-primary px-4 py-2 rounded-lg"
                >
                  Edit Profile
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="text-sm font-medium text-dark-600">Full Name</label>
                  <p class="text-lg text-dark-800 mt-1">{user.value?.name}</p>
                </div>

                <div>
                  <label class="text-sm font-medium text-dark-600">Email Address</label>
                  <p class="text-lg text-dark-800 mt-1">{user.value?.email}</p>
                </div>

                <div>
                  <label class="text-sm font-medium text-dark-600">Phone Number</label>
                  <p class="text-lg text-dark-800 mt-1">{user.value?.phone}</p>
                </div>

                <div>
                  <label class="text-sm font-medium text-dark-600">User ID</label>
                  <p class="text-lg text-dark-800 mt-1 font-mono">{user.value?.id}</p>
                </div>

                <div>
                  <label class="text-sm font-medium text-dark-600">Global Role</label>
                  <span class="badge-primary mt-1 inline-block capitalize">
                    {user.value?.role}
                  </span>
                </div>

                <div>
                  <label class="text-sm font-medium text-dark-600">Account Status</label>
                  <div class="mt-1">
                    {user.value?.is_active !== false ? (
                      <span class="badge-success">Active</span>
                    ) : (
                      <span class="badge-danger">Inactive</span>
                    )}
                  </div>
                </div>
              </div>

              {user.value?.is_super_admin && (
                <div class="mt-6 p-4 bg-warning-50 border-l-4 border-warning-500 rounded-lg">
                  <p class="text-warning-800 font-semibold">
                    🔑 Super Admin Access
                  </p>
                  <p class="text-warning-700 text-sm mt-1">
                    You have full administrative privileges across all business verticals
                  </p>
                </div>
              )}
            </div>

            {/* Business Roles */}
            {user.value?.business_roles && user.value.business_roles.length > 0 && (
              <div class="card bg-white shadow-lg rounded-xl p-8">
                <h2 class="text-2xl font-bold text-dark-800 mb-6">Business Roles</h2>

                <div class="space-y-4">
                  {user.value.business_roles.map((br, idx) => {
                    const business = businesses.value.find(
                      b => b.id === br.business_vertical_id
                    );
                    return (
                      <div key={idx} class="border border-light-300 rounded-lg p-4">
                        <div class="flex justify-between items-start mb-3">
                          <div>
                            <h3 class="text-lg font-semibold text-dark-800">
                              {business?.name || 'Unknown Business'}
                            </h3>
                            <p class="text-sm text-dark-600">
                              {business?.code || br.business_vertical_id}
                            </p>
                          </div>
                          {br.is_admin && (
                            <span class="badge-warning">Admin</span>
                          )}
                        </div>

                        <div class="mb-3">
                          <label class="text-sm font-medium text-dark-600">Roles</label>
                          <div class="flex flex-wrap gap-2 mt-1">
                            {br.roles.map((role, roleIdx) => (
                              <span key={roleIdx} class="badge-primary-200 text-xs">
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label class="text-sm font-medium text-dark-600">Permissions</label>
                          <div class="flex flex-wrap gap-2 mt-1">
                            {br.permissions.slice(0, 5).map((perm, permIdx) => (
                              <span key={permIdx} class="badge-success-100 text-xs">
                                {perm}
                              </span>
                            ))}
                            {br.permissions.length > 5 && (
                              <span class="badge-light-300 text-xs">
                                +{br.permissions.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Accessible Businesses */}
            {businesses.value.length > 0 && (
              <div class="card bg-white shadow-lg rounded-xl p-8">
                <h2 class="text-2xl font-bold text-dark-800 mb-6">
                  Accessible Business Verticals ({businesses.value.length})
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {businesses.value.map((business, idx) => (
                    <div
                      key={idx}
                      class="border border-light-300 rounded-lg p-4 hover:border-primary-400 transition cursor-pointer"
                      onClick$={() => {
                        businessService.setSelectedBusiness(business);
                        nav('/dashboard');
                      }}
                    >
                      <div class="flex justify-between items-start mb-2">
                        <h3 class="font-semibold text-dark-800">{business.name}</h3>
                        <span class="badge-light-300 text-xs">{business.code}</span>
                      </div>
                      {business.description && (
                        <p class="text-sm text-dark-600 mb-2">{business.description}</p>
                      )}
                      <span class="text-xs text-primary-600 font-medium">
                        Click to select →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div class="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div class="card bg-white shadow-lg rounded-xl p-6">
              <h3 class="text-lg font-semibold text-dark-800 mb-4">Quick Actions</h3>
              <div class="space-y-3">
                <button
                  onClick$={() => nav('/profile/edit')}
                  class="w-full text-left px-4 py-3 rounded-lg bg-primary-50 hover:bg-primary-100 transition flex items-center justify-between"
                >
                  <span class="text-primary-700">Edit Profile</span>
                  <span class="text-primary-600">→</span>
                </button>
                <button
                  onClick$={() => nav('/change-password')}
                  class="w-full text-left px-4 py-3 rounded-lg bg-light-50 hover:bg-light-100 transition flex items-center justify-between"
                >
                  <span class="text-dark-700">Change Password</span>
                  <span class="text-primary-600">→</span>
                </button>
                <button
                  onClick$={() => nav('/my-businesses')}
                  class="w-full text-left px-4 py-3 rounded-lg bg-light-50 hover:bg-light-100 transition flex items-center justify-between"
                >
                  <span class="text-dark-700">My Businesses</span>
                  <span class="text-primary-600">→</span>
                </button>
                <button
                  onClick$={() => nav('/my-sites')}
                  class="w-full text-left px-4 py-3 rounded-lg bg-light-50 hover:bg-light-100 transition flex items-center justify-between"
                >
                  <span class="text-dark-700">My Sites</span>
                  <span class="text-primary-600">→</span>
                </button>
              </div>
            </div>

            {/* Account Security */}
            <div class="card bg-success-50 border border-success-200 rounded-xl p-6">
              <h3 class="text-lg font-semibold text-success-800 mb-3">Account Security</h3>
              <ul class="space-y-2 text-sm text-success-700">
                <li class="flex items-center gap-2">
                  <span class="text-success-600">✓</span>
                  <span>Email verified</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-success-600">✓</span>
                  <span>Phone verified</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-success-600">✓</span>
                  <span>Secure password</span>
                </li>
              </ul>
            </div>

            {/* Help & Support */}
            <div class="card bg-info-50 border border-info-200 rounded-xl p-6">
              <h3 class="text-lg font-semibold text-info-800 mb-3">Need Help?</h3>
              <p class="text-sm text-info-700 mb-4">
                Contact your system administrator if you need to update your role or permissions.
              </p>
              <button class="btn-info-500 w-full py-2 rounded-lg text-sm">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
