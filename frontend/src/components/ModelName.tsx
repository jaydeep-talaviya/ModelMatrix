import { useTree } from '../store/TreeContext'
import type { ProviderId } from '../types'
import { ModelInfoRow, Tooltip } from './Tooltip'

interface ModelNameProps {
  provider: ProviderId
  modelId: string
  className?: string
}

function formatTokensCount(value: number | null | undefined): string {
  if (value == null) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`
  if (value >= 1_000) return value.toLocaleString('en-US')
  return String(value)
}

export function ModelName({ provider, modelId, className }: ModelNameProps) {
  const { modelOption } = useTree()
  const meta = modelOption(provider, modelId)

  const display = meta?.display_name ?? modelId
  const kind = provider === 'openai' ? 'OpenAI' : provider === 'gemini' ? 'Gemini' : 'Anthropic'
  const hasSpecs =
    meta != null && (meta.context_window != null || meta.max_output_tokens != null)

  const content = (
    <span className="block w-56">
      <span className="block">
        <span className="block text-xs font-semibold text-gray-900 dark:text-gray-100">
          {display}
        </span>
        <span className="block truncate text-[10px] text-gray-400 dark:text-gray-500">
          {modelId}
        </span>
      </span>
      <span className="mt-1 block space-y-0.5">
        <ModelInfoRow label="Provider" value={kind} />
        <ModelInfoRow
          label="Effort"
          value={meta ? (meta.supports_effort ? 'Yes' : 'Fixed') : '—'}
        />
        <ModelInfoRow
          label="Structured JSON"
          value={meta ? (meta.supports_structured_output ? 'Yes' : 'No') : '—'}
        />
        {meta?.context_window != null && (
          <ModelInfoRow
            label="Context window"
            value={`${formatTokensCount(meta.context_window)} tokens`}
          />
        )}
        {meta?.max_output_tokens != null && (
          <ModelInfoRow
            label="Max output"
            value={`${formatTokensCount(meta.max_output_tokens)} tokens`}
          />
        )}
      </span>
      {!hasSpecs && (
        <span className="mt-1 block text-[10px] italic text-gray-400 dark:text-gray-500">
          Limited info for this model.
        </span>
      )}
    </span>
  )

  return (
    <Tooltip content={content}>
      <span
        className={
          'rounded px-1 font-medium underline decoration-dotted underline-offset-2 text-gray-700 dark:text-gray-200 ' +
          (className ?? '')
        }
      >
        {display}
      </span>
    </Tooltip>
  )
}