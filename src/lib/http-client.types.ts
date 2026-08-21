export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

export interface HttpRequestConfig<TBody = unknown> {
  method?: HttpMethod;
  url: string;
  params?: QueryParams;
  body?: TBody;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: number;
  signal?: AbortSignal;
}

export interface ApiErrorShape {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

export class ApiError extends Error {
  code: string;
  status?: number;
  details?: unknown;

  constructor({ code, message, status, details }: ApiErrorShape) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  retry?: number;
  getAccessToken?: () => string | null | undefined;
  onUnauthorized?: (error: ApiError) => void;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}
