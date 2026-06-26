import type { FieldOption } from '~/types/workflow';

export const appendQueryParam = (endpoint: string, key: string, value: string): string => {
  if (!key) return endpoint;
  const resolvedKey = String(key).trim();
  if (!resolvedKey) return endpoint;
  const query = new URLSearchParams({ [resolvedKey]: value }).toString();
  if (!query) return endpoint;
  return endpoint.includes('?') ? `${endpoint}&${query}` : `${endpoint}?${query}`;
};

export const resolveApiRequest = (
  endpoint: string,
  endpointParams?: Record<string, string | undefined>,
  dependencyParams?: Record<string, string | undefined>
): { resolvedEndpoint: string; requestParams?: Record<string, string | undefined> } => {
  const hasQuery = endpoint.includes('?');
  const mergedParams = {
    ...(endpointParams || {}),
    ...(dependencyParams || {}),
  };

  const mergedParamPairs = Object.entries(mergedParams).filter(([, value]) => !!value) as Array<[string, string]>;

  if (hasQuery) {
    if (mergedParamPairs.length === 0) return { resolvedEndpoint: endpoint };
    const extra = new URLSearchParams(mergedParamPairs).toString();
    return {
      resolvedEndpoint: extra ? `${endpoint}&${extra}` : endpoint,
    };
  }

  if (mergedParamPairs.length === 0) {
    return { resolvedEndpoint: endpoint };
  }

  return {
    resolvedEndpoint: endpoint,
    requestParams: mergedParams,
  };
};

export const filterInvalidSelection = (
  value: any,
  isMultiple: boolean,
  options: FieldOption[]
): { value: any; changed: boolean } => {
  const validValues = new Set(options.map((option) => String(option.value)));

  if (isMultiple) {
    const currentValues = Array.isArray(value) ? value.map((item) => String(item)) : [];
    const filteredValues = currentValues.filter((item) => validValues.has(item));
    return {
      value: filteredValues,
      changed: filteredValues.length !== currentValues.length,
    };
  }

  if (value === undefined || value === null || String(value) === '') {
    return { value, changed: false };
  }

  const currentValue = String(value);
  if (validValues.has(currentValue)) {
    return { value, changed: false };
  }

  return { value: '', changed: true };
};
