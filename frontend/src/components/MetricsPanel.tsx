import { useMemo, useState } from 'react'

import { describeConfig, formatDuration, formatTokens } from '../lib/labels'
import { Tooltip } from './Tooltip'
import type { ExperimentResult } from '../types'

type SortKey = 'total' | 'input' | 'output' | 'thinking' | 'duration' | 'ratio'

interface MetricRow {
  key: string
  result: ExperimentResult
  input: number | null
  output: number | null
  thinking: number
  total: number
  duration: number | null
  ratio: number | null
}

function buildRows(results: ExperimentResult[]): MetricRow[] {
  return results.map((result) => {
    const input = result.usage.input_tokens
    const output = result.usage.output_tokens
    const total = result.usage.total_tokens
    const thinking =
      total != null && input != null && output != null
        ? Math.max(0, total - input - output)
        : 0
    const hasThinkingOutput = thinking > 0
    const durationMs = result.duration_ms
    const ratio =
      input != null && output != null && input > 0 ? output / input : null
    return {
      key: result.config_id,
      result,
      input,
      output,
      thinking: hasThinkingOutput ? thinking : 0,
      total: total ?? 0,
      duration: durationMs,
      ratio,
    }
  })
}

const SORT_LABELS: Record<SortKey, string> = {
  total: 'Total tokens',
  input: 'In',
  output: 'Out',
  thinking: 'Thinking',
  duration: 'Duration',
  ratio: 'Out/In',
}

const COLUMN_TOOLTIPS: Record<string, string> = {
  total: 'Input + output + any hidden thinking tokens reported by the provider. Lower = shorter/budget-friendlier.',
  ratio: 'Output tokens ÷ input tokens. Higher = more expansion of your prompt. Rewards verbosity; noisy for short prompts.',
}

export function MetricsPanel({ results }: { results: ExperimentResult[] }) {
  const rows = useMemo(() => buildRows(results), [results])
  const [sortKey, setSortKey] = useState<SortKey>('total')
  const [desc, setDesc] = useState(false)

  const sorted = useMemo(() => {
    const list = [...rows]
    list.sort((a, b) => {
      const va = a[sortKey] ?? -1
      const vb = b[sortKey] ?? -1
      return (desc ? vb - va : va - vb) as number
    })
    return list
  }, [rows, sortKey, desc])

  const successes = rows.filter((r) => r.result.status === 'success')
  const minTotal = successes.length ? Math.min(...successes.map((r) => r.total || 0)) : 0
  const minDuration = successes.length
    ? Math.min(...successes.map((r) => r.duration ?? Infinity))
    : 0
  const maxRatio = successes.length
    ? Math.max(...successes.map((r) => r.ratio ?? 0))
    : 0

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDesc(!desc)
    } else {
      setSortKey(key)
      setDesc(false)
    }
  }

  const bestOf = (key: 'total' | 'duration' | 'ratio') => {
    if (!successes.length) return null
    let best: MetricRow | null = null
    for (const r of successes) {
      if (best == null) {
        best = r
        continue
      }
      if (key === 'total' && (r.total || 0) < (best.total || 0)) best = r
      else if (
        key === 'duration' &&
        (r.duration ?? Infinity) < (best.duration ?? Infinity)
      )
        best = r
      else if (key === 'ratio' && (r.ratio ?? -1) > (best.ratio ?? -1)) best = r
    }
    return best
  }

  const summaries = [
    {
      label: 'Lowest total tokens',
      value: successes.length ? formatTokens(minTotal) : '—',
      row: bestOf('total'),
      hint: 'good for short, direct answers',
    },
    {
      label: 'Shortest time',
      value: formatDuration(successes.length ? minDuration : null),
      row: bestOf('duration'),
      hint: 'good for quick checks',
    },
    {
      label: 'Highest output/input',
      value: successes.length ? maxRatio.toFixed(2) : '—',
      row: bestOf('ratio'),
      hint: 'good for long, expanded answers',
    },
  ]

  const anyThinking = rows.some((r) => r.thinking > 0)

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
        No single config is “best” — pick by your goal: small/quick questions
        want fewer tokens and shorter times; hard or open-ended tasks want
        higher effort and longer answers. These cards just point at the
        notable values from this run.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {summaries.map(({ label, value, row, hint }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
          >
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {label}
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {value}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-gray-600 dark:text-gray-300" title={row ? describeConfig(row.result.config) : ''}>
              {row ? describeConfig(row.result.config) : 'no successful runs'}
            </p>
            <p className="text-[10px] text-gray-400">{hint}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-3 py-2 font-medium">Configuration</th>
{(["total", "input", "output", "duration", "ratio"] as SortKey[]).map(
                (key) =>
                  (key !== 'ratio' || successes.length > 0) && (
                    <th
                      key={key}
                      onClick={() => toggleSort(key)}
                      className="cursor-pointer select-none whitespace-nowrap px-3 py-2 font-medium hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      <div>
                        {COLUMN_TOOLTIPS[key] ? (
                          <Tooltip text={COLUMN_TOOLTIPS[key]}>
                            {SORT_LABELS[key]}
                          </Tooltip>
                        ) : (
                          SORT_LABELS[key]
                        )}
                        {sortKey === key ? (desc ? ' ↓' : ' ↑') : ''}
                      </div>
                    </th>
                  ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map((row) => {
              const success = row.result.status === 'success'
              const isMinTotal = success && minTotal > 0 && row.total === minTotal
              const isMinDuration =
                success && row.duration != null && row.duration === minDuration
              const isMaxRatio = success && row.ratio != null && row.ratio === maxRatio
              return (
                <tr key={row.key} className={success ? '' : 'opacity-50'}>
                  <td className="max-w-[180px] truncate px-3 py-2 text-gray-700 dark:text-gray-200">
                    <span
                      title={describeConfig(row.result.config)}
                      className="block truncate"
                    >
                      {describeConfig(row.result.config)}
                    </span>
                    <span
                      className={
                        'mt-0.5 inline-block rounded-full px-1.5 text-[9px] font-medium ' +
                        (success
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300')
                      }
                    >
                      {success ? 'OK' : row.result.error?.split(':')[0] ?? 'error'}
                    </span>
                  </td>
                  <td
                    className={
                      'whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-300 ' +
                      (isMinTotal ? 'font-semibold text-green-600 dark:text-green-400' : '')
                    }
                  >
                    {formatTokens(row.total)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-300">
                    {formatTokens(row.input)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-300">
                    {formatTokens(row.output)}
                    {anyThinking && row.thinking > 0 && (
                      <span className="ml-1 text-[10px] text-gray-400" title="Thinking tokens (Gemini)">
                        +{formatTokens(row.thinking)} think
                      </span>
                    )}
                  </td>
                  <td
                    className={
                      'whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-300 ' +
                      (isMinDuration ? 'font-semibold text-green-600 dark:text-green-400' : '')
                    }
                  >
                    {formatDuration(row.duration)}
                  </td>
                  <td
                    className={
                      'whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-300 ' +
                      (isMaxRatio ? 'font-semibold text-green-600 dark:text-green-400' : '')
                    }
                  >
                    {row.ratio != null ? row.ratio.toFixed(2) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {minTotal > 0 && (
        <p className="text-[11px] text-gray-400">
          Green marks the lowest or highest value in a column — an observation
          for your chosen goal, not a judgment that a config is “better”.
          'Thinking' tokens are Gemini's hidden reasoning and only appear when
          the provider reports them (total − input − output).
        </p>
      )}
    </div>
  )
}