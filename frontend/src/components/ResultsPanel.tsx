import { useEffect, useMemo, useRef, useState } from 'react'

import { runExperiments } from '../lib/api'
import { download, toCsv, toMarkdown, tsPrefix } from '../lib/export'
import { formatDuration, formatTokens } from '../lib/labels'
import { toExperimentRequest } from '../lib/toRequest'
import { useTree } from '../store/TreeContext'
import type { RunResult } from '../types'
import { ConfigLabel } from './ConfigLabel'
import { MetricsPanel } from './MetricsPanel'
import { ResultCard } from './ResultCard'

type RunPhase = 'idle' | 'running' | 'done' | 'error'

export function ResultsPanel() {
  const { state, options } = useTree()
  const [phase, setPhase] = useState<RunPhase>('idle')
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [durationMs, setDurationMs] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [view, setView] = useState<'cards' | 'insights' | 'table'>('cards')
  const abortRef = useRef<AbortController | null>(null)

  const leafCount = useMemo(() => {
    return Object.values(state.branches).reduce(
      (total, provider) =>
        total +
        Object.values(provider.models).reduce(
          (sum, model) => sum + Math.max(0, model.efforts.length),
          0,
        ),
      0,
    )
  }, [state.branches])

  const canRun =
    phase !== 'running' && state.prompt.trim().length > 0 && leafCount > 0

  useEffect(() => {
    if (startedAt == null) return
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [startedAt])

  const elapsed = startedAt == null ? (durationMs ?? 0) : now - startedAt

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const run = async () => {
    const request = toExperimentRequest(state)
    const started = Date.now()
    setRunResult(null)
    setRunError(null)
    setNow(started)
    setStartedAt(started)
    setPhase('running')
    const ac = new AbortController()
    abortRef.current = ac
    try {
      const result = await runExperiments(request, ac.signal)
      setRunResult(result)
      setDurationMs(Date.now() - started)
      setStartedAt(null)
      setPhase('done')
      setView('cards')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStartedAt(null)
        setPhase('idle')
        return
      }
      setRunError(err instanceof Error ? err.message : String(err))
      setDurationMs(Date.now() - started)
      setStartedAt(null)
      setPhase('error')
    } finally {
      abortRef.current = null
    }
  }

  const cancel = () => abortRef.current?.abort()

  const results = runResult?.results ?? []
  const succeeded = results.filter((r) => r.status === 'success').length
  const failed = results.length - succeeded
  const totalTokens = results.reduce((sum, r) => sum + (r.usage.total_tokens ?? 0), 0)

  const notConfiguredProviderIds = (options?.providers ?? [])
    .filter((p) => !p.configured && Object.keys(state.branches).includes(p.id))
    .map((p) => p.display_name)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => run()}
          disabled={!canRun}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
        >
          {phase === 'running' ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-gray-900/30 dark:border-t-gray-900" />
              Running… {formatDuration(elapsed)}
            </>
          ) : (
            'Run experiment'
          )}
        </button>
        {phase === 'running' && (
          <button
            onClick={cancel}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        )}
{phase === 'done' && runResult && (
          <div className="flex items-center gap-2">
            <div className="mr-1 flex items-center gap-1.5">
              <button
                onClick={() => download(`modelmatrix-${tsPrefix()}.md`, toMarkdown(runResult), 'text/markdown')}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Export .md
              </button>
              <button
                onClick={() => download(`modelmatrix-${tsPrefix()}.csv`, toCsv(runResult), 'text/csv')}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Export .csv
              </button>
            </div>
            <button
              onClick={() => setView('cards')}
              className={
                'rounded-md px-2 py-1 text-xs ' +
                (view === 'cards'
                  ? 'bg-gray-200 font-medium dark:bg-gray-800'
                  : 'text-gray-600 dark:text-gray-400')
              }
            >
              Cards
            </button>
            <button
              onClick={() => setView('insights')}
              className={
                'rounded-md px-2 py-1 text-xs ' +
                (view === 'insights'
                  ? 'bg-gray-200 font-medium dark:bg-gray-800'
                  : 'text-gray-600 dark:text-gray-400')
              }
            >
              Insights
            </button>
            <button
              onClick={() => setView('table')}
              className={
                'rounded-md px-2 py-1 text-xs ' +
                (view === 'table'
                  ? 'bg-gray-200 font-medium dark:bg-gray-800'
                  : 'text-gray-600 dark:text-gray-400')
              }
            >
              Comparison table
            </button>
          </div>
        )}
      </div>

      {!canRun && phase === 'idle' && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Select a provider, at least one model with an effort level, and enter a
          prompt to run an experiment ({leafCount} leaf{leafCount === 1 ? '' : 's'}).
        </p>
      )}

      {notConfiguredProviderIds.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Missing API keys for: {notConfiguredProviderIds.join(', ')} — those runs
          will report errors.
        </p>
      )}

      {phase === 'done' && runResult && (
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{results.length}</span>{' '}
              run{results.length === 1 ? '' : 's'}
            </span>
            <span className="text-green-600 dark:text-green-400">{succeeded} succeeded</span>
            <span className="text-red-600 dark:text-red-400">{failed} failed</span>
            <span>
              {formatTokens(totalTokens)} total tokens
            </span>
            <span>{formatDuration(durationMs)}</span>
          </div>

          {view === 'insights' ? (
            <MetricsPanel results={results} />
          ) : view === 'table' ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-2 font-medium">Configuration</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Tokens</th>
                    <th className="px-3 py-2 font-medium">Duration</th>
                    <th className="px-3 py-2 font-medium">Response (snippet)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {results.map((result) => (
                    <tr key={result.config_id}>
                      <td className="max-w-[240px] whitespace-nowrap px-3 py-2 text-gray-700 dark:text-gray-200">
                        <ConfigLabel config={result.config} />
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            'rounded-full px-2 py-0.5 font-medium ' +
                            (result.status === 'error'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300')
                          }
                        >
                          {result.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-300">
                        {formatTokens(result.usage.total_tokens)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-300">
                        {formatDuration(result.duration_ms)}
                      </td>
                      <td className="max-w-xs truncate px-3 py-2 text-gray-500 dark:text-gray-400">
                        {result.response?.replace(/\s+/g, ' ').trim() ?? result.error}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((result) => (
                <ResultCard key={result.config_id} result={result} />
              ))}
            </div>
          )}
        </>
      )}

      {phase === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {runError}
        </div>
      )}

      {phase === 'idle' && !runResult && (
        <p className="py-8 text-center text-sm text-gray-400">
          Results will appear here after you run an experiment.
        </p>
      )}
    </div>
  )
}