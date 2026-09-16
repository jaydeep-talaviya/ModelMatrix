import type { ExperimentRequest, OptionsResponse, RunResult } from '../types'

// Same-origin (/api) in dev (Vite proxy) and when backend serves the frontend;
// VITE_API_BASE overrides it (e.g. a separate deployed API origin).
const BASE =
  (import.meta.env as Record<string, string | undefined>).VITE_API_BASE?.replace(/\/+$/, '') ??
  '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = body?.detail ?? message
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new Error(message)
  }
  return (await res.json()) as T
}

export function getOptions(): Promise<OptionsResponse> {
  return request<OptionsResponse>('/options')
}

export function runExperiments(
  body: ExperimentRequest,
  signal?: AbortSignal,
): Promise<RunResult> {
  return request<RunResult>('/runs', {
    method: 'POST',
    body: JSON.stringify(body),
    signal,
  })
}