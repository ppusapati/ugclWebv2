const MINUTE = 60 * 1000;

const CACHE_TTL_RULES: Array<{ pattern: RegExp; ttl: number }> = [
  { pattern: /^\/modules(?:\/|$)/, ttl: 30 * MINUTE },
  { pattern: /^\/admin\/businesses(?:\/|$)/, ttl: 30 * MINUTE },
  { pattern: /^\/admin\/app-forms(?:\/|$)/, ttl: 15 * MINUTE },
  { pattern: /^\/business\/.+\/forms(?:\/|$)/, ttl: 10 * MINUTE },
  { pattern: /^\/dashboards(?:\/|$)/, ttl: 5 * MINUTE },
  { pattern: /^\/projects(?:\/|$)/, ttl: 5 * MINUTE },
  { pattern: /^\/documents(?:\/|$)/, ttl: 5 * MINUTE },
];

export const DEFAULT_CACHE_TTL_MS = 5 * MINUTE;

export function resolveCacheTTL(endpoint: string): number {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const matchedRule = CACHE_TTL_RULES.find((rule) => rule.pattern.test(normalizedEndpoint));
  return matchedRule?.ttl ?? DEFAULT_CACHE_TTL_MS;
}
