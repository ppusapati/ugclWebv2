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
        const labelKey = props.field.displayField || 'name';
        const valueKey = props.field.valueField || 'id';
        options.value = items
          .filter((item: any) => item != null)
          .map((item: any) => ({
            label: String(item[labelKey] ?? item.name ?? item.label ?? item.title ?? item.code ?? ''),
            value: String(item[valueKey] ?? item.id ?? item.value ?? item.code ?? ''),
          }))
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

      const labelKey = props.field.displayField || 'name';
      const valueKey = props.field.valueField || 'id';

      options.value = scopedItems
        .filter((item: any) => item != null)
        .map((item: any) => ({
          label: String(item[labelKey] ?? item.name ?? item.label ?? item.title ?? item.code ?? ''),
          value: String(item[valueKey] ?? item.id ?? item.value ?? item.code ?? ''),
        }))
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
