// src/components/form-builder/renderer/fields/SelectField.tsx
import { component$, useSignal, useVisibleTask$, $, type PropFunction } from '@builder.io/qwik';
import { FormField } from '~/components/ds';
import { apiClient } from '~/services';
import { integrationService } from '~/services/integration.service';
import type { FormField as WorkflowFormField, FieldOption } from '~/types/workflow';

interface SelectFieldProps {
  field: WorkflowFormField;
  value: any;
  error?: string;
  onChange$: PropFunction<(value: any) => void>;
  businessCode?: string;
}

// Strip everything that isn't a letter or digit so "full_Name", "fullName",
// "full name", "FullName" all normalise to the same string "fullname".
const normalizeKey = (key: string): string =>
  String(key || '')
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

// Build a normalised-key → original-key reverse map for a single object.
const buildNormMap = (item: Record<string, any>): Map<string, string> => {
  const map = new Map<string, string>();
  for (const key of Object.keys(item)) {
    const nk = normalizeKey(key);
    // First key wins (preserves insertion order, top-level wins over deep)
    if (!map.has(nk)) map.set(nk, key);
  }
  return map;
};

// Resolve a configured key against any object, regardless of casing/separators.
// Returns undefined when the key is not found at all.
const resolveKey = (item: Record<string, any>, key: string): any => {
  if (!key || !item || typeof item !== 'object') return undefined;
  // 1. Exact match — fastest path
  if (Object.prototype.hasOwnProperty.call(item, key)) return item[key];
  // 2. Normalised match — handles mixed-case / different separators
  const normMap = buildNormMap(item);
  const originalKey = normMap.get(normalizeKey(key));
  return originalKey !== undefined ? item[originalKey] : undefined;
};

// Hints used for auto-detection, in priority order.
// Matching is done on the normalised key, so partial matches work
// (e.g. "employeeid", "busid", "busnumber" still resolve).
const LABEL_HINTS = ['fullname', 'displayname', 'name', 'title', 'description', 'label', 'text', 'code'];
const VALUE_HINTS = ['id', 'uuid', 'code', 'key', 'number', 'no', 'num', 'ref'];

// When no displayField is configured, pick the most human-readable string field.
const autoLabel = (item: Record<string, any>): string => {
  const normMap = buildNormMap(item);
  for (const hint of LABEL_HINTS) {
    for (const [nk, original] of normMap) {
      if (nk.includes(hint) && typeof item[original] === 'string' && item[original]) {
        return item[original];
      }
    }
  }
  // Last resort: first non-empty primitive that isn't purely numeric
  for (const key of Object.keys(item)) {
    const v = item[key];
    if (v !== null && v !== undefined && typeof v !== 'object' && isNaN(Number(v))) {
      return String(v);
    }
  }
  return '';
};

// When no valueField is configured, pick the most appropriate identifier field.
const autoValue = (item: Record<string, any>): string => {
  const normMap = buildNormMap(item);
  for (const hint of VALUE_HINTS) {
    for (const [nk, original] of normMap) {
      if (nk === hint || nk.startsWith(hint) || nk.endsWith(hint)) {
        const v = item[original];
        if (v !== null && v !== undefined && typeof v !== 'object') return String(v);
      }
    }
  }
  // Fallback: first primitive value
  for (const key of Object.keys(item)) {
    const v = item[key];
    if (v !== null && v !== undefined && typeof v !== 'object') return String(v);
  }
  return '';
};

// Map a raw API item to a { label, value } option pair using configured keys
// (case-insensitive) and falling back to auto-detection when not configured.
const mapToOption = (
  item: any,
  configuredLabelKey: string,
  configuredValueKey: string
): FieldOption => {
  if (!item || typeof item !== 'object') return { label: '', value: '' };

  const label = configuredLabelKey
    ? String(resolveKey(item, configuredLabelKey) ?? autoLabel(item))
    : autoLabel(item);

  const value = configuredValueKey
    ? String(resolveKey(item, configuredValueKey) ?? autoValue(item))
    : autoValue(item);

  return { label, value };
};

export default component$<SelectFieldProps>((props) => {
  const options = useSignal<FieldOption[]>(props.field.options || []);
  const loading = useSignal(false);

  // Load API options client-side only.
  // Inlined (no nested $() QRL) so props.businessCode is read at task-run
  // time — not captured at component-creation time when it may be empty.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    const dataSource = props.field.dataSource;

    // ── Integration proxy path ──────────────────────────────────────────────
    if (dataSource === 'integration') {
      const integrationId = props.field.integrationId;
      const integrationPath = props.field.integrationPath;
      if (!integrationId || !integrationPath) return;
      try {
        loading.value = true;
        const data: any = await integrationService.proxyGet(integrationId, integrationPath);
        const items: any[] = Array.isArray(data)
          ? data
          : (data?.data ?? data?.items ?? data?.results ?? data?.records ?? []);
        const labelKey = props.field.displayField || '';
        const valueKey = props.field.valueField || '';
        options.value = items
          .filter((item: any) => item != null)
          .map((item: any) => mapToOption(item, labelKey, valueKey))
          .filter((opt) => opt.value !== '');
      } catch (err) {
        console.error('[SelectField] Failed to load integration options', err);
      } finally {
        loading.value = false;
      }
      return;
    }

    // ── Internal API path ───────────────────────────────────────────────────
    const rawEndpoint = props.field.apiEndpoint;
    if (dataSource !== 'api' || !rawEndpoint) return;

    // Resolve endpoint inline — avoids nested QRL capture issues
    const businessCode = props.businessCode || '';
    let endpoint = rawEndpoint.trim();
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      endpoint = endpoint.replaceAll('{vertical}', businessCode);
      if (!endpoint.startsWith('/')) endpoint = `/${endpoint}`;
    }

    try {
      loading.value = true;

      const storedBusinessId = String(
        localStorage.getItem('ugcl_current_business_vertical') ||
        localStorage.getItem('business_vertical_id') ||
        localStorage.getItem('business_id') ||
        ''
      )
        .trim()
        .toLowerCase();

      const storedBusinessCode = String(
        props.businessCode ||
        localStorage.getItem('business_code') ||
        ''
      )
        .trim()
        .toLowerCase();

      const isSiteEndpoint = /(^|\/)sites?(\/|$|\?)/i.test(endpoint);
      const endpointParams = isSiteEndpoint
        ? {
            business_vertical_id: storedBusinessId || undefined,
            business_code: storedBusinessCode || undefined,
          }
        : undefined;

      const hasQuery = endpoint.includes('?');
      const siteParamPairs = endpointParams
        ? Object.entries(endpointParams).filter(([, value]) => !!value)
        : [];

      let resolvedEndpoint = endpoint;
      if (hasQuery && siteParamPairs.length > 0) {
        const extra = new URLSearchParams(
          siteParamPairs as Array<[string, string]>
        ).toString();
        if (extra) {
          resolvedEndpoint = `${endpoint}&${extra}`;
        }
      }

      let data: any;
      try {
        data = await apiClient.get(
          resolvedEndpoint,
          hasQuery ? undefined : endpointParams
        ) as any;
      } catch (err: any) {
        const isForbidden = Number(err?.status) === 403;
        const isAdminSitesEndpoint = /(^|\/)admin\/sites?(\/|$|\?)/i.test(endpoint);

        if (isForbidden && isAdminSitesEndpoint && storedBusinessCode) {
          // Fallback for non-admin users: fetch sites from business-scoped endpoint.
          data = await apiClient.get(`/business/${storedBusinessCode}/sites`) as any;
        } else {
          throw err;
        }
      }

      // Handle multiple backend response shapes — check 'data' first
      const items: any[] = Array.isArray(data)
        ? data
        : (
            data?.data ??
            data?.options ??
            data?.items ??
            data?.sites ??
            data?.records ??
            data?.results ??
            []
          );

      // Scope site-like payloads to the active business vertical.
      const scopedItems = items.filter((item: any) => {
        if (!item) return false;

        const itemBusinessId = String(
          item.business_vertical_id || item.business_vertical?.id || item.vertical_id || item.business_id || ''
        )
          .trim()
          .toLowerCase();

        const itemBusinessCode = String(
          item.business_vertical_code ||
            item.business_vertical?.code ||
            item.vertical_code ||
            item.business_code ||
            ''
        )
          .trim()
          .toLowerCase();

        // If payload is not business-scoped metadata, keep it unchanged.
        if (!itemBusinessId && !itemBusinessCode) return true;

        const idMatch = !!storedBusinessId && itemBusinessId === storedBusinessId;
        const codeMatch = !!storedBusinessCode && itemBusinessCode === storedBusinessCode;
        return idMatch || codeMatch;
      });

      const labelKey = props.field.displayField || '';
      const valueKey = props.field.valueField || '';

      options.value = scopedItems
        .filter((item: any) => item != null)
        .map((item: any) => mapToOption(item, labelKey, valueKey))
        .filter((opt) => opt.value !== '');
    } catch (err) {
      console.error('[SelectField] Failed to load options from', endpoint, err);
    } finally {
      loading.value = false;
    }
  });

  // Dropdown
  if (props.field.type === 'dropdown') {
    return (
      <div class="field-wrapper">
        <FormField
          id={props.field.id}
          label={props.field.label}
          required={props.field.required}
          hint={props.field.hint}
          error={props.error}
        >
          <select
            id={props.field.id}
            value={props.value || ''}
            onChange$={async (e) => await props.onChange$((e.target as HTMLSelectElement).value)}
            required={props.field.required}
            disabled={loading.value}
            class={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              props.error ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">
              {loading.value ? 'Loading...' : (props.field.placeholder || 'Select an option...')}
            </option>
            {options.value.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    );
  }

  // Radio buttons
  if (props.field.type === 'radio') {
    return (
      <div class="field-wrapper">
        <FormField
          id={props.field.id}
          label={props.field.label}
          required={props.field.required}
          hint={props.field.hint}
          error={props.error}
        >
          <div class="space-y-2">
            {options.value.map((option) => (
              <label key={option.value} class="flex items-center">
                <input
                  type="radio"
                  name={props.field.id}
                  value={option.value}
                  checked={props.value === option.value}
                  onChange$={async (e) => await props.onChange$((e.target as HTMLInputElement).value)}
                  required={props.field.required}
                  class="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </FormField>
      </div>
    );
  }

  // Checkboxes (multiple selection)
  if (props.field.type === 'checkbox') {
    const selectedValues = Array.isArray(props.value) ? props.value : [];

    const handleCheckboxChange = $(async (optionValue: string | number, checked: boolean) => {
      let newValues = [...selectedValues];
      if (checked) {
        newValues.push(optionValue);
      } else {
        newValues = newValues.filter(v => v !== optionValue);
      }
      await props.onChange$(newValues);
    });

    return (
      <div class="field-wrapper">
        <FormField
          id={props.field.id}
          label={props.field.label}
          required={props.field.required}
          hint={props.field.hint}
          error={props.error}
        >
          <div class="space-y-2">
            {options.value.map((option) => (
              <label key={option.value} class="flex items-center">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={selectedValues.includes(option.value)}
                  onChange$={(e) => handleCheckboxChange(option.value, (e.target as HTMLInputElement).checked)}
                  class="mr-2 text-blue-600 focus:ring-blue-500 rounded"
                />
                <span class="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </FormField>
      </div>
    );
  }

  return null;
});
