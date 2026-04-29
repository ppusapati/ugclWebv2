interface CacheEntry<T = unknown> {
  value: T;
  storedAt: number;
  ttlMs: number;
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

function stableSerializeParams(params?: Record<string, any>): string {
  if (!params) {
    return '';
  }

  const filteredEntries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  return JSON.stringify(filteredEntries);
}

class RequestCacheService {
  private entries = new Map<string, CacheEntry>();

  private buildKey(endpoint: string, params?: Record<string, any>): string {
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const serializedParams = stableSerializeParams(params);
    return `${normalizedEndpoint}?${serializedParams}`;
  }

  get<T>(endpoint: string, params?: Record<string, any>): T | null {
    const key = this.buildKey(endpoint, params);
    const entry = this.entries.get(key);

    if (!entry) {
      return null;
    }

    const expired = Date.now() - entry.storedAt > entry.ttlMs;
    if (expired) {
      this.entries.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(endpoint: string, params: Record<string, any> | undefined, value: T, ttlMs: number): void {
    const key = this.buildKey(endpoint, params);
    this.entries.set(key, {
      value,
      storedAt: Date.now(),
      ttlMs,
    });
  }

  invalidateByEndpoint(endpoint: string): void {
    const normalizedEndpoint = normalizeEndpoint(endpoint);

    for (const key of this.entries.keys()) {
      const [cachedEndpoint] = key.split('?');
      const isRelated =
        cachedEndpoint.startsWith(normalizedEndpoint) ||
        normalizedEndpoint.startsWith(cachedEndpoint);

      if (isRelated) {
        this.entries.delete(key);
      }
    }
  }

  clear(): void {
    this.entries.clear();
  }
}

export const requestCacheService = new RequestCacheService();
