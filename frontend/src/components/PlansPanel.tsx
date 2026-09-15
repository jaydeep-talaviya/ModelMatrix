import { LAST_UPDATED, PROVIDER_PLANS, type Plan } from '../lib/plans'

export function PlansPanel() {
  return (
    <section
      aria-label="Compare plans"
      className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
    >
      <h2 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
        Compare plans
      </h2>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        Consumer chat subscription plans side by side. No single plan is
        “best” — it depends on how often you use it and which tools you need.
      </p>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
        Snapshot as of {LAST_UPDATED}. Prices and features change often — verify
        on each provider's signup page before committing. Subscription plans do
        not include API usage, which is billed separately (pay-as-you-go).
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {PROVIDER_PLANS.map((group) => (
          <div
            key={group.provider}
            className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
          >
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {group.provider}
            </h3>
            <div className="space-y-2.5">
              {group.plans.map((plan) => (
                <PlanCard key={plan.name} plan={plan} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/40">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {plan.name}
        </span>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {plan.price}
          <span className="ml-0.5 text-[10px] font-normal text-gray-400">
            {plan.priceNote}
          </span>
        </span>
      </div>
      <span className="mt-0.5 inline-block rounded-full bg-gray-200 px-1.5 py-0.5 text-[9px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
        {plan.usage}
      </span>
      {plan.context && (
        <span className="mt-0.5 ml-1 inline-block rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
          {plan.context}
        </span>
      )}
      <ul className="mt-2 space-y-1 text-[11px] leading-snug text-gray-600 dark:text-gray-300">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-1.5">
            <span className="mt-px shrink-0 text-emerald-600 dark:text-emerald-400">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}