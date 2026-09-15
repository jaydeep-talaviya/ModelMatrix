import { Checkbox } from './Checkbox'
import { useTree } from '../store/TreeContext'
import type { ProviderId } from '../types'

interface StructuredSelectProps {
  provider: ProviderId
  modelId: string
}

export function StructuredSelect({ provider, modelId }: StructuredSelectProps) {
  const { modelBranch, dispatch } = useTree()
  const enabled = modelBranch(provider, modelId)?.structured ?? false

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        Structured output:
      </span>
      <Checkbox
        checked={enabled}
        onChange={(checked) => dispatch({ type: 'SET_STRUCTURED', provider, modelId, enabled: checked })}
        label={enabled ? 'Enabled' : 'Disabled'}
      />
      {enabled && (
        <span className="text-xs text-gray-400">
          Response returned as JSON matching the schema
        </span>
      )}
    </div>
  )
}