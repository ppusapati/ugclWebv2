// src/components/form-builder/renderer/StepNavigation.tsx
import { component$, type PropFunction } from '@builder.io/qwik';
import { Btn } from '~/components/ds';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious$: PropFunction<() => void>;
  onNext$: PropFunction<() => void>;
  onSubmit$: PropFunction<() => void>;
  onSaveDraft$?: PropFunction<() => void>;
  onCancel$?: PropFunction<() => void>;
  isLastStep: boolean;
}

export default component$<StepNavigationProps>((props) => {
  return (
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex justify-between items-center">
        {/* Left: Cancel / Previous */}
        <div>
          {props.currentStep === 0 ? (
            props.onCancel$ && (
              <Btn
                size="sm"
                variant="secondary"
                onClick$={props.onCancel$}
              >
                Cancel
              </Btn>
            )
          ) : (
            <Btn
              size="sm"
              variant="secondary"
              onClick$={props.onPrevious$}
            >
              <i class="i-heroicons-arrow-left-solid h-4 w-4 inline-block" aria-hidden="true"></i>
              Previous
            </Btn>
          )}
        </div>

        {/* Center: Save Draft */}
        {props.onSaveDraft$ && (
          <Btn
            size="sm"
            variant="secondary"
            onClick$={props.onSaveDraft$}
            class="text-blue-600"
          >
            <i class="i-heroicons-bookmark-square-solid h-4 w-4 inline-block" aria-hidden="true"></i>
            Save Draft
          </Btn>
        )}

        {/* Right: Next / Submit */}
        <div>
          {props.isLastStep ? (
            <Btn
              onClick$={props.onSubmit$}
              variant="primary"
            >
              Submit Form
            </Btn>
          ) : (
            <Btn
              onClick$={props.onNext$}
              variant="primary"
            >
              Next
              <i class="i-heroicons-arrow-right-solid h-4 w-4 inline-block" aria-hidden="true"></i>
            </Btn>
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
