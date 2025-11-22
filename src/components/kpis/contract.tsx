import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { EChart } from '~/components/echarts';

// Types
type ContractorKpiEntry = { key: string; value: number };
type ContractorKpis = {
  totalMetersCompleted: number;
  totalDieselTaken: number;
  dieselPerMeter: number;
  averageMetersPerDay: number;
  reportsWithPhotosPct: number;
  vehicleUtilization: ContractorKpiEntry[];
  averageWorkingHours: number;
  cardNumberDieselDrawn: ContractorKpiEntry[];
  geoLocations: [number, number][];
  reportsByDateSite: ContractorKpiEntry[];
};

export const ContractKpi = component$(() => {
  const contractorKpis = useSignal<ContractorKpis | null>(null);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const selectedTab = useSignal('overview');

  useVisibleTask$(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://ugcl-429789556411.asia-south1.run.app/api/v1';
      const res = await fetch(`${baseUrl}/kpi/contractor`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch KPIs: ${res.status} ${res.statusText}`);
      const data = await res.json();
      contractorKpis.value = data;
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      contractorKpis.value = null;
    } finally {
      loading.value = false;
    }
  });

  // Helper functions for calculations
  const getEfficiencyMetrics = (data: ContractorKpis) => {
    const fuelEfficiency = data.dieselPerMeter;
    const productivityRate = data.averageMetersPerDay;
    const complianceRate = data.reportsWithPhotosPct;
    const workEfficiency = data.averageWorkingHours;
    const totalVehicles = data.vehicleUtilization.length;
    
    return { fuelEfficiency, productivityRate, complianceRate, workEfficiency, totalVehicles };
  };

  const getTopPerformers = (data: ContractorKpiEntry[], count = 5) => {
    return [...data].sort((a, b) => b.value - a.value).slice(0, count);
  };

  const getPerformanceStatus = (data: ContractorKpis) => {
    const metrics = getEfficiencyMetrics(data);
    if (metrics.complianceRate > 90 && metrics.productivityRate > 50 && metrics.fuelEfficiency < 2) return 'excellent';
    if (metrics.complianceRate > 75 && metrics.productivityRate > 30 && metrics.fuelEfficiency < 3) return 'good';
    if (metrics.complianceRate > 60 && metrics.productivityRate > 20 && metrics.fuelEfficiency < 4) return 'average';
    return 'needs-attention';
  };

  const getProjectProgress = (data: ContractorKpis) => {
    const dailyProgress = data.averageMetersPerDay;
    const efficiency = data.dieselPerMeter;
    
    if (dailyProgress > 40 && efficiency < 2.5) return { status: 'on-track', color: 'green' };
    if (dailyProgress > 25 && efficiency < 3.5) return { status: 'moderate', color: 'yellow' };
    return { status: 'behind', color: 'red' };
  };

  const renderOverviewTab = () => {
    if (!contractorKpis.value) return null;
    const metrics = getEfficiencyMetrics(contractorKpis.value);
    const status = getPerformanceStatus(contractorKpis.value);
    const progress = getProjectProgress(contractorKpis.value);
    const topVehicles = getTopPerformers(contractorKpis.value.vehicleUtilization, 3);

    return (
      <div class="space-y-8">
        {/* Executive Summary Cards */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-blue-100 text-sm font-medium">Work Completed</p>
                <p class="text-3xl font-bold">{(contractorKpis.value.totalMetersCompleted / 1000).toFixed(1)}K</p>
                <p class="text-blue-100 text-sm">Meters</p>
              </div>
              <div class="bg-blue-400 bg-opacity-30 rounded-full p-3">
                📏
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-100 text-sm font-medium">Fuel Consumed</p>
                <p class="text-3xl font-bold">{(contractorKpis.value.totalDieselTaken / 1000).toFixed(1)}K</p>
                <p class="text-green-100 text-sm">Liters</p>
              </div>
              <div class="bg-green-400 bg-opacity-30 rounded-full p-3">
                ⛽
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-purple-100 text-sm font-medium">Daily Progress</p>
                <p class="text-3xl font-bold">{contractorKpis.value.averageMetersPerDay.toFixed(0)}</p>
                <p class="text-purple-100 text-sm">Meters/Day</p>
              </div>
              <div class="bg-purple-400 bg-opacity-30 rounded-full p-3">
                📈
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-orange-100 text-sm font-medium">Fuel Efficiency</p>
                <p class="text-3xl font-bold">{contractorKpis.value.dieselPerMeter.toFixed(1)}</p>
                <p class="text-orange-100 text-sm">L/Meter</p>
              </div>
              <div class="bg-orange-400 bg-opacity-30 rounded-full p-3">
                ⚡
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">🎯 Performance Insights</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class={`rounded-lg p-4 ${
              status === 'excellent' ? 'bg-green-50' :
              status === 'good' ? 'bg-blue-50' :
              status === 'average' ? 'bg-yellow-50' : 'bg-red-50'
            }`}>
              <h4 class={`font-medium ${
                status === 'excellent' ? 'text-green-900' :
                status === 'good' ? 'text-blue-900' :
                status === 'average' ? 'text-yellow-900' : 'text-red-900'
              }`}>Overall Performance</h4>
              <p class={`text-sm mt-1 ${
                status === 'excellent' ? 'text-green-700' :
                status === 'good' ? 'text-blue-700' :
                status === 'average' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                Contractor performance is <span class="font-semibold">{status.replace('-', ' ')}</span>
              </p>
            </div>
            <div class={`rounded-lg p-4 ${
              progress.color === 'green' ? 'bg-green-50' :
              progress.color === 'yellow' ? 'bg-yellow-50' : 'bg-red-50'
            }`}>
              <h4 class={`font-medium ${
                progress.color === 'green' ? 'text-green-900' :
                progress.color === 'yellow' ? 'text-yellow-900' : 'text-red-900'
              }`}>Project Progress</h4>
              <p class={`text-sm mt-1 ${
                progress.color === 'green' ? 'text-green-700' :
                progress.color === 'yellow' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                Work is <span class="font-semibold">{progress.status.replace('-', ' ')}</span>
              </p>
            </div>
            <div class="bg-purple-50 rounded-lg p-4">
              <h4 class="font-medium text-purple-900">Top Vehicle</h4>
              <p class="text-sm text-purple-700 mt-1">
                <span class="font-semibold">{topVehicles[0]?.key || 'N/A'}</span> leads utilization
              </p>
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <EChart
              option={{
                title: { text: 'Daily Progress Trend', left: 'center', textStyle: { fontSize: 16, fontWeight: 'bold' } },
                tooltip: { trigger: 'axis' },
                xAxis: { 
                  type: 'category', 
                  data: (contractorKpis.value.reportsByDateSite || []).slice(-14).map((report, index) => 
                    new Date(Date.now() - (13 - index) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  )
                },
                yAxis: { type: 'value', name: 'Reports' },
                series: [{ 
                  type: 'line', 
                  data: (contractorKpis.value.reportsByDateSite || []).slice(-14).map(report => report.value),
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
                title: { text: 'Vehicle Utilization', left: 'center', textStyle: { fontSize: 16, fontWeight: 'bold' } },
                tooltip: { trigger: 'item', formatter: '{b}: {c} hours ({d}%)' },
                series: [{
                  type: 'pie',
                  radius: ['40%', '70%'],
                  data: getTopPerformers(contractorKpis.value.vehicleUtilization, 6).map((vehicle, index) => ({
                    value: vehicle.value,
                    name: vehicle.key,
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

        {/* Performance Metrics */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-500">Photo Compliance</div>
                <div class="text-2xl font-bold text-green-600">{contractorKpis.value.reportsWithPhotosPct.toFixed(1)}%</div>
              </div>
              <div class="text-2xl">📸</div>
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-500">Working Hours</div>
                <div class="text-2xl font-bold text-blue-600">{contractorKpis.value.averageWorkingHours.toFixed(1)}h</div>
              </div>
              <div class="text-2xl">⏰</div>
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-500">Active Vehicles</div>
                <div class="text-2xl font-bold text-purple-600">{metrics.totalVehicles}</div>
              </div>
              <div class="text-2xl">🚛</div>
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-500">Work Locations</div>
                <div class="text-2xl font-bold text-orange-600">{contractorKpis.value.geoLocations.length}</div>
              </div>
              <div class="text-2xl">📍</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalyticsTab = () => {
    if (!contractorKpis.value) return null;

    return (
      <div class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fuel Card Analysis */}
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <EChart
              option={{
                title: { text: 'Fuel Card Usage Distribution', left: 'center' },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                xAxis: { 
                  type: 'category', 
                  data: getTopPerformers(contractorKpis.value.cardNumberDieselDrawn, 8).map(card => 
                    card.key.length > 12 ? card.key.substring(0, 12) + '...' : card.key
                  ),
                  axisLabel: { rotate: 45, interval: 0 }
                },
                yAxis: { type: 'value', name: 'Liters' },
                series: [{
                  type: 'bar',
                  data: getTopPerformers(contractorKpis.value.cardNumberDieselDrawn, 8).map(card => card.value),
                  itemStyle: { color: '#f59e0b' }
                }]
              }}
            />
          </div>

          {/* Work Site Reports */}
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <EChart
              option={{
                title: { text: 'Site Activity Over Time', left: 'center' },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                xAxis: { 
                  type: 'category', 
                  data: contractorKpis.value.reportsByDateSite.map(report => 
                    report.key.length > 10 ? report.key.substring(0, 10) + '...' : report.key
                  ),
                  axisLabel: { rotate: 45, interval: 0 }
                },
                yAxis: { type: 'value', name: 'Reports' },
                series: [{
                  type: 'bar',
                  data: contractorKpis.value.reportsByDateSite.map(report => report.value),
                  itemStyle: { color: '#8b5cf6' }
                }]
              }}
            />
          </div>
        </div>

        {/* Detailed Fuel Card Table */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">⛽ Fuel Card Usage Analysis</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-3 px-4 font-medium">Card Number</th>
                  <th class="text-right py-3 px-4 font-medium">Fuel Drawn (L)</th>
                  <th class="text-right py-3 px-4 font-medium">% of Total</th>
                  <th class="text-center py-3 px-4 font-medium">Usage Level</th>
                  <th class="text-center py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {getTopPerformers(contractorKpis.value.cardNumberDieselDrawn, 10).map((card, index) => {
                  const percentage = (card.value / contractorKpis.value!.totalDieselTaken) * 100;
                  const usageLevel = percentage > 20 ? 'High' : percentage > 10 ? 'Medium' : 'Low';
                  return (
                    <tr key={index} class="border-b hover:bg-gray-50">
                      <td class="py-3 px-4 font-mono text-sm">{card.key}</td>
                      <td class="py-3 px-4 text-right">{card.value.toLocaleString()}</td>
                      <td class="py-3 px-4 text-right">{percentage.toFixed(1)}%</td>
                      <td class="py-3 px-4 text-center">
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            class="bg-orange-500 h-2 rounded-full" 
                            style={`width: ${Math.min(percentage * 3, 100)}%`}
                          ></div>
                        </div>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                          usageLevel === 'High' ? 'bg-red-100 text-red-800' :
                          usageLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {usageLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Performance Grid */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">🚛 Vehicle Performance Analysis</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contractorKpis.value.vehicleUtilization.map((vehicle, index) => (
              <div key={index} class="border rounded-lg p-3">
                <div class="font-medium text-sm truncate">{vehicle.key}</div>
                <div class="text-lg font-bold text-blue-600">{vehicle.value.toFixed(1)}h</div>
                <div class="text-xs text-gray-500">
                  {((vehicle.value / Math.max(...contractorKpis.value!.vehicleUtilization.map(v => v.value))) * 100).toFixed(0)}% utilization
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div 
                    class="bg-blue-500 h-1 rounded-full" 
                    style={`width: ${(vehicle.value / Math.max(...contractorKpis.value!.vehicleUtilization.map(v => v.value))) * 100}%`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMapTab = () => {
    if (!contractorKpis.value) return null;

    const totalLocations = contractorKpis.value.geoLocations.length;
    const uniqueLocations = new Set(contractorKpis.value.geoLocations.map(coords => `${coords[0].toFixed(4)},${coords[1].toFixed(4)}`)).size;

    return (
      <div class="space-y-6">
        {/* Location Statistics */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Work Locations</div>
            <div class="text-2xl font-bold text-blue-600">{totalLocations}</div>
          </div>
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Unique Sites</div>
            <div class="text-2xl font-bold text-green-600">{uniqueLocations}</div>
          </div>
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Coverage Efficiency</div>
            <div class="text-2xl font-bold text-purple-600">{uniqueLocations > 0 ? ((uniqueLocations / totalLocations) * 100).toFixed(1) : '0'}%</div>
          </div>
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Avg Work/Site</div>
            <div class="text-2xl font-bold text-orange-600">{uniqueLocations > 0 ? (contractorKpis.value.totalMetersCompleted / uniqueLocations).toFixed(0) : '0'}m</div>
          </div>
        </div>

        {/* Interactive Map */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">🗺️ Contractor Work Locations</h3>
          <div class="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src={`data:text/html;charset=utf-8,${encodeURIComponent(`
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Contractor Work Locations</title>
                  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                  <style>
                    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
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
                    <strong>🚧 ${totalLocations} Work Points</strong><br>
                    <span style="color: #666;">📍 ${uniqueLocations} Unique Sites</span><br>
                    <span style="color: #666;">📏 ${contractorKpis.value.totalMetersCompleted.toLocaleString()}m Completed</span>
                  </div>
                  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                  <script>
                    const map = L.map('map').setView([20.5937, 78.9629], 5);
                    
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                      attribution: '© OpenStreetMap contributors',
                      maxZoom: 19
                    }).addTo(map);
                    
                    const locations = ${JSON.stringify(contractorKpis.value.geoLocations || [])};
                    
                    // Create work site markers
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
                          
                          // Different marker sizes based on work intensity
                          const radius = Math.min(6 + (count * 2), 18);
                          const color = count > 5 ? '#ef4444' : count > 2 ? '#f59e0b' : '#3b82f6';
                          
                          const marker = L.circleMarker([lat, lng], {
                            radius: radius,
                            fillColor: color,
                            color: 'white',
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.8
                          }).addTo(map);
                          
                          marker.bindPopup(\`
                            <div style="text-align: center;">
                              <strong>🚧 Work Site</strong><br>
                              <span style="color: #666;">Lat: \${lat.toFixed(6)}</span><br>
                              <span style="color: #666;">Lng: \${lng.toFixed(6)}</span><br>
                              <strong style="color: \${color};">\${count} work sessions</strong>
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
                        <strong>Work Intensity</strong><br>
                        <span style="color: #3b82f6;">●</span> Light activity<br>
                        <span style="color: #f59e0b;">●</span> Moderate activity<br>
                        <span style="color: #ef4444;">●</span> High activity
                      \`;
                      return div;
                    };
                    legend.addTo(map);
                  </script>
                </body>
                </html>
              `)}`}
              class="w-full h-full border-0"
              title="Contractor Work Locations Map"
            />
          </div>
        </div>

        {/* Work Site Analysis */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">📊 Work Site Analysis</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium mb-2">Site Activity Distribution</h4>
              <div class="space-y-2">
                {contractorKpis.value.reportsByDateSite.slice(0, 5).map((site, index) => (
                  <div key={index} class="flex justify-between items-center">
                    <span class="text-sm truncate">{site.key}</span>
                    <div class="flex items-center space-x-2">
                      <div class="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          class="bg-purple-500 h-2 rounded-full" 
                          style={`width: ${(site.value / Math.max(...contractorKpis.value!.reportsByDateSite.map(s => s.value))) * 100}%`}
                        ></div>
                      </div>
                      <span class="text-sm font-medium w-8">{site.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 class="font-medium mb-2">Key Performance Insights</h4>
              <div class="space-y-3">
                <div class="bg-blue-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-blue-900">Work Efficiency</div>
                  <div class="text-sm text-blue-700">
                    {contractorKpis.value.dieselPerMeter.toFixed(2)} L/meter - {contractorKpis.value.dieselPerMeter < 2.5 ? 'Excellent' : contractorKpis.value.dieselPerMeter < 3.5 ? 'Good' : 'Needs Improvement'}
                  </div>
                </div>
                <div class="bg-green-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-green-900">Daily Productivity</div>
                  <div class="text-sm text-green-700">
                    {contractorKpis.value.averageMetersPerDay.toFixed(1)} meters/day - {contractorKpis.value.averageMetersPerDay > 40 ? 'Excellent' : contractorKpis.value.averageMetersPerDay > 25 ? 'Good' : 'Below Target'}
                  </div>
                </div>
                <div class="bg-orange-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-orange-900">Documentation Quality</div>
                  <div class="text-sm text-orange-700">
                    {contractorKpis.value.reportsWithPhotosPct.toFixed(1)}% compliance - {contractorKpis.value.reportsWithPhotosPct > 90 ? 'Excellent' : contractorKpis.value.reportsWithPhotosPct > 75 ? 'Good' : 'Needs Improvement'}
                  </div>
                </div>
                <div class="bg-purple-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-purple-900">Site Coverage</div>
                  <div class="text-sm text-purple-700">
                    {uniqueLocations > 0 ? ((uniqueLocations / totalLocations) * 100).toFixed(1) : '0'}% location diversity - {uniqueLocations > totalLocations * 0.7 ? 'Excellent spread' : 'Concentrated work'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Site Performance Summary */}
          <div class="mt-6 pt-6 border-t">
            <h4 class="font-medium mb-3">📈 Site Performance Summary</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center p-3 bg-gray-50 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">{contractorKpis.value.reportsByDateSite.length}</div>
                <div class="text-sm text-gray-600">Active Sites</div>
              </div>
              <div class="text-center p-3 bg-gray-50 rounded-lg">
                <div class="text-2xl font-bold text-green-600">{contractorKpis.value.reportsByDateSite.reduce((sum, site) => sum + site.value, 0)}</div>
                <div class="text-sm text-gray-600">Total Reports</div>
              </div>
              <div class="text-center p-3 bg-gray-50 rounded-lg">
                <div class="text-2xl font-bold text-purple-600">{contractorKpis.value.reportsByDateSite.length > 0 ? (contractorKpis.value.reportsByDateSite.reduce((sum, site) => sum + site.value, 0) / contractorKpis.value.reportsByDateSite.length).toFixed(1) : '0'}</div>
                <div class="text-sm text-gray-600">Avg Reports/Site</div>
              </div>
            </div>
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
          <h1 class="text-3xl font-bold text-gray-900 mb-2">🚧 Contractor Performance Dashboard</h1>
          <p class="text-gray-600">Comprehensive contractor analytics and operational insights</p>
        </div>

        {loading.value && (
          <div class="flex items-center justify-center p-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span class="ml-4 text-lg">Loading dashboard...</span>
          </div>
        )}

        {error.value && (
          <div class="bg-red-50 border border-red-200 rounded-lg p-6">
            <div class="text-red-800 font-medium">⚠️ Error loading dashboard</div>
            <div class="text-red-600 text-sm mt-1">{error.value}</div>
          </div>
        )}

        {contractorKpis.value && (
          <>
            {/* Tab Navigation */}
            <div class="bg-white rounded-lg border border-gray-200 mb-6">
              <div class="flex space-x-1 p-1">
                <button
                  onClick$={() => selectedTab.value = 'overview'}
                  class={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                    selectedTab.value === 'overview' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📊 Overview
                </button>
                <button
                  onClick$={() => selectedTab.value = 'analytics'}
                  class={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                    selectedTab.value === 'analytics' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🔍 Analytics
                </button>
                <button
                  onClick$={() => selectedTab.value = 'map'}
                  class={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                    selectedTab.value === 'map' 
                      ? 'bg-blue-100 text-blue-700' 
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