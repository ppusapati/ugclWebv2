import type { NoSerialize } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { InitialValues } from "@modular-forms/qwik";
import { required } from "@modular-forms/qwik";
import type { FormField } from "~/components/form_generator";

export type FileUpload = {
    file?: NoSerialize<File>;
  };
  
  // Define the fields for the candidate form
  export const fileUploadFields: FormField<FileUpload>[] = [
  {
  name: 'file',
  type: 'file',
  label: 'Resume Parsing',
  placeholder: 'Upload Resume',
  validate: [required<string>('Last name is required.')],
  required:true,
  hint: "Upload your Resume for Parsing"
  },
  ];
  
  // Example of how to use a loader or state initializer
  export const useFormLoader = routeLoader$<InitialValues<FileUpload>>(() => ({
  file: undefined,
  }));
  