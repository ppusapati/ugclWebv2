/**
 * Project Create Form Component
 * Form for creating new projects and uploading KMZ files
 */

import { component$, useStore, useSignal, $, type QRL, noSerialize, type NoSerialize } from '@builder.io/qwik';
import type { CreateProjectRequest } from '../../types/project';

export interface ProjectCreateFormProps {
  businessVerticals: Array<{ id: string; name: string; code: string }>;
  onSubmit$: QRL<(data: CreateProjectRequest, kmzFile?: File) => Promise<void>>;
  onCancel$?: QRL<() => void>;
}

export const ProjectCreateForm = component$<ProjectCreateFormProps>(({
  businessVerticals,
  onSubmit$,
  onCancel$,
}) => {
  const state = useStore({
    code: '',
    name: '',
    description: '',
    business_vertical_id: '',
    start_date: '',
    end_date: '',
    total_budget: '',
    currency: 'INR',
    errors: {} as Record<string, string>,
    touched: {} as Record<string, boolean>,
    submitting: false,
    apiError: '',
  });

  const kmzFile = useSignal<NoSerialize<File> | null>(null);
  const fileInputRef = useSignal<HTMLInputElement>();

  const handleFileSelect = $((e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.kmz')) {
        state.errors.kmz = 'Please select a valid KMZ file';
        kmzFile.value = null;
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        state.errors.kmz = 'File size must be less than 50MB';
        kmzFile.value = null;
        return;
      }

  kmzFile.value = noSerialize(file);
  // Clear any previous KMZ error by removing the key entirely
  delete state.errors.kmz;
    }
  });

  const removeFile = $(() => {
    kmzFile.value = null;
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
    // KMZ is optional; ensure no lingering error remains
    delete state.errors.kmz;
  });

  const validateField = $((field: string, value: string) => {
    switch (field) {
      case 'code':
        if (!value.trim()) {
          state.errors.code = 'Project code is required';
        } else if (!/^[A-Z0-9_-]+$/i.test(value)) {
          state.errors.code = 'Code can only contain letters, numbers, hyphens, and underscores';
        } else {
          delete state.errors.code;
        }
        break;

      case 'name':
        if (!value.trim()) {
          state.errors.name = 'Project name is required';
        } else if (value.length < 3) {
          state.errors.name = 'Name must be at least 3 characters';
        } else {
          delete state.errors.name;
        }
        break;

      case 'business_vertical_id':
        if (!value) {
          state.errors.business_vertical_id = 'Please select a business vertical';
        } else {
          delete state.errors.business_vertical_id;
        }
        break;

      case 'total_budget':
        if (value && (isNaN(Number(value)) || Number(value) < 0)) {
          state.errors.total_budget = 'Budget must be a positive number';
        } else {
          delete state.errors.total_budget;
        }
        break;

      case 'start_date':
      case 'end_date':
        if (state.start_date && state.end_date) {
          if (new Date(state.start_date) > new Date(state.end_date)) {
            state.errors.end_date = 'End date must be after start date';
          } else {
            delete state.errors.end_date;
          }
        }
        break;
    }
  });

  const handleSubmit = $(async (e: Event) => {
    e.preventDefault();
    console.debug('[ProjectCreateForm] Submit clicked');

    // Mark all as touched
    state.touched = {
      code: true,
      name: true,
      business_vertical_id: true,
    };

    // Validate all fields
    await validateField('code', state.code);
    await validateField('name', state.name);
    await validateField('business_vertical_id', state.business_vertical_id);
    await validateField('total_budget', state.total_budget);

    // Remove any error entries that are empty strings or falsy
    for (const key in state.errors) {
      if (!state.errors[key]) {
        delete state.errors[key];
      }
    }

    if (Object.keys(state.errors).length > 0) {
      console.warn('[ProjectCreateForm] Validation failed:', state.errors);
      return;
    }

    state.submitting = true;
    state.apiError = '';

    try {
      const projectData: CreateProjectRequest = {
        code: state.code.trim(),
        name: state.name.trim(),
        description: state.description.trim() || undefined,
        business_vertical_id: state.business_vertical_id,
        start_date: state.start_date || undefined,
        end_date: state.end_date || undefined,
        total_budget: state.total_budget ? Number(state.total_budget) : undefined,
        currency: state.currency,
      };

      console.debug('[ProjectCreateForm] Passing data to parent submit');
      await onSubmit$(projectData, (kmzFile.value as unknown as File) || undefined);
    } catch (error: any) {
      state.apiError = error.message || 'Failed to create project';
      console.error('[ProjectCreateForm] API error:', error);
    } finally {
      state.submitting = false;
    }
  });

  return (
    <form preventdefault:submit onSubmit$={handleSubmit} class="space-y-5">
      {/* API Error */}
      {state.apiError && (
        <div class="alert-error p-3 rounded-md text-sm">
          <i class="i-heroicons-exclamation-circle-solid w-4 h-4 inline-block mr-2"></i>
          {state.apiError}
        </div>
      )}

      {/* Project Code */}
      <div>
        <label class="form-label">
          Project Code <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          class={`form-input w-full ${state.errors.code && state.touched.code ? 'form-input-error' : ''}`}
          placeholder="e.g., PROJ-2024-001"
          value={state.code}
          onInput$={(e) => {
            state.code = (e.target as HTMLInputElement).value.toUpperCase();
            state.touched.code = true;
          }}
          onBlur$={() => validateField('code', state.code)}
        />
        {state.errors.code && state.touched.code && (
          <div class="form-error mt-1">{state.errors.code}</div>
        )}
      </div>

      {/* Project Name */}
      <div>
        <label class="form-label">
          Project Name <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          class={`form-input w-full ${state.errors.name && state.touched.name ? 'form-input-error' : ''}`}
          placeholder="Enter project name"
          value={state.name}
          onInput$={(e) => {
            state.name = (e.target as HTMLInputElement).value;
            state.touched.name = true;
          }}
          onBlur$={() => validateField('name', state.name)}
        />
        {state.errors.name && state.touched.name && (
          <div class="form-error mt-1">{state.errors.name}</div>
        )}
      </div>

      {/* Business Vertical */}
      <div>
        <label class="form-label">
          Business Vertical <span class="text-red-500">*</span>
        </label>
        <select
          class={`form-input w-full ${state.errors.business_vertical_id && state.touched.business_vertical_id ? 'form-input-error' : ''}`}
          value={state.business_vertical_id}
          onChange$={(e) => {
            state.business_vertical_id = (e.target as HTMLSelectElement).value;
            state.touched.business_vertical_id = true;
            validateField('business_vertical_id', state.business_vertical_id);
          }}
        >
          <option value="">Select Business Vertical</option>
          {businessVerticals.map(bv => (
            <option key={bv.id} value={bv.id}>{bv.name}</option>
          ))}
        </select>
        {state.errors.business_vertical_id && state.touched.business_vertical_id && (
          <div class="form-error mt-1">{state.errors.business_vertical_id}</div>
        )}
      </div>

      {/* Description */}
      <div>
        <label class="form-label">Description</label>
        <textarea
          class="form-input w-full min-h-20"
          placeholder="Enter project description (optional)"
          value={state.description}
          onInput$={(e) => {
            state.description = (e.target as HTMLTextAreaElement).value;
          }}
        />
      </div>

      {/* Date Range */}
      <div class="grid grid-cols-2 gap-12">
        <div>
          <label class="form-label">Start Date</label>
          <input
            type="date"
            class="form-input w-full"
            value={state.start_date}
            onInput$={(e) => {
              state.start_date = (e.target as HTMLInputElement).value;
              validateField('start_date', state.start_date);
            }}
          />
        </div>
        <div>
          <label class="form-label">End Date</label>
          <input
            type="date"
            class={`form-input w-full ${state.errors.end_date ? 'form-input-error' : ''}`}
            value={state.end_date}
            onInput$={(e) => {
              state.end_date = (e.target as HTMLInputElement).value;
              validateField('end_date', state.end_date);
            }}
          />
          {state.errors.end_date && (
            <div class="form-error mt-1">{state.errors.end_date}</div>
          )}
        </div>
      </div>

      {/* Budget */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="md:col-span-2">
          <label class="form-label">Total Budget</label>
          <input
            type="number"
            step="0.01"
            class={`form-input w-full ${state.errors.total_budget ? 'form-input-error' : ''}`}
            placeholder="Enter budget amount"
            value={state.total_budget}
            onInput$={(e) => {
              state.total_budget = (e.target as HTMLInputElement).value;
              validateField('total_budget', state.total_budget);
            }}
          />
          {state.errors.total_budget && (
            <div class="form-error mt-1">{state.errors.total_budget}</div>
          )}
        </div>
        <div>
          <label class="form-label">Currency</label>
          <select
            class="form-input w-full"
            value={state.currency}
            onChange$={(e) => {
              state.currency = (e.target as HTMLSelectElement).value;
            }}
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>

      {/* KMZ File Upload */}
      <div>
        <label class="form-label">KMZ File (Optional)</label>
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          {!kmzFile.value ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".kmz"
                class="hidden"
                onChange$={handleFileSelect}
                id="kmz-upload"
              />
              <label for="kmz-upload" class="cursor-pointer">
                <div class="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                  <i class="i-heroicons-arrow-up-tray-solid w-8 h-8 inline-block text-blue-600"></i>
                </div>
                <p class="text-sm font-medium text-gray-700 mb-1">Click to upload KMZ file</p>
                <p class="text-xs text-gray-500">Maximum file size: 50MB</p>
              </label>
            </div>
          ) : (
            <div class="flex items-center justify-between bg-blue-50 rounded p-3">
              <div class="flex items-center gap-2">
                <i class="i-heroicons-document-solid w-6 h-6 inline-block text-blue-600"></i>
                <div class="text-left">
                  <div class="text-sm font-medium text-gray-900">{kmzFile.value.name}</div>
                  <div class="text-xs text-gray-500">
                    {(kmzFile.value.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick$={removeFile}
                class="text-red-600 hover:text-red-700 p-1"
              >
                <i class="i-heroicons-x-circle-solid w-6 h-6 inline-block"></i>
              </button>
            </div>
          )}
        </div>
        {state.errors.kmz && (
          <div class="form-error mt-1">{state.errors.kmz}</div>
        )}
      </div>

      {/* Form Actions */}
      <div class="flex gap-3 pt-4 border-t border-gray-200">
        {onCancel$ && (
          <button
            type="button"
            onClick$={onCancel$}
            class="btn btn-secondary flex-1"
            disabled={state.submitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          class="btn btn-primary flex-1"
          disabled={state.submitting}
        >
          {state.submitting ? (
            <>
              <i class="i-heroicons-arrow-path-solid w-4 h-4 inline-block text-white animate-spin mr-2"></i>
              Creating...
            </>
          ) : (
            <>
              <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-2"></i>
              Create Project
            </>
          )}
        </button>
      </div>
    </form>
  );
});
