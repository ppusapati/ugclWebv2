import { component$, useSignal } from "@builder.io/qwik";
import { ContractKpi } from "~/components/kpis/contract";
import { DairySiteKpi } from "~/components/kpis/dairysite";
import { DieselKpi } from "~/components/kpis/diesel";
import { StockKpi } from "~/components/kpis/stock";

export default component$(() => {
  const activeTab = useSignal('diesel');

  // Only store serializable data in the dashboards array
  const dashboards = [
    { 
      id: 'diesel', 
      label: '⛽ Fuel Management', 
      description: 'Diesel consumption and efficiency analytics'
    },
    { 
      id: 'stock', 
      label: '📦 Inventory', 
      description: 'Stock levels and material management'
    },
    { 
      id: 'contractor', 
      label: '🚧 Contractors', 
      description: 'Contractor performance and productivity'
    },
    { 
      id: 'dairy', 
      label: '🏭 Dairy Sites', 
      description: 'Site reporting and operational metrics'
    }
  ];

  // Function to get the active component based on the current tab
  const getActiveComponent = () => {
    switch (activeTab.value) {
      case 'diesel':
        return DieselKpi;
      case 'stock':
        return StockKpi;
      case 'contractor':
        return ContractKpi;
      case 'dairy':
        return DairySiteKpi;
      default:
        return DieselKpi;
    }
  };

  const ActiveComponent = getActiveComponent();

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Main Header */}
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">📊 Operations Dashboard</h1>
              <p class="text-gray-600 mt-1">Comprehensive business intelligence and analytics</p>
            </div>
            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-6">
          <nav class="flex space-x-8">
            {dashboards.map((dashboard) => (
              <button
                key={dashboard.id}
                onClick$={() => activeTab.value = dashboard.id}
                class={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab.value === dashboard.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div class="flex items-center space-x-2">
                  <span>{dashboard.label}</span>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  {dashboard.description}
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Dashboard Content */}
      <div class="mx-auto">
        <ActiveComponent />
      </div>
    </div>
  );
});