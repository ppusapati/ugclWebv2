# Geofencing Feature - Frontend Implementation

## Overview
This document describes the frontend implementation of the geofencing feature for site management using MapLibre GL JS.

## Installation

First, install the required dependency:

```bash
npm install maplibre-gl
# or
pnpm install maplibre-gl
```

## File Structure

```
src/
├── components/
│   └── geofence/
│       └── GeofenceMap.tsx          # Main geofencing map component
├── utils/
│   └── geofence.ts                  # Geofencing utility functions
└── routes/
    └── admin/
        └── masters/
            └── sites/
                ├── new/index.tsx     # Create site with geofencing
                └── [id]/edit/index.tsx  # Edit site with geofencing
```

## Components

### 1. GeofenceMap Component

Located at: `src/components/geofence/GeofenceMap.tsx`

A reusable map component for defining and displaying site geofences using MapLibre GL JS.

#### Props

```typescript
interface GeofenceMapProps {
  initialGeofence?: Geofence | null;      // Pre-existing geofence data
  initialCenter?: Coordinate;              // Map center coordinates
  onGeofenceChange$?: QRL<(geofence: Geofence) => void>;  // Callback when geofence changes
  readonly?: boolean;                      // Display-only mode
  height?: string;                         // Map height (default: '500px')
}
```

#### Features

- **Drawing Mode**: Click to add points to create a polygon
- **Interactive Controls**: Undo last point, clear geofence
- **Real-time Validation**: Validates coordinates and polygon structure
- **Area Calculation**: Displays polygon area in square meters or hectares
- **Visual Feedback**: Shows polygon fill, outline, and vertices
- **Navigation Controls**: Pan, zoom, rotate
- **Read-only Mode**: Display geofences without editing capabilities

#### Usage Example

```tsx
import GeofenceMap from '~/components/geofence/GeofenceMap';
import type { Geofence } from '~/utils/geofence';
import { stringifyGeofence } from '~/utils/geofence';

export default component$(() => {
  const geofence = useSignal<Geofence | null>(null);

  const handleGeof enceChange = $((newGeofence: Geofence) => {
    geofence.value = newGeofence;
    console.log('Geofence updated:', newGeofence);
  });

  return (
    <GeofenceMap
      initialCenter={{ lat: 23.0225, lng: 72.5714 }}
      onGeofenceChange$={handleGeofenceChange}
      height="600px"
    />
  );
});
```

## Utility Functions

Located at: `src/utils/geofence.ts`

### Type Definitions

```typescript
interface Coordinate {
  lat: number;  // Latitude (-90 to 90)
  lng: number;  // Longitude (-180 to 180)
}

interface Geofence {
  coordinates: Coordinate[];
  name?: string;
  description?: string;
}
```

### Available Functions

#### `validateCoordinate(coord: Coordinate): string | null`
Validates a single coordinate. Returns error message if invalid, null if valid.

```typescript
const error = validateCoordinate({ lat: 23.0225, lng: 72.5714 });
if (error) {
  console.error(error);
}
```

#### `validateGeofence(geofence: Geofence): string | null`
Validates entire geofence structure (minimum 3 points, valid coordinates).

```typescript
const error = validateGeofence({
  coordinates: [
    { lat: 23.0225, lng: 72.5714 },
    { lat: 23.0226, lng: 72.5715 },
    { lat: 23.0227, lng: 72.5716 }
  ]
});
```

#### `isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean`
Checks if a point is inside a polygon using ray casting algorithm.

```typescript
const point = { lat: 23.0226, lng: 72.5715 };
const polygon = [
  { lat: 23.0225, lng: 72.5714 },
  { lat: 23.0227, lng: 72.5716 },
  { lat: 23.0225, lng: 72.5716 }
];
const isInside = isPointInPolygon(point, polygon);
```

#### `calculatePolygonCenter(coordinates: Coordinate[]): Coordinate`
Calculates the centroid of a polygon.

```typescript
const center = calculatePolygonCenter(geofence.coordinates);
console.log(`Center: ${center.lat}, ${center.lng}`);
```

#### `parseGeofence(geofenceJSON: string): Geofence | null`
Parses geofence JSON string to Geofence object.

```typescript
const geofence = parseGeofence(geofenceJsonString);
```

#### `stringifyGeofence(geofence: Geofence): string`
Converts Geofence object to JSON string for API submission.

```typescript
const jsonString = stringifyGeofence(geofence);
```

#### `autoClosePolygon(coordinates: Coordinate[]): Coordinate[]`
Auto-closes polygon by adding first point at the end if not already closed.

```typescript
const closedCoords = autoClosePolygon(coordinates);
```

#### `calculatePolygonArea(coordinates: Coordinate[]): number`
Calculates polygon area in square meters.

```typescript
const area = calculatePolygonArea(geofence.coordinates);
console.log(`Area: ${area} m²`);
```

#### `formatArea(areaInSquareMeters: number): string`
Formats area for display (converts to hectares if > 10,000 m²).

```typescript
const formattedArea = formatArea(15000);  // "1.50 hectares"
const formattedArea2 = formatArea(500);   // "500.00 m²"
```

## Integration with Site Creation/Edit Forms

### Create Site Form

Located at: `src/routes/admin/masters/sites/new/index.tsx`

#### Key Implementation Steps

1. **Import Dependencies**:
```typescript
import GeofenceMap from '~/components/geofence/GeofenceMap';
import type { Geofence } from '~/utils/geofence';
import { stringifyGeofence } from '~/utils/geofence';
```

2. **Add State**:
```typescript
const geofence = useSignal<Geofence | null>(null);
const showGeofenceSection = useSignal(false);
```

3. **Add Geofence Change Handler**:
```typescript
const handleGeofenceChange = $((newGeofence: Geofence) => {
  geofence.value = newGeofence;
});
```

4. **Update Submit Handler**:
```typescript
const handleSubmit = $(async (e: Event) => {
  // ... existing validation ...

  const payload = {
    ...formData.value,
    location: location ? JSON.stringify(location) : undefined,
    geofence: geofence.value ? stringifyGeofence(geofence.value) : undefined,
  };

  await apiClient.post('/admin/sites', payload);
});
```

5. **Add UI Section**:
```tsx
{/* Geofencing Section */}
<div class="form-group mb-6 border-t border-light-300 pt-6">
  <div class="flex items-center justify-between mb-4">
    <div>
      <label class="form-label text-dark-700 font-semibold mb-1">
        Geofencing (Optional)
      </label>
      <p class="text-sm text-dark-600">Define the geographical boundary for this site</p>
    </div>
    <button
      type="button"
      onClick$={() => { showGeofenceSection.value = !showGeofenceSection.value; }}
      class="btn btn-secondary px-4 py-2"
    >
      {showGeofenceSection.value ? 'Hide Map' : 'Show Map'}
    </button>
  </div>

  {showGeofenceSection.value && (
    <div class="mt-4">
      <GeofenceMap
        initialCenter={
          formData.value.latitude && formData.value.longitude
            ? {
                lat: parseFloat(formData.value.latitude),
                lng: parseFloat(formData.value.longitude)
              }
            : undefined
        }
        onGeofenceChange$={handleGeofenceChange}
        height="600px"
      />
      {geofence.value && geofence.value.coordinates.length > 0 && (
        <div class="mt-3 bg-success-50 border border-success-200 rounded-lg p-3">
          <p class="text-success-800 text-sm">
            ✓ Geofence defined with {geofence.value.coordinates.length} points
          </p>
        </div>
      )}
    </div>
  )}
</div>
```

### Edit Site Form

The same pattern applies to the edit form at `src/routes/admin/masters/sites/[id]/edit/index.tsx`:

1. Load existing geofence from site data
2. Pass it as `initialGeofence` prop to GeofenceMap
3. Update on changes
4. Include in update payload

## API Integration

### Request Format

When creating or updating a site with geofencing:

```typescript
POST /api/v1/admin/sites
PUT /api/v1/admin/sites/{siteId}

{
  "name": "Solar Plant A",
  "code": "SOLAR_A",
  "businessVerticalId": "uuid",
  "location": "{\"lat\": 23.0225, \"lng\": 72.5714, \"address\": \"...\"}",
  "geofence": "{\"coordinates\": [{\"lat\": 23.0225, \"lng\": 72.5714}, ...], \"name\": \"Site Perimeter\"}"
}
```

### Response Format

```json
{
  "id": "uuid",
  "name": "Solar Plant A",
  "geofence": "{\"coordinates\": [...], \"name\": \"Site Perimeter\"}",
  ...
}
```

## Map Tiles

The component uses MapLibre's demo tiles by default:
```
https://demotiles.maplibre.org/style.json
```

For production, you may want to use:
- **Maptiler**: https://api.maptiler.com/maps/streets/style.json?key=YOUR_KEY
- **MapBox**: Use with MapLibre GL JS compatible styles
- **Self-hosted tiles**: OSM tiles with custom styling

To change the map style, update the `style` property in GeofenceMap.tsx:

```typescript
const mapInstance = new maplibregl.Map({
  container: mapContainer.value,
  style: 'YOUR_STYLE_URL_HERE',
  center: [center.lng, center.lat],
  zoom: coordinates.value.length > 0 ? 14 : 5,
});
```

## User Workflow

### Creating a Site with Geofencing

1. Fill in basic site information (name, code, business vertical)
2. Optionally add location coordinates (lat/lng)
3. Click "Show Map" button in Geofencing section
4. Click "Start Drawing" to enable drawing mode
5. Click on map to add points (minimum 3 required)
6. Use "Undo Last Point" to remove mistakes
7. Use "Clear Geofence" to start over
8. View real-time feedback: point count, polygon area
9. Validation errors appear if coordinates are invalid
10. Click "Create Site" to save

### Viewing Site Geofencing

Sites list will display geofence indicator for sites with defined boundaries. Clicking on a site shows the geofence in read-only mode.

## Styling

The component uses your existing UnoCSS classes. Key classes used:

- `btn btn-primary` / `btn btn-secondary` / `btn-danger` - Buttons
- `form-group` / `form-label` - Form elements
- `bg-success-50`, `bg-danger-50` - Alert backgrounds
- `border-success-200`, `border-danger-500` - Alert borders
- `text-success-800`, `text-danger-800` - Alert text

Map-specific styling is applied via MapLibre GL JS configuration.

## Performance Considerations

1. **Lazy Loading**: MapLibre GL JS is dynamically imported to avoid SSR issues
2. **Map Cleanup**: Component properly cleans up map instance on unmount
3. **Conditional Rendering**: Map only loads when section is shown
4. **Debouncing**: Consider debouncing geofence change callbacks for large polygons

## Accessibility

- Keyboard navigation supported via MapLibre controls
- Clear visual feedback for drawing mode
- Descriptive labels and instructions
- Color-blind friendly polygon colors can be configured

## Browser Compatibility

MapLibre GL JS supports:
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers with WebGL support

## Troubleshooting

### Map not displaying
- Check browser console for WebGL errors
- Ensure MapLibre CSS is loaded
- Verify container has explicit height

### Points not adding
- Ensure drawing mode is active (button shows "Drawing Mode Active")
- Check browser console for JavaScript errors

### Validation errors
- Ensure at least 3 points
- Check coordinates are within valid ranges
- Verify JSON format is correct

## Future Enhancements

- [ ] Import/export geofence from KML/GeoJSON files
- [ ] Multiple geofences per site
- [ ] Distance measurement tools
- [ ] Geofence templates (circle, rectangle)
- [ ] Snap to roads/boundaries
- [ ] Satellite imagery overlay
- [ ] Geofence conflict detection (overlapping sites)
- [ ] Mobile-optimized touch controls

## Related Documentation

- Backend API: `D:\Maheshwari\UGCL\backend\v1\docs\GEOFENCING_FEATURE.md`
- MapLibre GL JS Docs: https://maplibre.org/maplibre-gl-js-docs/
- GeoJSON Specification: https://geojson.org/
