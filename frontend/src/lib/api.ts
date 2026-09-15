import type { ExperimentRequest, OptionsResponse, RunResult } from '../types'

const BASE = '/api'

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
): Promise<RunResult> {
  return request<RunResult>('/runs', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}