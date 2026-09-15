import { describeConfig, formatDuration, formatTokens } from './labels'
import { estimateCost, formatCost } from './pricing'
import type { ExperimentResult, RunResult } from '../types'

const TIMESTAMP = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

const CSV_COL = [
  'Prompt',
  'Provider',
  'Model',
  'Effort',
  'Structured',
  'Status',
  'Input tokens',
  'Output tokens',
  'Total tokens',
  'Est. cost (USD)',
  'Duration (ms)',
  'Response',
  'Error',
]

function csvSafe(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function rowToCsvRow(result: ExperimentResult, prompt: string): string[] {
  const c = result.config
  const cost = estimateCost(c.provider, c.model_id, result.usage.input_tokens, result.usage.output_tokens)
  return [
    prompt,
    c.provider,
    c.model_id,
    c.effort,
    String(c.structured_output),
    result.status,
    String(result.usage.input_tokens ?? ''),
    String(result.usage.output_tokens ?? ''),
    String(result.usage.total_tokens ?? ''),
    cost != null ? cost.toFixed(6) : '',
    String(result.duration_ms ?? ''),
    (result.response ?? '').replace(/[\r\n]+/g, ' ').trim(),
    result.error ?? '',
  ]
}

export function toCsv(run: RunResult): string {
  const header = CSV_COL.map(csvSafe).join(',')
  const rows = run.results.map((r) => rowToCsvRow(r, run.prompt).map(csvSafe).join(','))
  return [header, ...rows].join('\n')
}

export function toMarkdown(run: RunResult): string {
  const ts = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  const lines: string[] = [
    `# LLM Experiment — ${ts}`,
    '',
    `## Prompt`,
    `> ${run.prompt.replace(/\n/g, '\n> ')}`,
    '',
    `## Results`,
    '',
    '| Configuration | Status | In | Out | Total | Est. cost | Duration | Response |',
    '|---|---|---|---|---|---|---|---|',
  ]

  for (const r of run.results) {
    const cost = estimateCost(
      r.config.provider,
      r.config.model_id,
      r.usage.input_tokens,
      r.usage.output_tokens,
    )
    const snippet = (r.response ?? r.error ?? '')
      .replace(/\n+/g, ' ')
      .replace(/\|/g, '\\|')
      .slice(0, 160)
    lines.push(
      [
        describeConfig(r.config),
        r.status === 'success' ? 'success' : '**error**',
        formatTokens(r.usage.input_tokens),
        formatTokens(r.usage.output_tokens),
        formatTokens(r.usage.total_tokens),
        formatCost(cost),
        formatDuration(r.duration_ms),
        snippet,
      ].join(' | '),
    )
  }

  lines.push('')
  const successful = run.results.filter((r) => r.status === 'success')
  if (successful.length > 0) {
    lines.push('## Full responses', '')
    for (const r of successful) {
      lines.push(`### ${describeConfig(r.config)}`, '')
      const formatted = r.config.structured_output
        ? (() => {
            try {
              return '```json\n' + JSON.stringify(JSON.parse(r.response!), null, 2) + '\n```'
            } catch {
              return '```\n' + r.response + '\n```'
            }
          })()
        : '```\n' + r.response + '\n```'
      lines.push(formatted, '')
    }
  }

  return lines.join('\n')
}

export function download(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function tsPrefix(): string {
  return TIMESTAMP()
}