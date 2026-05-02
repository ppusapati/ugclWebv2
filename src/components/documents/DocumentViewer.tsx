import { component$, useStore, useTask$, useVisibleTask$, $, type QRL } from '@builder.io/qwik';
import * as XLSX from 'xlsx';
import { Btn } from '~/components/ds/btn';
import { documentService } from '~/services/document.service';
import type {
  Document,
  DocumentVersion,
  DocumentAuditLog,
  DocumentAIIntegration,
  DocumentAIResponse,
  DocumentAITask,
  DocumentWorkflowAction,
  DocumentWorkflowHistoryItem,
} from '~/types/document';

interface DocumentViewerProps {
  documentId: string;
  onClose?: QRL<() => void>;
}

interface ExcelSheetPreview {
  name: string;
  rows: string[][];
}

const preferredAIIntegrationStorageKey = 'preferred_document_ai_integration_id';

function parseExtractFieldsOutput(output: string): Record<string, unknown> | null {
  const trimmed = output.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function formatExtractFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'Not found';
  }
  if (typeof value === 'string') {
    return value.trim() || 'Not found';
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value, null, 2);
}

function humanizeTaskLabel(task: string): string {
  return task
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function humanizeStateLabel(state: string): string {
  if (!state) {
    return 'Draft';
  }
  return state.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseOutputLines(output: string): string[] {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeBulletLine(line: string): string {
  return line.replace(/^[-*•\d.)\s]+/, '').trim();
}

function getAuditTitle(log: DocumentAuditLog): string {
  const details = log.details || {};
  const aiTask = typeof details.ai_task === 'string' ? details.ai_task : '';
  if (aiTask) {
    return `AI ${humanizeTaskLabel(aiTask)}`;
  }
  return log.action.replace(/_/g, ' ');
}

function getUserDisplayName(user: unknown): string {
  if (!user || typeof user !== 'object') {
    return 'Unknown';
  }

  const candidate = user as Record<string, unknown>;
  const value = candidate.name ?? candidate.Name ?? candidate.email ?? candidate.Email;
  if (typeof value !== 'string') {
    return 'Unknown';
  }

  const trimmed = value.trim();
  return trimmed || 'Unknown';
}

function getFileExtension(fileName: string, fallback?: string): string {
  const fromName = fileName.split('.').pop()?.toLowerCase() || '';
  const fromFallback = (fallback || '').replace('.', '').toLowerCase();
  return fromName || fromFallback;
}

function isImageExtension(extension: string): boolean {
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(extension);
}

function isPdfExtension(extension: string): boolean {
  return extension === 'pdf';
}

function isWordExtension(extension: string): boolean {
  return extension === 'docx' || extension === 'doc';
}

function isExcelExtension(extension: string): boolean {
  return extension === 'xlsx' || extension === 'xls' || extension === 'csv';
}

export const DocumentViewer = component$<DocumentViewerProps>((props) => {
  const { documentId, onClose } = props;

  const state = useStore({
    document: null as Document | null,
    versions: [] as DocumentVersion[],
    auditLogs: [] as DocumentAuditLog[],
    aiIntegrations: [] as DocumentAIIntegration[],
    workflowActions: [] as DocumentWorkflowAction[],
    workflowHistory: [] as DocumentWorkflowHistoryItem[],
    workflowComment: '',
    workflowLoading: false,
    workflowSubmitting: false,
    workflowError: '',
    aiTask: 'synopsis' as DocumentAITask,
    aiIntegrationId: '',
    aiQuestion: '',
    aiFields: '',
    aiRunning: false,
    aiError: '',
    aiResult: null as DocumentAIResponse | null,
    previewLoading: false,
    previewError: '',
    previewLoaded: false,
    previewKind: '' as '' | 'image' | 'pdf' | 'word' | 'excel' | 'unsupported',
    previewObjectUrl: '',
    previewWordText: '',
    previewExcelSheets: [] as ExcelSheetPreview[],
    previewExcelActiveSheet: 0,
    loading: true,
    error: '',
    activeTab: 'review' as 'review' | 'preview' | 'details' | 'versions' | 'audit',
  });

  const loadDocument = $(async () => {
    state.loading = true;
    state.error = '';

    try {
      const document = await documentService.getDocument(documentId);
      state.document = document;
    } catch (error: any) {
      state.error = error.message || 'Failed to load document';
    } finally {
      state.loading = false;
    }
  });

  const loadVersions = $(async () => {
    try {
      state.versions = await documentService.getVersions(documentId);
    } catch (error: any) {
      console.error('Failed to load versions:', error);
    }
  });

  const loadAuditLogs = $(async () => {
    try {
      state.auditLogs = await documentService.getAuditLogs(documentId);
    } catch (error: any) {
      console.error('Failed to load audit logs:', error);
    }
  });

  const loadAIIntegrations = $(async () => {
    try {
      const response = await documentService.getAIIntegrations();
      state.aiIntegrations = response.integrations;

      if (!state.aiIntegrationId && response.integrations.length > 0) {
        let selectedId = response.integrations[0].id;

        if (typeof localStorage !== 'undefined') {
          const preferredId = localStorage.getItem(preferredAIIntegrationStorageKey) || '';
          const preferredExists = response.integrations.some((integration) => integration.id === preferredId);
          if (preferredExists) {
            selectedId = preferredId;
          }
        }

        state.aiIntegrationId = selectedId;
      }
    } catch (error: any) {
      state.aiError = error.message || 'Failed to load AI integrations';
    }
  });

  const loadWorkflow = $(async () => {
    state.workflowLoading = true;
    state.workflowError = '';

    try {
      const workflow = await documentService.getWorkflow(documentId);
      state.workflowActions = workflow.available_actions || [];
      state.workflowHistory = workflow.history || [];

      if (state.document) {
        state.document.current_state = workflow.current_state;
        state.document.status = workflow.status;
      }
    } catch (error: any) {
      state.workflowError = error.message || 'Failed to load document workflow';
    } finally {
      state.workflowLoading = false;
    }
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    await loadDocument();
    await loadVersions();
    await loadAuditLogs();
    await loadAIIntegrations();
    await loadWorkflow();
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const integrationId = track(() => state.aiIntegrationId);
    if (!integrationId) {
      return;
    }

    localStorage.setItem(preferredAIIntegrationStorageKey, integrationId);
  });

  useTask$(({ track, cleanup }) => {
    const objectUrl = track(() => state.previewObjectUrl);
    cleanup(() => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    });
  });

  const loadPreview = $(async () => {
    if (!state.document) {
      return;
    }

    state.previewLoading = true;
    state.previewError = '';
    state.previewKind = '';
    state.previewWordText = '';
    state.previewExcelSheets = [];
    state.previewExcelActiveSheet = 0;

    if (state.previewObjectUrl) {
      URL.revokeObjectURL(state.previewObjectUrl);
      state.previewObjectUrl = '';
    }

    try {
      const extension = getFileExtension(state.document.file_name, state.document.file_extension);
      const blob = await documentService.downloadDocument(documentId);

      if (isImageExtension(extension)) {
        state.previewKind = 'image';
        state.previewObjectUrl = URL.createObjectURL(blob);
      } else if (isPdfExtension(extension)) {
        state.previewKind = 'pdf';
        state.previewObjectUrl = URL.createObjectURL(blob);
      } else if (isWordExtension(extension)) {
        state.previewKind = 'word';
        if (extension === 'doc') {
          state.previewError = 'Legacy .doc preview is limited. Please upload or convert to .docx for rich inline preview.';
        }

        try {
          const arrayBuffer = await blob.arrayBuffer();
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ arrayBuffer });
          state.previewWordText = result.value?.trim() || 'No readable text found in this document.';
        } catch {
          state.previewError = state.previewError || 'Could not parse this Word file for inline preview.';
        }
      } else if (isExcelExtension(extension)) {
        state.previewKind = 'excel';

        const arrayBuffer = await blob.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        state.previewExcelSheets = workbook.SheetNames.map((name) => {
          const worksheet = workbook.Sheets[name];
          const matrix = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            defval: '',
          }) as Array<Array<string | number | boolean>>;

          const rows = matrix.slice(0, 100).map((row) =>
            row.slice(0, 20).map((cell) => (cell === undefined || cell === null ? '' : String(cell)))
          );

          return { name, rows };
        });
      } else {
        state.previewKind = 'unsupported';
        state.previewError = 'Preview is not supported for this file type. Please download the file.';
      }
    } catch (error: any) {
      state.previewKind = 'unsupported';
      state.previewError = error?.message || 'Failed to load document preview.';
    } finally {
      state.previewLoading = false;
      state.previewLoaded = true;
    }
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const activeTab = track(() => state.activeTab);
    track(() => state.document?.id);
    if (activeTab !== 'preview' && activeTab !== 'review') {
      return;
    }
    if (state.previewLoaded) {
      return;
    }

    await loadPreview();
  });

  const handleDownload = $(async () => {
    if (!state.document) return;

    try {
      await documentService.downloadDocument(documentId, state.document.file_name);
    } catch (error: any) {
      alert('Download failed: ' + error.message);
    }
  });

  const handlePreviewFullscreen = $(() => {
    const container = document.getElementById('document-preview-surface');
    if (!container) {
      return;
    }

    const fullscreenElement = document.fullscreenElement;
    if (fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }

    container.requestFullscreen().catch(() => {});
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRunAI = $(async () => {
    state.aiError = '';
    state.aiResult = null;

    if (!state.aiIntegrationId) {
      state.aiError = 'Select an AI integration.';
      return;
    }

    if (state.aiTask === 'answer_question' && !state.aiQuestion.trim()) {
      state.aiError = 'Enter a document-related question.';
      return;
    }

    if (state.aiTask === 'extract_fields' && !state.aiFields.trim()) {
      state.aiError = 'Enter one or more field names.';
      return;
    }

    state.aiRunning = true;
    try {
      state.aiResult = await documentService.processDocumentAI(documentId, {
        task: state.aiTask,
        integration_id: state.aiIntegrationId,
        question: state.aiTask === 'answer_question' ? state.aiQuestion.trim() : undefined,
        fields: state.aiTask === 'extract_fields'
          ? state.aiFields.split(',').map((item) => item.trim()).filter(Boolean)
          : undefined,
      });
    } catch (error: any) {
      state.aiError = error.message || 'Document AI request failed';
    } finally {
      state.aiRunning = false;
    }
  });

  const handleWorkflowAction = $(async (action: DocumentWorkflowAction) => {
    state.workflowError = '';

    if (action.requires_comment && !state.workflowComment.trim()) {
      state.workflowError = `Comment is required for ${action.label}.`;
      return;
    }

    state.workflowSubmitting = true;
    try {
      const response = await documentService.transitionWorkflow(documentId, {
        action: action.action,
        comment: state.workflowComment.trim() || undefined,
      });

      state.document = response.document;
      state.workflowActions = response.workflow.available_actions || [];
      state.workflowHistory = response.workflow.history || [];
      state.workflowComment = '';

      await loadAuditLogs();
    } catch (error: any) {
      state.workflowError = error.message || 'Workflow transition failed';
    } finally {
      state.workflowSubmitting = false;
    }
  });

  if (state.loading) {
    return (
      <div class="bg-white rounded-lg shadow-lg p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading document...</p>
      </div>
    );
  }

  if (state.error || !state.document) {
    return (
      <div class="bg-white rounded-lg shadow-lg p-8">
        <div class="text-center">
          <p class="text-red-600">{state.error || 'Document not found'}</p>
          {onClose && (
            <Btn class="mt-4" variant="secondary" onClick$={onClose}>
              Close
            </Btn>
          )}
        </div>
      </div>
    );
  }

  const doc = state.document;
  const extractedFields = state.aiResult?.task === 'extract_fields'
    ? parseExtractFieldsOutput(state.aiResult.output)
    : null;
  const aiOutputLines = state.aiResult ? parseOutputLines(state.aiResult.output) : [];

  return (
    <div class="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div class="border-b border-gray-200 p-6">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-gray-900">{doc.title}</h2>
            <p class="mt-1 text-sm text-gray-500">{doc.file_name}</p>
            <div class="mt-2 flex items-center gap-2">
              <span class="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                State: {humanizeStateLabel(doc.current_state || 'draft')}
              </span>
              <span class="inline-flex items-center rounded-full border border-blue-300 bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 capitalize">
                Status: {doc.status}
              </span>
            </div>
            {onClose && (
              <a
                href={`/documents/view/${doc.id}`}
                class="inline-block mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                Open Full Page Reader
              </a>
            )}
          </div>
          {onClose && (
            <Btn size="sm" variant="ghost" class="ml-4 text-gray-400 hover:text-gray-500" onClick$={onClose}>
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Btn>
          )}
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          {doc.tags?.map((tag) => (
            <span key={tag.id} class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {tag.name}
            </span>
          ))}
        </div>

        <div class="mt-4 flex gap-3">
          <Btn
            class="flex items-center gap-2"
            onClick$={handleDownload}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </Btn>
        </div>
      </div>

      {/* Tabs */}
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px items-center gap-2 px-4 py-2">
          <Btn
            size="sm"
            variant="ghost"
            class={`icon-tab-btn ${
              state.activeTab === 'review'
                ? 'icon-tab-btn-active-review'
                : ''
            }`}
            onClick$={() => (state.activeTab = 'review')}
            title="Review"
            aria-label="Review tab"
          >
            <i class="i-heroicons-sparkles-solid h-5 w-5" aria-hidden="true"></i>
          </Btn>
          <Btn
            size="sm"
            variant="ghost"
            class={`icon-tab-btn ${
              state.activeTab === 'preview'
                ? 'icon-tab-btn-active-preview'
                : ''
            }`}
            onClick$={() => (state.activeTab = 'preview')}
            title="Preview"
            aria-label="Preview tab"
          >
            <i class="i-heroicons-eye-solid h-5 w-5" aria-hidden="true"></i>
          </Btn>
          <Btn
            size="sm"
            variant="ghost"
            class={`icon-tab-btn ${
              state.activeTab === 'details'
                ? 'icon-tab-btn-active-details'
                : ''
            }`}
            onClick$={() => (state.activeTab = 'details')}
            title="Details"
            aria-label="Details tab"
          >
            <i class="i-heroicons-information-circle-solid h-5 w-5" aria-hidden="true"></i>
          </Btn>
          <Btn
            size="sm"
            variant="ghost"
            class={`icon-tab-btn ${
              state.activeTab === 'versions'
                ? 'icon-tab-btn-active-versions'
                : ''
            }`}
            onClick$={() => (state.activeTab = 'versions')}
            title={`Versions (${state.versions.length})`}
            aria-label={`Versions tab ${state.versions.length}`}
          >
            <i class="i-heroicons-clock-solid h-5 w-5" aria-hidden="true"></i>
          </Btn>
          <Btn
            size="sm"
            variant="ghost"
            class={`icon-tab-btn ${
              state.activeTab === 'audit'
                ? 'icon-tab-btn-active-activity'
                : ''
            }`}
            onClick$={() => (state.activeTab = 'audit')}
            title={`Activity (${state.auditLogs.length})`}
            aria-label={`Activity tab ${state.auditLogs.length}`}
          >
            <i class="i-heroicons-list-bullet-solid h-5 w-5" aria-hidden="true"></i>
          </Btn>
        </nav>
      </div>

      {/* Tab Content */}
      <div class="p-6">
        {/* Review Tab */}
        {state.activeTab === 'review' && (
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm text-gray-600">Document Preview</p>
                <Btn
                  size="sm"
                  variant="secondary"
                  onClick$={async () => {
                    state.previewLoaded = false;
                    await loadPreview();
                  }}
                  disabled={state.previewLoading}
                >
                  {state.previewLoading ? 'Loading...' : 'Refresh Preview'}
                </Btn>
              </div>

              {state.previewLoading && (
                <div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
                  <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                  <p class="mt-3 text-sm text-gray-600">Generating preview...</p>
                </div>
              )}

              {!state.previewLoading && state.previewError && (
                <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  {state.previewError}
                </div>
              )}

              {!state.previewLoading && state.previewKind === 'image' && state.previewObjectUrl && (
                <div class="rounded-lg border border-gray-200 bg-white p-4">
                  <img src={state.previewObjectUrl} alt={doc.title} width={1200} height={900} class="max-h-[65vh] mx-auto object-contain" />
                </div>
              )}

              {!state.previewLoading && state.previewKind === 'pdf' && state.previewObjectUrl && (
                <div class="rounded-lg border border-gray-200 overflow-hidden bg-white">
                  <iframe src={state.previewObjectUrl} class="w-full h-[70vh]" title="PDF Preview" />
                </div>
              )}

              {!state.previewLoading && state.previewKind === 'word' && (
                <div class="rounded-lg border border-gray-200 bg-white p-4">
                  <pre class="whitespace-pre-wrap break-words text-sm text-gray-900 font-sans leading-relaxed">
                    {state.previewWordText || 'No readable text available for this Word document.'}
                  </pre>
                </div>
              )}

              {!state.previewLoading && state.previewKind === 'excel' && (
                <div class="rounded-lg border border-gray-200 bg-white overflow-hidden">
                  {state.previewExcelSheets.length > 0 ? (
                    <>
                      <div class="border-b border-gray-200 px-4 py-2 flex flex-wrap gap-2">
                        {state.previewExcelSheets.map((sheet, index) => (
                          <button
                            key={sheet.name}
                            type="button"
                            class={[
                              'px-3 py-1 text-xs rounded-full border',
                              state.previewExcelActiveSheet === index
                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                            ].join(' ')}
                            onClick$={() => (state.previewExcelActiveSheet = index)}
                          >
                            {sheet.name}
                          </button>
                        ))}
                      </div>

                      <div class="overflow-auto max-h-[65vh]">
                        <table class="min-w-full text-xs">
                          <tbody>
                            {(state.previewExcelSheets[state.previewExcelActiveSheet]?.rows || []).map((row, rowIndex) => (
                              <tr key={`review-row-${rowIndex}`} class="border-b border-gray-100">
                                {row.map((cell, cellIndex) => (
                                  <td key={`review-cell-${rowIndex}-${cellIndex}`} class="px-2 py-1 align-top text-gray-800 border-r border-gray-100">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div class="p-4 text-sm text-gray-600">No readable sheets found in this Excel file.</div>
                  )}
                </div>
              )}
            </div>

            <div class="space-y-4">
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-sm font-semibold text-gray-900">Workflow</h3>
                    <p class="mt-1 text-xs text-gray-600">
                      Review actions are controlled by workflow state and permissions.
                    </p>
                  </div>
                  {state.workflowLoading && <span class="text-xs text-gray-500">Loading...</span>}
                </div>

                {state.workflowError && (
                  <div class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {state.workflowError}
                  </div>
                )}

                <div class="flex flex-wrap gap-2">
                  {state.workflowActions.length > 0 ? (
                    state.workflowActions.map((action) => (
                      <Btn
                        key={`wf-action-${action.action}-${action.to_state}`}
                        size="sm"
                        variant="secondary"
                        class="flex items-center gap-2"
                        onClick$={() => handleWorkflowAction(action)}
                        disabled={state.workflowSubmitting}
                        title={`Transition to ${humanizeStateLabel(action.to_state)}`}
                      >
                        <i class="i-heroicons-arrow-path-rounded-square-solid h-4 w-4" aria-hidden="true"></i>
                        {action.label}
                      </Btn>
                    ))
                  ) : (
                    <p class="text-xs text-gray-600">No workflow actions available in the current state.</p>
                  )}
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Workflow Comment</label>
                  <textarea
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                    rows={2}
                    placeholder="Add review notes (required for reject/request revision actions)"
                    value={state.workflowComment}
                    onInput$={(e) => (state.workflowComment = (e.target as HTMLTextAreaElement).value)}
                    disabled={state.workflowSubmitting}
                  />
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-medium text-gray-700">Transition History</p>
                  {state.workflowHistory.length > 0 ? (
                    <div class="max-h-56 overflow-auto space-y-2 pr-1">
                      {state.workflowHistory.map((item) => (
                        <div key={item.id} class="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                          <div class="flex items-center justify-between gap-2">
                            <span class="font-medium text-gray-900">
                              {humanizeTaskLabel(item.action || 'transition')}
                            </span>
                            <span class="text-gray-500">{formatDate(item.transitioned_at)}</span>
                          </div>
                          <div class="mt-1 text-gray-600">
                            {humanizeStateLabel(item.from_state)} to {humanizeStateLabel(item.to_state)}
                            {item.actor_name ? ` by ${item.actor_name}` : ''}
                          </div>
                          {item.comment && <div class="mt-1 text-gray-700">Comment: {item.comment}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p class="text-xs text-gray-600">No workflow transitions recorded yet.</p>
                  )}
                </div>
              </div>

              <div class="flex items-center justify-between gap-4">
                <div>
                  <h3 class="text-sm font-semibold text-gray-900">Document AI</h3>
                  <p class="mt-1 text-sm text-gray-600">
                    Run restricted synopsis, field extraction, or document-only Q&amp;A while reviewing preview.
                  </p>
                </div>
                <span class="text-xs text-gray-500">
                  {state.aiIntegrations.length} integration{state.aiIntegrations.length === 1 ? '' : 's'} available
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Integration</label>
                  <select
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={state.aiIntegrationId}
                    onChange$={(e) => (state.aiIntegrationId = (e.target as HTMLSelectElement).value)}
                  >
                    <option value="">Select integration</option>
                    {state.aiIntegrations.map((integration) => (
                      <option key={integration.id} value={integration.id}>
                        {`${integration.name} (${integration.provider} / ${integration.model})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Task</label>
                  <select
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={state.aiTask}
                    onChange$={(e) => (state.aiTask = (e.target as HTMLSelectElement).value as DocumentAITask)}
                  >
                    <option value="synopsis">Synopsis</option>
                    <option value="extract_fields">Extract Fields</option>
                    <option value="answer_question">Answer Question</option>
                  </select>
                </div>
              </div>

              {state.aiTask === 'extract_fields' && (
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Fields</label>
                  <input
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="invoice_number, vendor_name, total_amount"
                    value={state.aiFields}
                    onInput$={(e) => (state.aiFields = (e.target as HTMLInputElement).value)}
                  />
                  <p class="mt-1 text-xs text-gray-500">Comma-separated field names to extract from this document.</p>
                </div>
              )}

              {state.aiTask === 'answer_question' && (
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Question</label>
                  <textarea
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Ask only about content present in this document"
                    value={state.aiQuestion}
                    onInput$={(e) => (state.aiQuestion = (e.target as HTMLTextAreaElement).value)}
                  />
                </div>
              )}

              <div class="flex items-center gap-3">
                <Btn onClick$={handleRunAI} disabled={state.aiRunning || state.aiIntegrations.length === 0}>
                  {state.aiRunning ? 'Running...' : 'Run AI Task'}
                </Btn>
                <span class="text-xs text-gray-500">Non-document requests are rejected server-side.</span>
              </div>

              {state.aiError && (
                <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {state.aiError}
                </div>
              )}

              {state.aiResult && (
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span class="font-medium text-gray-700">{state.aiResult.provider}</span>
                    <span>{state.aiResult.model}</span>
                    <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-700">{state.aiResult.task}</span>
                  </div>

                  {state.aiResult.task === 'extract_fields' && extractedFields ? (
                    <div class="mt-4 grid grid-cols-1 gap-3">
                      {Object.entries(extractedFields).map(([key, value]) => (
                        <div key={`review-field-${key}`} class="rounded-md border border-gray-200 bg-white px-3 py-2">
                          <div class="text-xs font-medium uppercase tracking-wide text-gray-500">{key}</div>
                          <div class="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">
                            {formatExtractFieldValue(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : state.aiResult.task === 'synopsis' ? (
                    <div class="mt-4 space-y-3">
                      <ul class="list-disc pl-5 space-y-1 text-sm text-gray-900">
                        {aiOutputLines.map((line, index) => (
                          <li key={`review-synopsis-${index}`}>{normalizeBulletLine(line)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : state.aiResult.task === 'answer_question' ? (
                    <div class="mt-4 space-y-2">
                      {aiOutputLines.map((line, index) => (
                        <p key={`review-answer-${index}`} class="text-sm text-gray-900 leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <pre class="mt-3 whitespace-pre-wrap break-words text-sm text-gray-900 font-sans">{state.aiResult.output}</pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {state.activeTab === 'preview' && (
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm text-gray-600">
                Inline preview for PDF, images, Word and Excel files.
              </p>
                <div class="flex items-center gap-2">
                  <Btn
                    size="sm"
                    variant="secondary"
                    onClick$={handlePreviewFullscreen}
                    disabled={state.previewLoading || state.previewKind === 'unsupported' || !state.previewLoaded}
                  >
                    Full Screen
                  </Btn>
                  <Btn
                    size="sm"
                    variant="secondary"
                    onClick$={async () => {
                      state.previewLoaded = false;
                      await loadPreview();
                    }}
                    disabled={state.previewLoading}
                  >
                    {state.previewLoading ? 'Loading...' : 'Refresh Preview'}
                  </Btn>
                </div>
            </div>

            <div id="document-preview-surface" class="document-preview-surface">
            {state.previewLoading && (
              <div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p class="mt-3 text-sm text-gray-600">Generating preview...</p>
              </div>
            )}

            {!state.previewLoading && state.previewError && (
              <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {state.previewError}
              </div>
            )}

            {!state.previewLoading && state.previewKind === 'image' && state.previewObjectUrl && (
              <div class="rounded-lg border border-gray-200 bg-white p-4">
                <img src={state.previewObjectUrl} alt={doc.title} width={1200} height={900} class="preview-image max-h-[65vh] mx-auto object-contain" />
              </div>
            )}

            {!state.previewLoading && state.previewKind === 'pdf' && state.previewObjectUrl && (
              <div class="rounded-lg border border-gray-200 overflow-hidden bg-white">
                <iframe src={state.previewObjectUrl} class="preview-frame w-full h-[70vh]" title="PDF Preview" />
              </div>
            )}

            {!state.previewLoading && state.previewKind === 'word' && (
              <div class="rounded-lg border border-gray-200 bg-white p-4">
                <pre class="whitespace-pre-wrap break-words text-sm text-gray-900 font-sans leading-relaxed">
                  {state.previewWordText || 'No readable text available for this Word document.'}
                </pre>
              </div>
            )}

            {!state.previewLoading && state.previewKind === 'excel' && (
              <div class="rounded-lg border border-gray-200 bg-white overflow-hidden">
                {state.previewExcelSheets.length > 0 ? (
                  <>
                    <div class="border-b border-gray-200 px-4 py-2 flex flex-wrap gap-2">
                      {state.previewExcelSheets.map((sheet, index) => (
                        <button
                          key={sheet.name}
                          type="button"
                          class={[
                            'px-3 py-1 text-xs rounded-full border',
                            state.previewExcelActiveSheet === index
                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                          ].join(' ')}
                          onClick$={() => (state.previewExcelActiveSheet = index)}
                        >
                          {sheet.name}
                        </button>
                      ))}
                    </div>

                    <div class="preview-table-wrap overflow-auto max-h-[65vh]">
                      <table class="min-w-full text-xs">
                        <tbody>
                          {(state.previewExcelSheets[state.previewExcelActiveSheet]?.rows || []).map((row, rowIndex) => (
                            <tr key={`row-${rowIndex}`} class="border-b border-gray-100">
                              {row.map((cell, cellIndex) => (
                                <td key={`cell-${rowIndex}-${cellIndex}`} class="px-2 py-1 align-top text-gray-800 border-r border-gray-100">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div class="p-4 text-sm text-gray-600">No readable sheets found in this Excel file.</div>
                )}
              </div>
            )}
            </div>
          </div>
        )}

        {/* Details Tab */}
        {state.activeTab === 'details' && (
          <div class="space-y-4">
            {doc.description && (
              <div>
                <h3 class="text-sm font-medium text-gray-700">Description</h3>
                <p class="mt-1 text-sm text-gray-900">{doc.description}</p>
              </div>
            )}

            <div class="grid grid-cols-2 gap-4">
              <div>
                <h3 class="text-sm font-medium text-gray-700">Category</h3>
                <p class="mt-1 text-sm text-gray-900">{doc.category?.name || 'Uncategorized'}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">Status</h3>
                <p class="mt-1 text-sm text-gray-900 capitalize">{doc.status}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">File Size</h3>
                <p class="mt-1 text-sm text-gray-900">{documentService.formatFileSize(doc.file_size)}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">File Type</h3>
                <p class="mt-1 text-sm text-gray-900">{doc.file_type}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">Version</h3>
                <p class="mt-1 text-sm text-gray-900">v{doc.version}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">Uploaded By</h3>
                <p class="mt-1 text-sm text-gray-900">{getUserDisplayName(doc.uploaded_by)}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">Created</h3>
                <p class="mt-1 text-sm text-gray-900">{formatDate(doc.created_at)}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">Last Modified</h3>
                <p class="mt-1 text-sm text-gray-900">{formatDate(doc.updated_at)}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">Views</h3>
                <p class="mt-1 text-sm text-gray-900">{doc.view_count}</p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-700">Downloads</h3>
                <p class="mt-1 text-sm text-gray-900">{doc.download_count}</p>
              </div>
            </div>

            <div class="border-t border-gray-200 pt-6">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <h3 class="text-sm font-semibold text-gray-900">Document AI</h3>
                  <p class="mt-1 text-sm text-gray-600">
                    Run restricted synopsis, field extraction, or document-only Q&amp;A using a configured integration.
                  </p>
                </div>
                <span class="text-xs text-gray-500">
                  {state.aiIntegrations.length} integration{state.aiIntegrations.length === 1 ? '' : 's'} available
                </span>
              </div>

              <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Integration</label>
                  <select
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={state.aiIntegrationId}
                    onChange$={(e) => (state.aiIntegrationId = (e.target as HTMLSelectElement).value)}
                  >
                    <option value="">Select integration</option>
                    {state.aiIntegrations.map((integration) => (
                      <option key={integration.id} value={integration.id}>
                        {`${integration.name} (${integration.provider} / ${integration.model})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Task</label>
                  <select
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={state.aiTask}
                    onChange$={(e) => (state.aiTask = (e.target as HTMLSelectElement).value as DocumentAITask)}
                  >
                    <option value="synopsis">Synopsis</option>
                    <option value="extract_fields">Extract Fields</option>
                    <option value="answer_question">Answer Question</option>
                  </select>
                </div>
              </div>

              {state.aiTask === 'extract_fields' && (
                <div class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Fields</label>
                  <input
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="invoice_number, vendor_name, total_amount"
                    value={state.aiFields}
                    onInput$={(e) => (state.aiFields = (e.target as HTMLInputElement).value)}
                  />
                  <p class="mt-1 text-xs text-gray-500">Comma-separated field names to extract from this document.</p>
                </div>
              )}

              {state.aiTask === 'answer_question' && (
                <div class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Question</label>
                  <textarea
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Ask only about content present in this document"
                    value={state.aiQuestion}
                    onInput$={(e) => (state.aiQuestion = (e.target as HTMLTextAreaElement).value)}
                  />
                </div>
              )}

              <div class="mt-4 flex items-center gap-3">
                <Btn onClick$={handleRunAI} disabled={state.aiRunning || state.aiIntegrations.length === 0}>
                  {state.aiRunning ? 'Running...' : 'Run AI Task'}
                </Btn>
                <span class="text-xs text-gray-500">
                  Non-document requests are rejected server-side.
                </span>
              </div>

              {state.aiError && (
                <div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {state.aiError}
                </div>
              )}

              {state.aiResult && (
                <div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span class="font-medium text-gray-700">{state.aiResult.provider}</span>
                    <span>{state.aiResult.model}</span>
                    <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-700">{state.aiResult.task}</span>
                  </div>

                  {state.aiResult.task === 'extract_fields' && extractedFields ? (
                    <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(extractedFields).map(([key, value]) => (
                        <div key={key} class="rounded-md border border-gray-200 bg-white px-3 py-2">
                          <div class="text-xs font-medium uppercase tracking-wide text-gray-500">{key}</div>
                          <div class="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">
                            {formatExtractFieldValue(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : state.aiResult.task === 'synopsis' ? (
                    <div class="mt-4 space-y-3">
                      <ul class="list-disc pl-5 space-y-1 text-sm text-gray-900">
                        {aiOutputLines.map((line, index) => (
                          <li key={`synopsis-${index}`}>{normalizeBulletLine(line)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : state.aiResult.task === 'answer_question' ? (
                    <div class="mt-4 space-y-2">
                      {aiOutputLines.map((line, index) => (
                        <p key={`answer-${index}`} class="text-sm text-gray-900 leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <pre class="mt-3 whitespace-pre-wrap break-words text-sm text-gray-900 font-sans">{state.aiResult.output}</pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Versions Tab */}
        {state.activeTab === 'versions' && (
          <div class="space-y-3">
            {state.versions.length === 0 ? (
              <p class="text-gray-500 text-sm">No version history available</p>
            ) : (
              state.versions.map((version) => (
                <div key={version.id} class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900">Version {version.version_number}</span>
                        {version.is_current_version && (
                          <span class="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">Current</span>
                        )}
                      </div>
                      <p class="mt-1 text-sm text-gray-600">{version.change_log || 'No description'}</p>
                      <div class="mt-2 text-xs text-gray-500">
                        {version.created_by?.name} • {formatDate(version.created_at)} • {documentService.formatFileSize(version.file_size)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Audit Tab */}
        {state.activeTab === 'audit' && (
          <div class="space-y-3">
            {state.auditLogs.length === 0 ? (
              <p class="text-gray-500 text-sm">No activity logs available</p>
            ) : (
              state.auditLogs.map((log) => (
                <div key={log.id} class="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-900 capitalize">{getAuditTitle(log)}</span>
                      {log.user && <span class="text-sm text-gray-500">by {getUserDisplayName(log.user)}</span>}
                    </div>
                    {log.details?.provider && (
                      <div class="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-700">{String(log.details.provider)}</span>
                        {log.details?.model && <span>{String(log.details.model)}</span>}
                      </div>
                    )}
                    <p class="mt-1 text-xs text-gray-500">{formatDate(log.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
});
