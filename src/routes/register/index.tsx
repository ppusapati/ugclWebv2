// src/routes/register/index.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { Alert, Btn, SectionCard } from '~/components/ds';
import { authService } from '~/services';

export default component$(() => {
  const nav = useNavigate();

  const formData = useSignal({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const errors = useSignal<Record<string, string>>({});
  const loading = useSignal(false);
  const showPassword = useSignal(false);
  const showConfirmPassword = useSignal(false);
  const success = useSignal(false);

  // Password strength calculator
  const getPasswordStrength = $((password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  });

  const passwordStrength = useSignal(0);

  const validatePhone = $((phone: string): boolean => {
    return /^\d{10}$/.test(phone);
  });

  const validateEmail = $((email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  });

  const validate = $(async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.value.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.value.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!(await validateEmail(formData.value.email))) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.value.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!(await validatePhone(formData.value.phone))) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    if (!formData.value.password) {
      newErrors.password = 'Password is required';
    } else if (formData.value.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.value.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.value.password !== formData.value.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.value.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    errors.value = newErrors;
    return Object.keys(newErrors).length === 0;
  });

  const handleSubmit = $(async (e: Event) => {
    e.preventDefault();

    if (!(await validate())) {
      return;
    }

    loading.value = true;
    errors.value = {};

    try {
      await authService.register({
        name: formData.value.name,
        email: formData.value.email,
        phone: formData.value.phone,
        password: formData.value.password,
      });

      success.value = true;

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        nav('/dashboard');
      }, 2000);
    } catch (error: any) {
      errors.value = {
        submit: error.message || 'Registration failed. Please try again.',
      };
    } finally {
      loading.value = false;
    }
  });

  const updatePasswordStrength = $(async () => {
    passwordStrength.value = await getPasswordStrength(formData.value.password);
  });

  const getStrengthColor = () => {
    if (passwordStrength.value < 40) return 'danger';
    if (passwordStrength.value < 70) return 'warning';
    return 'success';
  };

  const getStrengthText = () => {
    if (passwordStrength.value < 40) return 'Weak';
    if (passwordStrength.value < 70) return 'Medium';
    return 'Strong';
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div class="w-full max-w-lg">
        {/* Logo and Title */}
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-primary-600 mb-2">UGCL</h1>
          <h2 class="text-2xl font-semibold text-neutral-800">Create Account</h2>
          <p class="text-neutral-600 mt-2">Sign up to get started</p>
        </div>

        {/* Registration Card */}
        <SectionCard class="p-8 shadow-xl">
          {success.value ? (
            <div class="text-center py-8">
              <i class="i-heroicons-check-circle-solid h-16 w-16 inline-block text-success-500 mb-4" aria-hidden="true"></i>
              <h3 class="text-2xl font-semibold text-neutral-800 mb-2">
                Registration Successful!
              </h3>
              <p class="text-neutral-600">
                Redirecting you to dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit$={handleSubmit} preventdefault:submit>
              {/* Name Field */}
              <div class="form-group mb-5">
                <label class="form-label text-neutral-700 font-semibold mb-2">
                  Full Name <span class="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.value.name}
                  onInput$={(e) => {
                    formData.value = {
                      ...formData.value,
                      name: (e.target as HTMLInputElement).value,
                    };
                  }}
                  class={`form-input w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.value.name ? 'border-error-500 focus:ring-error-400' : 'border-neutral-300 focus:ring-primary-400'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.value.name && (
                  <p class="form-error text-error-600 text-sm mt-1">{errors.value.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div class="form-group mb-5">
                <label class="form-label text-neutral-700 font-semibold mb-2">
                  Email Address <span class="text-error-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.value.email}
                  onInput$={(e) => {
                    formData.value = {
                      ...formData.value,
                      email: (e.target as HTMLInputElement).value,
                    };
                  }}
                  class={`form-input w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.value.email ? 'border-error-500 focus:ring-error-400' : 'border-neutral-300 focus:ring-primary-400'
                  }`}
                  placeholder="your.email@example.com"
                />
                {errors.value.email && (
                  <p class="form-error text-error-600 text-sm mt-1">{errors.value.email}</p>
                )}
              </div>

              {/* Phone Field */}
              <div class="form-group mb-5">
                <label class="form-label text-neutral-700 font-semibold mb-2">
                  Phone Number <span class="text-error-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.value.phone}
                  onInput$={(e) => {
                    const value = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 10);
                    formData.value = {
                      ...formData.value,
                      phone: value,
                    };
                  }}
                  class={`form-input w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.value.phone ? 'border-error-500 focus:ring-error-400' : 'border-neutral-300 focus:ring-primary-400'
                  }`}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
                {errors.value.phone && (
                  <p class="form-error text-error-600 text-sm mt-1">{errors.value.phone}</p>
                )}
              </div>

              {/* Password Field */}
              <div class="form-group mb-5">
                <label class="form-label text-neutral-700 font-semibold mb-2">
                  Password <span class="text-error-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type={showPassword.value ? 'text' : 'password'}
                    value={formData.value.password}
                    onInput$={async (e) => {
                      formData.value = {
                        ...formData.value,
                        password: (e.target as HTMLInputElement).value,
                      };
                      await updatePasswordStrength();
                    }}
                    class={`form-input w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.value.password ? 'border-error-500 focus:ring-error-400' : 'border-neutral-300 focus:ring-primary-400'
                    }`}
                    placeholder="Create a strong password"
                  />
                  <Btn
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick$={() => {
                      showPassword.value = !showPassword.value;
                    }}
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <i
                      class={`${showPassword.value ? 'i-heroicons-eye-slash-solid' : 'i-heroicons-eye-solid'} h-5 w-5 inline-block`}
                      aria-hidden="true"
                    ></i>
                  </Btn>
                </div>
                {formData.value.password && (
                  <div class="mt-2">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-neutral-600">Password Strength:</span>
                      <span class={`text-${getStrengthColor()}-600 font-semibold`}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <div class="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        class={`bg-${getStrengthColor()}-500 h-2 rounded-full transition-all duration-300 w-[var(--progress-width)]`}
                        style={{ '--progress-width': `${passwordStrength.value}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {errors.value.password && (
                  <p class="form-error text-error-600 text-sm mt-1">{errors.value.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div class="form-group mb-5">
                <label class="form-label text-neutral-700 font-semibold mb-2">
                  Confirm Password <span class="text-error-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type={showConfirmPassword.value ? 'text' : 'password'}
                    value={formData.value.confirmPassword}
                    onInput$={(e) => {
                      formData.value = {
                        ...formData.value,
                        confirmPassword: (e.target as HTMLInputElement).value,
                      };
                    }}
                    class={`form-input w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.value.confirmPassword ? 'border-error-500 focus:ring-error-400' : 'border-neutral-300 focus:ring-primary-400'
                    }`}
                    placeholder="Re-enter your password"
                  />
                  <Btn
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick$={() => {
                      showConfirmPassword.value = !showConfirmPassword.value;
                    }}
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <i
                      class={`${showConfirmPassword.value ? 'i-heroicons-eye-slash-solid' : 'i-heroicons-eye-solid'} h-5 w-5 inline-block`}
                      aria-hidden="true"
                    ></i>
                  </Btn>
                </div>
                {errors.value.confirmPassword && (
                  <p class="form-error text-error-600 text-sm mt-1">{errors.value.confirmPassword}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div class="form-group mb-6">
                <label class="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.value.acceptTerms}
                    onChange$={(e) => {
                      formData.value = {
                        ...formData.value,
                        acceptTerms: (e.target as HTMLInputElement).checked,
                      };
                    }}
                    class="form-checkbox mt-1 mr-2"
                  />
                  <span class="text-sm text-neutral-600">
                    I accept the{' '}
                    <a href="/terms" class="text-primary-600 hover:underline">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" class="text-primary-600 hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {errors.value.acceptTerms && (
                  <p class="form-error text-error-600 text-sm mt-1">{errors.value.acceptTerms}</p>
                )}
              </div>

              {/* Submit Error */}
              {errors.value.submit && (
                <Alert variant="error" class="mb-5">
                  {errors.value.submit}
                </Alert>
              )}

              {/* Submit Button */}
              <Btn
                type="submit"
                disabled={loading.value}
                class="w-full py-3 text-lg font-semibold"
              >
                {loading.value ? 'Creating Account...' : 'Create Account'}
              </Btn>

              {/* Login Link */}
              <div class="text-center mt-6">
                <p class="text-neutral-600">
                  Already have an account?{' '}
                  <a href="/login" class="text-primary-600 hover:underline font-semibold">
                    Sign In
                  </a>
                </p>
              </div>
            </form>
          )}
        </SectionCard>
      </div>
    </div>
  );
});
