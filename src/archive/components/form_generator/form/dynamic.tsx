 
import { component$, type QRL, useSignal } from "@builder.io/qwik";
import { useForm } from "@modular-forms/qwik";
import { type FormField } from "../types";
import { FormFooter, FormHeader, P9ECheckbox, P9EFileInput, P9ESelect, P9ETextInput } from "../elements";
import { P9EAvatar } from "../elements/avatar";
import { P9ETextEditor } from "../elements/text_editor";
export type DynamicProps<T> = {
  formFields: FormField<T>[];
  heading: string;
  formLoader?: any;
  onClick$: QRL<(values: any) => Promise<void>>;
};

export const DynamicForm = component$((props: DynamicProps<any>) => {
  const [formState, { Form, Field }] = useForm<any>({
    loader: useSignal(props.formLoader),
  });

  const renderField = (fieldConfig: FormField<any>, fieldProps: any, field: any) => {
    switch (fieldConfig.type) {
      case "text":
      case "email":
      case "number":
      case "password":
      case "url":
      case "date":
      case "datetime-local":
      case "month":
      case "week":
      case "time":
      case "search":
      case "tel":
        return (
          <P9ETextInput
            {...fieldProps}
            value={field.value}
            error={field.error}
            type={fieldConfig.type}
            label={fieldConfig.label}
            placeholder={fieldConfig.placeholder}
            required={fieldConfig.required}
            hint={fieldConfig.hint}
          />
        );
        case "textarea":
        return (
          <P9ETextEditor
            {...fieldProps}
            value={field.value}
            error={field.error}
            type={fieldConfig.type}
            label={fieldConfig.label}
            placeholder={fieldConfig.placeholder}
            required={fieldConfig.required}
            hint={fieldConfig.hint}
          />
        );
        case "avatar":
        return (
          <P9EAvatar
            {...fieldProps}
            value={field.value}
            error={field.error}
            type={fieldConfig.type}
            label={fieldConfig.label}
            placeholder={fieldConfig.placeholder}
            required={fieldConfig.required}
            hint={fieldConfig.hint}
          />
        );
      case "select":
        return (
          <P9ESelect
            {...fieldProps}
            value={field.value}
            options={fieldConfig.options || []}
            error={field.error}
            label={fieldConfig.label}
            multiple={fieldConfig.multiple}
            required={fieldConfig.required}
            hint={fieldConfig.hint}
          />
        );
        case 'range':
        return (
              <P9ETextInput
                {...fieldProps}
                value={field.value}
                error={field.error}
                type={fieldConfig.type}
                label={fieldConfig.label}
              />
        );
      case "file":
        return (
          <P9EFileInput {...fieldProps} value={field.value} error={field.error} label={fieldConfig.label} multiple={fieldConfig.multiple} required={fieldConfig.required} hint={fieldConfig.hint} />
        );
      case "checkbox":
        return (
          <P9ECheckbox
                {...fieldProps}
                class="!p-0"
                label={fieldConfig.label}
                value={field.value}
                checked={field.value}
                error={field.error}
                required={fieldConfig.required}
                hint={fieldConfig.hint}
              />
        );
        case 'checkbox-array':
        return (
          <>
            <label class="block px-8 font-medium md:text-lg lg:mb-5 lg:px-10 lg:text-xl">
              {fieldConfig.label}
            </label>
            <div class="mx-8 flex flex-wrap gap-6 rounded-2xl border-2 border-slate-200 p-6 dark:border-slate-800 lg:gap-10 lg:p-10">
              {fieldConfig.options?.map(({ label, value }) => (
                    <P9ECheckbox
                      {...fieldProps}
                      key={value}
                      class="!p-0"
                      label={label}
                      value={value}
                      checked={Array.isArray(field.value) ? (field.value as string[]).includes(value) : false}
                      error={field.error ?? ''}
                    />
              ))}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Form class="py-2" onSubmit$={props.onClick$}>
    <FormHeader of={formState} heading={props.heading} />
    <div class="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-col-3 items-center justify-center">
      {props.formFields.map((fieldConfig) => 
        fieldConfig.type === 'group' ? (
            <div key={fieldConfig.name} class='w-full flex flex-col gap-row-1'>
              {fieldConfig.subFields?.map((subField) => (
                <Field
                  key={subField.name}
                  name={`${fieldConfig.name}.${subField.name}`}
                  validate={subField.validate}
                  type={subField.fieldType}
                >
                  {(subFieldField, subFieldProps) =>
                    renderField(subField, subFieldProps, subFieldField)
                  }
                </Field>
              ))}
            </div>
          ) : (
            <div key={fieldConfig.name} class='w-full flex flex-col gap-row-2'>
            <Field key={fieldConfig.name} name={fieldConfig.name} validate={fieldConfig.validate} type={fieldConfig.fieldType}>
              {(field, fieldProps) => renderField(fieldConfig, fieldProps, field)}
            </Field>
            </div>
          )
      )}
    </div>
    <FormFooter of={formState} />
  </Form>
  );
});
// function mapFieldTypeToDataType(type: string): string | undefined {
//   switch (type) {
//     case "text":
//     case "email":
//     case "password":
//     case "search":
//     case "tel":
//     case "url":
//     case "date":
//     case "datetime-local":
//     case "month":
//     case "week":
//     case "select":
//     case "textarea":
//     case "avatar":
//       return "string";
//     case "number":
//     case "range":
//       return "number";
//     case "checkbox":
//       return "boolean";
//     case "checkbox-array":
//       return "string[]";
//     case "file":
//       return "File";
//     default:
//       return undefined;
//   }
// }