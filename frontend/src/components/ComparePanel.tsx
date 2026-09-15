import { Fragment, useEffect, useMemo, useRef, useState } from 'react'

import { runExperiments } from '../lib/api'
import { formatCompactTokens, formatDuration } from '../lib/labels'
import { useTree } from '../store/TreeContext'
import type { EffortLevel, ProviderId, RunResult } from '../types'
import { ModelName } from './ModelName'

const SEP = '\u241F'
const MAX_SLOTS = 3
const MIN_SLOTS = 2

type Slot = { provider: string; modelId: string }
type RunPhase = 'idle' | 'running' | 'done' | 'error'

function parseKey(key: string): Slot | null {
  const i = key.indexOf(SEP)
  if (i < 0) return null
  return { provider: key.slice(0, i), modelId: key.slice(i + SEP.length) }
}

function pickDistinct(all: Slot[], count: number): Slot[] {
  const out: Slot[] = []
  for (const slot of all) {
    if (out.length >= count) break
    if (!out.some((s) => s.modelId === slot.modelId)) out.push(slot)
  }
  return out
}

export function ComparePanel() {
  const { options, state } = useTree()
  const [slots, setSlots] = useState<string[]>([])
  const seeded = useRef(false)
  const [phase, setPhase] = useState<RunPhase>('idle')
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const allModels = useMemo(() => {
    return (options?.providers ?? []).flatMap((p) =>
      p.models.map((m) => ({ provider: p.id, modelId: m.id })),
    )
  }, [options])

  useEffect(() => {
    if (!options || seeded.current) return
    seeded.current = true
    setSlots(pickDistinct(allModels, MIN_SLOTS).map((s) => `${s.provider}${SEP}${s.modelId}`))
  }, [options, allModels])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const selected = slots
    .map(parseKey)
    .filter((s): s is Slot => s !== null)

  const setSlot = (index: number, key: string) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? key : s)))
    setRunResult(null)
    setPhase('idle')
  }

  const addSlot = () => {
    if (slots.length >= MAX_SLOTS) return
    const used = new Set(selected.map((s) => s.modelId))
    const unused = allModels.find((m) => !used.has(m.modelId))
    if (unused) {
      setSlots((prev) => [...prev, `${unused.provider}${SEP}${unused.modelId}`])
      setRunResult(null)
      setPhase('idle')
    }
  }

  const removeSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index))
    setRunResult(null)
    setPhase('idle')
  }

  const canRun =
    phase !== 'running' && selected.length >= MIN_SLOTS && state.prompt.trim().length > 0

  const run = async () => {
    const providers = selected.map((s) => ({
      provider: s.provider as ProviderId,
      models: [
        {
          model_id: s.modelId,
          efforts: ['medium'] as EffortLevel[],
          structured: false,
        },
      ],
    }))
    setRunResult(null)
    setRunError(null)
    setPhase('running')
    const ac = new AbortController()
    abortRef.current = ac
    try {
      const result = await runExperiments(
        { prompt: state.prompt, providers },
        ac.signal,
      )
      setRunResult(result)
      setPhase('done')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setPhase('idle')
        return
      }
      setRunError(err instanceof Error ? err.message : String(err))
      setPhase('error')
    } finally {
      abortRef.current = null
    }
  }

  const metaFor = (slot: Slot) =>
    options?.providers
      .find((p) => p.id === slot.provider)
      ?.models.find((m) => m.id === slot.modelId)

  const specSlots = slots
    .map((key) => parseKey(key))
    .filter((s): s is Slot => Boolean(s))

  const maxContext = specSlots.length
    ? Math.max(...specSlots.map((s) => metaFor(s)?.context_window ?? 0))
    : 0
  const maxOutput = specSlots.length
    ? Math.max(...specSlots.map((s) => metaFor(s)?.max_output_tokens ?? 0))
    : 0

  const results = runResult?.results ?? []

  return (
    <section aria-label="Compare models" className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
        Compare models
      </h2>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        Pick 2–3 models to see their specs side by side, then optionally run the
        current prompt on them.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        {slots.map((key, index) => (
          <div key={index} className="flex items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Model {index + 1}
              </span>
              <select
                value={key}
                onChange={(e) => setSlot(index, e.target.value)}
                className="w-64 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                {(options?.providers ?? []).map((p) => (
                  <optgroup key={p.id} label={p.display_name}>
                    {p.models.map((m) => (
                      <option
                        key={`${p.id}${SEP}${m.id}`}
                        value={`${p.id}${SEP}${m.id}`}
                      >
                        {m.display_name} — {m.id}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            {slots.length > MIN_SLOTS && (
              <button
                onClick={() => removeSlot(index)}
                className="mb-0.5 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                aria-label={`Remove model ${index + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {slots.length < MAX_SLOTS && (
          <button
            onClick={addSlot}
            className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            + Add a model
          </button>
        )}
      </div>

      {specSlots.length >= MIN_SLOTS && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {specSlots.map((slot) => {
              const meta = metaFor(slot)
              const isMaxCtx = meta != null && meta.context_window === maxContext
              const isMaxOut = meta != null && meta.max_output_tokens === maxOutput
              return (
                <div
                  key={`${slot.provider}${SEP}${slot.modelId}`}
                  className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <ModelName provider={slot.provider as ProviderId} modelId={slot.modelId} className="text-sm" />
                  </div>
                  <dl className="space-y-1.5 text-xs">
                    <SpecRow label="Provider" value={slot.provider} />
                    <SpecRow
                      label="Context window"
                      value={`${formatCompactTokens(meta?.context_window)} tokens`}
                      badge={isMaxCtx ? 'Longest' : undefined}
                    />
                    <SpecRow
                      label="Max output"
                      value={`${formatCompactTokens(meta?.max_output_tokens)} tokens`}
                      badge={isMaxOut ? 'Largest' : undefined}
                    />
                    <SpecRow
                      label="Effort levels"
                      value={meta?.supports_effort ? 'Low / Medium / High' : 'Fixed'}
                    />
                    <SpecRow
                      label="Structured JSON"
                      value={meta?.supports_structured_output ? 'Yes' : 'No'}
                    />
                  </dl>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            'Longest' / 'Largest' marks the highest value — matched to your goal,
            not a judgment that a model is better.
          </p>
        </>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={run}
          disabled={!canRun}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
        >
          {phase === 'running' ? 'Running…' : `Run on these ${specSlots.length || '…'} models`}
        </button>
        {phase === 'running' && (
          <button
            onClick={() => abortRef.current?.abort()}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        )}
        {!state.prompt.trim() && (
          <span className="text-xs text-gray-400">Type a prompt above to run.</span>
        )}
      </div>

      {phase === 'error' && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {runError}
        </div>
      )}

      {phase === 'done' && runResult && results.length > 0 && (
        <div className="mt-5">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <tr>
                <th className="py-2 pr-3 font-medium">Model</th>
                <th className="py-2 pr-3 font-medium">Total</th>
                <th className="py-2 pr-3 font-medium">In</th>
                <th className="py-2 pr-3 font-medium">Out</th>
                <th className="py-2 pr-3 font-medium">Think</th>
                <th className="py-2 pr-3 font-medium">Duration</th>
                <th className="py-2 font-medium">Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {results.map((result) => {
                const isError = result.status === 'error'
                const thinking = Math.max(
                  0,
                  (result.usage.total_tokens ?? 0) -
                    (result.usage.input_tokens ?? 0) -
                    (result.usage.output_tokens ?? 0),
                )
                const open = expandedId === result.config_id
                return (
                  <Fragment key={result.config_id}>
                    {open && (
                      <tr>
                        <td colSpan={7} className="px-3 pb-3">
                          <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-800 dark:bg-gray-800/60 dark:text-gray-200">
                            {isError
                              ? result.error
                              : result.response ?? '(empty response)'}
                          </pre>
                        </td>
                      </tr>
                    )}
                    <tr className={isError ? 'opacity-50' : ''}>
                      <td className="py-2 pr-3 font-medium text-gray-700 dark:text-gray-200">
                        {result.config.model_id}
                      </td>
                      <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">
                        {formatTokensValue(result.usage.total_tokens)}
                      </td>
                      <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">
                        {formatTokensValue(result.usage.input_tokens)}
                      </td>
                      <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">
                        {formatTokensValue(result.usage.output_tokens)}
                      </td>
                      <td className="py-2 pr-3 text-gray-500 dark:text-gray-400">
                        {thinking > 0 ? formatTokensValue(thinking) : '—'}
                      </td>
                      <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">
                        {formatDuration(result.duration_ms)}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => setExpandedId(open ? null : result.config_id)}
                          className="text-gray-500 underline decoration-dotted underline-offset-2 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                        >
                          {open ? 'Collapse' : 'View'}
                        </button>
                      </td>
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function SpecRow({
  label,
  value,
  badge,
}: {
  label: string
  value: string
  badge?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-gray-400 dark:text-gray-500">{label}</dt>
      <dd className="flex items-baseline gap-1.5">
        {badge && (
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {badge}
          </span>
        )}
        <span className="text-right font-medium text-gray-700 dark:text-gray-200">
          {value}
        </span>
      </dd>
    </div>
  )
}

function formatTokensValue(value: number | null | undefined): string {
  return value == null ? '—' : String(value)
}