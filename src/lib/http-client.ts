import type {
  ApiErrorShape,
  HttpClientOptions,
  HttpMethod,
  HttpRequestConfig,
  HttpResponse,
  QueryParams,
} from '@/lib/http-client.types';
import { ApiError } from '@/lib/http-client.types';

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

function buildQueryString(params?: QueryParams): string {
  if (!params) {
    return '';
  }

  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== null && item !== undefined) {
          query.append(key, String(item));
        }
      }
      continue;
    }

    query.append(key, String(value));
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

function normalizeUrl(url: string, params?: QueryParams, baseURL?: string): string {
  const hasAbsoluteUrl = /^https?:\/\//i.test(url) || url.startsWith('data:');
  const source = hasAbsoluteUrl ? url : `${baseURL ?? ''}${url}`;
  const query = buildQueryString(params);

  if (!query) {
    return source;
  }

  return source.includes('?') ? `${source}&${query.slice(1)}` : `${source}${query}`;
}

function createAbortSignal(
  timeout: number | undefined,
  signal: AbortSignal | undefined,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const externalSignal = signal;

  const abortFromTimeout = () => controller.abort();
  const timeoutId = timeout ? setTimeout(abortFromTimeout, timeout) : undefined;

  const abortFromExternal = () => {
    controller.abort();
  };

  externalSignal?.addEventListener('abort', abortFromExternal, { once: true });

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      externalSignal?.removeEventListener('abort', abortFromExternal);
    },
  };
}

function parseResponseBody<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json') || contentType.includes('+json');
  if (response.status === 204 || response.status === 205) {
    return Promise.resolve(null);
  }

  if (!response.headers.get('content-length') && !contentType) {
    return Promise.resolve(null);
  }

  if (!isJson) {
    return response.text() as Promise<T | null>;
  }

  return response.text().then((text) => {
    if (!text) {
      return null;
    }
    return JSON.parse(text) as T;
  });
}

function buildApiError(response: Response, details: unknown): ApiError {
  const payload = details as Partial<ApiErrorShape> | undefined;
  const status = response.status || payload?.status;
  const fallbackMessage = `Request failed with status ${status ?? 'unknown'}`;

  return new ApiError({
    code: payload?.code ?? `HTTP_${status ?? 'UNKNOWN'}`,
    message: payload?.message ?? fallbackMessage,
    status,
    details,
  });
}

function createDefaultHeaders(
  headers: Record<string, string> | undefined,
  token: string | null | undefined,
): Record<string, string> {
  const nextHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers ?? {}),
  };

  if (token) {
    nextHeaders.Authorization = `Bearer ${token}`;
  }

  return nextHeaders;
}

export class HttpClient {
  private readonly baseURL?: string;
  private readonly timeout?: number;
  private readonly retry?: number;
  private readonly getAccessToken?: () => string | null | undefined;
  private readonly onUnauthorized?: (error: ApiError) => void;

  constructor(options: HttpClientOptions = {}) {
    this.baseURL = options.baseURL;
    this.timeout = options.timeout;
    this.retry = options.retry ?? 0;
    this.getAccessToken = options.getAccessToken;
    this.onUnauthorized = options.onUnauthorized;
  }

  async request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const method = (config.method ?? 'GET').toUpperCase() as HttpMethod;
    const timeout = config.timeout ?? this.timeout;
    const maxRetries = config.retry ?? this.retry ?? 0;
    const url = normalizeUrl(config.url, config.params, this.baseURL);
    const token = this.getAccessToken?.();
    const headers = createDefaultHeaders(config.headers, token);
    const payload = config.body;

    const requestInit: RequestInit = {
      method,
      headers,
    };

    if (method !== 'GET' && method !== 'HEAD' && payload !== undefined) {
      if (isFormData(payload)) {
        requestInit.body = payload;
        delete headers['Content-Type'];
      } else {
        requestInit.body = JSON.stringify(payload);
        headers['Content-Type'] = 'application/json';
      }
    }

    let attempts = 0;
    let lastError: unknown;

    while (attempts <= maxRetries) {
      const { signal, cleanup } = createAbortSignal(timeout, config.signal);
      try {
        const response = await fetch(url, { ...requestInit, signal });
        const responseData = await parseResponseBody<T>(response);

        if (!response.ok) {
          const apiError = buildApiError(
            response,
            responseData ?? { message: response.statusText },
          );
          if (response.status === 401 || response.status === 403) {
            this.onUnauthorized?.(apiError);
          }

          if (
            attempts < maxRetries &&
            (response.status === 408 || response.status === 429 || response.status >= 500)
          ) {
            attempts += 1;
            continue;
          }

          throw apiError;
        }

        return {
          data: (responseData as T) ?? (null as T),
          status: response.status,
          headers: response.headers,
        };
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }

        lastError = error;
        const shouldRetry =
          attempts < maxRetries &&
          error instanceof ApiError &&
          (error.status === 408 || error.status === 429 || (error.status ?? 0) >= 500);

        if (shouldRetry) {
          attempts += 1;
          continue;
        }

        throw error;
      } finally {
        cleanup();
      }
    }

    throw lastError ?? new Error('Request failed');
  }

  get<T>(url: string, config: Omit<HttpRequestConfig, 'method' | 'url'> = {}): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url }).then((response) => response.data);
  }

  post<TBody, TResponse = TBody>(
    url: string,
    body?: TBody,
    config: Omit<HttpRequestConfig<TBody>, 'method' | 'url' | 'body'> = {},
  ): Promise<TResponse> {
    return this.request<TResponse>({ ...config, method: 'POST', url, body }).then(
      (response) => response.data,
    );
  }

  put<TBody, TResponse = TBody>(
    url: string,
    body?: TBody,
    config: Omit<HttpRequestConfig<TBody>, 'method' | 'url' | 'body'> = {},
  ): Promise<TResponse> {
    return this.request<TResponse>({ ...config, method: 'PUT', url, body }).then(
      (response) => response.data,
    );
  }

  patch<TBody, TResponse = TBody>(
    url: string,
    body?: TBody,
    config: Omit<HttpRequestConfig<TBody>, 'method' | 'url' | 'body'> = {},
  ): Promise<TResponse> {
    return this.request<TResponse>({ ...config, method: 'PATCH', url, body }).then(
      (response) => response.data,
    );
  }

  delete<T = void>(
    url: string,
    config: Omit<HttpRequestConfig, 'method' | 'url'> = {},
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url }).then((response) => response.data);
  }
}

export const createHttpClient = (options: HttpClientOptions = {}) => new HttpClient(options);

export const httpClient = createHttpClient({
  timeout: 10_000,
  retry: 1,
});
