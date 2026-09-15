// Mirrors backend/app/schemas/* — keep in sync with the FastAPI models.

export type ProviderId = 'openai' | 'gemini' | 'anthropic'

export type EffortLevel = 'low' | 'medium' | 'high'

export type ExperimentStatus = 'success' | 'error'

export interface ModelOption {
  id: string
  display_name: string
  supports_effort: boolean
  supports_structured_output: boolean
  context_window?: number | null
  max_output_tokens?: number | null
}

export interface ProviderOption {
  id: ProviderId
  display_name: string
  configured: boolean
  models: ModelOption[]
  efforts: EffortLevel[]
}

export interface OptionsResponse {
  providers: ProviderOption[]
}

export interface ModelSelection {
  model_id: string
  efforts: EffortLevel[]
  structured: boolean
}

export interface ProviderSelection {
  provider: ProviderId
  models: ModelSelection[]
}

export interface ExperimentRequest {
  prompt: string
  providers: ProviderSelection[]
}

export interface ExperimentConfig {
  provider: ProviderId
  model_id: string
  effort: EffortLevel
  structured_output: boolean
  id: string
}

export interface Usage {
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  raw: Record<string, unknown> | null
}

export interface ExperimentResult {
  config: ExperimentConfig
  config_id: string
  status: ExperimentStatus
  response: string | null
  usage: Usage
  error: string | null
  duration_ms: number | null
}

export interface RunResult {
  prompt: string
  configs: ExperimentConfig[]
  results: ExperimentResult[]
}