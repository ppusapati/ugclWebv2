// src/components/form-builder/renderer/StepNavigation.tsx
import { component$, $ } from '@builder.io/qwik';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onSaveDraft?: () => void;
  onCancel?: () => void;
  isLastStep: boolean;
}

export default component$<StepNavigationProps>((props) => {
  return (
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex justify-between items-center">
        {/* Left: Cancel / Previous */}
        <div>
          {props.currentStep === 0 ? (
            props.onCancel && (
              <button
                onClick$={props.onCancel}
                class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )
          ) : (
            <button
              onClick$={props.onPrevious}
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Previous
            </button>
          )}
        </div>

        {/* Center: Save Draft */}
        {props.onSaveDraft && (
          <button
            onClick$={props.onSaveDraft}
            class="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            💾 Save Draft
          </button>
        )}

        {/* Right: Next / Submit */}
        <div>
          {props.isLastStep ? (
            <button
              onClick$={props.onSubmit}
              class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Submit Form
            </button>
          ) : (
            <button
              onClick$={props.onNext}
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Step Indicators */}
      {props.totalSteps > 1 && (
        <div class="flex justify-center gap-2 mt-4">
          {Array.from({ length: props.totalSteps }).map((_, index) => (
            <div
              key={index}
              class={`h-2 rounded-full transition-all ${
                index === props.currentStep
                  ? 'w-8 bg-blue-600'
                  : index < props.currentStep
                  ? 'w-2 bg-blue-400'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
});
