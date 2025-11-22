import { component$, useSignal, useStore, $, type QRL, noSerialize, type NoSerialize } from '@builder.io/qwik';
import { documentService } from '~/services/document.service';
import type { DocumentCategory, DocumentTag } from '~/types/document';

interface DocumentUploadProps {
  onUploadComplete?: QRL<(documentId: string) => void>;
  categories?: DocumentCategory[];
  tags?: DocumentTag[];
  businessVerticalId?: string;
  workflowId?: string;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
}

export const DocumentUpload = component$<DocumentUploadProps>((props) => {
  const {
    onUploadComplete,
    categories = [],
    tags = [],
    businessVerticalId,
    workflowId,
    maxFileSize = 100,
    allowedTypes,
  } = props;

  const state = useStore({
    isDragging: false,
    isUploading: false,
    uploadProgress: 0,
    error: '',
    selectedFile: null as NoSerialize<File> | null,
    title: '',
    description: '',
    categoryId: '',
    selectedTags: [] as string[],
    isPublic: false,
  });

  const fileInputRef = useSignal<HTMLInputElement>();

  const handleDragOver = $((event: DragEvent) => {
    event.preventDefault();
    state.isDragging = true;
  });

  const handleDragLeave = $((event: DragEvent) => {
    event.preventDefault();
    state.isDragging = false;
  });

  const handleDrop = $((event: DragEvent) => {
    event.preventDefault();
    state.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  const handleFileSelect = $((file: File) => {
    // Validate file
    const validation = documentService.validateFile(file, {
      maxSize: maxFileSize * 1024 * 1024,
      allowedTypes,
    });

    if (!validation.valid) {
      state.error = validation.error || 'Invalid file';
      return;
    }

    state.selectedFile = noSerialize(file);
    state.error = '';

    // Auto-fill title from filename
    if (!state.title) {
      state.title = file.name.replace(/\.[^/.]+$/, '');
    }
  });

  const handleFileInputChange = $((event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      handleFileSelect(input.files[0]);
    }
  });

  const handleTagToggle = $((tagName: string) => {
    const index = state.selectedTags.indexOf(tagName);
    if (index > -1) {
      state.selectedTags.splice(index, 1);
    } else {
      state.selectedTags.push(tagName);
    }
  });

  const handleUpload = $(async () => {
    if (!state.selectedFile) {
      state.error = 'Please select a file';
      return;
    }

    if (!state.title.trim()) {
      state.error = 'Please enter a title';
      return;
    }

    state.isUploading = true;
    state.error = '';

    try {
      const document = await documentService.uploadDocument(
        {
          file: state.selectedFile,
          title: state.title,
          description: state.description,
          category_id: state.categoryId || undefined,
          tags: state.selectedTags.length > 0 ? state.selectedTags : undefined,
          business_vertical_id: businessVerticalId,
          workflow_id: workflowId,
          is_public: state.isPublic,
        },
        (progress) => {
          state.uploadProgress = progress;
        }
      );

      // Reset form
      state.selectedFile = null;
      state.title = '';
      state.description = '';
      state.categoryId = '';
      state.selectedTags = [];
      state.isPublic = false;
      state.uploadProgress = 0;

      if (onUploadComplete) {
        await onUploadComplete(document.id);
      }
    } catch (error: any) {
      state.error = error.message || 'Upload failed';
    } finally {
      state.isUploading = false;
    }
  });

  const handleCancel = $(() => {
    state.selectedFile = null;
    state.title = '';
    state.description = '';
    state.categoryId = '';
    state.selectedTags = [];
    state.error = '';
    state.uploadProgress = 0;
  });

  return (
    <div class="document-upload bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Upload Document</h3>

      {/* Drop Zone */}
      <div
        class={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${state.isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${state.isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onDragOver$={handleDragOver}
        onDragLeave$={handleDragLeave}
        onDrop$={handleDrop}
        onClick$={(event) => {
          // Prevent click if target is the input itself to avoid infinite loop
          if ((event.target as HTMLElement).tagName !== 'INPUT') {
            fileInputRef.value?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          class="hidden"
          onChange$={handleFileInputChange}
          disabled={state.isUploading}
          onClick$={(event) => event.stopPropagation()}
        />

        <div class="space-y-2">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          {state.selectedFile ? (
            <div>
              <p class="text-sm font-medium text-gray-900">{state.selectedFile.name}</p>
              <p class="text-xs text-gray-500">
                {documentService.formatFileSize(state.selectedFile.size)}
              </p>
            </div>
          ) : (
            <div>
              <p class="text-sm text-gray-600">
                <span class="font-medium text-blue-600 hover:text-blue-500">Click to upload</span>
                {' '}or drag and drop
              </p>
              <p class="text-xs text-gray-500">
                {allowedTypes ? allowedTypes.join(', ') : 'All file types'} (Max {maxFileSize}MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form Fields */}
      {state.selectedFile && (
        <div class="mt-6 space-y-4">
          {/* Title */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Title <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={state.title}
              onInput$={(e) => (state.title = (e.target as HTMLInputElement).value)}
              placeholder="Enter document title"
              disabled={state.isUploading}
            />
          </div>

          {/* Description */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={state.description}
              onInput$={(e) => (state.description = (e.target as HTMLTextAreaElement).value)}
              placeholder="Enter document description (optional)"
              disabled={state.isUploading}
            />
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={state.categoryId}
                onChange$={(e) => (state.categoryId = (e.target as HTMLSelectElement).value)}
                disabled={state.isUploading}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div class="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    class={`
                      px-3 py-1 rounded-full text-sm font-medium transition-colors
                      ${
                        state.selectedTags.includes(tag.name)
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }
                      border hover:bg-blue-50
                    `}
                    onClick$={() => handleTagToggle(tag.name)}
                    disabled={state.isUploading}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Public checkbox */}
          <div class="flex items-center">
            <input
              type="checkbox"
              id="is-public"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={state.isPublic}
              onChange$={(e) => (state.isPublic = (e.target as HTMLInputElement).checked)}
              disabled={state.isUploading}
            />
            <label for="is-public" class="ml-2 block text-sm text-gray-700">
              Make this document public
            </label>
          </div>

          {/* Upload Progress */}
          {state.isUploading && (
            <div>
              <div class="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{state.uploadProgress}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${state.uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {state.error && (
            <div class="p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              onClick$={handleUpload}
              disabled={state.isUploading || !state.selectedFile || !state.title.trim()}
            >
              {state.isUploading ? 'Uploading...' : 'Upload Document'}
            </button>
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              onClick$={handleCancel}
              disabled={state.isUploading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
