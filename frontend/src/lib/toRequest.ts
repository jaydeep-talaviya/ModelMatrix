import type { ExperimentRequest, ProviderSelection } from '../types'
import type { TreeState } from '../store/TreeContext'

/** Build the API request shape (mirror of backend ExperimentRequest). */
export function toExperimentRequest(state: TreeState): ExperimentRequest {
  const providers: ProviderSelection[] = Object.values(state.branches).map(
    (branch) => ({
      provider: branch.provider,
      models: Object.values(branch.models).map((model) => ({
        model_id: model.modelId,
        efforts: model.efforts,
        structured: model.structured,
      })),
    }),
  )
  return { prompt: state.prompt, providers }
}