import { useState } from 'react'

import { describeConfig, displayResponse, formatDuration, formatTokens } from '../lib/labels'
import type { ExperimentResult } from '../types'

const COLLAPSE_CHARS = 420

interface ResultCardProps {
  result: ExperimentResult
}

export function ResultCard({ result }: ResultCardProps) {
  const { config, status } = result
  const isError = status === 'error'
  const content = isError ? result.error ?? '' : displayResponse(config, result.response)
  const collapsible = content.length > COLLAPSE_CHARS
  const [expanded, setExpanded] = useState(!collapsible)

  return (
    <article className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-2">
        <h3
          className="min-w-0 break-words text-xs font-medium leading-snug text-gray-800 dark:text-gray-100"
          title={describeConfig(config)}
        >
          {describeConfig(config)}
        </h3>
        <span
          className={
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ' +
            (isError
              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300')
          }
        >
          {isError ? 'Error' : 'OK'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
        <span title="Total tokens across all counts">
          {formatTokens(result.usage.total_tokens)} tok
        </span>
        <span>in {formatTokens(result.usage.input_tokens)}</span>
        <span>out {formatTokens(result.usage.output_tokens)}</span>
        <span>{formatDuration(result.duration_ms)}</span>
      </div>

      <pre
        className={
          'max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-2.5 text-[11px] leading-relaxed text-gray-800 dark:bg-gray-800/60 dark:text-gray-200 ' +
          (collapsible && !expanded ? 'relative max-h-28 overflow-hidden' : '')
        }
        data-testid="result-response"
      >
        {content || '(empty response)'}
        {collapsible && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="absolute inset-x-0 bottom-0 rounded-b-lg bg-gradient-to-t from-gray-50 to-transparent py-2 text-center text-[10px] font-medium text-gray-500 hover:text-gray-700 dark:from-gray-800/90 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Show full response
          </button>
        )}
      </pre>
      {collapsible && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="self-end text-[10px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          Collapse
        </button>
      )}
    </article>
  )
}