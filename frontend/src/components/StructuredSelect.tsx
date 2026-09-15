import { Checkbox } from './Checkbox'
import { useTree } from '../store/TreeContext'
import type { ProviderId, StructuredOutputFormat } from '../types'

const FORMATS: StructuredOutputFormat[] = ['csv', 'pydantic']

const FORMAT_DISPLAY: Record<StructuredOutputFormat, string> = {
  csv: 'CSV',
  pydantic: 'Pydantic',
}

interface StructuredSelectProps {
  provider: ProviderId
  modelId: string
}

export function StructuredSelect({ provider, modelId }: StructuredSelectProps) {
  const { modelBranch, dispatch } = useTree()
  const selections = modelBranch(provider, modelId)?.structured ?? []

  const plain = selections.some((s) => !s.enabled)
  const active = new Set(
    selections.filter((s) => s.enabled && s.format).map((s) => s.format as StructuredOutputFormat),
  )

  const commit = (plainOn: boolean, formats: Set<StructuredOutputFormat>) => {
    const next: typeof selections = []
    if (plainOn) next.push({ enabled: false, format: null })
    for (const format of FORMATS) {
      if (formats.has(format)) next.push({ enabled: true, format })
    }
    dispatch({ type: 'SET_STRUCTURED', provider, modelId, selections: next })
  }

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        Output:
      </span>
      <Checkbox
        checked={plain}
        onChange={(checked) => {
          const formats = new Set(active)
          if (!checked && formats.size === 0) formats.add('csv')
          commit(checked, formats)
        }}
        label="No structure"
      />
      {FORMATS.map((format) => (
        <Checkbox
          key={format}
          checked={active.has(format)}
          onChange={(checked) => {
            const formats = new Set(active)
            if (checked) formats.add(format)
            else formats.delete(format)
            commit(plain, formats)
          }}
          label={FORMAT_DISPLAY[format]}
        />
      ))}
    </div>
  )
}