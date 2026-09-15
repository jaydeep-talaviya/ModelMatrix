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

  const masterOn = selections.some((s) => s.enabled)
  const active = new Set(
    selections.filter((s) => s.enabled && s.format).map((s) => s.format as StructuredOutputFormat),
  )

  const commit = (on: boolean, formats: Set<StructuredOutputFormat>) => {
    const next: typeof selections = []
    if (on) {
      for (const format of FORMATS) {
        if (formats.has(format)) next.push({ enabled: true, format })
      }
    }
    dispatch({ type: 'SET_STRUCTURED', provider, modelId, selections: next })
  }

  const toggleFormat = (format: StructuredOutputFormat, checked: boolean) => {
    const formats = new Set(active)
    if (checked) {
      formats.add(format)
    } else {
      if (formats.size <= 1) return // keep at least one format selected
      formats.delete(format)
    }
    commit(true, formats)
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        Structured output:
      </span>
      <Checkbox
        checked={masterOn}
        onChange={(checked) => commit(checked, new Set(['csv']))}
        label={masterOn ? 'Enabled' : 'Disabled'}
      />
      {masterOn && (
        <>
          <span className="text-xs text-gray-400">Format:</span>
          {FORMATS.map((format) => (
            <Checkbox
              key={format}
              checked={active.has(format)}
              onChange={(checked) => toggleFormat(format, checked)}
              label={FORMAT_DISPLAY[format]}
            />
          ))}
        </>
      )}
    </div>
  )
}