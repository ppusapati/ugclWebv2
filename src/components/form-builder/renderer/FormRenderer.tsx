// src/components/form-builder/renderer/FormRenderer.tsx
import { component$, useStore, useSignal, useVisibleTask$, $, type PropFunction } from '@builder.io/qwik';
import { formBuilderService } from '~/services';
import type { FormStep } from '~/types/workflow';
import StepNavigation from './StepNavigation';
import FieldRenderer from './FieldRenderer';

interface FormRendererProps {
  businessCode: string;
  formCode: string;
  initialData?: Record<string, any>;
  submissionId?: string;
  onSubmit$: PropFunction<(data: Record<string, any>) => void>;
  onSaveDraft$?: PropFunction<(data: Record<string, any>) => void>;
  onCancel$?: PropFunction<() => void>;
}

export default component$<FormRendererProps>((props) => {
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const currentStep = useSignal(0);

  const formDefinition = useStore<{
    title: string;
    description?: string;
    steps: FormStep[];
    ui_config?: any;
  }>({
    title: '',
    steps: [],
  });

  const formData = useStore<Record<string, any>>(props.initialData || {});
  const errors = useStore<Record<string, string>>({});

  // Load form definition
  useVisibleTask$(async () => {
    try {
      loading.value = true;
      const form = await formBuilderService.getFormByCode(props.formCode);

      formDefinition.title = form.title;
      formDefinition.description = form.description;
      formDefinition.steps = form.steps || [];
      formDefinition.ui_config = form.ui_config;
    } catch (err: any) {
      error.value = err.message || 'Failed to load form';
    } finally {
      loading.value = false;
    }
  });

  const validateStep = $(async (stepIndex: number): Promise<boolean> => {
    const step = formDefinition.steps[stepIndex];
    if (!step) return true;

    let isValid = true;

    for (const field of step.fields) {
      const value = formData[field.id];

      // Required validation
      if (field.required && (!value || value === '')) {
        errors[field.id] = field.validation?.message || `${field.label} is required`;
        isValid = false;
        continue;
      }

      // Type-specific validation
      if (field.type === 'number' && value !== undefined && value !== '') {
        const numValue = parseFloat(value);
        if (field.min !== undefined && numValue < field.min) {
          errors[field.id] = `Value must be at least ${field.min}`;
          isValid = false;
        }
        if (field.max !== undefined && numValue > field.max) {
          errors[field.id] = `Value must be at most ${field.max}`;
          isValid = false;
        }
      }

      // Clear error if valid
      if (isValid) {
        delete errors[field.id];
      }
    }

    return isValid;
  });

  const handleNext = $(async () => {
    const isValid = await validateStep(currentStep.value);
    if (!isValid) return;

    if (currentStep.value < formDefinition.steps.length - 1) {
      currentStep.value++;
    }
  });

  const handlePrevious = $(() => {
    if (currentStep.value > 0) {
      currentStep.value--;
    }
  });

  const handleSubmit = $(async () => {
    // Validate all steps
    for (let i = 0; i < formDefinition.steps.length; i++) {
      const isValid = await validateStep(i);
      if (!isValid) {
        currentStep.value = i;
        return;
      }
    }

    await props.onSubmit$(formData);
  });

  const handleSaveDraft = $(async () => {
    if (props.onSaveDraft$) {
      await props.onSaveDraft$(formData);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFieldChange = $((fieldId: string, value: any) => {
    formData[fieldId] = value;
    // Clear error when field changes
    delete errors[fieldId];
  });

  if (loading.value) {
    return (
      <div class="flex justify-center items-center min-h-screen">
        <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error.value) {
    return (
      <div class="max-w-2xl mx-auto p-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 class="text-red-800 font-medium">Error Loading Form</h2>
          <p class="text-red-600 mt-2">{error.value}</p>
        </div>
      </div>
    );
  }

  const currentStepData = formDefinition.steps[currentStep.value];

  return (
    <div class="form-renderer min-h-screen bg-gray-50 py-8">
      <div class="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 class="text-2xl font-bold text-gray-900">{formDefinition.title}</h1>
          {formDefinition.description && (
            <p class="text-gray-600 mt-2">{formDefinition.description}</p>
          )}

          {/* Progress Indicator */}
          {formDefinition.ui_config?.show_progress && formDefinition.steps.length > 1 && (
            <div class="mt-4">
              <div class="flex justify-between text-sm text-gray-600 mb-2">
                <span>Step {currentStep.value + 1} of {formDefinition.steps.length}</span>
                <span>{Math.round(((currentStep.value + 1) / formDefinition.steps.length) * 100)}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={`width: ${((currentStep.value + 1) / formDefinition.steps.length) * 100}%`}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Current Step */}
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 class="text-xl font-bold mb-2">{currentStepData?.title}</h2>
          {currentStepData?.description && (
            <p class="text-gray-600 mb-6">{currentStepData.description}</p>
          )}

          {/* Fields */}
          <div class="space-y-6">
            {currentStepData?.fields.map((field) => {
              const onChange = $((value: any) => {
                formData[field.id] = value;
                delete errors[field.id];
              });
              
              return (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={formData[field.id]}
                  error={errors[field.id]}
                  onChange$={onChange}
                  allFormData={formData}
                />
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <StepNavigation
          currentStep={currentStep.value}
          totalSteps={formDefinition.steps.length}
          onPrevious$={handlePrevious}
          onNext$={handleNext}
          onSubmit$={handleSubmit}
          onSaveDraft$={formDefinition.ui_config?.allow_save_draft ? handleSaveDraft : undefined}
          onCancel$={props.onCancel$}
          isLastStep={currentStep.value === formDefinition.steps.length - 1}
        />
      </div>
    </div>
  );
});
