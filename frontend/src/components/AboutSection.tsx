const aboutPoints = [
  {
    title: 'Why this app exists',
    body: (
      <p className="text-sm">
        Trying to pick a model usually means juggling dashboards, SDKs, and API
        keys across several providers. ModelMatrix removes that: you type one
        prompt, pick any mix of OpenAI, Gemini, and Anthropic models (plus
        effort level and structured output), and every combination runs in
        parallel — with latency, token usage, and estimated cost reported side
        by side.
      </p>
    ),
  },
  {
    title: 'Who it is for',
    body: (
      <ul className="list-disc space-y-1.5 pl-4">
        <li>
          <strong>Engineers</strong> comparing candidates before committing to a
          model in production.
        </li>
        <li>
          <strong>Prompt engineers</strong> checking how different models and
          reasoning budgets handle the same instruction.
        </li>
        <li>
          <strong>Researchers & students</strong> evaluating models without
          writing per-vendor code — or paying for keys (OpenAI/Anthropic run
          through the Puter free tier).
        </li>
        <li>
          <strong>Anyone</strong> curious how "apples to apples" a cheaper model
          really is.
        </li>
      </ul>
    ),
  },
  {
    title: 'What good questions look like here',
    body: (
      <ul className="list-disc space-y-1.5 pl-4">
        <li>
          For the same prompt, is the flagship model measurably better (or just
          slower and pricier) than the cheap one? Look at the Compare section.
        </li>
        <li>
          Does a higher reasoning effort actually improve the answer? Compare
          the same model across Low / Medium / High and watch thinking-token
          totals.
        </li>
        <li>
          How much does structured output cost in tokens versus plain text?
        </li>
      </ul>
    ),
  },
  {
    title: 'Zero-cost demo',
    body: (
      <p className="text-sm">
        OpenAI and Anthropic calls go through the Puter free tier, so you can
        test the flow with no paid API key. Gemini runs through the official
        SDK with a demo/free key.
      </p>
    ),
  },
]

export function AboutSection() {
  return (
    <section aria-label="About this app" className="mt-6">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        About this app
      </h2>
      <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-700 dark:bg-gray-900">
        {aboutPoints.map((point) => (
          <details key={point.title} className="group px-4 py-3" open>
            <summary className="cursor-pointer select-none text-sm font-medium text-gray-800 marker:text-gray-400 dark:text-gray-100">
              {point.title}
            </summary>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {point.body}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}