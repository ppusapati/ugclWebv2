// src/components/admin/super-admin-dashboard.tsx
import { component$, isServer, useStore, useTask$ } from '@builder.io/qwik';
import { Alert, Badge, Btn, SectionCard, StatCard } from '~/components/ds';
import { authService } from '~/services/auth.service';

export const SuperAdminDashboard = component$(() => {
  const state = useStore({
    dashboardData: null as any,
    loading: true,
    error: null as string | null,
  });

  useTask$(async () => {
    if (isServer) {
      return;
    }

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
      <Alert variant="error">
        <p class="text-red-800">{state.error}</p>
      </Alert>
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
        <StatCard class="p-6">
          <h3 class="text-sm font-medium text-gray-500">Total Users</h3>
          <p class="text-3xl font-bold text-blue-600">{global_stats.total_users}</p>
        </StatCard>
        <StatCard class="p-6">
          <h3 class="text-sm font-medium text-gray-500">Business Verticals</h3>
          <p class="text-3xl font-bold text-green-600">{global_stats.total_business_verticals}</p>
        </StatCard>
        <StatCard class="p-6">
          <h3 class="text-sm font-medium text-gray-500">Global Roles</h3>
          <p class="text-3xl font-bold text-purple-600">{global_stats.total_global_roles}</p>
        </StatCard>
        <StatCard class="p-6">
          <h3 class="text-sm font-medium text-gray-500">Business Roles</h3>
          <p class="text-3xl font-bold text-orange-600">{global_stats.total_business_roles}</p>
        </StatCard>
      </div>

      {/* Business Verticals Overview */}
      <SectionCard class="overflow-hidden p-0">
        <div class="p-6 border-b">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Business Verticals</h2>
            <Btn>
              Create New Business
            </Btn>
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
                    <Badge variant="neutral">
                      {business.code}
                    </Badge>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">{business.user_count}</td>
                  <td class="px-6 py-4 text-sm text-gray-900">{business.role_count}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    {new Date(business.created_at).toLocaleDateString()}
                  </td>
                  <td class="px-6 py-4 text-sm flex items-center gap-2">
                    <Btn
                      size="sm"
                      variant="ghost"
                      class="text-blue-600 hover:text-blue-900"
                      onClick$={() => {
                        window.location.href = `/admin/masters/business/${business.code}/manage`;
                      }}
                    >
                      Manage
                    </Btn>
                    <Btn
                      size="sm"
                      variant="secondary"
                      class="text-green-600 hover:text-green-900"
                      onClick$={() => {
                        window.location.href = `/admin/masters/business/${business.code}/dashboard`;
                      }}
                    >
                      View
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
});
