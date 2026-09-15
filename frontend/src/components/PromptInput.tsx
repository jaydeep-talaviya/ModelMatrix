import { useTree } from '../store/TreeContext'

export function PromptInput() {
  const { state, dispatch } = useTree()

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Prompt
      </span>
      <textarea
        value={state.prompt}
        onChange={(e) => dispatch({ type: 'SET_PROMPT', value: e.target.value })}
        rows={4}
        placeholder="e.g. Hello, what is Redis?"
        className="w-full resize-y rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
    </label>
  )
}