// src/components/form-builder/renderer/fields/FileUploadField.tsx
import { component$, useSignal, $, type PropFunction } from '@builder.io/qwik';
import { Btn, FormField } from '~/components/ds';
import { fileService } from '~/services';
import type { FormField as WorkflowFormField } from '~/types/workflow';

interface FileUploadFieldProps {
  field: WorkflowFormField;
  value: string | string[];
  error?: string;
  onChange$: PropFunction<(value: string | string[]) => void>;
}

export default component$<FileUploadFieldProps>((props) => {
  const uploading = useSignal(false);
  const uploadProgress = useSignal(0);
  const uploadedFiles = useSignal<string[]>(
    Array.isArray(props.value) ? props.value : props.value ? [props.value] : []
  );
  const isCameraField = props.field.type === 'camera';
  const acceptedTypes = props.field.accept || (isCameraField ? 'image/*' : undefined);

  // Treat maxSizePerFile as MB; keep compatibility for legacy byte-based values.
  const maxSizeInMB = (() => {
    if (!props.field.maxSizePerFile || props.field.maxSizePerFile <= 0) return undefined;
    return props.field.maxSizePerFile > 1024
      ? props.field.maxSizePerFile / (1024 * 1024)
      : props.field.maxSizePerFile;
  })();

  const maxSizeInBytes = maxSizeInMB ? maxSizeInMB * 1024 * 1024 : undefined;

  const handleFileSelect = $(async (e: Event) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    // Validate file count
    if (props.field.maxFiles && uploadedFiles.value.length + files.length > props.field.maxFiles) {
      alert(`Maximum ${props.field.maxFiles} files allowed`);
      return;
    }

    // Validate file sizes
    for (const file of Array.from(files)) {
      if (maxSizeInBytes && file.size > maxSizeInBytes) {
        alert(`File ${file.name} exceeds maximum size of ${maxSizeInMB}MB`);
        return;
      }
    }

    try {
      uploading.value = true;
      uploadProgress.value = 0;

      const fileArray = Array.from(files);
      const responses = await fileService.uploadFiles(fileArray);
      const newUrls = responses.map(r => r.file_url);

      const allFiles = [...uploadedFiles.value, ...newUrls];
      uploadedFiles.value = allFiles;

      // Update form value
      if (props.field.multiple) {
        await props.onChange$(allFiles);
      } else {
        await props.onChange$(allFiles[0] || '');
      }

      uploadProgress.value = 100;
    } catch (error: any) {
      alert('Upload failed: ' + error.message);
    } finally {
      uploading.value = false;
      uploadProgress.value = 0;
    }
  });

  const removeFile = $(async (index: number) => {
    const newFiles = uploadedFiles.value.filter((_, i) => i !== index);
    uploadedFiles.value = newFiles;

    if (props.field.multiple) {
      await props.onChange$(newFiles);
    } else {
      await props.onChange$(newFiles[0] || '');
    }
  });

  return (
    <div class="field-wrapper">
      <FormField
        id={`file-input-${props.field.id}`}
        label={props.field.label}
        required={props.field.required}
        hint={props.field.hint}
        error={props.error}
      >

        {/* File Input */}
        <div class="relative">
        <input
          type="file"
          accept={acceptedTypes}
          capture={isCameraField ? 'environment' : undefined}
          multiple={props.field.multiple}
          onChange$={handleFileSelect}
          disabled={uploading.value}
          class="hidden"
          id={`file-input-${props.field.id}`}
        />

        <label
          for={`file-input-${props.field.id}`}
          class={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 ${
            props.error ? 'border-red-500' : 'border-gray-300'
          } ${uploading.value ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <p class="mt-2 text-sm text-gray-600">
              {uploading.value ? 'Uploading...' : isCameraField ? 'Open camera or choose a photo' : 'Click to upload or drag and drop'}
            </p>
            {acceptedTypes && (
              <p class="text-xs text-gray-500 mt-1">
                Accepted: {acceptedTypes}
              </p>
            )}
            {maxSizeInMB && (
              <p class="text-xs text-gray-500">
                Max size: {maxSizeInMB}MB
              </p>
            )}
          </div>
        </label>

          {/* Upload Progress */}
          {uploading.value && (
            <div class="mt-2">
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all w-[var(--upload-width)]"
                  style={{ '--upload-width': `${uploadProgress.value}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </FormField>

      {/* Uploaded Files */}
      {uploadedFiles.value.length > 0 && (
        <div class="mt-3 space-y-2">
          {uploadedFiles.value.map((url, index) => (
            <div key={index} class="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
              {/* File preview/icon */}
              {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img src={url} alt="Preview" width="48" height="48" class="h-12 w-12 object-cover rounded" />
              ) : (
                <div class="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                  <span class="text-xs text-gray-600">FILE</span>
                </div>
              )}

              {/* File name */}
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900 truncate">
                  {url.split('/').pop()}
                </p>
                <a
                  href={url}
                  target="_blank"
                  class="text-xs text-blue-600 hover:underline"
                >
                  View
                </a>
              </div>

              {/* Remove button */}
              <Btn
                type="button"
                onClick$={() => removeFile(index)}
                size="sm"
                variant="danger"
                class="rounded"
              >
                Remove
              </Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
