import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'

import { getOptions } from '../lib/api'
import type {
  EffortLevel,
  ModelOption,
  OptionsResponse,
  ProviderId,
  StructuredOutputSelection,
} from '../types'

interface ModelBranch {
  modelId: string
  efforts: EffortLevel[]
  structured: StructuredOutputSelection[]
}

type ModelMap = Record<string, ModelBranch>

interface ProviderBranch {
  provider: ProviderId
  models: ModelMap
}

type BranchMap = Record<string, ProviderBranch>

export interface TreeState {
  prompt: string
  branches: BranchMap
}

type Action =
  | { type: 'SET_PROMPT'; value: string }
  | { type: 'TOGGLE_PROVIDER'; provider: ProviderId }
  | { type: 'TOGGLE_MODEL'; provider: ProviderId; modelId: string; supportsEffort: boolean }
  | { type: 'SET_EFFORT'; provider: ProviderId; modelId: string; effort: EffortLevel; checked: boolean }
  | { type: 'SET_STRUCTURED'; provider: ProviderId; modelId: string; selections: StructuredOutputSelection[] }
  | { type: 'CLEAR' }

const initialState: TreeState = { prompt: '', branches: {} }

function setStructuredChoices(branch: ModelBranch, selections: StructuredOutputSelection[]): ModelBranch {
  return { ...branch, structured: selections }
}

function reducer(state: TreeState, action: Action): TreeState {
  switch (action.type) {
    case 'SET_PROMPT':
      return { ...state, prompt: action.value }

    case 'TOGGLE_PROVIDER': {
      const branches = { ...state.branches }
      if (branches[action.provider]) {
        delete branches[action.provider]
      } else {
        branches[action.provider] = { provider: action.provider, models: {} }
      }
      return { ...state, branches }
    }

    case 'TOGGLE_MODEL': {
      const provider = state.branches[action.provider]
      if (!provider) return state
      const models = { ...provider.models }
      if (models[action.modelId]) {
        delete models[action.modelId]
      } else {
        models[action.modelId] = {
          modelId: action.modelId,
          efforts: action.supportsEffort ? [] : ['medium'],
          structured: [],
        }
      }
      return {
        ...state,
        branches: {
          ...state.branches,
          [action.provider]: { ...provider, models },
        },
      }
    }

    case 'SET_EFFORT': {
      const provider = state.branches[action.provider]
      const model = provider?.models[action.modelId]
      if (!provider || !model) return state
      const efforts = action.checked
        ? [...model.efforts, action.effort]
        : model.efforts.filter((e) => e !== action.effort)
      return {
        ...state,
        branches: {
          ...state.branches,
          [action.provider]: {
            ...provider,
            models: { ...provider.models, [action.modelId]: { ...model, efforts } },
          },
        },
      }
    }

    case 'SET_STRUCTURED': {
      const provider = state.branches[action.provider]
      const model = provider?.models[action.modelId]
      if (!provider || !model) return state
      return {
        ...state,
        branches: {
          ...state.branches,
          [action.provider]: {
            ...provider,
            models: {
              ...provider.models,
              [action.modelId]: setStructuredChoices(model, action.selections),
            },
          },
        },
      }
    }

    case 'CLEAR':
      return { ...initialState }
  }
}

interface TreeContextValue {
  state: TreeState
  options: OptionsResponse | null
  optionsError: string | null
  dispatch: Dispatch<Action>
  isProviderSelected: (provider: ProviderId) => boolean
  isModelSelected: (provider: ProviderId, modelId: string) => boolean
  modelBranch: (provider: ProviderId, modelId: string) => ModelBranch | undefined
  modelOption: (provider: ProviderId, modelId: string) => ModelOption | undefined
}

const TreeContext = createContext<TreeContextValue | null>(null)

export function TreeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [options, setOptions] = useState<OptionsResponse | null>(null)
  const [optionsError, setOptionsError] = useState<string | null>(null)

  useEffect(() => {
    getOptions()
      .then(setOptions)
      .catch((err: unknown) =>
        setOptionsError(err instanceof Error ? err.message : String(err)),
      )
  }, [])

  const value = useMemo<TreeContextValue>(() => {
    const providerOptions = new Map(
      (options?.providers ?? []).map((p) => [p.id, p] as const),
    )
    const modelOption = (provider: ProviderId, modelId: string) =>
      providerOptions.get(provider)?.models.find((m) => m.id === modelId)

    const modelBranch = (provider: ProviderId, modelId: string) =>
      state.branches[provider]?.models[modelId]

    return {
      state,
      options,
      optionsError,
      dispatch,
      isProviderSelected: (provider) => Boolean(state.branches[provider]),
      isModelSelected: (provider, modelId) => Boolean(modelBranch(provider, modelId)),
      modelBranch,
      modelOption,
    }
  }, [state, options, optionsError])

  return <TreeContext.Provider value={value}>{children}</TreeContext.Provider>
}

export function useTree(): TreeContextValue {
  const ctx = useContext(TreeContext)
  if (!ctx) throw new Error('useTree must be used inside <TreeProvider>')
  return ctx
}