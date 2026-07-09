export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

const AUTH_TOKEN_KEY = 'fiberpass:auth-token';

export interface ApiRequestOptions extends RequestInit {
  auth?: boolean;
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function getStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function getAuthToken(): string | null {
  return getStorage()?.getItem(AUTH_TOKEN_KEY) ?? null;
}

export function setAuthToken(token: string): void {
  getStorage()?.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  getStorage()?.removeItem(AUTH_TOKEN_KEY);
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function apiUnavailableMessage(): string {
  return 'Cannot reach the FiberPass API at ' + API_URL + '. Start the backend, then check VITE_API_URL and backend CORS settings.';
}

function isFetchNetworkError(error: unknown): boolean {
  return error instanceof TypeError && /fetch|network|load failed/i.test(error.message);
}

export function getApiErrorMessage(error: unknown, fallback = 'FiberPass API request failed.'): string {
  if (error instanceof ApiError) return error.message;
  if (isFetchNetworkError(error)) return apiUnavailableMessage();
  if (error instanceof Error) return error.message;
  return fallback;
}

function parseBody(text: string): unknown {
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getErrorBody(data: unknown): ApiErrorBody['error'] | undefined {
  if (!data || typeof data !== 'object' || !('error' in data)) return undefined;
  return (data as ApiErrorBody).error;
}

export async function apiRequest<T>(requestPath: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = true, ...requestOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...Object.fromEntries(new Headers(requestOptions.headers).entries())
  };

  const token = getAuthToken();
  if (auth && token) {
    headers.Authorization = 'Bearer ' + token;
  }

  let response: Response;
  try {
    response = await fetch(API_URL + requestPath, {
      ...requestOptions,
      headers
    });
  } catch (error) {
    throw new ApiError(
      0,
      'API_NETWORK_ERROR',
      apiUnavailableMessage(),
      error instanceof Error ? { cause: error.message } : undefined
    );
  }

  const data = parseBody(await response.text());

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
    }

    const error = getErrorBody(data);
    throw new ApiError(
      response.status,
      error?.code ?? 'FIBERPASS_API_ERROR',
      error?.message ?? 'FiberPass API request failed with ' + response.status,
      error?.details
    );
  }

  return data as T;
}
