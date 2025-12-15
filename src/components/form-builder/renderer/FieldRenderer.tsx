// src/components/form-builder/renderer/FieldRenderer.tsx
import { component$, useSignal, type PropFunction } from '@builder.io/qwik';
import type { FormField } from '~/types/workflow';
import TextField from './fields/TextField';
import TextAreaField from './fields/TextAreaField';
import NumberField from './fields/NumberField';
import DateField from './fields/DateField';
import SelectField from './fields/SelectField';
import FileUploadField from './fields/FileUploadField';

interface FieldRendererProps {
  field: FormField;
  value: any;
  error?: string;
  onChange$: PropFunction<(value: any) => void>;
  allFormData: Record<string, any>;
}

export default component$<FieldRendererProps>((props) => {
  const isVisible = useSignal(true);

  // Check visibility condition
  if (props.field.visible) {
    const condition = props.field.visible;
    const fieldValue = props.allFormData[condition.field];

    switch (condition.operator) {
      case 'equals':
        isVisible.value = fieldValue === condition.value;
        break;
      case 'not_equals':
        isVisible.value = fieldValue !== condition.value;
        break;
      case 'contains':
        isVisible.value = String(fieldValue || '').includes(String(condition.value));
        break;
      case 'greater_than':
        isVisible.value = parseFloat(fieldValue) > parseFloat(condition.value);
        break;
      case 'less_than':
        isVisible.value = parseFloat(fieldValue) < parseFloat(condition.value);
        break;
      default:
        isVisible.value = true;
    }
  }

  if (!isVisible.value) {
    return null;
  }

  const commonProps = {
    field: props.field,
    value: props.value,
    error: props.error,
    onChange$: props.onChange$,
  };

  return (
    <div class="field-container">
      {/* Render appropriate field type */}
      {props.field.type === 'text' && <TextField {...commonProps} />}
      {props.field.type === 'email' && <TextField {...commonProps} />}
      {props.field.type === 'phone' && <TextField {...commonProps} />}
      {props.field.type === 'textarea' && <TextAreaField {...commonProps} />}
      {props.field.type === 'number' && <NumberField {...commonProps} />}
      {props.field.type === 'date' && <DateField {...commonProps} />}
      {props.field.type === 'datetime' && <DateField {...commonProps} />}
      {props.field.type === 'time' && <DateField {...commonProps} />}
      {props.field.type === 'radio' && <SelectField {...commonProps} />}
      {props.field.type === 'checkbox' && <SelectField {...commonProps} />}
      {props.field.type === 'dropdown' && <SelectField {...commonProps} />}
      {props.field.type === 'file_upload' && <FileUploadField {...commonProps} />}

      {/* Fallback for unsupported types */}
      {!['text', 'email', 'phone', 'textarea', 'number', 'date', 'datetime', 'time', 'radio', 'checkbox', 'dropdown', 'file_upload'].includes(props.field.type) && (
        <div class="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p class="text-sm text-yellow-800">
            Field type "{props.field.type}" is not yet supported
          </p>
        </div>
      )}
    </div>
  );
});
