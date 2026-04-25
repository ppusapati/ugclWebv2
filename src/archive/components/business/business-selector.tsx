// src/components/business/business-selector.tsx
import { component$, isServer, useStore, useTask$ } from '@builder.io/qwik';
import { authService, type BusinessVertical } from '~/services/auth.service';
import { Badge, Btn } from '~/components/ds';

export const BusinessSelector = component$(() => {
  const state = useStore({
    businesses: [] as BusinessVertical[],
    selectedBusiness: null as BusinessVertical | null,
    loading: true,
  });

  useTask$(async () => {
    if (isServer) {
      return;
    }

    try {
      state.businesses = await authService.getUserBusinesses();
      state.loading = false;
    } catch (error) {
      console.error('Failed to load businesses:', error);
      state.loading = false;
    }
  });

  return (
    <div class="business-selector p-4 border rounded-lg">
      <h3 class="text-lg font-semibold mb-4">Select Business Vertical</h3>
      
      {state.loading && (
        <div class="flex items-center justify-center p-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.businesses.map((business) => (
          <div
            key={business.id}
            class={`business-card p-4 border rounded-lg cursor-pointer transition-colors ${
              state.selectedBusiness?.id === business.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick$={() => {
              state.selectedBusiness = business;
            }}
          >
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-medium">{business.name}</h4>
              <Badge variant="neutral">
                {business.code}
              </Badge>
            </div>
            
            <p class="text-sm text-gray-600 mb-3">{business.description}</p>
            
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500">Access Type:</span>
                <Badge variant={
                  business.access_type === 'super_admin' 
                    ? 'error' 
                    : 'success'
                }>
                  {business.access_type === 'super_admin' ? 'Super Admin' : 'Business Role'}
                </Badge>
              </div>
              
              <div class="text-xs">
                <span class="text-gray-500">Roles:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  {business.roles.map((role) => (
                    <Badge key={role} variant="info">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {state.selectedBusiness && (
        <div class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 class="font-medium text-green-800 mb-2">
            Selected: {state.selectedBusiness.name}
          </h4>
          <div class="flex gap-2">
            <Btn
              class="rounded"
              onClick$={async () => {
                await authService.setActiveBusinessContext(state.selectedBusiness!);
                // Navigate to business dashboard
                window.location.href = `/admin/masters/business/${state.selectedBusiness!.code}/dashboard`;
              }}
            >
              Enter Dashboard
            </Btn>
            <Btn
              variant="secondary"
              class="rounded"
              onClick$={async () => {
                await authService.setActiveBusinessContext(state.selectedBusiness!);
                // Navigate to business management
                window.location.href = `/admin/masters/business/${state.selectedBusiness!.code}/manage`;
              }}
            >
              Manage Business
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
});
