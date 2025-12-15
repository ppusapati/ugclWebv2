/**
 * Project Map Component
 * Displays zones, nodes, and tasks on an interactive map using MapLibre GL JS
 */

import { component$, useSignal, useVisibleTask$, type QRL } from '@builder.io/qwik';
import type { GeoJSONFeatureCollection, Node, Zone } from '../../types/project';

// Helper to load MapLibre GL from CDN to avoid bundler issues
const loadMaplibreGL = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).maplibregl) {
      resolve((window as any).maplibregl);
      return;
    }

    // Load script from CDN
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).maplibregl) {
        resolve((window as any).maplibregl);
      } else {
        reject(new Error('MapLibre GL failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load MapLibre GL script'));
    document.head.appendChild(script);
  });
};

export interface ProjectMapProps {
  geojsonData?: GeoJSONFeatureCollection;
  zones?: Zone[];
  nodes?: Node[];
  height?: string;
  onNodeClick$?: QRL<(node: Node) => void>;
  onZoneClick$?: QRL<(zone: Zone) => void>;
}

export const ProjectMap = component$<ProjectMapProps>(({
  geojsonData,
  zones,
  nodes,
  height = '600px',
  onNodeClick$,
  onZoneClick$,
}) => {
  const mapContainer = useSignal<HTMLDivElement>();
  const mapInstance = useSignal<any>(null);
  const errorMsg = useSignal<string>('');

  useVisibleTask$(async ({ track, cleanup }) => {
    // Track changes to data
    track(() => geojsonData);
    track(() => zones);
    track(() => nodes);

    if (!mapContainer.value) return;

    try {
      // Load MapLibre GL JS from CDN to avoid bundler issues
      const maplibregl = await loadMaplibreGL();

      // Import MapLibre CSS
      if (!document.getElementById('maplibre-css')) {
        const link = document.createElement('link');
        link.id = 'maplibre-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.css';
        document.head.appendChild(link);
      }

      // Initialize map if not already done
      if (!mapInstance.value) {
        mapInstance.value = new maplibregl.Map({
          container: mapContainer.value,
          style: {
            version: 8,
            sources: {
              'osm-tiles': {
                type: 'raster',
                tiles: [
                  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
                ],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap contributors',
              },
            },
            layers: [
              {
                id: 'osm-tiles-layer',
                type: 'raster',
                source: 'osm-tiles',
                minzoom: 0,
                maxzoom: 19,
              },
            ],
          },
          center: [78.9629, 20.5937], // India center [lng, lat]
          zoom: 4,
        });

        // Add navigation controls
        mapInstance.value.addControl(
          new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true,
          }),
          'top-right'
        );

        // Add scale control
        mapInstance.value.addControl(
          new maplibregl.ScaleControl({
            maxWidth: 100,
            unit: 'metric',
          }),
          'bottom-left'
        );
      }

      const map = mapInstance.value;

      // Wait for map to load
      await new Promise<void>((resolve) => {
        if (map.loaded()) {
          resolve();
        } else {
          map.once('load', () => resolve());
        }
      });

      // Remove existing sources and layers
      const existingSources = ['geojson-data', 'zones-data', 'nodes-data'];
      const existingLayers = [
        'zones-fill',
        'zones-outline',
        'geojson-polygons-fill',
        'geojson-polygons-outline',
        'geojson-lines',
        'nodes-layer',
        'geojson-points',
      ];

      existingLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });

      existingSources.forEach(sourceId => {
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });

      const bounds = new maplibregl.LngLatBounds();
      let hasBounds = false;

      // Add GeoJSON data if available
      if (geojsonData && geojsonData.features && geojsonData.features.length > 0) {
        map.addSource('geojson-data', {
          type: 'geojson',
          data: geojsonData,
        });

        // Add polygon fill layer
        map.addLayer({
          id: 'geojson-polygons-fill',
          type: 'fill',
          source: 'geojson-data',
          filter: ['==', ['geometry-type'], 'Polygon'],
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.3,
          },
        });

        // Add polygon outline layer
        map.addLayer({
          id: 'geojson-polygons-outline',
          type: 'line',
          source: 'geojson-data',
          filter: ['==', ['geometry-type'], 'Polygon'],
          paint: {
            'line-color': '#2563eb',
            'line-width': 2,
            'line-opacity': 0.8,
          },
        });

        // Add line layer
        map.addLayer({
          id: 'geojson-lines',
          type: 'line',
          source: 'geojson-data',
          filter: ['==', ['geometry-type'], 'LineString'],
          paint: {
            'line-color': '#16a34a',
            'line-width': 3,
            'line-opacity': 0.7,
          },
        });

        // Add point layer with color based on node_type
        map.addLayer({
          id: 'geojson-points',
          type: 'circle',
          source: 'geojson-data',
          filter: ['==', ['geometry-type'], 'Point'],
          paint: {
            'circle-radius': 8,
            'circle-color': [
              'match',
              ['get', 'node_type'],
              'start', '#16a34a',
              'stop', '#dc2626',
              'waypoint', '#f59e0b',
              '#3b82f6', // default
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9,
          },
        });

        // Add click handlers for GeoJSON features
        map.on('click', 'geojson-points', (e: any) => {
          if (e.features && e.features.length > 0 && onNodeClick$) {
            const feature = e.features[0];
            const coords = feature.geometry.coordinates;
            const node = nodes?.find(n =>
              Math.abs(n.latitude - coords[1]) < 0.0001 &&
              Math.abs(n.longitude - coords[0]) < 0.0001
            );
            if (node) {
              onNodeClick$(node);
            }
          }
        });

        map.on('click', 'geojson-polygons-fill', (e: any) => {
          if (e.features && e.features.length > 0 && onZoneClick$) {
            const feature = e.features[0];
            const props = feature.properties;
            const zone = zones?.find(z => z.name === props.name || z.label === props.label);
            if (zone) {
              onZoneClick$(zone);
            }
          }
        });

        // Add popup on hover
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
        });

        map.on('mouseenter', 'geojson-points', (e: any) => {
          map.getCanvas().style.cursor = 'pointer';
          const feature = e.features[0];
          const coords = feature.geometry.coordinates.slice();
          const props = feature.properties;

          popup
            .setLngLat(coords)
            .setHTML(`
              <div class="p-2 text-sm">
                <div class="font-semibold mb-1">${props.name || props.label || 'Unnamed'}</div>
                ${props.node_type ? `<div class="text-xs text-gray-600">Type: ${props.node_type}</div>` : ''}
                ${props.description ? `<div class="text-xs text-gray-600 mt-1">${props.description}</div>` : ''}
              </div>
            `)
            .addTo(map);
        });

        map.on('mouseleave', 'geojson-points', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });

        // Extend bounds
        geojsonData.features.forEach((feature: any) => {
          if (feature.geometry.type === 'Point') {
            bounds.extend(feature.geometry.coordinates);
            hasBounds = true;
          } else if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates[0].forEach((coord: number[]) => {
              bounds.extend(coord as [number, number]);
              hasBounds = true;
            });
          }
        });
      }

      // Add zones separately if provided
      if (zones && zones.length > 0) {
        const zonesGeoJSON: any = {
          type: 'FeatureCollection',
          features: zones
            .filter(z => z.geojson)
            .map(zone => {
              try {
                const geoJson = typeof zone.geojson === 'string'
                  ? JSON.parse(zone.geojson)
                  : zone.geojson;
                return {
                  type: 'Feature',
                  geometry: geoJson.geometry || geoJson,
                  properties: {
                    id: zone.id,
                    name: zone.name,
                    code: zone.code,
                    area: zone.area,
                  },
                };
              } catch (err) {
                console.error('Failed to parse zone GeoJSON:', zone.name, err);
                return null;
              }
            })
            .filter(Boolean),
        };

        if (zonesGeoJSON.features.length > 0) {
          map.addSource('zones-data', {
            type: 'geojson',
            data: zonesGeoJSON,
          });

          map.addLayer({
            id: 'zones-fill',
            type: 'fill',
            source: 'zones-data',
            paint: {
              'fill-color': '#3b82f6',
              'fill-opacity': 0.3,
            },
          });

          map.addLayer({
            id: 'zones-outline',
            type: 'line',
            source: 'zones-data',
            paint: {
              'line-color': '#2563eb',
              'line-width': 2,
              'line-opacity': 0.8,
            },
          });

          // Extend bounds
          zonesGeoJSON.features.forEach((feature: any) => {
            if (feature.geometry.type === 'Polygon') {
              feature.geometry.coordinates[0].forEach((coord: number[]) => {
                bounds.extend(coord as [number, number]);
                hasBounds = true;
              });
            }
          });
        }
      }

      // Add nodes separately if provided
      if (nodes && nodes.length > 0) {
        const nodesGeoJSON: any = {
          type: 'FeatureCollection',
          features: nodes.map(node => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [node.longitude, node.latitude],
            },
            properties: {
              id: node.id,
              name: node.name,
              node_type: node.node_type,
              status: node.status,
              elevation: node.elevation,
            },
          })),
        };

        map.addSource('nodes-data', {
          type: 'geojson',
          data: nodesGeoJSON,
        });

        map.addLayer({
          id: 'nodes-layer',
          type: 'circle',
          source: 'nodes-data',
          paint: {
            'circle-radius': 8,
            'circle-color': [
              'match',
              ['get', 'node_type'],
              'start', '#16a34a',
              'stop', '#dc2626',
              'waypoint', '#f59e0b',
              '#3b82f6',
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9,
          },
        });

        // Add click handler for nodes
        map.on('click', 'nodes-layer', (e: any) => {
          if (e.features && e.features.length > 0 && onNodeClick$) {
            const feature = e.features[0];
            const node = nodes.find(n => n.id === feature.properties.id);
            if (node) {
              onNodeClick$(node);
            }
          }
        });

        // Add popup on hover
        const nodePopup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
        });

        map.on('mouseenter', 'nodes-layer', (e: any) => {
          map.getCanvas().style.cursor = 'pointer';
          const feature = e.features[0];
          const coords = feature.geometry.coordinates.slice();
          const props = feature.properties;

          nodePopup
            .setLngLat(coords)
            .setHTML(`
              <div class="p-2 text-sm">
                <div class="font-semibold mb-1">${props.name}</div>
                <div class="text-xs text-gray-600">Type: ${props.node_type}</div>
                <div class="text-xs text-gray-600">Status: ${props.status}</div>
                ${props.elevation ? `<div class="text-xs text-gray-600">Elevation: ${props.elevation}m</div>` : ''}
              </div>
            `)
            .addTo(map);
        });

        map.on('mouseleave', 'nodes-layer', () => {
          map.getCanvas().style.cursor = '';
          nodePopup.remove();
        });

        // Extend bounds
        nodes.forEach(node => {
          bounds.extend([node.longitude, node.latitude]);
          hasBounds = true;
        });
      }

      // Fit map to bounds if we have any data
      if (hasBounds) {
        map.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
        });
      }

    } catch (error) {
      console.error('Map initialization error:', error);
      errorMsg.value = 'Failed to load map. Please refresh the page.';
    }

    cleanup(() => {
      if (mapInstance.value) {
        mapInstance.value.remove();
        mapInstance.value = null;
      }
    });
  });

  return (
    <div class="relative w-full" style={{ height }}>
      {errorMsg.value && (
        <div class="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div class="text-center p-4">
            <div class="text-red-600 font-medium mb-2">Map Error</div>
            <div class="text-sm text-gray-600">{errorMsg.value}</div>
          </div>
        </div>
      )}
      <div ref={mapContainer} class="w-full h-full rounded-lg border border-gray-300 shadow-sm"></div>

      {/* Map Legend */}
      <div class="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-3 z-10 text-xs">
        <div class="font-semibold mb-2">Legend</div>
        <div class="flex items-center gap-2 mb-1">
          <div class="w-3 h-3 rounded-full bg-green-600 border-2 border-white"></div>
          <span>Start Node</span>
        </div>
        <div class="flex items-center gap-2 mb-1">
          <div class="w-3 h-3 rounded-full bg-red-600 border-2 border-white"></div>
          <span>Stop Node</span>
        </div>
        <div class="flex items-center gap-2 mb-1">
          <div class="w-3 h-3 rounded-full bg-amber-500 border-2 border-white"></div>
          <span>Waypoint</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-3 border-2 border-blue-600 bg-blue-400 bg-opacity-30"></div>
          <span>Zone</span>
        </div>
      </div>
    </div>
  );
});
