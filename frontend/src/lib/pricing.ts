import type { ProviderId } from '../types'

// Per-model token prices (USD per 1,000,000 tokens) — static snapshot.
// Matched by regex against live model ids so unknown ids still get a
// family-based estimate. Prices change often; see PRICING_AS_OF.

export const PRICING_AS_OF = 'Sep 2026'

export interface TokenPrice {
  input: number
  output: number
}

type Rule = { re: RegExp; provider: ProviderId; price: TokenPrice }

const RULES: Rule[] = [
  // --- OpenAI ------------------------------------------------
  { re: /gpt-6/i, provider: 'openai', price: { input: 10.0, output: 50.0 } },
  { re: /gpt-5\.6.*luna/i, provider: 'openai', price: { input: 0.2, output: 1.2 } },
  { re: /gpt-5\.6.*terra/i, provider: 'openai', price: { input: 2.0, output: 12.0 } },
  { re: /gpt-5\.6/i, provider: 'openai', price: { input: 5.0, output: 30.0 } },
  { re: /gpt-5\.5/i, provider: 'openai', price: { input: 5.0, output: 30.0 } },
  { re: /gpt-5\.(4|3)(\.|\-).*mini/i, provider: 'openai', price: { input: 0.25, output: 2.0 } },
  { re: /gpt-5\.(4|3)/i, provider: 'openai', price: { input: 2.5, output: 15.0 } },
  { re: /gpt-5\.2-nano/i, provider: 'openai', price: { input: 0.05, output: 0.4 } },
  { re: /gpt-5-nano/i, provider: 'openai', price: { input: 0.05, output: 0.4 } },
  { re: /gpt-5.*mini/i, provider: 'openai', price: { input: 0.25, output: 2.0 } },
  { re: /gpt-5/i, provider: 'openai', price: { input: 1.25, output: 10.0 } },
  { re: /gpt-4\.1-nano/i, provider: 'openai', price: { input: 0.1, output: 0.4 } },
  { re: /gpt-4\.1-mini/i, provider: 'openai', price: { input: 0.4, output: 1.6 } },
  { re: /gpt-4\.1/i, provider: 'openai', price: { input: 2.0, output: 8.0 } },
  { re: /gpt-4o-mini/i, provider: 'openai', price: { input: 0.15, output: 0.6 } },
  { re: /gpt-4o/i, provider: 'openai', price: { input: 2.5, output: 10.0 } },
  { re: /gpt-4/i, provider: 'openai', price: { input: 30.0, output: 60.0 } },
  { re: /o1/i, provider: 'openai', price: { input: 15.0, output: 60.0 } },
  { re: /o4-mini/i, provider: 'openai', price: { input: 1.1, output: 4.4 } },
  { re: /o3-mini/i, provider: 'openai', price: { input: 1.1, output: 4.4 } },
  { re: /o3/i, provider: 'openai', price: { input: 2.0, output: 8.0 } },

  // --- Google (Gemini) ----------------------------------------
  { re: /3\.1-pro/i, provider: 'gemini', price: { input: 2.0, output: 12.0 } },
  { re: /2\.5-pro|computer-use/i, provider: 'gemini', price: { input: 1.25, output: 10.0 } },
  { re: /3\.5-flash-lite/i, provider: 'gemini', price: { input: 0.3, output: 2.5 } },
  { re: /3\.1-flash-lite/i, provider: 'gemini', price: { input: 0.25, output: 1.5 } },
  { re: /3\.5-flash/i, provider: 'gemini', price: { input: 1.5, output: 9.0 } },
  { re: /flash-lite/i, provider: 'gemini', price: { input: 0.25, output: 1.5 } },
  { re: /3\.[0-9]-flash|3-flash/i, provider: 'gemini', price: { input: 0.75, output: 3.75 } },
  { re: /2\.5-flash/i, provider: 'gemini', price: { input: 0.3, output: 2.5 } },
  { re: /2\.0-flash/i, provider: 'gemini', price: { input: 0.1, output: 0.4 } },

  // --- Anthropic (Claude) ---------------------------------------
  { re: /fable|mythos/i, provider: 'anthropic', price: { input: 10.0, output: 50.0 } },
  { re: /sonnet-5/i, provider: 'anthropic', price: { input: 2.0, output: 10.0 } },
  { re: /opus/i, provider: 'anthropic', price: { input: 5.0, output: 25.0 } },
  { re: /sonnet/i, provider: 'anthropic', price: { input: 3.0, output: 15.0 } },
  { re: /haiku/i, provider: 'anthropic', price: { input: 1.0, output: 5.0 } },
]

const FALLBACK: Record<ProviderId, TokenPrice> = {
  openai: { input: 1.25, output: 10.0 },
  gemini: { input: 0.75, output: 3.75 },
  anthropic: { input: 3.0, output: 15.0 },
}

export function priceFor(provider: ProviderId, modelId: string): TokenPrice {
  for (const rule of RULES) {
    if (rule.provider === provider && rule.re.test(modelId)) return rule.price
  }
  return FALLBACK[provider]
}

/** Estimated cost of a run in USD, from token usage and list price. */
export function estimateCost(
  provider: ProviderId | undefined,
  modelId: string | undefined,
  input: number | undefined | null,
  output: number | undefined | null,
): number | null {
  if (!provider || !modelId || input == null || output == null) return null
  const price = priceFor(provider, modelId)
  return (input / 1_000_000) * price.input + (output / 1_000_000) * price.output
}

export function formatCost(value: number | null | undefined): string {
  if (value == null) return '—'
  if (value >= 1) return `$${value.toFixed(2)}`
  if (value >= 0.01) return `$${value.toFixed(3)}`
  return `$${value.toFixed(4)}`
}