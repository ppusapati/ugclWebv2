import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { EChart } from '~/components/echarts';

// Define types
type GeoPoint = { latitude: number; longitude: number };
type DairyKpi = {
  totalReports: number;
  reportsPerSite: Record<string, number>;
  reportsPerDay: Record<string, number>;
  reportsPerEngineer: Record<string, number>;
  uniqueSites: number;
  uniqueEngineers: number;
  geoPoints: GeoPoint[];
  reportingCompliancePct: number;
};

export const DairySiteKpi = component$(() => {
  const kpis = useSignal<DairyKpi | null>(null);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const selectedTab = useSignal('overview');

  useVisibleTask$(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://ugcl-429789556411.asia-south1.run.app/api/v1';
      const res = await fetch(`${baseUrl}/kpi/dairysite`, {
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
  const getReportingMetrics = (data: DairyKpi) => {
    const avgReportsPerSite = data.totalReports / data.uniqueSites;
    const avgReportsPerEngineer = data.totalReports / data.uniqueEngineers;
    const activeDays = Object.keys(data.reportsPerDay).length;
    const avgReportsPerDay = data.totalReports / activeDays;
    
    return { avgReportsPerSite, avgReportsPerEngineer, activeDays, avgReportsPerDay };
  };

  const getTopPerformers = (record: Record<string, number>, count = 5) => {
    return Object.entries(record)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([key, value]) => ({ key, value }));
  };

  const getReportingTrend = (reportsPerDay: Record<string, number>) => {
    const entries = Object.entries(reportsPerDay).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length < 7) return 'stable';
    
    const recent = entries.slice(-7);
    const older = entries.slice(-14, -7);
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, [, count]) => sum + count, 0) / recent.length;
    const olderAvg = older.reduce((sum, [, count]) => sum + count, 0) / older.length;
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    return change > 15 ? 'increasing' : change < -15 ? 'decreasing' : 'stable';
  };

  const getPerformanceStatus = (data: DairyKpi) => {
    const metrics = getReportingMetrics(data);
    if (data.reportingCompliancePct > 90 && metrics.avgReportsPerDay > 10) return 'excellent';
    if (data.reportingCompliancePct > 75 && metrics.avgReportsPerDay > 5) return 'good';
    if (data.reportingCompliancePct > 60 && metrics.avgReportsPerDay > 3) return 'average';
    return 'needs-attention';
  };

  const renderOverviewTab = () => {
    if (!kpis.value) return null;
    const metrics = getReportingMetrics(kpis.value);
    const topSites = getTopPerformers(kpis.value.reportsPerSite, 3);
    // const topEngineers = getTopPerformers(kpis.value.reportsPerEngineer, 3);
    const trend = getReportingTrend(kpis.value.reportsPerDay);
    const status = getPerformanceStatus(kpis.value);

    return (
      <div class="space-y-8">
        {/* Executive Summary Cards */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-primary-100 text-sm font-medium">Total Reports</p>
                <p class="text-3xl font-bold">{(kpis.value.totalReports / 1000).toFixed(1)}K</p>
                <p class="text-primary-100 text-sm">Generated</p>
              </div>
              <div class="bg-primary-400 bg-opacity-30 rounded-full p-3">
                📊
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-100 text-sm font-medium">Active Sites</p>
                <p class="text-3xl font-bold">{kpis.value.uniqueSites}</p>
                <p class="text-green-100 text-sm">Locations</p>
              </div>
              <div class="bg-green-400 bg-opacity-30 rounded-full p-3">
                🏭
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-purple-100 text-sm font-medium">Field Engineers</p>
                <p class="text-3xl font-bold">{kpis.value.uniqueEngineers}</p>
                <p class="text-purple-100 text-sm">Active</p>
              </div>
              <div class="bg-purple-400 bg-opacity-30 rounded-full p-3">
                👷
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-orange-100 text-sm font-medium">Compliance Rate</p>
                <p class="text-3xl font-bold">{kpis.value.reportingCompliancePct.toFixed(0)}%</p>
                <p class="text-orange-100 text-sm">Quality Score</p>
              </div>
              <div class="bg-orange-400 bg-opacity-30 rounded-full p-3">
                ✅
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">📈 Operational Insights</h3>
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
              }`}>Overall Performance</h4>
              <p class={`text-sm mt-1 ${
                status === 'excellent' ? 'text-green-700' :
                status === 'good' ? 'text-primary-700' :
                status === 'average' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                Site reporting is <span class="font-semibold">{status.replace('-', ' ')}</span>
              </p>
            </div>
            <div class="bg-purple-50 rounded-lg p-4">
              <h4 class="font-medium text-purple-900">Top Performing Site</h4>
              <p class="text-sm text-purple-700 mt-1">
                <span class="font-semibold">{topSites[0]?.key || 'N/A'}</span> with {topSites[0]?.value || 0} reports
              </p>
            </div>
            <div class="bg-primary-50 rounded-lg p-4">
              <h4 class="font-medium text-primary-900">Reporting Trend</h4>
              <p class="text-sm text-primary-700 mt-1">
                Activity is <span class="font-semibold">{trend}</span> this week
              </p>
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <EChart
              option={{
                title: { text: 'Daily Reporting Activity', left: 'center', textStyle: { fontSize: 16, fontWeight: 'bold' } },
                tooltip: { trigger: 'axis' },
                xAxis: { 
                  type: 'category', 
                  data: Object.keys(kpis.value.reportsPerDay).slice(-14).map(date => 
                    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  )
                },
                yAxis: { type: 'value', name: 'Reports' },
                series: [{ 
                  type: 'line', 
                  data: Object.values(kpis.value.reportsPerDay).slice(-14),
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
                title: { text: 'Top Performing Sites', left: 'center', textStyle: { fontSize: 16, fontWeight: 'bold' } },
                tooltip: { trigger: 'item', formatter: '{b}: {c} reports ({d}%)' },
                series: [{
                  type: 'pie',
                  radius: ['40%', '70%'],
                  data: getTopPerformers(kpis.value.reportsPerSite, 6).map((site, index) => ({
                    value: site.value,
                    name: site.key,
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
                <div class="text-sm text-gray-500">Avg Reports/Site</div>
                <div class="text-2xl font-bold text-primary-600">{metrics.avgReportsPerSite.toFixed(1)}</div>
              </div>
              <div class="text-2xl">📊</div>
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-500">Avg Reports/Engineer</div>
                <div class="text-2xl font-bold text-purple-600">{metrics.avgReportsPerEngineer.toFixed(1)}</div>
              </div>
              <div class="text-2xl">👷</div>
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-500">Active Days</div>
                <div class="text-2xl font-bold text-green-600">{metrics.activeDays}</div>
              </div>
              <div class="text-2xl">📅</div>
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-500">Avg Reports/Day</div>
                <div class="text-2xl font-bold text-orange-600">{metrics.avgReportsPerDay.toFixed(1)}</div>
              </div>
              <div class="text-2xl">📈</div>
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
          {/* Site Performance Analysis */}
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <EChart
              option={{
                title: { text: 'Site Performance Distribution', left: 'center' },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                xAxis: { 
                  type: 'category', 
                  data: getTopPerformers(kpis.value.reportsPerSite, 10).map(site => 
                    site.key.length > 12 ? site.key.substring(0, 12) + '...' : site.key
                  ),
                  axisLabel: { rotate: 45, interval: 0 }
                },
                yAxis: { type: 'value', name: 'Reports' },
                series: [{
                  type: 'bar',
                  data: getTopPerformers(kpis.value.reportsPerSite, 10).map(site => site.value),
                  itemStyle: { color: '#10b981' }
                }]
              }}
            />
          </div>

          {/* Engineer Productivity */}
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <EChart
              option={{
                title: { text: 'Engineer Productivity', left: 'center' },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                xAxis: { 
                  type: 'category', 
                  data: getTopPerformers(kpis.value.reportsPerEngineer, 8).map(eng => 
                    eng.key.length > 15 ? eng.key.substring(0, 15) + '...' : eng.key
                  ),
                  axisLabel: { rotate: 45, interval: 0 }
                },
                yAxis: { type: 'value', name: 'Reports' },
                series: [{
                  type: 'bar',
                  data: getTopPerformers(kpis.value.reportsPerEngineer, 8).map(eng => eng.value),
                  itemStyle: { color: '#8b5cf6' }
                }]
              }}
            />
          </div>
        </div>

        {/* Detailed Performance Table */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">🏭 Site Performance Analysis</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-3 px-4 font-medium">Site Name</th>
                  <th class="text-right py-3 px-4 font-medium">Reports</th>
                  <th class="text-right py-3 px-4 font-medium">% of Total</th>
                  <th class="text-center py-3 px-4 font-medium">Activity Level</th>
                  <th class="text-center py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {getTopPerformers(kpis.value.reportsPerSite, 10).map((site, index) => {
                  const percentage = (site.value / kpis.value!.totalReports) * 100;
                  const activityLevel = percentage > 15 ? 'High' : percentage > 8 ? 'Medium' : 'Low';
                  return (
                    <tr key={index} class="border-b hover:bg-gray-50">
                      <td class="py-3 px-4 font-medium">{site.key}</td>
                      <td class="py-3 px-4 text-right">{site.value.toLocaleString()}</td>
                      <td class="py-3 px-4 text-right">{percentage.toFixed(1)}%</td>
                      <td class="py-3 px-4 text-center">
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            class="bg-green-500 h-2 rounded-full" 
                            style={`width: ${Math.min(percentage * 4, 100)}%`}
                          ></div>
                        </div>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                          activityLevel === 'High' ? 'bg-green-100 text-green-800' :
                          activityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {activityLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Engineer Performance */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">👷 Engineer Performance Analysis</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getTopPerformers(kpis.value.reportsPerEngineer, 9).map((engineer, index) => (
              <div key={index} class="border rounded-lg p-3">
                <div class="font-medium text-sm truncate">{engineer.key}</div>
                <div class="text-lg font-bold text-purple-600">{engineer.value}</div>
                <div class="text-xs text-gray-500">
                  {((engineer.value / kpis.value!.totalReports) * 100).toFixed(1)}% of total
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div 
                    class="bg-purple-500 h-1 rounded-full" 
                    style={`width: ${(engineer.value / Math.max(...Object.values(kpis.value!.reportsPerEngineer))) * 100}%`}
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
    if (!kpis.value) return null;

    const totalLocations = kpis.value.geoPoints.length;
    const uniqueLocations = new Set(kpis.value.geoPoints.map(point => `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`)).size;

    return (
      <div class="space-y-6">
        {/* Location Statistics */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Total Reports</div>
            <div class="text-2xl font-bold text-primary-600">{totalLocations}</div>
          </div>
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Unique Locations</div>
            <div class="text-2xl font-bold text-green-600">{uniqueLocations}</div>
          </div>
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Site Coverage</div>
            <div class="text-2xl font-bold text-purple-600">{kpis.value.uniqueSites}</div>
          </div>
          <div class="bg-white rounded-lg border p-4">
            <div class="text-sm text-gray-500">Avg Reports/Location</div>
            <div class="text-2xl font-bold text-orange-600">{uniqueLocations > 0 ? (totalLocations / uniqueLocations).toFixed(1) : '0'}</div>
          </div>
        </div>

        {/* Interactive Map */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">🗺️ Dairy Site Locations</h3>
          <div class="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src={`data:text/html;charset=utf-8,${encodeURIComponent(`
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Dairy Site Locations</title>
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
                    <strong>🏭 ${totalLocations} Reports</strong><br>
                    <span style="color: #666;">📍 ${uniqueLocations} Locations</span><br>
                    <span style="color: #666;">🎯 ${kpis.value.uniqueSites} Sites</span>
                  </div>
                  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                  <script>
                    const map = L.map('map').setView([20.5937, 78.9629], 5);
                    
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                      attribution: '© OpenStreetMap contributors',
                      maxZoom: 19
                    }).addTo(map);
                    
                    const locations = ${JSON.stringify(kpis.value.geoPoints || [])};
                    
                    // Create a heat map effect by grouping nearby locations
                    const locationCounts = {};
                    locations.forEach((point) => {
                      if (point && point.latitude && point.longitude) {
                        const key = Math.floor(point.latitude * 1000) + ',' + Math.floor(point.longitude * 1000);
                        locationCounts[key] = (locationCounts[key] || 0) + 1;
                      }
                    });
                    
                    let bounds = [];
                    const addedLocations = new Set();
                    
                    locations.forEach((point, index) => {
                      if (point && point.latitude && point.longitude) {
                        const lat = point.latitude;
                        const lng = point.longitude;
                        const key = Math.floor(lat * 1000) + ',' + Math.floor(lng * 1000);
                        
                        if (!addedLocations.has(key)) {
                          addedLocations.add(key);
                          const count = locationCounts[key];
                          
                          // Different marker sizes based on frequency
                          const radius = Math.min(5 + (count * 2), 15);
                          const color = count > 10 ? '#ef4444' : count > 5 ? '#f59e0b' : '#10b981';
                          
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
                              <strong>🏭 Dairy Site</strong><br>
                              <span style="color: #666;">Lat: \${lat.toFixed(6)}</span><br>
                              <span style="color: #666;">Lng: \${lng.toFixed(6)}</span><br>
                              <strong style="color: \${color};">\${count} reports</strong>
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
                        <strong>Report Frequency</strong><br>
                        <span style="color: #10b981;">●</span> 1-5 reports<br>
                        <span style="color: #f59e0b;">●</span> 6-10 reports<br>
                        <span style="color: #ef4444;">●</span> 10+ reports
                      \`;
                      return div;
                    };
                    legend.addTo(map);
                  </script>
                </body>
                </html>
              `)}`}
              class="w-full h-full border-0"
              title="Dairy Site Locations Map"
            />
          </div>
        </div>

        {/* Site Coverage Analysis */}
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">📊 Geographic Analysis</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium mb-2">Site Distribution</h4>
              <div class="space-y-2">
                {getTopPerformers(kpis.value.reportsPerSite, 5).map((site, index) => (
                  <div key={index} class="flex justify-between items-center">
                    <span class="text-sm">{site.key}</span>
                    <div class="flex items-center space-x-2">
                      <div class="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          class="bg-green-500 h-2 rounded-full" 
                          style={`width: ${(site.value / Math.max(...Object.values(kpis.value!.reportsPerSite))) * 100}%`}
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
                <div class="bg-green-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-green-900">Coverage Efficiency</div>
                  <div class="text-sm text-green-700">
                    {totalLocations > 0 ? ((uniqueLocations / totalLocations) * 100).toFixed(1) : '0'}% location diversity
                  </div>
                </div>
                <div class="bg-primary-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-primary-900">Most Active Site</div>
                  <div class="text-sm text-primary-700">
                    {getTopPerformers(kpis.value.reportsPerSite, 1)[0]?.key || 'N/A'} leads activity
                  </div>
                </div>
                <div class="bg-purple-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-purple-900">Reporting Density</div>
                  <div class="text-sm text-purple-700">
                    {kpis.value.uniqueSites > 0 ? (kpis.value.totalReports / kpis.value.uniqueSites).toFixed(1) : '0'} reports per site
                  </div>
                </div>
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
          <h1 class="text-3xl font-bold text-gray-900 mb-2">🏭 Dairy Site Management Dashboard</h1>
          <p class="text-gray-600">Comprehensive site reporting analytics and performance insights</p>
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