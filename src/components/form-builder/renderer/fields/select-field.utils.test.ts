import { describe, expect, it } from 'vitest';
import { appendQueryParam, filterInvalidSelection, resolveApiRequest } from './select-field.utils';

describe('select field utilities', () => {
  it('appends query params to empty and existing query strings', () => {
    expect(appendQueryParam('/api/v1/sites', 'parent_value', 'KA')).toBe('/api/v1/sites?parent_value=KA');
    expect(appendQueryParam('/api/v1/sites?active=true', 'parent_value', 'KA')).toBe('/api/v1/sites?active=true&parent_value=KA');
  });

  it('resolves API request with params object when endpoint has no query string', () => {
    const req = resolveApiRequest('/api/v1/sites', { business_code: 'ugcl' }, { parent_value: 'KA' });
    expect(req.resolvedEndpoint).toBe('/api/v1/sites');
    expect(req.requestParams).toEqual({ business_code: 'ugcl', parent_value: 'KA' });
  });

  it('resolves API request by extending endpoint query when endpoint already has a query string', () => {
    const req = resolveApiRequest('/api/v1/sites?active=true', { business_code: 'ugcl' }, { parent_value: 'KA' });
    expect(req.resolvedEndpoint).toContain('/api/v1/sites?active=true');
    expect(req.resolvedEndpoint).toContain('business_code=ugcl');
    expect(req.resolvedEndpoint).toContain('parent_value=KA');
    expect(req.requestParams).toBeUndefined();
  });

  it('filters invalid values for multi-select arrays', () => {
    const normalized = filterInvalidSelection(['A', 'X', 'B'], true, [
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
    ]);
    expect(normalized.changed).toBe(true);
    expect(normalized.value).toEqual(['A', 'B']);
  });

  it('resets invalid single-select values', () => {
    const normalized = filterInvalidSelection('X', false, [
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
    ]);
    expect(normalized.changed).toBe(true);
    expect(normalized.value).toBe('');
  });
});
