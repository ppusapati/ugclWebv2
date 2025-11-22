// src/components/geofence/GeofenceMap.tsx
import { component$, useSignal, useVisibleTask$, $, type QRL, noSerialize, type NoSerialize } from '@builder.io/qwik';
import type { Coordinate, Geofence } from '~/utils/geofence';
import { validateGeofence, calculatePolygonCenter, autoClosePolygon, calculatePolygonArea, formatArea } from '~/utils/geofence';

interface GeofenceMapProps {
  initialGeofence?: Geofence | null;
  initialCenter?: Coordinate;
  onGeofenceChange$?: QRL<(geofence: Geofence) => void>;
  readonly?: boolean;
  height?: string;
}

export default component$<GeofenceMapProps>((props) => {
  const mapContainer = useSignal<HTMLElement>();
  const map = useSignal<NoSerialize<any>>();
  const markers = useSignal<NoSerialize<any[]>>(noSerialize([]));
  const coordinates = useSignal<Coordinate[]>(props.initialGeofence?.coordinates || []);
  const drawingMode = useSignal(false);
  const validationError = useSignal<string | null>(null);
  const polygonArea = useSignal<number>(0);
  const geofenceName = useSignal(props.initialGeofence?.name || '');
  const geofenceDescription = useSignal(props.initialGeofence?.description || '');

  // Initialize MapLibre map
  useVisibleTask$(async () => {
    if (!mapContainer.value) return;

    // Dynamically import maplibre-gl to avoid SSR issues
    const maplibregl = await import('maplibre-gl');

    // Load MapLibre CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
    document.head.appendChild(link);

    // Default center (Karnataka, India) or use provided center
    const center = props.initialCenter ||
      (coordinates.value.length > 0 ? calculatePolygonCenter(coordinates.value) : { lng: 76.5, lat: 15.0 });

    // Initialize map with OSM tiles
    const mapInstance = new maplibregl.Map({
      container: mapContainer.value,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [center.lng, center.lat],
      zoom: coordinates.value.length > 0 ? 14 : 7,
    });

    map.value = noSerialize(mapInstance);

    // Add navigation controls
    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add scale control
    mapInstance.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    // Function to create draggable marker
    const createMarker = (coord: Coordinate, index: number) => {
      const markerEl = document.createElement('div');
      markerEl.className = 'geofence-marker';
      markerEl.style.width = '20px';
      markerEl.style.height = '20px';
      markerEl.style.borderRadius = '50%';
      markerEl.style.backgroundColor = '#ef4444';
      markerEl.style.border = '3px solid white';
      markerEl.style.cursor = 'move';
      markerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      markerEl.title = `Point ${index + 1}`;

      const marker = new maplibregl.Marker({
        element: markerEl,
        draggable: !props.readonly
      })
        .setLngLat([coord.lng, coord.lat])
        .addTo(mapInstance);

      // Handle drag end
      if (!props.readonly) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          coordinates.value = coordinates.value.map((c, i) =>
            i === index ? { lat: lngLat.lat, lng: lngLat.lng } : c
          );
          updatePolygon();
          emitGeofenceChange();
        });
      }

      return marker;
    };

    // Function to update markers
    const updateMarkers = () => {
      // Remove old markers
      if (markers.value) {
        markers.value.forEach((m: any) => m.remove());
      }

      // Create new markers
      const newMarkers = coordinates.value.map((coord, index) => createMarker(coord, index));
      markers.value = noSerialize(newMarkers);
    };

    // Function to update polygon
    const updatePolygon = () => {
      if (!mapInstance.getSource('geofence')) return;

      const closedCoords = autoClosePolygon(coordinates.value);

      // Update polygon
      (mapInstance.getSource('geofence') as any).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: closedCoords.length >= 3 ? [closedCoords.map(c => [c.lng, c.lat])] : []
        }
      });

      // Calculate area
      if (coordinates.value.length >= 3) {
        polygonArea.value = calculatePolygonArea(closedCoords);
      }

      // Validate
      if (coordinates.value.length > 0) {
        const geofence: Geofence = {
          coordinates: coordinates.value,
          name: geofenceName.value,
          description: geofenceDescription.value
        };
        validationError.value = validateGeofence(geofence);
      }
    };

    // Function to update map (polygon and markers)
    const updateMap = () => {
      updatePolygon();
      updateMarkers();

      // Fit bounds if polygon exists
      if (coordinates.value.length > 0) {
        const bounds = coordinates.value.reduce(
          (bounds, coord) => bounds.extend([coord.lng, coord.lat]),
          new maplibregl.LngLatBounds(
            [coordinates.value[0].lng, coordinates.value[0].lat],
            [coordinates.value[0].lng, coordinates.value[0].lat]
          )
        );
        mapInstance.fitBounds(bounds, { padding: 50 });
      }
    };

    // Emit geofence change
    const emitGeofenceChange = () => {
      if (props.onGeofenceChange$ && coordinates.value.length > 0) {
        const geofence: Geofence = {
          coordinates: coordinates.value,
          name: geofenceName.value,
          description: geofenceDescription.value
        };
        props.onGeofenceChange$(geofence);
      }
    };

    // Wait for map to load
    mapInstance.on('load', () => {
      // Add polygon source
      mapInstance.addSource('geofence', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: coordinates.value.length > 0 ? [coordinates.value.map(c => [c.lng, c.lat])] : []
          }
        }
      });

      // Add polygon fill layer
      mapInstance.addLayer({
        id: 'geofence-fill',
        type: 'fill',
        source: 'geofence',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.25
        }
      });

      // Add polygon outline layer
      mapInstance.addLayer({
        id: 'geofence-outline',
        type: 'line',
        source: 'geofence',
        paint: {
          'line-color': '#2563eb',
          'line-width': 3
        }
      });

      // Add click handler for drawing mode
      if (!props.readonly) {
        mapInstance.on('click', (e: any) => {
          if (drawingMode.value) {
            const newCoord: Coordinate = { lat: e.lngLat.lat, lng: e.lngLat.lng };
            coordinates.value = [...coordinates.value, newCoord];
            updateMap();
            emitGeofenceChange();
          }
        });
      }

      // Initialize markers and polygon if initial geofence exists
      if (coordinates.value.length > 0) {
        updateMap();
      }
    });

    // Store update function for use in other handlers
    (window as any).__updateGeofenceMap = updateMap;
    (window as any).__updateGeofencePolygon = updatePolygon;
    (window as any).__updateGeofenceMarkers = updateMarkers;

    // Cleanup
    return () => {
      if (markers.value) {
        markers.value.forEach((m: any) => m.remove());
      }
      if (mapInstance) {
        mapInstance.remove();
      }
      delete (window as any).__updateGeofenceMap;
      delete (window as any).__updateGeofencePolygon;
      delete (window as any).__updateGeofenceMarkers;
    };
  });

  const toggleDrawing = $(() => {
    drawingMode.value = !drawingMode.value;
    if (map.value) {
      map.value.getCanvas().style.cursor = drawingMode.value ? 'crosshair' : '';
    }
  });

  const clearGeofence = $(() => {
    coordinates.value = [];
    polygonArea.value = 0;
    validationError.value = null;

    // Remove markers
    if (markers.value) {
      markers.value.forEach((m: any) => m.remove());
      markers.value = noSerialize([]);
    }

    // Clear polygon
    if (map.value && map.value.getSource('geofence')) {
      (map.value.getSource('geofence') as any).setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [] }
      });
    }

    if (props.onGeofenceChange$) {
      props.onGeofenceChange$({ coordinates: [], name: geofenceName.value, description: geofenceDescription.value });
    }
  });

  const undoLastPoint = $(() => {
    if (coordinates.value.length > 0) {
      coordinates.value = coordinates.value.slice(0, -1);

      // Update map using stored function
      if ((window as any).__updateGeofenceMap) {
        (window as any).__updateGeofenceMap();
      }

      if (props.onGeofenceChange$) {
        if (coordinates.value.length > 0) {
          const geofence: Geofence = {
            coordinates: coordinates.value,
            name: geofenceName.value,
            description: geofenceDescription.value
          };
          props.onGeofenceChange$(geofence);
        } else {
          props.onGeofenceChange$({ coordinates: [], name: geofenceName.value, description: geofenceDescription.value });
        }
      }
    }
  });

  return (
    <div class="geofence-map-container">
      {!props.readonly && (
        <div class="mb-4 space-y-4">
          <div class="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick$={toggleDrawing}
              class={`btn ${drawingMode.value ? 'btn-primary' : 'btn-secondary'} px-4 py-2`}
            >
              {drawingMode.value ? '✓ Drawing Mode Active' : 'Start Drawing'}
            </button>
            <button
              type="button"
              onClick$={undoLastPoint}
              disabled={coordinates.value.length === 0}
              class="btn btn-secondary px-4 py-2 disabled:opacity-50"
            >
              Undo Last Point
            </button>
            <button
              type="button"
              onClick$={clearGeofence}
              disabled={coordinates.value.length === 0}
              class="btn btn-danger px-4 py-2 disabled:opacity-50"
            >
              Clear Geofence
            </button>
          </div>

          <div class="text-sm text-dark-600 bg-light-100 p-3 rounded">
            <strong>Instructions:</strong> Click "Start Drawing" then click on the map to add points.
            You can drag the red markers to adjust positions. At least 3 points are required.
          </div>

          {coordinates.value.length > 0 && (
            <div class="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <span class="text-sm font-medium text-primary-800">
                  Points: {coordinates.value.length}
                </span>
                {polygonArea.value > 0 && (
                  <span class="text-sm font-medium text-primary-800">
                    Area: {formatArea(polygonArea.value)}
                  </span>
                )}
              </div>
            </div>
          )}

          {validationError.value && (
            <div class="alert-danger rounded-lg p-3 bg-danger-50 border-l-4 border-danger-500">
              <p class="text-danger-800 text-sm">{validationError.value}</p>
            </div>
          )}
        </div>
      )}

      <div
        ref={mapContainer}
        style={{ height: props.height || '500px' }}
        class="rounded-lg border border-light-300 shadow"
      />

      {props.readonly && coordinates.value.length > 0 && (
        <div class="mt-3 bg-light-50 border border-light-200 rounded-lg p-3">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-dark-600">Points:</span>
              <span class="ml-2 font-medium text-dark-800">{coordinates.value.length}</span>
            </div>
            {polygonArea.value > 0 && (
              <div>
                <span class="text-dark-600">Area:</span>
                <span class="ml-2 font-medium text-dark-800">{formatArea(polygonArea.value)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
