// src/components/form-builder/workflow/ValidationSummary.tsx
import { component$ } from '@builder.io/qwik';
import type { ValidationResult } from './validation';

interface ValidationSummaryProps {
  validation: ValidationResult;
  onClose?: () => void;
}

export default component$<ValidationSummaryProps>((props) => {
  if (props.validation.errors.length === 0 && props.validation.warnings.length === 0) {
    return null;
  }

  return (
    <div class="space-y-3">
      {/* Errors */}
      {props.validation.errors.length > 0 && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <h3 class="text-sm font-semibold text-red-900">
                {props.validation.errors.length} Error{props.validation.errors.length !== 1 ? 's' : ''} Found
              </h3>
            </div>
            {props.onClose && (
              <button
                onClick$={props.onClose}
                class="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            )}
          </div>
          <ul class="space-y-1">
            {props.validation.errors.map((error, index) => (
              <li key={index} class="text-sm text-red-800 flex items-start gap-2">
                <span class="text-red-500 font-bold">•</span>
                <div>
                  <span class="font-medium">{error.field}:</span> {error.message}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {props.validation.warnings.length > 0 && (
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <h3 class="text-sm font-semibold text-yellow-900">
                {props.validation.warnings.length} Warning{props.validation.warnings.length !== 1 ? 's' : ''}
              </h3>
            </div>
            {props.onClose && (
              <button
                onClick$={props.onClose}
                class="text-yellow-600 hover:text-yellow-800"
              >
                ✕
              </button>
            )}
          </div>
          <ul class="space-y-1">
            {props.validation.warnings.map((warning, index) => (
              <li key={index} class="text-sm text-yellow-800 flex items-start gap-2">
                <span class="text-yellow-500 font-bold">•</span>
                <div>
                  <span class="font-medium">{warning.field}:</span> {warning.message}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {props.validation.valid && props.validation.warnings.length === 0 && (
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <h3 class="text-sm font-semibold text-green-900">
              Workflow configuration is valid
            </h3>
          </div>
        </div>
      )}
    </div>
  );
});
