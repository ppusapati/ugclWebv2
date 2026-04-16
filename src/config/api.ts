const LOCAL_API_BASE_URL = 'http://localhost:10012/api/v1';
const CLOUD_API_BASE_URL =
  'https://ugclbackend2-429789556411.europe-west1.run.app/api/v1';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

export function resolveApiBaseUrl(hostname?: string): string {
  const configured = import.meta.env.PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  const host =
    hostname ||
    (typeof window !== 'undefined' ? window.location.hostname : undefined);

  if (host === 'localhost' || host === '127.0.0.1') {
    return LOCAL_API_BASE_URL;
  }

  return CLOUD_API_BASE_URL;
}

export function resolveApiRootUrl(hostname?: string): string {
  const base = resolveApiBaseUrl(hostname);
  return base.endsWith('/api/v1') ? base.slice(0, -7) : base;
}

export function buildApiUrl(endpoint: string, hostname?: string): string {
  return `${resolveApiBaseUrl(hostname)}${normalizeEndpoint(endpoint)}`;
}

export function buildApiRootUrl(endpoint: string, hostname?: string): string {
  return `${resolveApiRootUrl(hostname)}${normalizeEndpoint(endpoint)}`;
}
