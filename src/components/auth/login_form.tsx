import { $, component$, useStore } from "@builder.io/qwik";
import { isValidPhone } from "~/utils/validations";
import { useNavigate } from '@builder.io/qwik-city';

export const LoginForm = component$(() => {
  const nav = useNavigate();
    const state = useStore({
        phone: '',
        password: '',
        loading: false,
        success: false,
        touched: false,
        phoneError: null as string | null,
        passwordError: null as string | null,
        apiError: '',
        apiSuccess: false,
    });

    const handlePhoneInput = $((e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        state.phone = value;
        state.touched = true;
        if (!value.trim()) {
            state.phoneError = 'Password is required';
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
const API_URL = 'https://ugcl-429789556411.asia-south1.run.app/api/v1';
// const API_URL = 'http://localhost:8080/api/v1'; // Use local API for development
    const handleSubmit = $(async (e: Event) => {
        e.preventDefault();
        state.touched = true;
        if (!isValidPhone(state.phone)) {
            state.phoneError = 'Phone number must be exactly 10 digits';
            return;
        }
        // Proceed with form submission (API call, etc.)
        try {
            const resp = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: state.phone,
                    password: state.password,
                }),
            });

            if (!resp.ok) {
                const error = await resp.text();
                state.apiError = `Login failed: ${error}`;
            } else {
                const data = await resp.json();
                state.apiSuccess = true;
                // Store in localStorage for client-side
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);

                // Also store in cookies for SSR (routeLoader$ access)
                document.cookie = `token=${data.token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
                document.cookie = `user=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

                nav('/admin/dashboard'); 
                // alert('Login successful! Response: ' + JSON.stringify(data));
            }
        } catch (err: any) {
            state.apiError = 'Network error: ' + err?.message || 'Unknown error';
        } finally {
            state.loading = false;
        }
    });
    return (
    <div class="min-h-screen bg-gradient-to-tr from-primary-400 via-light-650 to-white flex items-center justify-center">
  <div class="flex flex-col items-center w-full max-w-md">
    <div class="flex items-center justify-center mb-4 ">
      <img src="/logo.png" alt="Logo" class="w-36" />
    </div>
    <div class="w-full shadow-xl rounded-2xl animate-fade-in overflow-hidden border border-light-200">
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
        <button
          type="submit"
          class="btn btn-primary w-full shadow-md hover:scale-105 active:scale-98 transition-transform font-semibold"
          disabled={!!state.phoneError || !!state.passwordError || !state.phone}
        >
          Sign In
        </button>
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