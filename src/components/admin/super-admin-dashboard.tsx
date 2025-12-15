// src/components/admin/super-admin-dashboard.tsx
import { component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { authService } from '~/services/auth.service';

export const SuperAdminDashboard = component$(() => {
  const state = useStore({
    dashboardData: null as any,
    loading: true,
    error: null as string | null,
  });

  useVisibleTask$(async () => {
    try {
      state.dashboardData = await authService.getSuperAdminDashboard();
      state.loading = false;
    } catch {
      state.error = 'Failed to load dashboard data';
      state.loading = false;
    }
  });

  if (state.loading) {
    return (
      <div class="flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-800">{state.error}</p>
      </div>
    );
  }

  const { global_stats, business_verticals, super_admin } = state.dashboardData;

  return (
    <div class="super-admin-dashboard space-y-6">
      {/* Header */}
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 class="text-2xl font-bold">Super Admin Dashboard</h1>
        <p class="mt-2">Welcome back, {super_admin.name}</p>
        <div class="mt-4 flex items-center gap-4 text-sm">
          <span class="bg-white/20 px-3 py-1 rounded">Role: {super_admin.role}</span>
          <span class="bg-white/20 px-3 py-1 rounded">Full System Access</span>
        </div>
      </div>

      {/* Global Statistics */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat-card bg-white p-6 border rounded-lg shadow-sm">
          <h3 class="text-sm font-medium text-gray-500">Total Users</h3>
          <p class="text-3xl font-bold text-blue-600">{global_stats.total_users}</p>
        </div>
        <div class="stat-card bg-white p-6 border rounded-lg shadow-sm">
          <h3 class="text-sm font-medium text-gray-500">Business Verticals</h3>
          <p class="text-3xl font-bold text-green-600">{global_stats.total_business_verticals}</p>
        </div>
        <div class="stat-card bg-white p-6 border rounded-lg shadow-sm">
          <h3 class="text-sm font-medium text-gray-500">Global Roles</h3>
          <p class="text-3xl font-bold text-purple-600">{global_stats.total_global_roles}</p>
        </div>
        <div class="stat-card bg-white p-6 border rounded-lg shadow-sm">
          <h3 class="text-sm font-medium text-gray-500">Business Roles</h3>
          <p class="text-3xl font-bold text-orange-600">{global_stats.total_business_roles}</p>
        </div>
      </div>

      {/* Business Verticals Overview */}
      <div class="bg-white border rounded-lg">
        <div class="p-6 border-b">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Business Verticals</h2>
            <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Create New Business
            </button>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Business
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Code
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Users
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Roles
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {business_verticals.map((business: any) => (
                <tr key={business.id} class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div>
                      <div class="font-medium text-gray-900">{business.name}</div>
                      <div class="text-sm text-gray-500">{business.description}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded">
                      {business.code}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">{business.user_count}</td>
                  <td class="px-6 py-4 text-sm text-gray-900">{business.role_count}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    {new Date(business.created_at).toLocaleDateString()}
                  </td>
                  <td class="px-6 py-4 text-sm space-x-2">
                    <button
                      class="text-blue-600 hover:text-blue-900"
                      onClick$={() => {
                        window.location.href = `/business/${business.code}/manage`;
                      }}
                    >
                      Manage
                    </button>
                    <button
                      class="text-green-600 hover:text-green-900"
                      onClick$={() => {
                        window.location.href = `/business/${business.code}/dashboard`;
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
