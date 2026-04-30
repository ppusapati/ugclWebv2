import type { DashboardWidget } from '~/types/analytics';

type WidgetResultMap = Record<string, any>;

export interface GroupedWidgetExecutionError {
  message: string;
  widgetIds: string[];
  widgetTitles: string[];
}

function toKey(value: unknown): string {
  return String(value ?? '').trim();
}

function extractMapFromObject(source: any): WidgetResultMap {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return {};
  }

  return source as WidgetResultMap;
}

function extractMapFromArray(source: any[]): WidgetResultMap {
  const map: WidgetResultMap = {};

  for (const entry of source) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const widgetKey = toKey((entry as any).widget_id ?? (entry as any).widgetId ?? (entry as any).id);
    const reportKey = toKey((entry as any).report_id ?? (entry as any).reportId);
    const value =
      (entry as any).result ??
      (entry as any).data ??
      (entry as any).value ??
      entry;

    if (widgetKey) {
      map[widgetKey] = value;
      continue;
    }

    if (reportKey) {
      map[reportKey] = value;
    }
  }

  return map;
}

function extractRawResults(payload: any): WidgetResultMap {
  const candidates = [
    payload?.results,
    payload?.widget_results,
    payload?.widgets,          // backend: { widgets: [{ widget_id, result }] }
    payload?.data?.results,
    payload?.data?.widget_results,
    payload?.data?.widgets,
    payload,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (Array.isArray(candidate)) {
      const fromArray = extractMapFromArray(candidate);
      if (Object.keys(fromArray).length > 0) {
        return fromArray;
      }
      continue;
    }

    const fromObject = extractMapFromObject(candidate);
    if (Object.keys(fromObject).length > 0) {
      return fromObject;
    }
  }

  return {};
}

function getResultByCandidateKeys(raw: WidgetResultMap, keys: string[]): { found: boolean; value: any } {
  for (const key of keys) {
    if (!key) {
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(raw, key)) {
      return { found: true, value: raw[key] };
    }
  }

  return { found: false, value: undefined };
}

export function normalizeDashboardWidgetResults(payload: any, widgets: DashboardWidget[]): WidgetResultMap {
  const raw = extractRawResults(payload);
  const normalized: WidgetResultMap = {};

  for (const widget of widgets) {
    const widgetKey = toKey(widget.id);
    const reportKey = toKey(widget.report_id);

    const { found, value } = getResultByCandidateKeys(raw, [widgetKey, reportKey]);
    if (found) {
      normalized[widgetKey] = value;
    }
  }

  return normalized;
}

export function hasWidgetResult(results: WidgetResultMap, widgetId: unknown): boolean {
  return Object.prototype.hasOwnProperty.call(results, toKey(widgetId));
}

export function getWidgetResult(results: WidgetResultMap, widgetId: unknown): any {
  return results[toKey(widgetId)];
}

export function getWidgetExecutionErrorMessage(raw: any): string | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const directError = (raw as any).error;
  if (typeof directError === 'string' && directError.trim().length > 0) {
    return directError.trim();
  }

  const nestedError = (raw as any).result?.error || (raw as any).data?.error;
  if (typeof nestedError === 'string' && nestedError.trim().length > 0) {
    return nestedError.trim();
  }

  const directMessage = (raw as any).message;
  if (typeof directMessage === 'string' && directMessage.trim().length > 0) {
    return directMessage.trim();
  }

  const nestedMessage = (raw as any).result?.message || (raw as any).data?.message;
  if (typeof nestedMessage === 'string' && nestedMessage.trim().length > 0) {
    return nestedMessage.trim();
  }

  const failedStatus = String((raw as any).status || '').toLowerCase() === 'failed';
  if (failedStatus) {
    return 'Widget execution failed';
  }

  return null;
}

export function groupWidgetExecutionErrors(results: WidgetResultMap, widgets: DashboardWidget[]): GroupedWidgetExecutionError[] {
  const grouped = new Map<string, GroupedWidgetExecutionError>();

  for (const widget of widgets) {
    const widgetId = toKey(widget.id);
    if (!hasWidgetResult(results, widgetId)) {
      continue;
    }

    const rawResult = getWidgetResult(results, widgetId);
    const message = getWidgetExecutionErrorMessage(rawResult);
    if (!message) {
      continue;
    }

    const existingGroup = grouped.get(message);
    if (existingGroup) {
      existingGroup.widgetIds.push(widgetId);
      existingGroup.widgetTitles.push(widget.title || widgetId);
      continue;
    }

    grouped.set(message, {
      message,
      widgetIds: [widgetId],
      widgetTitles: [widget.title || widgetId],
    });
  }

  return Array.from(grouped.values()).sort((left, right) => right.widgetIds.length - left.widgetIds.length);
}
