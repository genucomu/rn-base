import { config } from '@/lib/config';
import { useAuthStore } from '@/stores/auth-store';

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

async function request<T>(method: string, path: string, options: RequestInit = {}): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    ...options,
    method,
    headers,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new HttpError(res.status, body || `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

async function requestWithRefresh<T>(
  method: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    return await request<T>(method, path, options);
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();

      if (!refreshToken) {
        clearAuth();
        throw error;
      }

      let refreshRes: Response;
      refreshRes = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      console.log('Refresh response:', refreshRes.status);

      if (!refreshRes.ok) {
        if (refreshRes.status === 401 || refreshRes.status === 403) {
          clearAuth();
        }
        throw new HttpError(refreshRes.status, 'Refresh token inválido o expirado');
      }

      const data = (await refreshRes.json()) as {
        accessToken: string;
        refreshToken: string;
      };

      if (!data.accessToken || !data.refreshToken) {
        throw new Error('Respuesta inválida al renovar la sesión');
      }

      setTokens(data.accessToken, data.refreshToken);

      return request<T>(method, path, options);
    }
    throw error;
  }
}

export const http = {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      }
    }
    const query = searchParams.toString();
    return requestWithRefresh<T>('GET', query ? `${path}?${query}` : path);
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return requestWithRefresh<T>('POST', path, {
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return requestWithRefresh<T>('PATCH', path, {
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string): Promise<T> {
    return requestWithRefresh<T>('DELETE', path);
  },
};
