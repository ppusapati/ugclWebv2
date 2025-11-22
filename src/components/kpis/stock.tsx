import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { EChart } from '~/components/echarts';

// Types
type KpiEntry = { key: string; value: number };
type StockKpis = {
  totalStockIn: number;
  totalStockOut: number;
  currentStockLevel: number;
  stockAgingDays: number;
  defectiveMaterialPct: number;
  topContractors: KpiEntry[];
  topItemsPipeDiaUsed: KpiEntry[];
  documentationCompliancePct: number;
  specialsVsRegularRatio: number;
  avgDataEntryDelayDays: number;
};

export const StockKpi = component$(() => {
  const kpis = useSignal<StockKpis | null>(null);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const selectedTab = useSignal('overview');

  useVisibleTask$(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://ugcl-429789556411.asia-south1.run.app/api/v1';
      const res = await fetch(`${baseUrl}/kpi/stock`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch KPIs: ${res.status} ${res.statusText}`);
      const data = await res.json();
      kpis.value = data;
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      kpis.value = null;
    } finally {
      loading.value = false;
    }
  });

  // Helper functions for calculations
  const getStockHealth = (data: StockKpis) => {
    const turnoverRate = data.totalStockOut / data.totalStockIn;
    const stockUtilization = (data.totalStockOut / (data.totalStockIn + data.currentStockLevel)) * 100;
    const defectRate = data.defectiveMaterialPct;
    const complianceScore = data.documentationCompliancePct;
    
    return { turnoverRate, stockUtilization, defectRate, complianceScore };
  };

  const getTopPerformers = (data: KpiEntry[], count = 5) => {
    return [...data].sort((a, b) => b.value - a.value).slice(0, count);
  };

  const getStockStatus = (data: StockKpis) => {
    const health = getStockHealth(data);
    if (health.stockUtilization > 80 && health.defectRate < 5) return 'excellent';
    if (health.stockUtilization > 60 && health.defectRate < 10) return 'good';
    if (health.stockUtilization > 40 && health.defectRate < 15) return 'average';
    return 'needs-attention';
  };

  const renderOverviewTab = () => {
    if (!kpis.value) return null;
    const health = getStockHealth(kpis.value);
    const topContractors = getTopPerformers(kpis.value.topContractors, 3);
    const status = getStockStatus(kpis.value);

    return (
      <div class="space-y-8">
        {/* Executive Summary Cards */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-100 text-sm font-medium">Stock Inbound</p>
                <p class="text-3xl font-bold">{(kpis.value.totalStockIn / 1000).toFixed(1)}K</p>
                <p class="text-green-100 text-sm">Items Received</p>
              </div>
              <div class="bg-green-400 bg-opacity-30 rounded-full p-3">
                📦
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-red-100 text-sm font-medium">Stock Outbound</p>
                <p class="text-3xl font-bold">{(kpis.value.totalStockOut / 1000).toFixed(1)}K</p>
                <p class="text-red-100 text-sm">Items Issued</p>
              </div>
              <div class="bg-red-400 bg-opacity-30 rounded-full p-3">
                📤
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-primary-100 text-sm font-medium">Current Stock</p>
                <p class="text-3xl font-bold">{(kpis.value.currentStockLevel / 1000).toFixed(1)}K</p>
                <p class="text-primary-100 text-sm">On Hand</p>
              </div>
              <div class="bg-primary-400 bg-opacity-30 rounded-full p-3">
                🏪
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-purple-100 text-sm font-medium">Turnover Rate</p>
                <p class="text-3xl font-bold">{health.turnoverRate.toFixed(1)}x</p>
                <p class="text-purple-100 text-sm">Efficiency</p>
              </div>
              <div class="bg-purple-400 bg-opacity-30 rounded-full p-3">
                ⚡
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">📊 Stock Health Overview</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class={`rounded-lg p-4 ${
              status === 'excellent' ? 'bg-green-50' :
              status === 'good' ? 'bg-primary-50' :
              status === 'average' ? 'bg-yellow-50' : 'bg-red-50'
            }`}>
              <h4 class={`font-medium ${
                status === 'excellent' ? 'text-green-900' :
                status === 'good' ? 'text-primary-900' :
                status === 'average' ? 'text-yellow-900' : 'text-red-900'
              }`}>Overall Status</h4>
              <p class={`text-sm mt-1 ${
                status === 'excellent' ? 'text-green-700' :
                status === 'good' ? 'text-primary-700' :
                status === 'average' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                Stock operations are <span class="font-semibold">{status.replace('-', ' ')}</span>
              </p>
            </div>
            <div class="bg-purple-50 rounded-lg p-4">
              <h4 class="font-medium text-purple-900">Top Contractor</h4>
              <p class="text-sm text-purple-700 mt-1">
                <span class="font-semibold">{topContractors[0]?.key}</span> leads with {topContractors[0]?.value} items
              </p>
            </div>
            <div class="bg-orange-50 rounded-lg p-4">
              <h4 class="font-medium text-orange-900">Aging Analysis</h4>
              <p class="text-sm text-orange-700 mt-1">
                Average stock age: <span class="font-semibold">{kpis.value.stockAgingDays} days</span>
              </p>
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <EChart
              option={{
                title: { text: 'Stock Flow Analysis', left: 'center', textStyle: { fontSize: 16, fontWeight: 'bold' } },
                tooltip: { trigger: 'item' },
                series: [{
                  type: 'pie',
                  radius: ['40%', '70%'],
                  data: [
                    { value: kpis.value.totalStockIn, name: 'Stock In', itemStyle: { color: '#10b981' } },
                    { value: kpis.value.totalStockOut, name: 'Stock Out', itemStyle: { color: '#ef4444' } },
                    { value: kpis.value.currentStockLevel, name: 'Current Stock', itemStyle: { color: '#3b82f6' } }
                  ],
                  label: { formatter: '{b}\n{d}%', fontSize: 11 }
                }]
              }}
            />
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <EChart
              option={{
                title: { text: 'Top Contractors Performance', left: 'center', textStyle: { fontSize: 16, fontWeight: 'bold' } },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                xAxis: { 
                  type: 'category', 
                  data: getTopPerformers(kpis.value.topContractors, 6).map(c => c.key.length > 15 ? c.key.substring(0, 15) + '...' : c.key),
                  axisLabel: { rotate: 45, interval: 0 }
                },
                yAxis: { type: 'value', name: 'Items' },
                series: [{
                  type: 'bar',
                  data: getTopPerformers(kpis.value.topContractors, 6).map(c => c.value),
                  itemStyle: { color: '#8b5cf6' }
                }]
              }}
            />
          </div>
        </div>

        {/* Performance Metrics */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-500">Stock Utilization</div>
                <div class="text-2xl font-bold text-primary-600">{health.stockUtilization.toFixed(1)}%</div>
              </div>
              <div class="text-2xl">📈</div>
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-500">Defect Rate</div>
                <div class="text-2xl font-bold text-red-600">{kpis.value.defectiveMaterialPct.toFixed(1)}%</div>
              </div>
              <div class="text-2xl">⚠️</div>
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-500">Documentation</div>
                <div class="text-2xl font-bold text-green-600">{kpis.value.documentationCompliancePct.toFixed(1)}%</div>
              </div>
              <div class="text-2xl">📋</div>
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-500">Entry Delay</div>
                <div class="text-2xl font-bold text-yellow-600">{kpis.value.avgDataEntryDelayDays}</div>
              </div>
              <div class="text-2xl">⏱️</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalyticsTab = () => {
    if (!kpis.value) return null;

    return (
      <div class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipe Diameter Usage Analysis */}
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <EChart
              option={{
                title: { text: 'Pipe Diameter Usage Distribution', left: 'center' },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                xAxis: { 
                  type: 'category', 
                  data: getTopPerformers(kpis.value.topItemsPipeDiaUsed, 8).map(item => item.key),
                  axisLabel: { rotate: 45, interval: 0 }
                },
                yAxis: { type: 'value', name: 'Usage Count' },
                series: [{
                  type: 'bar',
                  data: getTopPerformers(kpis.value.topItemsPipeDiaUsed, 8).map(item => item.value),
                  itemStyle: { color: '#06b6d4' }
                }]
              }}
            />
          </div>

          {/* Stock Composition */}
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <EChart
              option={{
                title: { text: 'Material Type Distribution', left: 'center' },
                tooltip: { trigger: 'item' },
                series: [{
                  type: 'pie',
                  radius: '70%',
                  data: [
                    { 
                      value: kpis.value.specialsVsRegularRatio * 100, 
                      name: 'Special Items', 
                      itemStyle: { color: '#f59e0b' } 
                    },
                    { 
                      value: 100 - (kpis.value.specialsVsRegularRatio * 100), 
                      name: 'Regular Items', 
                      itemStyle: { color: '#3b82f6' } 
                    }
                  ],
                  label: { formatter: '{b}\n{d}%' }
                }]
              }}
            />
          </div>
        </div>

        {/* Detailed Analytics Table */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">📊 Contractor Performance Analysis</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-3 px-4 font-medium">Contractor</th>
                  <th class="text-right py-3 px-4 font-medium">Items Handled</th>
                  <th class="text-right py-3 px-4 font-medium">Share</th>
                  <th class="text-center py-3 px-4 font-medium">Performance</th>
                  <th class="text-center py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {kpis.value.topContractors.slice(0, 8).map((contractor, index) => {
                  const marketShare = (contractor.value / kpis.value!.topContractors.reduce((sum, c) => sum + c.value, 0)) * 100;
                  const performance = marketShare > 20 ? 'High' : marketShare > 10 ? 'Medium' : 'Low';
                  return (
                    <tr key={index} class="border-b hover:bg-gray-50">
                      <td class="py-3 px-4 font-medium">{contractor.key}</td>
                      <td class="py-3 px-4 text-right">{contractor.value.toLocaleString()}</td>
                      <td class="py-3 px-4 text-right">{marketShare.toFixed(1)}%</td>
                      <td class="py-3 px-4 text-center">
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            class="bg-primary-500 h-2 rounded-full" 
                            style={`width: ${Math.min(marketShare * 5, 100)}%`}
                          ></div>
                        </div>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                          performance === 'High' ? 'bg-green-100 text-green-800' :
                          performance === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {performance}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderInventoryTab = () => {
    if (!kpis.value) return null;
    const health = getStockHealth(kpis.value);

    return (
      <div class="space-y-6">
        {/* Inventory Health Metrics */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Stock Aging</div>
            <div class="text-2xl font-bold text-orange-600">{kpis.value.stockAgingDays} days</div>
          </div>
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Defective Rate</div>
            <div class="text-2xl font-bold text-red-600">{kpis.value.defectiveMaterialPct.toFixed(1)}%</div>
          </div>
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Specials Ratio</div>
            <div class="text-2xl font-bold text-purple-600">{kpis.value.specialsVsRegularRatio.toFixed(2)}</div>
          </div>
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Data Entry Delay</div>
            <div class="text-2xl font-bold text-yellow-600">{kpis.value.avgDataEntryDelayDays} days</div>
          </div>
        </div>

        {/* Inventory Analysis */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">📦 Inventory Health Analysis</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium mb-2">Stock Movement Efficiency</h4>
              <div class="space-y-3">
                <div class="bg-green-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-green-900">Turnover Rate</div>
                  <div class="text-sm text-green-700">
                    {health.turnoverRate.toFixed(2)}x - {health.turnoverRate > 2 ? 'Excellent' : health.turnoverRate > 1 ? 'Good' : 'Needs Improvement'}
                  </div>
                </div>
                <div class="bg-primary-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-primary-900">Stock Utilization</div>
                  <div class="text-sm text-primary-700">
                    {health.stockUtilization.toFixed(1)}% - {health.stockUtilization > 80 ? 'Optimal' : health.stockUtilization > 60 ? 'Good' : 'Low'}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 class="font-medium mb-2">Quality & Compliance</h4>
              <div class="space-y-3">
                <div class="bg-red-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-red-900">Defect Rate</div>
                  <div class="text-sm text-red-700">
                    {kpis.value.defectiveMaterialPct.toFixed(1)}% - {kpis.value.defectiveMaterialPct < 5 ? 'Excellent' : kpis.value.defectiveMaterialPct < 10 ? 'Acceptable' : 'High'}
                  </div>
                </div>
                <div class="bg-green-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-green-900">Documentation</div>
                  <div class="text-sm text-green-700">
                    {kpis.value.documentationCompliancePct.toFixed(1)}% - {kpis.value.documentationCompliancePct > 95 ? 'Excellent' : kpis.value.documentationCompliancePct > 85 ? 'Good' : 'Needs Improvement'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Items Analysis */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">🔧 Most Used Items/Pipe Diameters</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.value.topItemsPipeDiaUsed.slice(0, 9).map((item, index) => (
              <div key={index} class="border rounded-lg p-3">
                <div class="font-medium text-sm truncate">{item.key}</div>
                <div class="text-lg font-bold text-primary-600">{item.value}</div>
                <div class="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div 
                    class="bg-primary-500 h-1 rounded-full" 
                    style={`width: ${(item.value / Math.max(...kpis.value!.topItemsPipeDiaUsed.map(i => i.value))) * 100}%`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="mx-auto">
        {/* Header */}
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">📦 Stock Management Dashboard</h1>
          <p class="text-gray-600">Comprehensive inventory analytics and performance insights</p>
        </div>

        {loading.value && (
          <div class="flex items-center justify-center p-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <span class="ml-4 text-lg">Loading dashboard...</span>
          </div>
        )}

        {error.value && (
          <div class="bg-red-50 border border-red-200 rounded-lg p-6">
            <div class="text-red-800 font-medium">⚠️ Error loading dashboard</div>
            <div class="text-red-600 text-sm mt-1">{error.value}</div>
          </div>
        )}

        {kpis.value && (
          <>
            {/* Tab Navigation */}
            <div class="bg-white rounded-lg border border-gray-200 mb-6">
              <div class="flex space-x-1 p-1">
                <button
                  onClick$={() => selectedTab.value = 'overview'}
                  class={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                    selectedTab.value === 'overview' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📊 Overview
                </button>
                <button
                  onClick$={() => selectedTab.value = 'analytics'}
                  class={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                    selectedTab.value === 'analytics' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🔍 Analytics
                </button>
                <button
                  onClick$={() => selectedTab.value = 'inventory'}
                  class={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                    selectedTab.value === 'inventory' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📦 Inventory
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {selectedTab.value === 'overview' && renderOverviewTab()}
            {selectedTab.value === 'analytics' && renderAnalyticsTab()}
            {selectedTab.value === 'inventory' && renderInventoryTab()}
          </>
        )}
      </div>
    </div>
  );
});