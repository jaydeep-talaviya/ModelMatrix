import { Checkbox } from './Checkbox'
import { EffortSelect } from './EffortSelect'
import { ModelName } from './ModelName'
import { StructuredSelect } from './StructuredSelect'
import { useTree } from '../store/TreeContext'
import type { ModelOption, ProviderId } from '../types'

interface ModelRowProps {
  provider: ProviderId
  model: ModelOption
}

export function ModelRow({ provider, model }: ModelRowProps) {
  const { isModelSelected, dispatch } = useTree()
  const selected = isModelSelected(provider, model.id)

  return (
    <div>
      <Checkbox
        checked={selected}
        onChange={() =>
          dispatch({
            type: 'TOGGLE_MODEL',
            provider,
            modelId: model.id,
            supportsEffort: model.supports_effort,
          })
        }
        label={
          <>
            <ModelName provider={provider} modelId={model.id} />
            <span className="ml-2 text-xs text-gray-400">{model.id}</span>
          </>
        }
      />
      {selected && (
        <div className="mt-1.5 space-y-1.5 border-l border-gray-200 pl-4 dark:border-gray-700">
          <EffortSelect provider={provider} modelId={model.id} />
          <StructuredSelect provider={provider} modelId={model.id} />
        </div>
      )}
    </div>
  )
}