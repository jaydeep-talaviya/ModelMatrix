import { ModelRow } from './ModelRow'
import { ProviderSelect } from './ProviderSelect'
import { useTree } from '../store/TreeContext'

export function ConfigurationTree() {
  const { options, isProviderSelected } = useTree()

  return (
    <div className="space-y-6">
      <ProviderSelect />

      {options?.providers
        .filter((p) => isProviderSelected(p.id))
        .map((provider) => (
          <div
            key={provider.id}
            className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
          >
            <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
              {provider.display_name}
            </h3>
            <div className="space-y-2.5 border-l border-gray-200 pl-4 dark:border-gray-700">
              {provider.models.map((model) => (
                <ModelRow key={model.id} provider={provider.id} model={model} />
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}