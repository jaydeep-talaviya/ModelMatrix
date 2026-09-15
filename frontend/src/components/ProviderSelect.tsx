import { Checkbox } from './Checkbox'
import { useTree } from '../store/TreeContext'

export function ProviderSelect() {
  const { options, optionsError, isProviderSelected, dispatch } = useTree()

  if (optionsError) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Could not load providers: {optionsError}
      </p>
    )
  }
  if (!options) {
    return <p className="text-sm text-gray-400">Loading providers…</p>
  }

  return (
    <div>
      <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Providers
      </h3>
      <div className="space-y-1.5">
        {options.providers.map((provider) => (
          <Checkbox
            key={provider.id}
            checked={isProviderSelected(provider.id)}
            onChange={() =>
              dispatch({ type: 'TOGGLE_PROVIDER', provider: provider.id })
            }
            label={
              <>
                <span className="font-medium">{provider.display_name}</span>
                {!provider.configured && (
                  <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                    (no API key)
                  </span>
                )}
              </>
            }
          />
        ))}
      </div>
    </div>
  )
}