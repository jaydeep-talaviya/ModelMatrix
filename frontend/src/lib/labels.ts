import type { EffortLevel, ExperimentConfig, ProviderId } from '../types'

export const PROVIDER_DISPLAY: Record<ProviderId, string> = {
  openai: 'OpenAI',
  gemini: 'Gemini',
  anthropic: 'Anthropic',
}

export const EFFORT_DISPLAY: Record<EffortLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export function describeConfig(config: ExperimentConfig): string {
  const structure = config.structured_output ? 'structured (JSON)' : 'no structure'
  return `${PROVIDER_DISPLAY[config.provider]} → ${config.model_id} → ${
    EFFORT_DISPLAY[config.effort]
  } → ${structure}`
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

export function formatTokens(value: number | null | undefined): string {
  return value == null ? '—' : String(value)
}

/** Compact for spec sheets: 1.05M → "1.05M", 1048576 → "1,048,576". */
export function formatCompactTokens(value: number | null | undefined): string {
  if (value == null) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`
  if (value >= 1_000) return value.toLocaleString('en-US')
  return String(value)
}

/** Try to pretty-print structured (JSON) responses; fall back to raw text. */
export function displayResponse(config: ExperimentConfig, response: string | null): string {
  if (response == null) return ''
  if (config.structured_output) {
    try {
      return JSON.stringify(JSON.parse(response), null, 2)
    } catch {
      return response
    }
  }
  return response
}