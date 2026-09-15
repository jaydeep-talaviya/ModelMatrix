import { Checkbox } from './Checkbox'
import { useTree } from '../store/TreeContext'
import type { EffortLevel, ProviderId } from '../types'

const DISPLAY: Record<EffortLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

interface EffortSelectProps {
  provider: ProviderId
  modelId: string
}

export function EffortSelect({ provider, modelId }: EffortSelectProps) {
  const { options, modelOption, modelBranch, dispatch } = useTree()
  const option = modelOption(provider, modelId)
  const branch = modelBranch(provider, modelId)

  // Models without effort support run at a fixed level — no UI needed.
  if (!option?.supports_effort) return null

  const available = options?.providers.find((p) => p.id === provider)?.efforts ?? []

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        Effort:
      </span>
      {available.map((effort) => (
        <Checkbox
          key={effort}
          checked={branch?.efforts.includes(effort) ?? false}
          onChange={(checked) =>
            dispatch({
              type: 'SET_EFFORT',
              provider,
              modelId,
              effort,
              checked,
            })
          }
          label={DISPLAY[effort]}
        />
      ))}
    </div>
  )
}