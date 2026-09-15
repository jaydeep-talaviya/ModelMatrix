import { useEffect, useRef, useState } from 'react'

import { useTree } from '../store/TreeContext'
import type { ProviderId } from '../types'

export interface PickedModel {
  provider: ProviderId
  modelId: string
}

interface ModelPickerProps {
  value: PickedModel | null
  onChange: (model: PickedModel) => void
  placeholder?: string
}

export function ModelPicker({ value, onChange, placeholder }: ModelPickerProps) {
  const { options } = useTree()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedMeta = value
    ? options?.providers
        .find((p) => p.id === value.provider)
        ?.models.find((m) => m.id === value.modelId)
    : undefined

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  const q = query.trim().toLowerCase()
  const groups = (options?.providers ?? [])
    .map((p) => ({
      provider: p,
      models: p.models.filter(
        (m) =>
          !q ||
          m.display_name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.models.length > 0)

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          if (!open) setQuery('')
          setOpen((o) => !o)
        }}
        className="flex w-64 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-800 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-500"
      >
        <span className="min-w-0 truncate">
          {value
            ? `${selectedMeta?.display_name ?? value.modelId} — ${value.provider}`
            : placeholder ?? 'Select a model…'}
        </span>
        <span className="ml-auto shrink-0 text-xs text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search models…"
            className="w-full border-b border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:border-gray-700 dark:text-gray-100"
          />
          <div className="max-h-72 overflow-y-auto">
            {groups.length === 0 && (
              <p className="px-3 py-3 text-xs text-gray-400">
                No models match “{query}”.
              </p>
            )}
            {groups.map(({ provider, models }, gi) => (
              <div
                key={provider.id}
                className={gi > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}
              >
                <p className="bg-gray-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:bg-gray-800/60 dark:text-gray-500">
                  {provider.display_name}
                </p>
                {models.map((m) => {
                  const selected =
                    value?.provider === provider.id && value.modelId === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onChange({ provider: provider.id as ProviderId, modelId: m.id })
                        setOpen(false)
                      }}
                      className={
                        'flex w-full items-baseline justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ' +
                        (selected ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300')
                      }
                    >
                      <span className="min-w-0 truncate font-medium">
                        {m.display_name}
                        {selected && <span className="ml-1 text-emerald-600 dark:text-emerald-400">✓</span>}
                      </span>
                      <span className="shrink-0 text-[10px] text-gray-400">
                        {m.id}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}