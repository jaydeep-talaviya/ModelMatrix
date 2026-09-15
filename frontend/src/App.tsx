import { useTree } from './store/TreeContext'

function App() {
  const { options, optionsError, state } = useTree()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            ModelMatrix
          </h1>
          <div className="flex items-center gap-2 text-sm">
            {optionsError ? (
              <span className="text-red-600 dark:text-red-400">{optionsError}</span>
            ) : options ? (
              options.providers.map((p) => (
                <span
                  key={p.id}
                  className={
                    p.configured
                      ? 'rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'rounded-full bg-gray-100 px-2 py-0.5 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }
                  title={p.configured ? `${p.display_name} configured` : `${p.display_name} key not set`}
                >
                  {p.display_name}
                  {p.configured ? ' ✓' : ' —'}
                </span>
              ))
            ) : (
              <span className="text-gray-400">Loading…</span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_1fr]">
        <section aria-label="Prompt and configuration" className="min-h-[50vh]">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Configuration
          </h2>
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400 dark:border-gray-700">
            Prompt input and the configuration tree render here (Phase 6).
          </div>
        </section>

        <section aria-label="Results">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Results
          </h2>
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400 dark:border-gray-700">
            Experiment results render here (Phase 7). Selected providers:{' '}
            {Object.keys(state.branches).length
              ? Object.keys(state.branches).join(', ')
              : 'none yet'}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App