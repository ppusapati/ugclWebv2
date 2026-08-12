import { $, component$, useStore } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { Btn } from '~/components/ds/btn';
import { platformService, PlatformApiError } from '~/services/platform.service';

export const PlatformLoginForm = component$(() => {
  const nav = useNavigate();
  const state = useStore({
    email: '',
    password: '',
    loading: false,
    error: '',
  });

  const handleSubmit = $(async () => {
    if (state.loading) return;

    state.error = '';
    if (!state.email.trim()) {
      state.error = 'Email is required';
      return;
    }
    if (!state.password) {
      state.error = 'Password is required';
      return;
    }

    state.loading = true;
    try {
      await platformService.login(state.email.trim(), state.password);
      await nav('/platform/tenants');
    } catch (err) {
      state.error =
        err instanceof PlatformApiError
          ? err.message
          : 'Network error. Please try again.';
    } finally {
      state.loading = false;
    }
  });

  return (
    <div class="min-h-screen bg-gradient-to-tr from-neutral-800 via-neutral-700 to-neutral-900 flex items-center justify-center">
      <div class="flex flex-col items-center w-full max-w-md">
        <div class="w-full shadow-xl rounded-2xl overflow-hidden border border-neutral-200">
          <div class="bg-neutral-900 p-6 text-center rounded-t-2xl">
            <h2 class="h-2-bold text-white tracking-wide">
              Platform Admin
            </h2>
            <p class="text-neutral-400 text-sm mt-1">
              Cross-tenant operator access
            </p>
          </div>
          <form
            class="flex flex-col gap-2 p-8 bg-white"
            preventdefault:submit
            onSubmit$={handleSubmit}
          >
            <div class="form-group">
              <label class="form-label-muted mb-2" for="platform-email">
                Email
              </label>
              <input
                type="email"
                id="platform-email"
                required
                class="form-input w-full box-border transition-shadow focus:ring-2 focus:ring-primary-400"
                placeholder="Enter your email"
                autoComplete="username"
                value={state.email}
                onInput$={(e) => {
                  state.email = (e.target as HTMLInputElement).value;
                }}
              />
            </div>
            <div class="form-group">
              <label class="form-label-muted mb-2" for="platform-password">
                Password
              </label>
              <input
                type="password"
                id="platform-password"
                required
                class="form-input w-full box-border transition-shadow focus:ring-2 focus:ring-primary-400"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={state.password}
                onInput$={(e) => {
                  state.password = (e.target as HTMLInputElement).value;
                }}
              />
            </div>
            {state.error && (
              <div
                class="rounded-lg border border-danger-300 bg-danger-50 px-3 py-2 text-sm text-danger-700"
                role="alert"
                aria-live="polite"
              >
                {state.error}
              </div>
            )}
            <Btn
              type="submit"
              class="w-full shadow-md hover:scale-105 active:scale-98 transition-transform font-semibold"
              disabled={state.loading || !state.email || !state.password}
            >
              {state.loading ? 'Signing in...' : 'Sign In'}
            </Btn>
          </form>
        </div>
      </div>
    </div>
  );
});
