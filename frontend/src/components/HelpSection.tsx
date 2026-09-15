const sections = [
  {
    title: 'Tokens: what each number means',
    body: (
      <ul className="list-disc space-y-1.5 pl-4">
        <li>
          <strong>Input tokens</strong> — the prompt you sent (the text, plus the
          structured-output config if enabled).
        </li>
        <li>
          <strong>Output tokens</strong> — the visible answer the model returned.
        </li>
        <li>
          <strong>Thinking tokens</strong> (Gemini) — hidden reasoning the model
          does before answering. It is <em>not</em> included in the input/output
          columns, but Gemini still counts it in the total.
        </li>
        <li>
          <strong>Total tokens</strong> — how each provider calculates it:
          <ul className="mt-1 list-disc pl-4">
            <li>OpenAI / Anthropic: input + output</li>
            <li>Gemini: input + output + thinking</li>
          </ul>
        </li>
      </ul>
    ),
  },
  {
    title: 'Example',
    body: (
      <p className="text-sm">
        A Gemini run showing <code>tokens: 1724</code> with{' '}
        <code>in 4 / out 832</code> means: 4 prompt tokens + 832 answer tokens +{' '}
        <strong>888 thinking tokens</strong> = 1724. The gap between the total and
        (input + output) is how much the model 'thought' before answering.
      </p>
    ),
  },
  {
    title: 'Effort levels',
    body: (
      <ul className="list-disc space-y-1.5 pl-4">
        <li>
          <strong>Low / Medium / High</strong> control how much reasoning budget
          the model gets (OpenAI <code>reasoning_effort</code>, Gemini and
          Anthropic thinking budgets). Models that don't support effort run at a
          fixed medium setting.
        </li>
        <li>
          Higher effort usually means <em>more thinking (hidden) tokens</em> and
          better results on hard reasoning tasks — but longer run time and more
          cost. This is why comparing the same prompt across effort levels is
          interesting: the token total shows the effort cost directly.
        </li>
      </ul>
    ),
  },
  {
    title: 'Structured output',
    body: (
      <ul className="list-disc space-y-1.5 pl-4">
        <li>
          When <strong>Structured output</strong> is enabled, the model must
          return <em>valid JSON</em> matching this exact schema:
          <pre className="mt-2 overflow-auto rounded-lg bg-gray-100 p-3 text-xs dark:bg-gray-800">
{`{
  "summary": "one sentence",
  "answer": "direct answer",
  "key_details": ["point", "point"]
}`}
          </pre>
        </li>
        <li>
          OpenAI enforces it with strict JSON mode, Gemini with a
          response schema, Anthropic with a forced tool call.
        </li>
        <li>
          When disabled, you get the model's plain-text response instead.
        </li>
      </ul>
    ),
  },
  {
    title: 'Status & duration',
    body: (
      <ul className="list-disc space-y-1.5 pl-4">
        <li>
          <strong>Success</strong> — the provider returned a response.{' '}
          <strong>Error</strong> — the call failed (missing API key, no credits,
          retired model, rate limit); the error message shows the reason.
        </li>
        <li>
          <strong>Duration</strong> is the wall-clock time of that single call,
          including waiting on reasoning tokens.
        </li>
        <li>
          The summary bar shows the whole batch: total runs, succeeded, failed,
          total tokens across all runs, and total time.
        </li>
      </ul>
    ),
  },
  {
    title: 'Models are live',
    body: (
      <p className="text-sm">
        The model list isn't hardcoded — it's fetched live from each provider's
        own model API. Retired models disappear automatically, and new ones
        appear as soon as the provider publishes them.
      </p>
    ),
  },
]

export function HelpSection() {
  return (
    <section aria-label="How to read the results" className="mt-6">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Understanding the numbers
      </h2>
      <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-700 dark:bg-gray-900">
        {sections.map((section) => (
          <details key={section.title} className="group px-4 py-3">
            <summary className="cursor-pointer select-none text-sm font-medium text-gray-800 marker:text-gray-400 dark:text-gray-100">
              {section.title}
            </summary>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {section.body}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}