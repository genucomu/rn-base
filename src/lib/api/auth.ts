import { useMutation } from '@tanstack/react-query';
import type { User } from '@/types/api';

// ── Types ───────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string | null;
  user: User;
}

// ── API error class ─────────────────────────────────────

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// ── Mutation function ───────────────────────────────────

async function loginRequest(data: LoginRequest): Promise<LoginResponse> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.39:3000';
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured');
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error('No se pudo conectar. Verificá tu conexión.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(response.status, 'Respuesta inválida del servidor');
  }

  if (!response.ok) {
    const message =
      response.status === 401
        ? 'Email o contraseña incorrectos'
        : `Error del servidor (${response.status})`;
    throw new ApiError(response.status, message, body);
  }

  const rawBody = body as {
    accessToken?: string;
    access_token?: string;
    refreshToken?: string;
    refresh_token?: string;
    token?: string;
    user?: User;
    data?: {
      accessToken?: string;
      access_token?: string;
      refreshToken?: string;
      refresh_token?: string;
      token?: string;
      user?: User;
    };
  };
  const responseBody = rawBody.data ?? rawBody;
  const accessToken = responseBody.accessToken ?? responseBody.access_token ?? responseBody.token;

  if (!accessToken || !responseBody.user) {
    throw new ApiError(response.status, 'Respuesta de login inválida', body);
  }

  return {
    accessToken,
    refreshToken: responseBody.refreshToken ?? responseBody.refresh_token ?? null,
    user: responseBody.user,
  };
}

// ── Hook ────────────────────────────────────────────────

interface UseLoginMutationOptions {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: Error) => void;
}

export function useLoginMutation({ onSuccess, onError }: UseLoginMutationOptions = {}) {
  return useMutation({
    mutationFn: loginRequest,
    onSuccess,
    onError,
  });
}
