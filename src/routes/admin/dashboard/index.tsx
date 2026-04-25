import { component$, useSignal } from "@builder.io/qwik";
import { ContractKpi } from "~/components/kpis/contract";
import { DairySiteKpi } from "~/components/kpis/dairysite";
import { DieselKpi } from "~/components/kpis/diesel";
import { StockKpi } from "~/components/kpis/stock";
import { PageHeader, TabBar, type TabItem } from "~/components/ds";

export default component$(() => {
  const activeTab = useSignal('diesel');

  // Only store serializable data in the dashboards array
  const dashboards = [
    { 
      id: 'diesel', 
      label: 'Fuel Management', 
      description: 'Diesel consumption and efficiency analytics'
    },
    { 
      id: 'stock', 
      label: 'Inventory', 
      description: 'Stock levels and material management'
    },
    { 
      id: 'contractor', 
      label: 'Contractors', 
      description: 'Contractor performance and productivity'
    },
    { 
      id: 'dairy', 
      label: 'Dairy Sites', 
      description: 'Site reporting and operational metrics'
    }
  ];

  const tabItems: TabItem[] = dashboards.map((dashboard) => ({
    key: dashboard.id,
    label: dashboard.label,
  }));

  const activeDashboard = dashboards.find((dashboard) => dashboard.id === activeTab.value);

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
    <div class="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        subtitle="Comprehensive business intelligence and analytics"
      >
        <div q:slot="actions" class="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </PageHeader>

      <div class="rounded-xl border border-color-border-primary bg-color-surface-primary px-6 py-4 shadow-sm">
        <TabBar
          items={tabItems}
          activeKey={activeTab.value}
          onTabChange$={(key) => {
            activeTab.value = key;
          }}
        />
        {activeDashboard ? (
          <p class="mt-2 text-xs text-gray-500">{activeDashboard.description}</p>
        ) : null}
      </div>

      <div>
        <ActiveComponent />
      </div>
    </div>
  );
});