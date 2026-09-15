import { EFFORT_DISPLAY, PROVIDER_DISPLAY } from '../lib/labels'
import type { ExperimentConfig } from '../types'
import { ModelName } from './ModelName'

interface ConfigLabelProps {
  config: ExperimentConfig
  className?: string
}

export function ConfigLabel({ config, className }: ConfigLabelProps) {
  const structure = config.structured_output ? 'structured (JSON)' : 'no structure'
  return (
    <span className={'inline-flex flex-wrap items-center gap-x-1 leading-snug ' + (className ?? '')}>
      <span className="text-gray-400 dark:text-gray-500">{PROVIDER_DISPLAY[config.provider]}</span>
      <span className="text-gray-300 dark:text-gray-600">→</span>
      <ModelName provider={config.provider} modelId={config.model_id} />
      <span className="text-gray-300 dark:text-gray-600">→</span>
      <span className="text-gray-500 dark:text-gray-400">{EFFORT_DISPLAY[config.effort]}</span>
      <span className="text-gray-300 dark:text-gray-600">→</span>
      <span className="text-gray-500 dark:text-gray-400">{structure}</span>
    </span>
  )
}