import { $, component$, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { Btn } from '~/components/ds/btn';
import { isValidPhone } from "~/utils/validations";
import ImgLogo from '~/media/logo.png?jsx';
import { buildApiUrl } from '~/config/api';
import { authService } from '~/services';

const API_KEY = '87339ea3-1add-4689-ae57-3128ebd03c4f';

interface TenantOption {
    name: string;
    slug: string;
}

export const LoginForm = component$(() => {
    const state = useStore({
        tenantSlug: '',
        phone: '',
        password: '',
        loading: false,
        success: false,
        touched: false,
        tenantSlugError: null as string | null,
        phoneError: null as string | null,
        passwordError: null as string | null,
        apiError: '',
        apiSuccess: false,
        tenants: [] as TenantOption[],
        tenantsLoading: true,
        tenantsError: '',
    });

    // Fetches the public, unauthenticated GET /tenants list to populate the
    // dropdown below. Known, accepted tradeoff (see backend
    // handlers.ListPublicTenants doc comment): this lets anyone enumerate
    // active tenant names without logging in. Accepted deliberately for
    // now — revisit there if the tenant list becomes sensitive enough to
    // matter more than the login-failure problem this dropdown fixes.
    useVisibleTask$(async () => {
        try {
            const resp = await fetch(buildApiUrl('/tenants'));
            if (!resp.ok) throw new Error(`Request failed (${resp.status})`);
            const data = await resp.json();
            state.tenants = Array.isArray(data?.tenants) ? data.tenants : [];
            if (state.tenants.length === 1) {
                // Only one organization exists — preselect it so the common
                // case (one tenant deployment) still takes a single click.
                state.tenantSlug = state.tenants[0].slug;
            }
        } catch {
            state.tenantsError = 'Could not load organizations. Please refresh the page.';
        } finally {
            state.tenantsLoading = false;
        }
    });

    const handleTenantSlugChange = $((e: Event) => {
        const value = (e.target as HTMLSelectElement).value;
        state.tenantSlug = value;
        state.touched = true;
        state.tenantSlugError = value ? '' : 'Organization is required';
    });

    const handlePhoneInput = $((e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        state.phone = value;
        state.touched = true;
        if (!value.trim()) {
        state.phoneError = 'Phone number is required';
        } else if (!isValidPhone(value)) {
            state.phoneError = 'Phone number must be only numerics and exactly 10 digits';
        } else {
            state.phoneError = '';
        }
    });

    const handlePasswordInput = $((e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        state.password = value;
        state.touched = true;

        if (!value.trim()) {
            state.passwordError = 'Password is required';
        } else if (value.length < 6) {
            state.passwordError = 'Password must be at least 6 characters';
        } else {
            state.passwordError = '';
        }
    });
    const handleSubmit = $(async () => {
      if (state.loading) {
        return;
      }

        state.touched = true;
        if (!state.tenantSlug) {
            state.tenantSlugError = 'Organization is required';
            return;
        }
        if (!isValidPhone(state.phone)) {
            state.phoneError = 'Phone number must be exactly 10 digits';
            return;
        }
      if (!state.password.trim()) {
        state.passwordError = 'Password is required';
        return;
      }
      if (state.password.length < 6) {
        state.passwordError = 'Password must be at least 6 characters';
        return;
      }

        state.loading = true;
        state.apiError = '';
      state.apiSuccess = false;
        // Proceed with form submission (API call, etc.)
        try {
            const loginAbortController = new AbortController();
            const loginTimeout = globalThis.setTimeout(() => loginAbortController.abort(), 12000);
          const resp = await fetch(buildApiUrl('/login'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tenant_slug: state.tenantSlug.trim(),
              phone: state.phone,
              password: state.password,
            }),
            signal: loginAbortController.signal,
          }).finally(() => {
            globalThis.clearTimeout(loginTimeout);
          });

            if (!resp.ok) {
                const contentType = resp.headers.get('content-type') || '';
                let message = `Login failed (${resp.status}). Please check your credentials and try again.`;

                if (contentType.includes('application/json')) {
                  const errorBody = await resp.json().catch(() => null) as any;
                  const apiMessage = errorBody?.message || errorBody?.error || errorBody?.detail;
                  if (typeof apiMessage === 'string' && apiMessage.trim()) {
                    message = apiMessage;
                  }
                } else {
                  const rawError = await resp.text();
                  const cleanedError = rawError.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                  if (cleanedError) {
                    message = cleanedError;
                  }
                }

                state.apiError = message;
            } else {
                const data = await resp.json();
              let enrichedUser = data.user;

              // Hydrate full user context (permissions + business roles) for sidebar/form visibility.
              try {
                const profileAbortController = new AbortController();
                const profileTimeout = globalThis.setTimeout(() => profileAbortController.abort(), 4000);
                const profileResp = await fetch(buildApiUrl('/profile'), {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${data.token}`,
                    'x-api-key': API_KEY,
                  },
                  signal: profileAbortController.signal,
                }).finally(() => {
                  globalThis.clearTimeout(profileTimeout);
                });

                if (profileResp.ok) {
                  enrichedUser = await profileResp.json();
                }
              } catch {
                // Fallback to login payload if profile call fails.
              }

                state.apiSuccess = true;
              authService.persistSession(data.token, enrichedUser);

                // Full reload so SSR route guards and layout auth state re-run from the app entry point.
                window.location.href = '/';
            }
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            state.apiError = 'Login request timed out. Please try again.';
          } else {
            state.apiError = 'Network error: ' + (err?.message || 'Unknown error');
          }
        } finally {
            state.loading = false;
        }
    });
    return (
    <div class="min-h-screen bg-gradient-to-tr from-primary-400 via-light-650 to-white flex items-center justify-center">
  <div class="flex flex-col items-center w-full max-w-md">
    <div class="flex items-center justify-center mb-4 ">
      <ImgLogo class="w-36 h-auto" />
    </div>
    <div class="w-full shadow-xl rounded-2xl animate-fade-in overflow-hidden border border-neutral-200">
      <div class="bg-primary-600 p-6 text-center rounded-t-2xl">
        <h2 class="h-2-bold text-white tracking-wide  drop-shadow">
           Welcome to Sree UGCL
        </h2>
      </div>
      <form 
        class="flex flex-col gap-2 p-8 bg-white"
        preventdefault:submit
        onSubmit$={handleSubmit}
      >
        <div class="form-group">
          <label class="form-label-muted mb-2" for="tenantSlug">
            Organization
          </label>
          <select
            id="tenantSlug"
            required
            disabled={state.tenantsLoading || !!state.tenantsError}
            class={[
              "form-input w-full box-border transition-shadow",
              state.tenantSlugError && state.touched ? "form-input-error ring-2 ring-danger-400" : "focus:ring-2 focus:ring-primary-400",
            ].join(' ')}
            value={state.tenantSlug}
            onChange$={handleTenantSlugChange}
          >
            <option value="" disabled selected={!state.tenantSlug}>
              {state.tenantsLoading ? 'Loading organizations...' : 'Select your organization'}
            </option>
            {state.tenants.map((tenant) => (
              <option key={tenant.slug} value={tenant.slug}>
                {tenant.name}
              </option>
            ))}
          </select>
          {state.tenantsError && (
            <span class="form-error">{state.tenantsError}</span>
          )}
          {!state.tenantsError && state.tenantSlugError && state.touched && (
            <span class="form-error">{state.tenantSlugError}</span>
          )}
        </div>
        <div class="form-group">
          <label class="form-label-muted mb-2" for="phone">
            Phone Number
          </label>
          <input
            type="text"
            id="phone"
            required
            class={[
              "form-input w-full box-border transition-shadow",
              state.phoneError && state.touched ? "form-input-error ring-2 ring-danger-400" : "focus:ring-2 focus:ring-primary-400",
            ].join(' ')}
            placeholder="Enter your phone number"
            autoComplete="tel"
            value={state.phone}
            onInput$={handlePhoneInput}
          />
          {state.phoneError && state.touched && (
            <span class="form-error">{state.phoneError}</span>
          )}
        </div>
        <div class="form-group">
          <label class="form-label-muted mb-2" for="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            required
            minLength={6}
            class={[
              "form-input w-full box-border transition-shadow",
              state.passwordError && state.touched ? "form-input-error ring-2 ring-danger-400" : "focus:ring-2 focus:ring-primary-400",
            ].join(' ')}
            placeholder="Enter your password"
            autoComplete="current-password"
            value={state.password}
            onInput$={handlePasswordInput}
          />
          {state.passwordError && state.touched && (
            <span class="form-error">{state.passwordError}</span>
          )}
        </div>
        {state.apiError && (
          <div class="rounded-lg border border-danger-300 bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert" aria-live="polite">
            {state.apiError}
          </div>
        )}
        <Btn
          type="submit"
          class="w-full shadow-md hover:scale-105 active:scale-98 transition-transform font-semibold"
          disabled={state.loading || state.tenantsLoading || !!state.tenantsError || !!state.tenantSlugError || !!state.phoneError || !!state.passwordError || !state.tenantSlug || !state.phone || !state.password}
        >
          {state.loading ? 'Signing in...' : 'Sign In'}
        </Btn>
      </form>
      <div class="px-8 py-4 text-center  rounded-b-2xl">
        <span class="text-primary-100 font-sans text-sm hover:text-primary-50 transition-colors cursor-pointer">
          Forgot password? Contact Admin
        </span>
      </div>
    </div>
  </div>
</div>

    );
});