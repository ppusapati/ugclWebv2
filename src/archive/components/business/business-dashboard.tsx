// src/components/business/business-dashboard.tsx
import { component$, isServer, useStore, useTask$ } from '@builder.io/qwik';
import { buildApiUrl } from '~/config/api';
import { Badge, Btn } from '~/components/ds';

interface BusinessDashboardProps {
  businessCode: string;
}

export const BusinessDashboard = component$<BusinessDashboardProps>(({ businessCode }) => {
  const state = useStore({
    businessContext: null as any,
    analytics: null as any,
    loading: true,
  });

  useTask$(async () => {
    if (isServer) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const apiKey = 'YOUR_API_KEY';

      // Get business context
      const contextResponse = await fetch(buildApiUrl(`/business/${businessCode}/context`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': apiKey,
        },
      });
      state.businessContext = await contextResponse.json();

      // Get business analytics
      const analyticsResponse = await fetch(buildApiUrl(`/business/${businessCode}/analytics`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': apiKey,
        },
      });
      state.analytics = await analyticsResponse.json();

      state.loading = false;
    } catch (err) {
      console.error('Failed to load business data:', err);
      state.loading = false;
    }
  });

  if (state.loading) {
    return <div class="p-8 text-center">Loading business dashboard...</div>;
  }

  return (
    <div class="business-dashboard space-y-6">
      {/* Business Header */}
      <div class="bg-white border rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">Business Dashboard</h1>
            <p class="text-gray-600">Business Code: {businessCode}</p>
          </div>
          
          <div class="flex items-center gap-4">
            {state.businessContext?.is_super_admin && (
              <Badge variant="error" class="px-3 py-1 text-sm">
                Super Admin Access
              </Badge>
            )}
            {state.businessContext?.is_admin && !state.businessContext?.is_super_admin && (
              <Badge variant="info" class="px-3 py-1 text-sm">
                Business Admin
              </Badge>
            )}
          </div>
        </div>

        {/* User Permissions */}
        <div class="mt-4">
          <h3 class="text-sm font-medium text-gray-700 mb-2">Your Permissions:</h3>
          <div class="flex flex-wrap gap-2">
            {state.businessContext?.permissions?.map((permission: string) => (
              <Badge key={permission} variant="neutral" class="px-2 py-1 text-xs">
                {permission}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {state.businessContext?.permissions?.includes('read_reports') && (
          <Btn
            variant="ghost"
            class="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 text-left"
            onClick$={() => {
              window.location.href = `/admin/masters/business/${businessCode}/reports`;
            }}
          >
            <h3 class="font-medium text-blue-900">View Reports</h3>
            <p class="text-sm text-blue-700 mt-1">Access business reports</p>
          </Btn>
        )}

        {state.businessContext?.permissions?.includes('business_manage_users') && (
          <Btn
            variant="ghost"
            class="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 text-left"
            onClick$={() => {
              window.location.href = `/admin/masters/business/${businessCode}/users`;
            }}
          >
            <h3 class="font-medium text-green-900">Manage Users</h3>
            <p class="text-sm text-green-700 mt-1">Add and manage users</p>
          </Btn>
        )}

        {businessCode === 'SOLAR' && state.businessContext?.permissions?.includes('solar_read_generation') && (
          <Btn
            variant="ghost"
            class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 text-left"
            onClick$={() => {
              window.location.href = `/admin/masters/business/${businessCode}/solar/generation`;
            }}
          >
            <h3 class="font-medium text-yellow-900">Solar Generation</h3>
            <p class="text-sm text-yellow-700 mt-1">Monitor solar output</p>
          </Btn>
        )}

        {businessCode === 'WATER' && state.businessContext?.permissions?.includes('water_read_consumption') && (
          <Btn
            variant="ghost"
            class="p-4 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 text-left"
            onClick$={() => {
              window.location.href = `/admin/masters/business/${businessCode}/water/consumption`;
            }}
          >
            <h3 class="font-medium text-cyan-900">Water Consumption</h3>
            <p class="text-sm text-cyan-700 mt-1">Monitor water usage</p>
          </Btn>
        )}
      </div>

      {/* Analytics Section */}
      {state.analytics && (
        <div class="bg-white border rounded-lg p-6">
          <h2 class="text-xl font-semibold mb-4">Business Analytics</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 bg-gray-50 rounded">
              <p class="text-2xl font-bold text-blue-600">
                {state.analytics.analytics?.total_reports || 0}
              </p>
              <p class="text-sm text-gray-600">Total Reports</p>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded">
              <p class="text-2xl font-bold text-green-600">
                {state.analytics.analytics?.active_users || 0}
              </p>
              <p class="text-sm text-gray-600">Active Users</p>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded">
              <p class="text-2xl font-bold text-purple-600">
                {state.analytics.analytics?.monthly_growth || 0}%
              </p>
              <p class="text-sm text-gray-600">Monthly Growth</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
