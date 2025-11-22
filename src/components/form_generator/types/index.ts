 
import type { PropFunction, NoSerialize, QRL } from "@builder.io/qwik";
import type { ValidateField, FormStore } from "@modular-forms/qwik";

export type SubmitValue = Record<string, any>;

export type P9EBaseProps = {
  class?: string;
  style?: string;
  animation?: string;
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";
};

export type P9EFormProps = {
  name?: string;
  value?: string;
  label?: string;
  error?: string;
  placeholder?: string;
  form?: string;
  hint?: string;
  disabled?:boolean;
};

export type P9EInputFunctions = {
  ref?: QRL<(element: HTMLInputElement) => void>;
  onInput$?: (event: Event, element: HTMLInputElement) => void;
  onChange$?: (event: Event, element: HTMLInputElement) => void;
  onBlur$?: (event: Event, element: HTMLInputElement) => void;
};

export type P9EIconProps = {
  icon?: string;
  iconSize?: number;
  iconColor?: string;
  iconClick$?: () => void;
  style?: string;
  class?: string;
};

export type P9EValidations = {
  required?: boolean;
};

export type P9EButtonProps = P9EBaseProps & P9EIconProps & P9EFormProps & {
  type?: "button" | "submit" | "reset";
  active?: boolean;
  loading?: boolean;
  'preventdefault:click'?: boolean;
  onClick$?: PropFunction<(data: SubmitValue) => void>;
};

export type P9LinkProps = P9EBaseProps & {
  type: "link";
  href: string;
  download?: boolean | string;
  target?: "_blank";
  "aria-label"?: string;
};

export type P9ETextInputProps = P9EBaseProps & P9EFormProps & P9EInputFunctions & P9EValidations & {
  type: "number" | "email" | "password" | "search" | "time" | "text" | "tel" | "url" | "date" | "datetime-local" | "month" | "week" |"select"| "file" |"checkbox" |"radio" |"textarea" |"group" | "checkbox-array";
  value: string | number | undefined | any;
};

export type P9ECheckboxProps = P9EBaseProps & P9EFormProps & P9EValidations & P9EInputFunctions & {
  checked?: boolean;
};

export type P9EFileInputProps = P9EBaseProps & P9EFormProps & P9EValidations & P9EInputFunctions & {
  value: NoSerialize<Blob> | NoSerialize<Blob>[] | NoSerialize<File> | NoSerialize<File>[] | null | undefined;
  accept?: string;
  multiple?: boolean;
};

export type P9ESelectProps = P9EBaseProps & P9EFormProps & P9EValidations & {
  value?: string | string[] | null | undefined;
  options?: { label: string; value: string }[];
  multiple?: boolean;
  size?: number;
  onInput$?: (event: Event, element: HTMLSelectElement) => void;
  onChange$?: (event: Event, element: HTMLSelectElement) => void;
  onBlur$?: (event: Event, element: HTMLSelectElement) => void;
  onSelect$?: (event: Event, element: HTMLSelectElement) => void;
};

export type P9ESliderProps = P9EBaseProps & P9EFormProps & P9EInputFunctions & P9EValidations & {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
};

export type P9EInputErrorProps = P9EFormProps & {};
export type P9EInputHintProps = P9EFormProps & {};

export type P9EInputLabelProps = P9EFormProps & P9EValidations & {
  margin?: "none";
};

export type P9EExpandableProps = P9EBaseProps & {
  id?: string;
  expanded: boolean;
};

export type P9ETabsProps = P9EBaseProps & {
  items: string[];
};

export type P9EResponseProps = P9EBaseProps & {
  of: FormStore<any, any>;
};

export type FormField<T> = P9EFormProps & P9ESelectProps & {
  name: keyof T;
  type: "number" | "email" | "password" | "search" | "time" | "text" | "tel" | "url" | "date" | "datetime-local" | "month" | "week" |"select"| "file" |"checkbox" |"radio" |"textarea" |"group" | "checkbox-array" |"range" | "avatar";
  fieldType?:"string" | "number" | "boolean" | "string[]" | "File[]" | "File" | "Date" | undefined
  placeholder?: string;
  hint?: string;
  validate?: QRL<ValidateField<string>>[];
  required?: boolean;
  options?: { label: string; value: string }[];
  multiple?: boolean;
  subFields?: FormField<any>[];
};
