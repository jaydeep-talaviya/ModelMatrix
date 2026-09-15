import { useState } from 'react'

import { useTree } from '../store/TreeContext'
import { ModelRow } from './ModelRow'
import { ProviderSelect } from './ProviderSelect'

export function ConfigurationTree() {
  const { options, isProviderSelected } = useTree()
  const [queries, setQueries] = useState<Record<string, string>>({})

  const setQuery = (providerId: string, value: string) =>
    setQueries((prev) => ({ ...prev, [providerId]: value }))

  return (
    <div className="space-y-6">
      <ProviderSelect />

      {options?.providers
        .filter((p) => isProviderSelected(p.id))
        .map((provider) => {
          const query = (queries[provider.id] ?? '').trim().toLowerCase()
          const models = provider.models.filter(
            (m) =>
              !query ||
              m.display_name.toLowerCase().includes(query) ||
              m.id.toLowerCase().includes(query),
          )
          return (
            <div
              key={provider.id}
              className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {provider.display_name}
                </h3>
                <span className="text-[10px] text-gray-400">
                  {models.length}/{provider.models.length} models
                </span>
              </div>
              <input
                value={queries[provider.id] ?? ''}
                onChange={(e) => setQuery(provider.id, e.target.value)}
                placeholder={`Search ${provider.display_name} models…`}
                className="mb-2.5 w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-none placeholder:text-gray-400 focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-500"
              />
              <div className="space-y-2.5 border-l border-gray-200 pl-4 dark:border-gray-700">
                {models.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    No models match “{queries[provider.id]?.trim()}”.
                  </p>
                ) : (
                  models.map((model) => (
                    <ModelRow key={model.id} provider={provider.id} model={model} />
                  ))
                )}
              </div>
            </div>
          )
        })}
    </div>
  )
}