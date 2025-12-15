// src/components/reports/ReportForm.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { reportService, getReportConfig, fileService } from '~/services';
import type { ReportKey } from '~/services';

interface ReportFormProps {
  reportType: ReportKey;
  reportId?: string;
  businessCode?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ReportForm = component$<ReportFormProps>(({ reportType, reportId, businessCode: _businessCode }) => {
  const nav = useNavigate();
  const isEdit = !!reportId;

  const formData = useSignal<Record<string, any>>({});
  const errors = useSignal<Record<string, string>>({});
  const loading = useSignal(false);
  const initialLoading = useSignal(isEdit);
  const success = useSignal(false);

  const config = getReportConfig(reportType);

  useVisibleTask$(async () => {
    // Initialize form with empty values
    const initial: Record<string, any> = {};
    config.fields.forEach((field: any) => {
      initial[field.name] = '';
    });
    formData.value = initial;

    // Load existing report if editing
    if (isEdit && reportId) {
      try {
        const report = await reportService.getReportById(reportType, reportId);
        formData.value = { ...initial, ...report };
      } catch (error) {
        console.error('Failed to load report:', error);
        nav(`/reports/${reportType}`);
      } finally {
        initialLoading.value = false;
      }
    }
  });

  const validate = $(() => {
    const newErrors: Record<string, string> = {};

    config.fields.forEach((field: any) => {
      if (field.required && !formData.value[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

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
      if (isEdit && reportId) {
        await reportService.updateReport(reportType, reportId, formData.value);
      } else {
        await reportService.createReport(reportType, formData.value);
      }

      success.value = true;
      setTimeout(() => {
        nav(`/reports/${reportType}`);
      }, 1500);
    } catch (error: any) {
      errors.value = {
        submit: error.message || `Failed to ${isEdit ? 'update' : 'create'} report`,
      };
    } finally {
      loading.value = false;
    }
  });

  const handleFileUpload = $(async (fieldName: string, file: File) => {
    try {
      const result = await fileService.uploadFile(file);
      formData.value = {
        ...formData.value,
        [fieldName]: result.file_url,
      };
    } catch (error: any) {
      errors.value = {
        ...errors.value,
        [fieldName]: error.message || 'Failed to upload file',
      };
    }
  });

  if (initialLoading.value) {
    return (
      <div class="min-h-screen bg-light-50 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-dark-600">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container-md mx-auto">
        <div class="mb-6">
          <button
            onClick$={() => nav(`/reports/${reportType}`)}
            class="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
          >
            <span>←</span> Back to {config.displayName}
          </button>
          <h1 class="text-3xl font-bold text-dark-800 flex items-center gap-3">
            <span class="text-4xl">{config.icon}</span>
            {isEdit ? 'Edit' : 'Create'} {config.displayName.slice(0, -1)}
          </h1>
          <p class="text-dark-600 mt-2">{config.description}</p>
        </div>

        <div class="card bg-white shadow-lg rounded-xl p-8">
          {success.value ? (
            <div class="text-center py-8">
              <div class="text-success-500 text-6xl mb-4">✓</div>
              <h3 class="text-2xl font-semibold text-dark-800 mb-2">
                {isEdit ? 'Report Updated!' : 'Report Created!'}
              </h3>
              <p class="text-dark-600">Redirecting...</p>
            </div>
          ) : (
            <form onSubmit$={handleSubmit} preventdefault:submit>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {config.fields.map((field: any) => (
                  <div
                    key={field.name}
                    class={field.type === 'textarea' ? 'md:col-span-2' : ''}
                  >
                    <label class="form-label text-dark-700 font-semibold mb-2">
                      {field.label}
                      {field.required && <span class="text-danger-500 ml-1">*</span>}
                    </label>

                    {/* Text Input */}
                    {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'number' || field.type === 'date' || field.type === 'time' || field.type === 'datetime') && (
                      <input
                        type={field.type}
                        value={formData.value[field.name]}
                        onInput$={(e) => {
                          formData.value = {
                            ...formData.value,
                            [field.name]: (e.target as HTMLInputElement).value,
                          };
                        }}
                        min={field.min}
                        max={field.max}
                        class={`form-input w-full px-4 py-3 border rounded-lg ${
                          errors.value[field.name]
                            ? 'border-danger-500'
                            : 'border-light-300 focus:ring-2 focus:ring-primary-400'
                        }`}
                        placeholder={field.placeholder}
                      />
                    )}

                    {/* Textarea */}
                    {field.type === 'textarea' && (
                      <textarea
                        value={formData.value[field.name]}
                        onInput$={(e) => {
                          formData.value = {
                            ...formData.value,
                            [field.name]: (e.target as HTMLTextAreaElement).value,
                          };
                        }}
                        rows={field.rows || 4}
                        class={`form-input w-full px-4 py-3 border rounded-lg ${
                          errors.value[field.name]
                            ? 'border-danger-500'
                            : 'border-light-300 focus:ring-2 focus:ring-primary-400'
                        }`}
                        placeholder={field.placeholder}
                      ></textarea>
                    )}

                    {/* Select */}
                    {field.type === 'select' && (
                      <select
                        value={formData.value[field.name]}
                        onChange$={(e) => {
                          formData.value = {
                            ...formData.value,
                            [field.name]: (e.target as HTMLSelectElement).value,
                          };
                        }}
                        class={`form-select w-full px-4 py-3 border rounded-lg ${
                          errors.value[field.name]
                            ? 'border-danger-500'
                            : 'border-light-300 focus:ring-2 focus:ring-primary-400'
                        }`}
                      >
                        <option value="">{`-- Select ${field.label} --`}</option>
                        {field.options?.map((option: any) => {
                          const value = typeof option === 'string' ? option : option.value;
                          const label = typeof option === 'string' ? option : option.label;
                          return (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    )}

                    {/* File Input */}
                    {(field.type === 'file' || field.type === 'file-multiple') && (
                      <div>
                        <input
                          type="file"
                          accept={field.accept}
                          multiple={field.type === 'file-multiple'}
                          onChange$={async (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files && files[0]) {
                              await handleFileUpload(field.name, files[0]);
                            }
                          }}
                          class="form-input w-full px-4 py-3 border border-light-300 rounded-lg"
                        />
                        {formData.value[field.name] && (
                          <p class="text-xs text-success-600 mt-1">
                            File uploaded successfully
                          </p>
                        )}
                      </div>
                    )}

                    {/* Checkbox */}
                    {field.type === 'checkbox' && (
                      <label class="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.value[field.name]}
                          onChange$={(e) => {
                            formData.value = {
                              ...formData.value,
                              [field.name]: (e.target as HTMLInputElement).checked,
                            };
                          }}
                          class="form-checkbox mr-3"
                        />
                        <span class="text-dark-700">{field.label}</span>
                      </label>
                    )}

                    {errors.value[field.name] && (
                      <p class="form-error text-danger-600 text-sm mt-1">
                        {errors.value[field.name]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {errors.value.submit && (
                <div class="alert-danger rounded-lg p-4 mt-6 bg-danger-50 border-l-4 border-danger-500">
                  <p class="text-danger-800">{errors.value.submit}</p>
                </div>
              )}

              <div class="flex gap-4 mt-8 flex-col sm:flex-row">
                <button
                  type="submit"
                  disabled={loading.value}
                  class="btn-primary flex-1 py-3 text-lg font-semibold rounded-lg disabled:opacity-50"
                >
                  {loading.value ? 'Saving...' : isEdit ? 'Update Report' : 'Create Report'}
                </button>
                <button
                  type="button"
                  onClick$={() => nav(`/reports/${reportType}`)}
                  class="btn-light-300 flex-1 py-3 text-lg font-semibold rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
});
