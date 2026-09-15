import { useEffect, useMemo, useRef, useState } from 'react'

import { formatCompactTokens } from '../lib/labels'
import { useTree } from '../store/TreeContext'
import type { ProviderId } from '../types'
import { ModelName } from './ModelName'

const SEP = '\u241F'
const MAX_SLOTS = 3
const MIN_SLOTS = 2

type Slot = { provider: string; modelId: string }

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
  const { options } = useTree()
  const [slots, setSlots] = useState<string[]>([])
  const seeded = useRef(false)

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

  const setSlot = (index: number, key: string) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? key : s)))
  }

  const addSlot = () => {
    if (slots.length >= MAX_SLOTS) return
    const used = new Set(parseKeys(slots).map((s) => s.modelId))
    const unused = allModels.find((m) => !used.has(m.modelId))
    if (unused) {
      setSlots((prev) => [...prev, `${unused.provider}${SEP}${unused.modelId}`])
    }
  }

  const removeSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index))
  }

  const metaFor = (slot: Slot) =>
    options?.providers
      .find((p) => p.id === slot.provider)
      ?.models.find((m) => m.id === slot.modelId)

  const specSlots = parseKeys(slots)

  const maxContext = specSlots.length
    ? Math.max(...specSlots.map((s) => metaFor(s)?.context_window ?? 0))
    : 0
  const maxOutput = specSlots.length
    ? Math.max(...specSlots.map((s) => metaFor(s)?.max_output_tokens ?? 0))
    : 0

  return (
    <section
      aria-label="Compare models"
      className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
    >
      <h2 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
        Compare models
      </h2>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        Pick 2–3 models to see their specs side by side.
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
                  <div className="mb-2">
                    <ModelName
                      provider={slot.provider as ProviderId}
                      modelId={slot.modelId}
                      className="text-sm"
                    />
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
    </section>
  )
}

function parseKeys(slots: string[]): Slot[] {
  return slots.map(parseKey).filter((s): s is Slot => s !== null)
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