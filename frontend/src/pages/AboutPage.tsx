const sections = [
  {
    title: 'Why this app exists',
    body: (
      <p>
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
      <p>
        OpenAI and Anthropic calls go through the Puter free tier, so you can
        test the flow with no paid API key. Gemini runs through the official
        SDK with a demo/free key.
      </p>
    ),
  },
]

export function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        About this app
      </h1>
      <div className="mt-6 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {section.title}
            </h2>
            <div className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}