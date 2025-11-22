import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { EChart } from '~/components/echarts';

type KpiEntry = { key: string; value: number };
type DieselKpis = {
  totalDieselConsumed: number;
  totalAmountPaid: number;
  avgDieselPerLiter: number;
  entriesWithPhotosPct: number;
  dieselByContractor: KpiEntry[];
  dieselByVehicle: KpiEntry[];
  cardNumberUsage: { key: string; value: number; extra: number }[];
  geoPoints: [number, number][];
  entriesWithRemarks: number;
  entriesPerSite: KpiEntry[];
  entriesPerDate: KpiEntry[];
  totalEntries: number;
};

export const DieselKpi = component$(() => {
  const kpis = useSignal<DieselKpis | null>(null);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const selectedTab = useSignal('overview');

  useVisibleTask$(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://ugcl-429789556411.asia-south1.run.app/api/v1';
      const res = await fetch(`${baseUrl}/kpi/diesel`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch KPIs: ${res.status} ${res.statusText}`);
      const raw = await res.json();
      kpis.value = raw;
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      kpis.value = null;
    } finally {
      loading.value = false;
    }
  });

  // Helper functions for calculations
  const getEfficiencyMetrics = (data: DieselKpis) => {
    const avgCostPerEntry = data.totalAmountPaid / data.totalEntries;
    const avgDieselPerEntry = data.totalDieselConsumed / data.totalEntries;
    const photoComplianceRate = data.entriesWithPhotosPct;
    const remarksRate = (data.entriesWithRemarks / data.totalEntries) * 100;
    
    return { avgCostPerEntry, avgDieselPerEntry, photoComplianceRate, remarksRate };
  };

  const getTopPerformers = (data: KpiEntry[], count = 5) => {
    return [...data].sort((a, b) => b.value - a.value).slice(0, count);
  };

  const getRecentTrend = (entries: KpiEntry[]) => {
    if (entries.length < 7) return 'stable';
    const recent = entries.slice(-7);
    const older = entries.slice(-14, -7);
    const recentAvg = recent.reduce((sum, entry) => sum + entry.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry.value, 0) / older.length;
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    return change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable';
  };

  const renderOverviewTab = () => {
    if (!kpis.value) return null;
    const metrics = getEfficiencyMetrics(kpis.value);
    const topContractors = getTopPerformers(kpis.value.dieselByContractor, 3);
    const trend = getRecentTrend(kpis.value.entriesPerDate);

    return (
      <div class="">
        {/* Executive Summary Cards */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-primary-100 text-sm font-medium">Total Consumption</p>
                <p class="text-3xl font-bold">{(kpis.value.totalDieselConsumed / 1000).toFixed(1)}K</p>
                <p class="text-primary-100 text-sm">Liters</p>
              </div>
              <div class="bg-primary-400 bg-opacity-30 rounded-full p-3">
                ⛽
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-100 text-sm font-medium">Total Spend</p>
                <p class="text-3xl font-bold">₹{(kpis.value.totalAmountPaid / 100000).toFixed(1)}L</p>
                <p class="text-green-100 text-sm">Cost</p>
              </div>
              <div class="bg-green-400 bg-opacity-30 rounded-full p-3">
                💰
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-purple-100 text-sm font-medium">Avg Cost/Liter</p>
                <p class="text-3xl font-bold">₹{kpis.value.avgDieselPerLiter.toFixed(0)}</p>
                <p class="text-purple-100 text-sm">Per Liter</p>
              </div>
              <div class="bg-purple-400 bg-opacity-30 rounded-full p-3">
                📊
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-orange-100 text-sm font-medium">Efficiency Score</p>
                <p class="text-3xl font-bold">{Math.round(metrics.photoComplianceRate)}</p>
                <p class="text-orange-100 text-sm">% Compliant</p>
              </div>
              <div class="bg-orange-400 bg-opacity-30 rounded-full p-3">
                ✅
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">📈 Key Insights</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-primary-50 rounded-lg p-4">
              <h4 class="font-medium text-primary-900">Usage Trend</h4>
              <p class="text-sm text-primary-700 mt-1">
                Recent activity is <span class="font-semibold">{trend}</span> compared to previous period
              </p>
            </div>
            <div class="bg-green-50 rounded-lg p-4">
              <h4 class="font-medium text-green-900">Top Contributor</h4>
              <p class="text-sm text-green-700 mt-1">
                <span class="font-semibold">{topContractors[0]?.key}</span> accounts for {((topContractors[0]?.value / kpis.value.totalDieselConsumed) * 100).toFixed(1)}% of consumption
              </p>
            </div>
            <div class="bg-purple-50 rounded-lg p-4">
              <h4 class="font-medium text-purple-900">Compliance Rate</h4>
              <p class="text-sm text-purple-700 mt-1">
                <span class="font-semibold">{metrics.photoComplianceRate}%</span> entries have photo documentation
              </p>
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <EChart
              option={{
                title: { text: 'Daily Usage Trend', left: 'center', textStyle: { fontSize: 16, fontWeight: 'bold' } },
                tooltip: { trigger: 'axis' },
                xAxis: { 
                  type: 'category', 
                  data: kpis.value.entriesPerDate.slice(-14).map(d => new Date(d.key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
                },
                yAxis: { type: 'value', name: 'Entries' },
                series: [{ 
                  type: 'line', 
                  data: kpis.value.entriesPerDate.slice(-14).map(d => d.value),
                  smooth: true,
                  areaStyle: { color: 'rgba(59, 130, 246, 0.1)' },
                  lineStyle: { color: '#3b82f6', width: 3 },
                  itemStyle: { color: '#3b82f6' }
                }]
              }}
            />
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <EChart
              option={{
                title: { text: 'Top Contractors', left: 'center', textStyle: { fontSize: 16, fontWeight: 'bold' } },
                tooltip: { trigger: 'item', formatter: '{b}: {c}L ({d}%)' },
                series: [{
                  type: 'pie',
                  radius: ['40%', '70%'],
                  data: getTopPerformers(kpis.value.dieselByContractor, 6).map((c, index) => ({
                    value: c.value,
                    name: c.key,
                    itemStyle: { 
                      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index] 
                    }
                  })),
                  label: { formatter: '{b}\n{d}%', fontSize: 11 }
                }]
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderMapTab = () => {
    if (!kpis.value) return null;

    // Calculate location statistics
    const totalLocations = kpis.value.geoPoints.length;
    const uniqueLocations = new Set(kpis.value.geoPoints.map(coords => `${coords[0].toFixed(4)},${coords[1].toFixed(4)}`)).size;

    return (
      <div class="space-y-6">
        {/* Location Statistics */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Total Entries</div>
            <div class="text-2xl font-bold text-primary-600">{totalLocations}</div>
          </div>
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Unique Locations</div>
            <div class="text-2xl font-bold text-green-600">{uniqueLocations}</div>
          </div>
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Coverage Area</div>
            <div class="text-2xl font-bold text-purple-600">Bangalore</div>
          </div>
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Avg Entries/Location</div>
            <div class="text-2xl font-bold text-orange-600">{(totalLocations / uniqueLocations).toFixed(1)}</div>
          </div>
        </div>

        {/* Interactive Map */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">🗺️ Diesel Entry Locations</h3>
          <div class="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src={`data:text/html;charset=utf-8,${encodeURIComponent(`
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Diesel Entry Locations</title>
                  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                  <style>
                    body { margin: 0; padding: 0; }
                    #map { height: 100vh; width: 100%; }
                    .info-panel { 
                      position: absolute; 
                      top: 10px; 
                      right: 10px; 
                      background: white; 
                      padding: 10px; 
                      border-radius: 5px; 
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                      z-index: 1000;
                      font-size: 12px;
                    }
                  </style>
                </head>
                <body>
                  <div id="map"></div>
                  <div class="info-panel">
                    <strong>📍 ${totalLocations} Total Entries</strong><br>
                    <span style="color: #666;">🎯 ${uniqueLocations} Unique Locations</span>
                  </div>
                  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                  <script>
                    const map = L.map('map').setView([12.84, 77.40], 10);
                    
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                      attribution: '© OpenStreetMap contributors',
                      maxZoom: 19
                    }).addTo(map);
                    
                    const locations = ${JSON.stringify(kpis.value.geoPoints || [])};
                    
                    // Create a heat map effect by grouping nearby locations
                    const locationCounts = {};
                    locations.forEach((coords) => {
                      if (coords && coords.length >= 2) {
                        const key = Math.floor(coords[0] * 1000) + ',' + Math.floor(coords[1] * 1000);
                        locationCounts[key] = (locationCounts[key] || 0) + 1;
                      }
                    });
                    
                    let bounds = [];
                    const addedLocations = new Set();
                    
                    locations.forEach((coords, index) => {
                      if (coords && coords.length >= 2) {
                        const lat = coords[0];
                        const lng = coords[1];
                        const key = Math.floor(lat * 1000) + ',' + Math.floor(lng * 1000);
                        
                        if (!addedLocations.has(key)) {
                          addedLocations.add(key);
                          const count = locationCounts[key];
                          
                          // Different marker sizes based on frequency
                          const radius = Math.min(5 + (count * 2), 15);
                          const color = count > 10 ? '#ef4444' : count > 5 ? '#f59e0b' : '#3b82f6';
                          
                          const marker = L.circleMarker([lat, lng], {
                            radius: radius,
                            fillColor: color,
                            color: 'white',
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.7
                          }).addTo(map);
                          
                          marker.bindPopup(\`
                            <div style="text-align: center;">
                              <strong>📍 Entry Point</strong><br>
                              <span style="color: #666;">Lat: \${lat.toFixed(6)}</span><br>
                              <span style="color: #666;">Lng: \${lng.toFixed(6)}</span><br>
                              <strong style="color: \${color};">\${count} entries</strong>
                            </div>
                          \`);
                          
                          bounds.push([lat, lng]);
                        }
                      }
                    });
                    
                    if (bounds.length > 0) {
                      map.fitBounds(bounds, { padding: [20, 20] });
                    }
                    
                    // Add a legend
                    const legend = L.control({position: 'bottomleft'});
                    legend.onAdd = function (map) {
                      const div = L.DomUtil.create('div', 'info legend');
                      div.style.background = 'white';
                      div.style.padding = '10px';
                      div.style.borderRadius = '5px';
                      div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                      div.innerHTML = \`
                        <strong>Entry Frequency</strong><br>
                        <span style="color: #3b82f6;">●</span> 1-5 entries<br>
                        <span style="color: #f59e0b;">●</span> 6-10 entries<br>
                        <span style="color: #ef4444;">●</span> 10+ entries
                      \`;
                      return div;
                    };
                    legend.addTo(map);
                  </script>
                </body>
                </html>
              `)}`}
              class="w-full h-full border-0"
              title="Diesel Entry Locations Map"
            />
          </div>
        </div>

        {/* Location Insights */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">📊 Location Analysis</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium mb-2">Geographic Distribution</h4>
              <div class="space-y-2">
                {kpis.value.entriesPerSite.map((site, index) => (
                  <div key={index} class="flex justify-between items-center">
                    <span class="text-sm">{site.key}</span>
                    <div class="flex items-center space-x-2">
                      <div class="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          class="bg-primary-500 h-2 rounded-full" 
                          style={`width: ${(site.value / Math.max(...kpis.value!.entriesPerSite.map(s => s.value))) * 100}%`}
                        ></div>
                      </div>
                      <span class="text-sm font-medium w-8">{site.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 class="font-medium mb-2">Key Insights</h4>
              <div class="space-y-3">
                <div class="bg-primary-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-primary-900">Coverage Efficiency</div>
                  <div class="text-sm text-primary-700">
                    {((uniqueLocations / totalLocations) * 100).toFixed(1)}% location diversity
                  </div>
                </div>
                <div class="bg-green-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-green-900">Primary Region</div>
                  <div class="text-sm text-green-700">
                    Most activity in {kpis.value.entriesPerSite[0]?.key} area
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add the missing renderAnalyticsTab function
  const renderAnalyticsTab = () => {
    if (!kpis.value) return null;

    return (
      <div class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Type Analysis */}
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <EChart
              option={{
                title: { text: 'Vehicle Type Distribution', left: 'center' },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                xAxis: { 
                  type: 'category', 
                  data: getTopPerformers(kpis.value.dieselByVehicle, 8).map(v => v.key.length > 15 ? v.key.substring(0, 15) + '...' : v.key),
                  axisLabel: { rotate: 45 }
                },
                yAxis: { type: 'value', name: 'Liters' },
                series: [{
                  type: 'bar',
                  data: getTopPerformers(kpis.value.dieselByVehicle, 8).map(v => v.value),
                  itemStyle: { color: '#10b981' }
                }]
              }}
            />
          </div>

          {/* Site Performance */}
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <EChart
              option={{
                title: { text: 'Site Performance', left: 'center' },
                tooltip: { trigger: 'item' },
                series: [{
                  type: 'pie',
                  radius: '70%',
                  data: kpis.value.entriesPerSite.map((site, index) => ({
                    value: site.value,
                    name: site.key,
                    itemStyle: { color: ['#3b82f6', '#10b981'][index] }
                  })),
                  label: { formatter: '{b}\n{c} entries' }
                }]
              }}
            />
          </div>
        </div>

        {/* Card Usage Analysis */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">💳 Fuel Card Usage Analysis</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-3 px-4 font-medium">Card Number</th>
                  <th class="text-right py-3 px-4 font-medium">Diesel (L)</th>
                  <th class="text-right py-3 px-4 font-medium">Amount (₹)</th>
                  <th class="text-right py-3 px-4 font-medium">Avg Cost/L</th>
                  <th class="text-center py-3 px-4 font-medium">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {kpis.value.cardNumberUsage.slice(0, 8).map((card, index) => (
                  <tr key={index} class="border-b hover:bg-gray-50">
                    <td class="py-3 px-4 font-mono text-sm">{card.key}</td>
                    <td class="py-3 px-4 text-right">{card.value.toFixed(1)}</td>
                    <td class="py-3 px-4 text-right">₹{card.extra.toLocaleString()}</td>
                    <td class="py-3 px-4 text-right">₹{(card.extra / card.value).toFixed(1)}</td>
                    <td class="py-3 px-4 text-center">
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          class="bg-primary-500 h-2 rounded-full" 
                          style={`width: ${Math.min((card.value / Math.max(...kpis.value!.cardNumberUsage.map(c => c.value))) * 100, 100)}%`}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <h1 class="text-3xl font-bold text-gray-900 mb-2">🚛 Diesel Management Dashboard</h1>
          <p class="text-gray-600">Comprehensive fuel consumption analytics and insights</p>
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
                  onClick$={() => selectedTab.value = 'map'}
                  class={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                    selectedTab.value === 'map' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🗺️ Locations
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {selectedTab.value === 'overview' && renderOverviewTab()}
            {selectedTab.value === 'analytics' && renderAnalyticsTab()}
            {selectedTab.value === 'map' && renderMapTab()}
          </>
        )}
      </div>
    </div>
  );
});