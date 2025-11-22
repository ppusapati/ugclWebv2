// Geofencing utility functions

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Geofence {
  coordinates: Coordinate[];
  name?: string;
  description?: string;
}

/**
 * Validate a single coordinate
 */
export function validateCoordinate(coord: Coordinate): string | null {
  if (coord.lat < -90 || coord.lat > 90) {
    return `Latitude ${coord.lat} is out of valid range [-90, 90]`;
  }
  if (coord.lng < -180 || coord.lng > 180) {
    return `Longitude ${coord.lng} is out of valid range [-180, 180]`;
  }
  return null;
}

/**
 * Validate geofence data
 */
export function validateGeofence(geofence: Geofence): string | null {
  if (!geofence.coordinates || geofence.coordinates.length < 3) {
    return 'Geofence must have at least 3 coordinates to form a polygon';
  }

  for (let i = 0; i < geofence.coordinates.length; i++) {
    const error = validateCoordinate(geofence.coordinates[i]);
    if (error) {
      return `Invalid coordinate at index ${i}: ${error}`;
    }
  }

  return null;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  let j = polygon.length - 1;

  for (let i = 0; i < polygon.length; i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
    j = i;
  }

  return inside;
}

/**
 * Calculate the centroid of a polygon
 */
export function calculatePolygonCenter(coordinates: Coordinate[]): Coordinate {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length,
  };
}

/**
 * Parse geofence JSON string to Geofence object
 */
export function parseGeofence(geofenceJSON: string): Geofence | null {
  if (!geofenceJSON) return null;

  try {
    const geofence = JSON.parse(geofenceJSON);
    return geofence;
  } catch (error) {
    console.error('Failed to parse geofence:', error);
    return null;
  }
}

/**
 * Convert Geofence object to JSON string
 */
export function stringifyGeofence(geofence: Geofence): string {
  return JSON.stringify(geofence);
}

/**
 * Auto-close polygon by adding first point at the end if not already closed
 */
export function autoClosePolygon(coordinates: Coordinate[]): Coordinate[] {
  if (coordinates.length < 3) return coordinates;

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  if (first.lat !== last.lat || first.lng !== last.lng) {
    return [...coordinates, { ...first }];
  }

  return coordinates;
}

/**
 * Calculate polygon area in square meters (approximate)
 */
export function calculatePolygonArea(coordinates: Coordinate[]): number {
  if (coordinates.length < 3) return 0;

  // Using the Shoelace formula for polygon area
  let area = 0;
  const earthRadius = 6371000; // meters

  for (let i = 0; i < coordinates.length - 1; i++) {
    const lat1 = (coordinates[i].lat * Math.PI) / 180;
    const lat2 = (coordinates[i + 1].lat * Math.PI) / 180;
    const lng1 = (coordinates[i].lng * Math.PI) / 180;
    const lng2 = (coordinates[i + 1].lng * Math.PI) / 180;

    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = (Math.abs(area) * earthRadius * earthRadius) / 2;
  return area;
}

/**
 * Format area for display
 */
export function formatArea(areaInSquareMeters: number): string {
  if (areaInSquareMeters < 10000) {
    return `${areaInSquareMeters.toFixed(2)} m²`;
  } else {
    const areaInHectares = areaInSquareMeters / 10000;
    return `${areaInHectares.toFixed(2)} hectares`;
  }
}
