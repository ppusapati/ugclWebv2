// src/components/attendance/AttendanceTrailMap.tsx
import { component$, useSignal, useTask$, type NoSerialize, noSerialize, isServer } from '@builder.io/qwik';
import type { AttendanceSession } from '~/services/types';

// Reuses the same CDN-loaded MapLibre GL instance pattern as GeofenceMap.
const loadMaplibreGL = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).maplibregl) {
      resolve((window as any).maplibregl);
      return;
    }

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

interface AttendanceTrailMapProps {
  session: AttendanceSession;
  height?: string;
}

export default component$<AttendanceTrailMapProps>((props) => {
  const mapContainer = useSignal<HTMLElement>();
  const map = useSignal<NoSerialize<any>>();

  useTask$(async ({ track }) => {
    track(() => props.session.id);
    if (isServer) return;
    if (!mapContainer.value) return;

    const session = props.session;
    const pings = session.pings || [];

    // Ordered trail: check-in -> pings (already ping_time ASC from the API) -> check-out.
    const trailPoints: Array<{ lat: number; lng: number; label: string; kind: 'checkin' | 'ping' | 'checkout' }> = [];
    trailPoints.push({ lat: session.checkInLatitude, lng: session.checkInLongitude, label: 'Check-in', kind: 'checkin' });
    for (const ping of pings) {
      trailPoints.push({ lat: ping.latitude, lng: ping.longitude, label: ping.pingTime, kind: 'ping' });
    }
    if (session.checkOutLatitude != null && session.checkOutLongitude != null) {
      trailPoints.push({ lat: session.checkOutLatitude, lng: session.checkOutLongitude, label: 'Check-out', kind: 'checkout' });
    }

    if (trailPoints.length === 0) return;

    const maplibregl = await loadMaplibreGL();

    if (!document.getElementById('maplibre-css')) {
      const link = document.createElement('link');
      link.id = 'maplibre-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.css';
      document.head.appendChild(link);
    }

    const center = trailPoints[0];

    const mapInstance = new maplibregl.Map({
      container: mapContainer.value,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }],
      },
      center: [center.lng, center.lat],
      zoom: 15,
    });

    map.value = noSerialize(mapInstance);
    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapInstance.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    mapInstance.on('load', () => {
      // Site geofence/radius reference point, if the site's location is known.
      if (session.site?.location) {
        new maplibregl.Marker({ color: '#6b7280' })
          .setLngLat([session.site.location.lng, session.site.location.lat])
          .setPopup(new maplibregl.Popup().setText(session.site.name || 'Site'))
          .addTo(mapInstance);
      }

      // Trail line through every captured point in chronological order.
      mapInstance.addSource('trail', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: trailPoints.map((p) => [p.lng, p.lat]),
          },
        },
      });
      mapInstance.addLayer({
        id: 'trail-line',
        type: 'line',
        source: 'trail',
        paint: { 'line-color': '#2563eb', 'line-width': 3, 'line-opacity': 0.8 },
      });

      // Intermediate ping markers (small dots).
      for (const point of trailPoints) {
        if (point.kind === 'ping') {
          const el = document.createElement('div');
          el.style.width = '8px';
          el.style.height = '8px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#2563eb';
          el.style.border = '1px solid white';
          new maplibregl.Marker({ element: el })
            .setLngLat([point.lng, point.lat])
            .setPopup(new maplibregl.Popup().setText(`Tracked at ${formatTime(point.label)}`))
            .addTo(mapInstance);
        }
      }

      // Check-in marker (green) and check-out marker (red).
      const checkIn = trailPoints[0];
      new maplibregl.Marker({ color: '#16a34a' })
        .setLngLat([checkIn.lng, checkIn.lat])
        .setPopup(new maplibregl.Popup().setText(`Check-in: ${formatTime(session.checkInAt)}`))
        .addTo(mapInstance);

      const last = trailPoints[trailPoints.length - 1];
      if (last.kind === 'checkout') {
        new maplibregl.Marker({ color: '#dc2626' })
          .setLngLat([last.lng, last.lat])
          .setPopup(new maplibregl.Popup().setText(`Check-out: ${formatTime(session.checkOutAt)}`))
          .addTo(mapInstance);
      }

      // Fit bounds to the whole trail (plus the site marker, if present).
      const boundsPoints = session.site?.location
        ? [...trailPoints, { lat: session.site.location.lat, lng: session.site.location.lng }]
        : trailPoints;
      const bounds = boundsPoints.reduce(
        (b, p) => b.extend([p.lng, p.lat]),
        new maplibregl.LngLatBounds([boundsPoints[0].lng, boundsPoints[0].lat], [boundsPoints[0].lng, boundsPoints[0].lat])
      );
      mapInstance.fitBounds(bounds, { padding: 60, maxZoom: 18 });
    });

    return () => {
      mapInstance.remove();
    };
  });

  const pingCount = props.session.pings?.length || 0;

  return (
    <div class="attendance-trail-map-container">
      <div class="mb-2 text-xs text-neutral-500">
        {pingCount > 0
          ? `${pingCount} location point${pingCount === 1 ? '' : 's'} captured during this session`
          : 'No location pings captured during this session yet'}
      </div>
      <div
        ref={mapContainer}
        style={{ '--map-height': props.height || '320px' }}
        class="rounded-lg border border-neutral-300 shadow h-[var(--map-height)]"
      />
    </div>
  );
});

function formatTime(value?: string): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return value;
  }
}
