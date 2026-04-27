// src/routes/integrations/[id]/index.tsx
// Handles both "new" (id === 'new') and edit (id === uuid) flows.
import { component$, useSignal, $, useStore } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead, useNavigate, useLocation } from '@builder.io/qwik-city';
import { createSSRApiClient } from '~/services';
import { integrationService } from '~/services/integration.service';
import type { DataScope, ThirdPartyIntegration } from '~/types/integration';
import { ALL_DATA_SCOPES, DATA_SCOPE_LABELS } from '~/types/integration';
import { Alert, Btn, FormField, PageHeader, SectionCard } from '~/components/ds';

export const useIntegrationDetail = routeLoader$(async (requestEvent) => {
  const id = requestEvent.params.id;
  if (id === 'new') {
    return { integration: null as ThirdPartyIntegration | null, error: null as string | null };
  }
  try {
    const ssrApiClient = createSSRApiClient(requestEvent);
    const integration = await ssrApiClient.get<ThirdPartyIntegration>(`/admin/integrations/${id}`);
    return { integration, error: null as string | null };
  } catch (err: any) {
    return { integration: null as ThirdPartyIntegration | null, error: err.message || 'Failed to load integration' };
  }
});

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function parseLines(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function linesToText(arr: string[] | undefined): string {
  return (arr ?? []).join('\n');
}

export default component$(() => {
  const detail = useIntegrationDetail();
  const nav = useNavigate();
  const loc = useLocation();
  const isNew = loc.params.id === 'new';

  const integration = detail.value.integration;

  // ── form state ──────────────────────────────────────────────────────────────
  const form = useStore({
    name: integration?.name ?? '',
    description: integration?.description ?? '',
    contactEmail: integration?.contact_email ?? '',
    provider: integration?.provider ?? '',
    endpointUrl: integration?.endpoint_url ?? '',
    model: integration?.model ?? '',
    authHeader: integration?.auth_header ?? 'Authorization',
    authScheme: integration?.auth_scheme ?? 'Bearer',
    secret: '',
    allowedUrlsText: linesToText(integration?.allowed_urls),
    allowedIpsText: linesToText(integration?.allowed_ips),
    dataScopes: new Set<DataScope>(integration?.data_scopes ?? []),
  });

  const saving = useSignal(false);
  const regenerating = useSignal(false);
  const newApiKey = useSignal<string | null>(null);
  const errors = useStore<Record<string, string>>({});
  const serverError = useSignal<string | null>(detail.value.error);

  // ── validation ───────────────────────────────────────────────────────────────
  const validate = $(() => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (form.provider.trim()) {
      if (!form.endpointUrl.trim()) e.endpointUrl = 'Endpoint URL is required when provider is set.';
      if (!form.model.trim()) e.model = 'Model is required when provider is set.';
      if (!form.dataScopes.has('integration.document.ai.use')) {
        e.dataScopes = 'Enable integration.document.ai.use scope to use document AI.';
      }
    }
    const urls = parseLines(form.allowedUrlsText);
    for (const u of urls) {
      try { new URL(u); } catch {
        e.allowedUrls = `"${u}" is not a valid URL.`;
        break;
      }
    }
    const ips = parseLines(form.allowedIpsText);
    const ipCidr = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^([0-9a-fA-F:]+)(\/\d{1,3})?$/;
    for (const ip of ips) {
      if (!ipCidr.test(ip)) {
        e.allowedIps = `"${ip}" is not a valid IP or CIDR.`;
        break;
      }
    }
    return e;
  });

  // ── save ─────────────────────────────────────────────────────────────────────
  const handleSave = $(async () => {
    const e = await validate();
    if (Object.keys(e).length > 0) {
      Object.assign(errors, e);
      return;
    }
    Object.keys(errors).forEach((k) => delete (errors as any)[k]);

    saving.value = true;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      contact_email: form.contactEmail.trim(),
      provider: form.provider.trim().toLowerCase(),
      endpoint_url: form.endpointUrl.trim(),
      model: form.model.trim(),
      auth_header: form.authHeader.trim() || 'Authorization',
      auth_scheme: form.authScheme.trim() || 'Bearer',
      allowed_urls: parseLines(form.allowedUrlsText),
      allowed_ips: parseLines(form.allowedIpsText),
      data_scopes: Array.from(form.dataScopes) as DataScope[],
      ...(form.secret.trim() ? { secret: form.secret.trim() } : {}),
    } as const;

    try {
      if (isNew) {
        const created = await integrationService.create(payload);
        if (created.api_key) newApiKey.value = created.api_key;
        nav(`/integrations/${created.id}`);
      } else {
        await integrationService.update(loc.params.id, payload);
        serverError.value = null;
      }
    } catch (err: any) {
      serverError.value = err.message || 'Save failed';
    } finally {
      saving.value = false;
    }
  });

  // ── regenerate key ────────────────────────────────────────────────────────────
  const handleRegenerate = $(async () => {
    regenerating.value = true;
    try {
      const res = await integrationService.regenerateKey(loc.params.id);
      newApiKey.value = res.api_key;
    } catch (err: any) {
      serverError.value = err.message || 'Regenerate failed';
    } finally {
      regenerating.value = false;
    }
  });

  const toggleScope = $((scope: DataScope) => {
    const next = new Set<DataScope>(form.dataScopes);
    if (next.has(scope)) next.delete(scope);
    else next.add(scope);
    form.dataScopes = next;
  });

  return (
    <div class="space-y-6 py-4">
      <PageHeader
        title={isNew ? 'New Integration' : `Edit: ${integration?.name ?? '…'}`}
        subtitle={
          isNew
            ? 'Configure a new third-party partner: allowed URLs, source IPs, and data they may access.'
            : 'Update the integration configuration.'
        }
      >
        <div q:slot="actions">
          <Btn variant="secondary" onClick$={() => nav('/integrations')}>
            <i class="i-heroicons-arrow-left-solid w-4 h-4 inline-block"></i>
            Back
          </Btn>
        </div>
      </PageHeader>

      {serverError.value ? (
        <Alert variant="error">
          {serverError.value}
        </Alert>
      ) : null}

      {/* New API key banner */}
      {newApiKey.value ? (
        <Alert variant="success">
          <p class="text-sm font-semibold text-color-semantic-success-800 mb-1">
            {isNew ? 'Integration created! Copy your API key now — it will not be shown again.' : 'New API key generated. Copy it now.'}
          </p>
          <div class="flex items-center gap-2 mt-2">
            <code class="flex-1 font-mono text-xs bg-white border border-color-border-primary rounded px-3 py-2 break-all select-all">
              {newApiKey.value}
            </code>
            <Btn
              variant="secondary"
              size="sm"
              onClick$={() => {
                if (typeof navigator !== 'undefined') navigator.clipboard.writeText(newApiKey.value!);
              }}
            >
              <i class="i-heroicons-clipboard-document-solid w-4 h-4 inline-block"></i>
              Copy
            </Btn>
          </div>
        </Alert>
      ) : null}

      {/* ── Basic details ── */}
      <SectionCard title="Basic Details" class="mb-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Integration Name" required id="name" labelFor="name" error={errors.name}>
            <input
              id="name"
              class="input w-full"
              type="text"
              placeholder="e.g. Acme ERP"
              value={form.name}
              onInput$={(e) => { form.name = (e.target as HTMLInputElement).value; }}
            />
          </FormField>

          <FormField label="Contact Email" id="email" labelFor="email" hint="Notified on key issues or policy changes.">
            <input
              id="email"
              class="input w-full"
              type="email"
              placeholder="partner@example.com"
              value={form.contactEmail}
              onInput$={(e) => { form.contactEmail = (e.target as HTMLInputElement).value; }}
            />
          </FormField>

          <FormField label="Description" id="desc" labelFor="desc" class="md:col-span-2">
            <textarea
              id="desc"
              class="input w-full resize-none"
              rows={2}
              placeholder="Short description of the integration"
              value={form.description}
              onInput$={(e) => { form.description = (e.target as HTMLTextAreaElement).value; }}
            />
          </FormField>
        </div>
      </SectionCard>

      {/* ── Allowed callback URLs ── */}
      <SectionCard title="AI Provider Configuration" subtitle="Configure provider settings through this integration screen (no backend hardcoding)." class="mb-5">
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Provider" id="provider" labelFor="provider" hint="Example: openai or claude.">
              <input
                id="provider"
                class="input w-full"
                type="text"
                placeholder="openai"
                value={form.provider}
                onInput$={(e) => { form.provider = (e.target as HTMLInputElement).value; }}
              />
            </FormField>

            <FormField label="Model" id="model" labelFor="model" error={errors.model}>
              <input
                id="model"
                class="input w-full"
                type="text"
                placeholder="gpt-4o-mini"
                value={form.model}
                onInput$={(e) => { form.model = (e.target as HTMLInputElement).value; }}
              />
            </FormField>
          </div>

          <FormField label="Endpoint URL" id="endpoint-url" labelFor="endpoint-url" error={errors.endpointUrl}>
            <input
              id="endpoint-url"
              class="input w-full"
              type="url"
              placeholder="https://api.openai.com/v1/chat/completions"
              value={form.endpointUrl}
              onInput$={(e) => { form.endpointUrl = (e.target as HTMLInputElement).value; }}
            />
          </FormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Model" id="model" labelFor="model" error={errors.model}>
              <input
                id="auth-header"
                class="input w-full"
                type="text"
                placeholder="Authorization"
                value={form.authHeader}
                onInput$={(e) => { form.authHeader = (e.target as HTMLInputElement).value; }}
              />
            </FormField>
            <FormField label="Auth Scheme" id="auth-scheme" labelFor="auth-scheme" hint="Usually Bearer.">
              <input
                id="auth-scheme"
                class="input w-full"
                type="text"
                placeholder="Bearer"
                value={form.authScheme}
                onInput$={(e) => { form.authScheme = (e.target as HTMLInputElement).value; }}
              />
            </FormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Provider Secret" id="secret" labelFor="secret" hint={integration?.has_secret ? 'Leave blank to keep current secret.' : 'Required for AI calls.'}>
              <input
                id="secret"
                class="input w-full"
                type="password"
                placeholder={integration?.has_secret ? '********' : 'Enter provider API key'}
                value={form.secret}
                onInput$={(e) => { form.secret = (e.target as HTMLInputElement).value; }}
              />
            </FormField>
            <div class="rounded-lg border border-color-border-primary bg-color-surface-secondary px-4 py-3 text-sm text-color-text-secondary">
              <p class="font-medium text-color-text-primary mb-1">Provider setup notes</p>
              <p>Use this only if the integration also manages external AI or model-backed processing. Leave it blank for normal webhook and dropdown integrations.</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Allowed callback URLs ── */}
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SectionCard title="Allowed Callback URLs">
          <FormField
            label="Callback URLs"
            required
            id="allowed-urls"
            labelFor="allowed-urls"
            hint="One URL per line (or comma-separated). Only these URLs will be accepted as webhook / dropdown callback targets."
            error={errors.allowedUrls}
          >
            <textarea
              id="allowed-urls"
              class="input w-full font-mono text-xs resize-none"
              rows={8}
              placeholder={"https://partner.example.com/callback\nhttps://erp.client.io/webhook"}
              value={form.allowedUrlsText}
              onInput$={(e) => { form.allowedUrlsText = (e.target as HTMLTextAreaElement).value; }}
            />
          </FormField>
          {form.allowedUrlsText ? (
            <ul class="mt-2 flex flex-wrap gap-1">
              {parseLines(form.allowedUrlsText).map((u) => (
                <li key={u} class="text-xs font-mono bg-color-surface-secondary border border-color-border-primary rounded px-2 py-0.5 text-color-text-secondary">
                  {u}
                </li>
              ))}
            </ul>
          ) : null}
        </SectionCard>

        <SectionCard title="Allowed Source IPs">
          <FormField
            label="Source IPs / CIDR ranges"
            id="allowed-ips"
            labelFor="allowed-ips"
            hint="One entry per line. Only requests from these IPs will be able to call our APIs. Leave blank to allow any IP (not recommended)."
            error={errors.allowedIps}
          >
            <textarea
              id="allowed-ips"
              class="input w-full font-mono text-xs resize-none"
              rows={8}
              placeholder={"203.0.113.0/24\n198.51.100.42"}
              value={form.allowedIpsText}
              onInput$={(e) => { form.allowedIpsText = (e.target as HTMLTextAreaElement).value; }}
            />
          </FormField>
          {form.allowedIpsText ? (
            <ul class="mt-2 flex flex-wrap gap-1">
              {parseLines(form.allowedIpsText).map((ip) => (
                <li key={ip} class="text-xs font-mono bg-color-surface-secondary border border-color-border-primary rounded px-2 py-0.5 text-color-text-secondary">
                  {ip}
                </li>
              ))}
            </ul>
          ) : null}
        </SectionCard>
      </div>

      {/* ── Data Scopes ── */}
      <SectionCard title="Data Scopes" subtitle="Choose exactly which data this integration may access." class="mb-5">
        {errors.dataScopes ? (
          <Alert variant="error" class="mb-3 text-xs">
            {errors.dataScopes}
          </Alert>
        ) : null}
        <div class="space-y-2">
          {ALL_DATA_SCOPES.map((scope) => {
            const checked = form.dataScopes.has(scope);
            return (
              <label
                key={scope}
                class={[
                  'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors',
                  checked
                    ? 'border-color-brand-primary-300 bg-color-brand-primary-50'
                    : 'border-color-border-primary bg-color-surface-primary hover:bg-color-surface-secondary',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-color-border-primary text-color-brand-primary-600"
                  checked={checked}
                  onChange$={() => toggleScope(scope)}
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-color-text-primary">{DATA_SCOPE_LABELS[scope]}</p>
                  <p class="text-xs text-color-text-tertiary font-mono">{scope}</p>
                </div>
                {checked ? (
                  <span class="text-xs text-color-brand-primary-700 font-semibold">Granted</span>
                ) : null}
              </label>
            );
          })}
        </div>
        {form.dataScopes.size === 0 ? (
          <p class="mt-3 text-xs text-color-semantic-warning-700 bg-color-semantic-warning-50 border border-color-semantic-warning-200 rounded px-3 py-2">
            No scopes selected — this integration will not be able to access any data.
          </p>
        ) : null}
      </SectionCard>

      {/* ── API Key management (edit only) ── */}
      {!isNew && integration ? (
        <SectionCard title="API Key" class="mb-5">
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <p class="text-sm text-color-text-secondary">
                Current key prefix: <code class="font-mono bg-color-surface-secondary px-2 py-0.5 rounded text-xs">{integration.api_key_prefix}…</code>
              </p>
              <p class="mt-1 text-xs text-color-text-tertiary">
                The full key is never displayed again after creation. Regenerate to issue a new key (old key is immediately invalidated).
              </p>
            </div>
            <Btn
              variant="secondary"
              size="sm"
              disabled={regenerating.value}
              onClick$={handleRegenerate}
            >
              <i class="i-heroicons-arrow-path-solid w-4 h-4 inline-block"></i>
              {regenerating.value ? 'Regenerating…' : 'Regenerate Key'}
            </Btn>
          </div>
        </SectionCard>
      ) : null}

      {/* ── Footer actions ── */}
      <div class="flex justify-end gap-3 pt-2">
        <Btn variant="secondary" onClick$={() => nav('/integrations')}>Cancel</Btn>
        <Btn disabled={saving.value} onClick$={handleSave}>
          {saving.value ? 'Saving…' : isNew ? 'Create Integration' : 'Save Changes'}
        </Btn>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ params }) => ({
  title: params.id === 'new' ? 'New Integration | Admin' : 'Edit Integration | Admin',
});
