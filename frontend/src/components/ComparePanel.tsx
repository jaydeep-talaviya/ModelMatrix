import { useEffect, useMemo, useRef, useState } from 'react'

import { formatCompactTokens } from '../lib/labels'
import { formatCost, priceFor } from '../lib/pricing'
import { useTree } from '../store/TreeContext'
import type { ProviderId } from '../types'
import { ModelName } from './ModelName'
import { ModelPicker, type PickedModel } from './ModelPicker'

const MAX_SLOTS = 3
const MIN_SLOTS = 2

const DEFAULT_INPUT_TOKENS = 10_000
const DEFAULT_OUTPUT_TOKENS = 2_000

export function ComparePanel() {
  const { options } = useTree()
  const [slots, setSlots] = useState<PickedModel[]>([])
  const seeded = useRef(false)
  const [inputTokens, setInputTokens] = useState(DEFAULT_INPUT_TOKENS)
  const [outputTokens, setOutputTokens] = useState(DEFAULT_OUTPUT_TOKENS)

  const allModels = useMemo(() => {
    return (options?.providers ?? []).flatMap((p) =>
      p.models.map(
        (m) => ({ provider: p.id as ProviderId, modelId: m.id }) as PickedModel,
      ),
    )
  }, [options])

  useEffect(() => {
    if (!options || seeded.current) return
    seeded.current = true
    const picked: PickedModel[] = []
    for (const m of allModels) {
      if (picked.length >= MIN_SLOTS) break
      if (!picked.some((s) => s.modelId === m.modelId)) picked.push(m)
    }
    setSlots(picked)
  }, [options, allModels])

  const setSlot = (index: number, model: PickedModel) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? model : s)))
  }

  const addSlot = () => {
    if (slots.length >= MAX_SLOTS) return
    const used = new Set(slots.map((s) => s.modelId))
    const unused = allModels.find((m) => !used.has(m.modelId))
    if (unused) setSlots((prev) => [...prev, unused])
  }

  const removeSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index))
  }

  const metaFor = (slot: PickedModel) =>
    options?.providers
      .find((p) => p.id === slot.provider)
      ?.models.find((m) => m.id === slot.modelId)

  const maxContext = slots.length
    ? Math.max(...slots.map((s) => metaFor(s)?.context_window ?? 0))
    : 0
  const maxOutput = slots.length
    ? Math.max(...slots.map((s) => metaFor(s)?.max_output_tokens ?? 0))
    : 0

  const costRows = useMemo(() => {
    return slots.map((slot) => {
      const price = priceFor(slot.provider, slot.modelId)
      const cost =
        (inputTokens / 1_000_000) * price.input +
        (outputTokens / 1_000_000) * price.output
      return {
        key: `${slot.provider}:${slot.modelId}`,
        name: metaFor(slot)?.display_name ?? slot.modelId,
        cost,
        price,
      }
    })
  }, [slots, inputTokens, outputTokens, options])

  const maxCost = costRows.length
    ? Math.max(...costRows.map((r) => r.cost))
    : 0
  const minCost = costRows.length
    ? Math.min(...costRows.map((r) => r.cost))
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
        Pick 2–3 models to see their specs and estimated cost side by side.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        {slots.map((slot, index) => (
          <div key={index} className="flex items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Model {index + 1}
              </span>
              <ModelPicker value={slot} onChange={(m) => setSlot(index, m)} />
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

      {slots.length >= MIN_SLOTS && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot) => {
              const meta = metaFor(slot)
              const price = priceFor(slot.provider, slot.modelId)
              const isMaxCtx =
                meta != null && meta.context_window === maxContext
              const isMaxOut =
                meta != null && meta.max_output_tokens === maxOutput
              return (
                <div
                  key={`${slot.provider}:${slot.modelId}`}
                  className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="mb-2">
                    <ModelName
                      provider={slot.provider}
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
                    <SpecRow
                      label="Price in /1M"
                      value={`$${price.input}`}
                    />
                    <SpecRow
                      label="Price out /1M"
                      value={`$${price.output}`}
                    />
                  </dl>
                </div>
              )
            })}
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              Estimated cost per query
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <label className="block">
                <span className="mb-0.5 block text-[11px] text-gray-500 dark:text-gray-400">
                  Input tokens
                </span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={inputTokens}
                  onChange={(e) =>
                    setInputTokens(Math.max(0, Math.floor(Number(e.target.value) || 0)))
                  }
                  className="w-32 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[11px] text-gray-500 dark:text-gray-400">
                  Output tokens
                </span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={outputTokens}
                  onChange={(e) =>
                    setOutputTokens(Math.max(0, Math.floor(Number(e.target.value) || 0)))
                  }
                  className="w-32 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                />
              </label>
            </div>

            <div className="mt-3 space-y-2">
              {costRows.map((row) => {
                const isLowest =
                  minCost >= 0 && maxCost > 0 && row.cost === minCost
                const width = maxCost > 0 ? (row.cost / maxCost) * 100 : 0
                return (
                  <div key={row.key} className="flex items-center gap-3">
                    <span className="w-44 shrink-0 truncate text-xs text-gray-700 dark:text-gray-200">
                      {row.name}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={
                          'h-full rounded-full ' +
                          (isLowest
                            ? 'bg-emerald-500'
                            : 'bg-gray-300 dark:bg-gray-600')
                        }
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs font-medium text-gray-700 dark:text-gray-200">
                      {formatCost(row.cost)}
                    </span>
                    {isLowest && (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Lowest
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
              Based on list prices (in × input + out × output ÷ 1,000,000) — an
              estimate, not your actual bill. Batch, caching and volume discounts
              are excluded. 'Lowest' marks the cheapest for these token counts.
            </p>
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