/**
 * Centralized API Client for QwikJS
 * - SSR-aware (works on both server and browser)
 * - Uses environment variables for configuration
 * - Handles authentication, timeout, and JSON parsing
 */

export interface ApiError {
  message: string;
  status: number;
  data?: any;
}

export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, any>;
  customHeaders?: HeadersInit;
  serverToken?: string;
  serverBaseUrl?: string;
  skipContentType?: boolean;
}

const DEFAULT_TIMEOUT = 30000;

/**
 * Resolve base URL depending on environment (SSR or client)
 */
function getBaseUrl(): string {
  if (import.meta.env.PUBLIC_API_BASE_URL) {
    return import.meta.env.PUBLIC_API_BASE_URL;
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8080/api/v1';
  }
//  return 'http://localhost:8080/api/v1';
 return 'https://ugclbackend2-429789556411.europe-west1.run.app/api/v1';
  // return 'https://ugcl-429789556411.asia-south1.run.app/api/v1';
}

/**
 * Safely get token (works only in browser)
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Build headers for every request
 */
function buildHeaders(customHeaders?: HeadersInit, serverToken?: string, skipContentType = false): Record<string, string> {
  const headers: Record<string, string> = {
    'x-api-key': '87339ea3-1add-4689-ae57-3128ebd03c4f',
    'Accept': 'application/json',
  };

  // Add Content-Type only if not skipped (for multipart/form-data uploads)
  if (!skipContentType) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
  }

  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((v, k) => (headers[k] = v));
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([k, v]) => (headers[k] = v));
    } else {
      Object.assign(headers, customHeaders);
    }
  }

  const token = serverToken || getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return headers;
}

/**
 * Handle failed responses uniformly
 */
async function handleError(response: Response): Promise<never> {
  let message = `HTTP ${response.status}`;
  let data: any = null;

  try {
    // Try JSON first
    data = await response.clone().json();
    console.error('[API Error] JSON response data:', data);
    message = data?.message || data?.error || message;
  } catch {
    try {
      // Fallback to text to surface backend plain-text errors like "Invalid JSON"
      const text = await response.clone().text();
      if (text) {
        data = { raw: text };
        message = text || response.statusText || message;
        console.error('[API Error] Text response data:', text);
      } else {
        message = response.statusText || message;
      }
    } catch {
      message = response.statusText || message;
    }
  }

  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  throw { message, status: response.status, data } as ApiError;
}

/**
 * Generic request handler (used by all methods)
 */
async function request<T>(
  endpoint: string,
  {
    method = 'GET',
    params,
    body,
    customHeaders,
    serverToken,
    serverBaseUrl,
    signal,
    skipContentType,
  }: ApiRequestOptions = {}
): Promise<T> {
  const baseUrl = serverBaseUrl || getBaseUrl();

  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = `${baseUrl}${endpoint}${query}`;

  const headers = buildHeaders(customHeaders, serverToken, skipContentType);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    // Debug: Log outgoing request details (safe subset)
    if (typeof body === 'string' && (method === 'POST' || method === 'PUT')) {
      try {
        const parsed = JSON.parse(body);
        console.debug('[API Request]', method, url, { body: parsed });
        console.debug('[API Request] Raw body string:', body);
        console.debug('[API Request] Headers:', headers);
      } catch {
        console.debug('[API Request]', method, url, { body });
      }
    }

    const response = await fetch(url, {
      method,
      body,
      headers,
      signal: signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      await handleError(response);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    // Fallback: return response text when JSON isn't provided
  const text = await response.text();
  return (text as unknown as T);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw { message: 'Request timeout', status: 408 } as ApiError;
    throw err;
  }
}

/**
 * Public API Methods
 */
export const apiClient = {
  get<T>(endpoint: string, params?: Record<string, any>) {
    return request<T>(endpoint, { method: 'GET', params });
  },

  post<T>(endpoint: string, data?: any) {
    return request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
  },

  put<T>(endpoint: string, data?: any) {
    return request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  },

  delete<T>(endpoint: string) {
    return request<T>(endpoint, { method: 'DELETE' });
  },

  patch<T>(endpoint: string, data?: any) {
    return request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) });
  },

  upload<T>(endpoint: string, formData: FormData) {
    // Skip Content-Type header to let browser set multipart/form-data with boundary
    return request<T>(endpoint, {
      method: 'POST',
      body: formData,
      skipContentType: true,
    });
  },

  async download(endpoint: string, filename?: string): Promise<Blob> {
    const url = `${getBaseUrl()}${endpoint}`;
    const headers = buildHeaders();

    const response = await fetch(url, { headers });
    if (!response.ok) await handleError(response);

    const blob = await response.blob();

    if (filename && typeof window !== 'undefined') {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    }

    return blob;
  },
};

/**
 * Extract token from cookie header string
 */
function extractTokenFromCookies(cookieHeader: string): string | undefined {
  if (!cookieHeader) {
    console.log('[extractTokenFromCookies] No cookie header provided');
    return undefined;
  }
  console.log('[extractTokenFromCookies] Cookie header:', cookieHeader);
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  const token = match ? match[1] : undefined;
  console.log('[extractTokenFromCookies] Extracted token:', token ? `Found (${token.substring(0, 20)}...)` : 'None');
  return token;
}

/**
 * Qwik SSR-friendly API client creator
 * Auto-extracts cookies/token from requestEvent
 */
export function createSSRApiClient(requestEvent: any) {
  const cookieHeader = requestEvent.request.headers.get('cookie') || '';
  const serverToken = extractTokenFromCookies(cookieHeader);
  const serverBaseUrl =
    requestEvent.url.hostname === 'localhost'
      ? 'http://localhost:8080/api/v1'
      : 'http://localhost:8080/api/v1'; //'https://ugcl-429789556411.asia-south1.run.app/api/v1';

  console.log('[createSSRApiClient] Token extracted:', serverToken ? 'Yes' : 'No');
  console.log('[createSSRApiClient] Base URL:', serverBaseUrl);
  console.log('[createSSRApiClient] Request URL:', requestEvent.url.pathname);

  // Helper to handle 401 errors in SSR by throwing redirect
  const handleSSRUnauthorized = (error: any) => {
    if (error.status === 401) {
      console.log('[SSR] 401 Unauthorized - redirecting to login');
      throw requestEvent.redirect(302, '/login');
    }
    throw error;
  };

  return {
    async get<T>(endpoint: string, params?: Record<string, any>) {
      try {
        return await request<T>(endpoint, { method: 'GET', params, serverBaseUrl, serverToken });
      } catch (error) {
        handleSSRUnauthorized(error);
        throw error;
      }
    },
    async post<T>(endpoint: string, data?: any) {
      try {
        return await request<T>(endpoint, { method: 'POST', body: JSON.stringify(data), serverBaseUrl, serverToken });
      } catch (error) {
        handleSSRUnauthorized(error);
        throw error;
      }
    },
    async put<T>(endpoint: string, data?: any) {
      try {
        return await request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data), serverBaseUrl, serverToken });
      } catch (error) {
        handleSSRUnauthorized(error);
        throw error;
      }
    },
    async delete<T>(endpoint: string) {
      try {
        return await request<T>(endpoint, { method: 'DELETE', serverBaseUrl, serverToken });
      } catch (error) {
        handleSSRUnauthorized(error);
        throw error;
      }
    },
  };
}
