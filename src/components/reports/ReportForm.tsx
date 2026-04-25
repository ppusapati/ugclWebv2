// src/components/reports/ReportForm.tsx
import { component$, isServer, useSignal, useTask$, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { reportService, getReportConfig, fileService } from '~/services';
import type { ReportKey } from '~/services';
import { Alert, Btn, FormField, SectionCard } from '~/components/ds';

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

  useTask$(async () => {
    if (isServer) {
      return;
    }

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
      <div class="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div class="text-center">
          <i class="i-heroicons-arrow-path-solid animate-spin mb-4 inline-block h-10 w-10 text-primary-500" aria-hidden="true"></i>
          <p class="text-neutral-600">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-neutral-50 py-8 px-4">
      <div class="container-md mx-auto">
        <div class="mb-6">
          <Btn
            size="sm"
            variant="ghost"
            onClick$={() => nav(`/reports/${reportType}`)}
            class="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
          >
            <i class="i-heroicons-arrow-left-solid h-4 w-4 inline-block" aria-hidden="true"></i>
            Back to {config.displayName}
          </Btn>
          <h1 class="text-3xl font-bold text-neutral-800 flex items-center gap-3">
            <i class={`${config.icon} h-10 w-10 inline-block text-primary-600`} aria-hidden="true"></i>
            {isEdit ? 'Edit' : 'Create'} {config.displayName.slice(0, -1)}
          </h1>
          <p class="text-neutral-600 mt-2">{config.description}</p>
        </div>

        <SectionCard class="p-8 shadow-lg">
          {success.value ? (
            <div class="text-center py-8">
              <i class="i-heroicons-check-circle-solid mb-4 inline-block h-14 w-14 text-success-500" aria-hidden="true"></i>
              <h3 class="text-2xl font-semibold text-neutral-800 mb-2">
                {isEdit ? 'Report Updated!' : 'Report Created!'}
              </h3>
              <p class="text-neutral-600">Redirecting...</p>
            </div>
          ) : (
            <form onSubmit$={handleSubmit} preventdefault:submit>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {config.fields.map((field: any) => (
                  <div
                    key={field.name}
                    class={field.type === 'textarea' ? 'md:col-span-2' : ''}
                  >
                    {field.type !== 'checkbox' ? (
                      <FormField
                        id={`report-form-${field.name}`}
                        label={field.label}
                        required={field.required}
                        error={errors.value[field.name]}
                      >

                        {/* Text Input */}
                        {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'number' || field.type === 'date' || field.type === 'time' || field.type === 'datetime') && (
                          <input
                            id={`report-form-${field.name}`}
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
                            required={field.required}
                            aria-required={field.required ? 'true' : undefined}
                            aria-describedby={errors.value[field.name] ? `report-form-${field.name}-error` : undefined}
                            class={`form-input w-full px-4 py-3 border rounded-lg ${
                              errors.value[field.name]
                                ? 'border-error-500'
                                : 'border-neutral-300 focus:ring-2 focus:ring-primary-400'
                            }`}
                            placeholder={field.placeholder}
                          />
                        )}

                        {/* Textarea */}
                        {field.type === 'textarea' && (
                          <textarea
                            id={`report-form-${field.name}`}
                            value={formData.value[field.name]}
                            onInput$={(e) => {
                              formData.value = {
                                ...formData.value,
                                [field.name]: (e.target as HTMLTextAreaElement).value,
                              };
                            }}
                            rows={field.rows || 4}
                            required={field.required}
                            aria-required={field.required ? 'true' : undefined}
                            aria-describedby={errors.value[field.name] ? `report-form-${field.name}-error` : undefined}
                            class={`form-input w-full px-4 py-3 border rounded-lg ${
                              errors.value[field.name]
                                ? 'border-error-500'
                                : 'border-neutral-300 focus:ring-2 focus:ring-primary-400'
                            }`}
                            placeholder={field.placeholder}
                          ></textarea>
                        )}

                        {/* Select */}
                        {field.type === 'select' && (
                          <select
                            id={`report-form-${field.name}`}
                            value={formData.value[field.name]}
                            onChange$={(e) => {
                              formData.value = {
                                ...formData.value,
                                [field.name]: (e.target as HTMLSelectElement).value,
                              };
                            }}
                            required={field.required}
                            aria-required={field.required ? 'true' : undefined}
                            aria-describedby={errors.value[field.name] ? `report-form-${field.name}-error` : undefined}
                            class={`form-select w-full px-4 py-3 border rounded-lg ${
                              errors.value[field.name]
                                ? 'border-error-500'
                                : 'border-neutral-300 focus:ring-2 focus:ring-primary-400'
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
                              id={`report-form-${field.name}`}
                              type="file"
                              accept={field.accept}
                              multiple={field.type === 'file-multiple'}
                              onChange$={async (e) => {
                                const files = (e.target as HTMLInputElement).files;
                                if (files && files[0]) {
                                  await handleFileUpload(field.name, files[0]);
                                }
                              }}
                              class="form-input w-full px-4 py-3 border border-neutral-300 rounded-lg"
                            />
                            {formData.value[field.name] && (
                              <p class="text-xs text-success-600 mt-1">
                                File uploaded successfully
                              </p>
                            )}
                          </div>
                        )}

                      </FormField>
                    ) : null}

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
                        <span class="text-neutral-700">{field.label}</span>
                      </label>
                    )}

                    {field.type === 'checkbox' && errors.value[field.name] && (
                      <p class="form-error text-error-600 text-sm mt-1">
                        {errors.value[field.name]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {errors.value.submit && (
                <Alert variant="error" class="mt-6 border-l-4">
                  <p class="text-error-800">{errors.value.submit}</p>
                </Alert>
              )}

              <div class="flex gap-4 mt-8 flex-col sm:flex-row">
                <Btn
                  type="submit"
                  disabled={loading.value}
                  variant="primary"
                  class="flex-1 py-3 text-lg font-semibold rounded-lg disabled:opacity-50"
                >
                  {loading.value ? 'Saving...' : isEdit ? 'Update Report' : 'Create Report'}
                </Btn>
                <Btn
                  type="button"
                  onClick$={() => nav(`/reports/${reportType}`)}
                  variant="secondary"
                  class="flex-1 py-3 text-lg font-semibold rounded-lg"
                >
                  Cancel
                </Btn>
              </div>
            </form>
          )}
        </SectionCard>
      </div>
    </div>
  );
});
