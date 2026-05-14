// Thin fetch wrapper for the backend API.
//
// - Prefixes VITE_API_BASE_URL.
// - Sends `credentials: 'include'` so the cookie session sticks.
// - Serialises `json` payloads and parses JSON responses.
// - Throws ApiError on non-2xx so call sites can branch on status.

const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
export const API_BASE_URL = RAW_BASE.replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `API ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type ApiInit = Omit<RequestInit, 'body'> & {
  json?: unknown;
  body?: BodyInit;
};

export async function apiFetch<T = unknown>(path: string, init: ApiInit = {}): Promise<T> {
  const { json, headers, body, ...rest } = init;
  const finalHeaders = new Headers(headers);
  let finalBody: BodyInit | undefined = body;
  if (json !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
    finalBody = JSON.stringify(json);
  }
  if (!finalHeaders.has('Accept')) finalHeaders.set('Accept', 'application/json');

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    body: finalBody,
    headers: finalHeaders,
    credentials: 'include',
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

// Vite env vars are strings; treat anything other than the literal "true" as off.
export function envFlag(name: 'VITE_USE_REAL_EMAIL' | 'VITE_USE_REAL_JOBS'): boolean {
  return import.meta.env[name] === 'true';
}
