/**
 * Single entry point for every call to the Garment E-commerce FastAPI backend.
 *
 * The backend speaks snake_case and issues short-lived JWTs; this module hides
 * both from the rest of the app — responses come back camelCased and an expired
 * access token is refreshed and the request replayed once, so a session that has
 * been idle does not surface as a spurious logout.
 */

const FALLBACK_BASE_URL = 'https://d100c6f2kgsym4.cloudfront.net';

const ACCESS_TOKEN_KEY = 'dristhi_access_token';
const REFRESH_TOKEN_KEY = 'dristhi_refresh_token';
const BASE_URL_KEY = 'dristhi_api_base_url';

// Vite inlines `import.meta.env` at build time; the optional chaining keeps the
// module importable outside a Vite build (SSR checks, test runners), where the
// whole `env` object is absent.
const configuredBaseUrl = import.meta.env?.VITE_API_BASE_URL;

let baseUrl = configuredBaseUrl?.replace(/\/$/, '') || FALLBACK_BASE_URL;
let accessToken: string | null = null;
let refreshToken: string | null = null;

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }

  /** The session is gone (or was never there) rather than the request being wrong. */
  get isAuthError() {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  get isNotFound() {
    return this.statusCode === 404;
  }
}

/** Turns anything thrown by a fetch into a message worth putting in a toast. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function getBaseUrl(): string {
  return baseUrl;
}

export function setBaseUrl(url: string): void {
  baseUrl = url.replace(/\/$/, '');
  try {
    localStorage.setItem(BASE_URL_KEY, baseUrl);
  } catch {
    /* private browsing — the override just does not persist */
  }
}

/** Restores tokens (and any base-URL override) from a previous session. */
export function initApiClient(): void {
  try {
    accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const saved = localStorage.getItem(BASE_URL_KEY);
    if (saved) baseUrl = saved.replace(/\/$/, '');
  } catch {
    /* noop */
  }
}

export function setTokens(access: string, refresh: string): void {
  accessToken = access;
  refreshToken = refresh;
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  } catch {
    /* noop */
  }
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    /* noop */
  }
}

export function hasToken(): boolean {
  return accessToken !== null;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) h.Authorization = `Bearer ${accessToken}`;
  return h;
}

const toCamel = (key: string) => key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/**
 * Normalises response keys to camelCase. Request bodies are written in
 * snake_case by hand in the api modules, so only responses need converting.
 */
function camelizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelizeKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [toCamel(k), camelizeKeys(v)]),
    );
  }
  return value;
}

/**
 * FastAPI reports validation failures as a list of error objects under `detail`.
 * Flatten those into one readable sentence instead of showing "[object Object]".
 */
function extractDetail(decoded: unknown): string | null {
  if (typeof decoded !== 'object' || decoded === null) return null;
  const detail = (decoded as Record<string, unknown>).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map(d => (typeof d === 'object' && d !== null ? String((d as Record<string, unknown>).msg ?? '') : String(d)))
      .filter(Boolean);
    if (messages.length) return messages.join('. ');
  }
  return null;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let decoded: unknown = text;
  try {
    decoded = text ? JSON.parse(text) : null;
  } catch {
    /* a non-JSON body (e.g. a proxy error page) stays a string */
  }

  if (res.ok) {
    if (typeof decoded === 'object' && decoded !== null) return camelizeKeys(decoded) as T;
    return decoded as T;
  }

  throw new ApiError(res.status, extractDetail(decoded) ?? `Request failed (${res.status})`);
}

const REFRESH_PATH = '/api/v1/auth/refresh-token';

/**
 * `unavailable` is deliberately distinct from `expired`: the refresh could not
 * be attempted (the network was down), which is not evidence the session died.
 * Only `expired` ends the session.
 */
type RefreshOutcome = 'refreshed' | 'expired' | 'unavailable';

let refreshInFlight: Promise<RefreshOutcome> | null = null;

/** Called when the session ends for good, so the store can drop the user. */
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

/**
 * Exchanges the refresh token for a new access token. Concurrent callers share
 * one in-flight request, so a burst of 401s triggers a single refresh.
 */
async function refreshAccessToken(): Promise<RefreshOutcome> {
  // Nothing to refresh with — whatever access token we hold is unusable.
  if (!refreshToken) return 'expired';

  refreshInFlight ??= (async (): Promise<RefreshOutcome> => {
    try {
      const res = await fetch(`${baseUrl}${REFRESH_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return 'expired';
      const data = await res.json();
      const access = data.access_token as string | undefined;
      if (!access) return 'expired';
      setTokens(access, (data.refresh_token as string) ?? refreshToken!);
      return 'refreshed';
    } catch {
      return 'unavailable';
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function request<T>(path: string, init: RequestInit, query?: Record<string, string>): Promise<T> {
  const url = new URL(`${baseUrl}${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }

  const send = () => fetch(url.toString(), { ...init, headers: headers() });

  let res: Response;
  try {
    res = await send();
  } catch {
    throw new ApiError(0, 'Cannot reach the store right now. Check your connection and try again.');
  }

  // A guest hitting a protected route also gets a 401/403; only a request that
  // carried a token is worth retrying.
  const isAuthFailure = res.status === 401 || res.status === 403;
  if (isAuthFailure && accessToken && path !== REFRESH_PATH) {
    const outcome = await refreshAccessToken();
    if (outcome === 'refreshed') {
      res = await send();
    } else if (outcome === 'expired') {
      clearTokens();
      onSessionExpired?.();
    }
    // 'unavailable' keeps the tokens; the original error surfaces and the next
    // call can try again once the network recovers.
  }

  return handleResponse<T>(res);
}

export function apiGet<T>(path: string, query?: Record<string, string>): Promise<T> {
  return request<T>(path, { method: 'GET' }, query);
}

export function apiPost<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
}

export function apiPut<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

/** For binary endpoints (the GST invoice PDF) where JSON decoding would corrupt the body. */
export async function apiGetBlob(path: string): Promise<Blob> {
  const res = await fetch(`${baseUrl}${path}`, { headers: headers() });
  if (!res.ok) {
    const text = await res.text();
    let message = `Request failed (${res.status})`;
    try {
      message = extractDetail(JSON.parse(text)) ?? message;
    } catch {
      /* noop */
    }
    throw new ApiError(res.status, message);
  }
  return res.blob();
}

/**
 * Multipart upload for the evidence endpoint. Unlike the JSON helpers this one
 * must NOT set a Content-Type header — the browser fills in the boundary.
 */
async function requestUpload<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append('file', file);

  const send = () => {
    const h: Record<string, string> = {};
    if (accessToken) h.Authorization = `Bearer ${accessToken}`;
    return fetch(`${baseUrl}${path}`, { method: 'POST', headers: h, body: form });
  };

  let res: Response;
  try {
    res = await send();
  } catch {
    throw new ApiError(0, 'Cannot reach the store right now. Check your connection and try again.');
  }

  const isAuthFailure = res.status === 401 || res.status === 403;
  if (isAuthFailure && accessToken && path !== REFRESH_PATH) {
    const outcome = await refreshAccessToken();
    if (outcome === 'refreshed') {
      res = await send();
    } else if (outcome === 'expired') {
      clearTokens();
      onSessionExpired?.();
    }
  }

  return handleResponse<T>(res);
}

/** Uploads a customer return-evidence image. Returns the public S3 URL. */
export function apiUploadReturnEvidence(file: File): Promise<{ url: string }> {
  return requestUpload<{ url: string }>('/api/v1/upload/return-evidence', file);
}
