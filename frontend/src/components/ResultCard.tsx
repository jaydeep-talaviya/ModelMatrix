import { describeConfig, displayResponse, formatDuration, formatTokens } from '../lib/labels'
import type { ExperimentResult } from '../types'

interface ResultCardProps {
  result: ExperimentResult
}

export function ResultCard({ result }: ResultCardProps) {
  const { config, status } = result
  const isError = status === 'error'

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-sm font-medium text-gray-800 dark:text-gray-100">
          {describeConfig(config)}
        </p>
        <span
          className={
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ' +
            (isError
              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300')
          }
        >
          {isError ? 'Error' : 'Success'}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        <span>tokens: {formatTokens(result.usage.total_tokens)}</span>
        <span>
          in {formatTokens(result.usage.input_tokens)} / out{' '}
          {formatTokens(result.usage.output_tokens)}
        </span>
        <span>{formatDuration(result.duration_ms)}</span>
      </div>

      {isError ? (
        <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {result.error}
        </pre>
      ) : (
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-800/60 dark:text-gray-200">
          {displayResponse(config, result.response)}
        </pre>
      )}
    </article>
  )
}