// src/components/business/business-selector.tsx
import { component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { authService, type BusinessVertical } from '~/services/auth.service';

export const BusinessSelector = component$(() => {
  const state = useStore({
    businesses: [] as BusinessVertical[],
    selectedBusiness: null as BusinessVertical | null,
    loading: true,
  });

  useVisibleTask$(async () => {
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
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">
                {business.code}
              </span>
            </div>
            
            <p class="text-sm text-gray-600 mb-3">{business.description}</p>
            
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500">Access Type:</span>
                <span class={`px-2 py-1 rounded ${
                  business.access_type === 'super_admin' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {business.access_type === 'super_admin' ? 'Super Admin' : 'Business Role'}
                </span>
              </div>
              
              <div class="text-xs">
                <span class="text-gray-500">Roles:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  {business.roles.map((role) => (
                    <span key={role} class="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {role}
                    </span>
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
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick$={() => {
                // Navigate to business dashboard
                window.location.href = `/business/${state.selectedBusiness!.code}/dashboard`;
              }}
            >
              Enter Dashboard
            </button>
            <button
              class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              onClick$={() => {
                // Navigate to business management
                window.location.href = `/business/${state.selectedBusiness!.code}/manage`;
              }}
            >
              Manage Business
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
