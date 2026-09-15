import type { ProviderId } from '../types'

// One-line "what is this for" blurbs, curated from OpenRouter's model
// descriptions (snapshot Sep 2026). Matched by regex so live-discovered ids
// still get a sensible line.

type DescRule = { re: RegExp; provider: ProviderId; text: string }

const RULES: DescRule[] = [
  // --- OpenAI ---------------------------------------------------
  { re: /gpt-5\.6.*sol/i, provider: 'openai', text: 'Flagship GPT-5.6 — complex reasoning, coding, agentic and CLI-heavy workflows.' },
  { re: /gpt-5\.6.*terra/i, provider: 'openai', text: 'GPT-5.6 mid tier for multi-step coding and agent work; cheaper than Sol.' },
  { re: /gpt-5\.6.*luna/i, provider: 'openai', text: 'Fast, low-cost GPT-5.6 tier for high-volume everyday workloads.' },
  { re: /gpt-5\.6/i, provider: 'openai', text: 'GPT-5.6 series — OpenAI\u2019s current generation of models.' },
  { re: /gpt-5\.5/i, provider: 'openai', text: 'Frontier GPT-5.5 for complex professional workloads, with 1M+ token context.' },
  { re: /gpt-5\.4-pro/i, provider: 'openai', text: 'High-capacity GPT-5.4 tier for demanding professional workloads.' },
  { re: /gpt-5\.4.*mini/i, provider: 'openai', text: 'Faster, cheaper GPT-5.4 tier for high-throughput reasoning and coding.' },
  { re: /gpt-5\.4.*nano/i, provider: 'openai', text: 'Smallest GPT-5.4 tier for ultra-low-latency developer tools.' },
  { re: /gpt-5\.4/i, provider: 'openai', text: 'GPT-5.4 — strong reasoning, coding and reliability across general tasks.' },
  { re: /gpt-5.*mini/i, provider: 'openai', text: 'Compact, cheaper GPT-5 tier for lighter reasoning at lower latency and cost.' },
  { re: /gpt-5.*nano/i, provider: 'openai', text: 'Smallest, fastest GPT-5 variant — spare memory, ultra-low latency calls.' },
  { re: /gpt-5/i, provider: 'openai', text: 'Frontier GPT-5 — step-by-step reasoning, coding quality and accurate answers.' },
  { re: /gpt-4\.1-mini/i, provider: 'openai', text: 'GPT-4.1-class quality at lower latency and cost, with a big context window.' },
  { re: /gpt-4\.1-nano/i, provider: 'openai', text: 'Fastest and cheapest GPT-4.1 for simple, low-latency calls.' },
  { re: /gpt-4\.1/i, provider: 'openai', text: 'Flagship class for instruction following, software engineering and long context.' },
  { re: /gpt-4o-mini/i, provider: 'openai', text: 'Cheap, fast small model for high-volume production use.' },
  { re: /gpt-4o/i, provider: 'openai', text: 'Older all-round flagship — fast, good general-purpose answers.' },
  { re: /o4-mini|o3-mini/i, provider: 'openai', text: 'Cost-efficient reasoning model, strong at STEM, coding and tool use.' },
  { re: /o1-pro/i, provider: 'openai', text: 'O-series top tier for the hardest reasoning, at a premium price.' },
  { re: /o1/i, provider: 'openai', text: 'Deep-reasoning model for the hardest math, science and coding problems.' },
  { re: /o3/i, provider: 'openai', text: 'Well-rounded reasoning across math, science, coding and visual tasks.' },

  // --- Google (Gemini) -------------------------------------------
  { re: /3\.\d+-pro|3\.\d+-pro-preview/i, provider: 'gemini', text: 'Frontier Gemini reasoning for complex engineering and agent workloads.' },
  { re: /3\.\d+-flash/i, provider: 'gemini', text: 'High-efficiency Gemini — coding, agentic workflows and app development.' },
  { re: /flash-lite/i, provider: 'gemini', text: 'Low-latency, high-volume general model at the cheapest rate.' },
  { re: /2\.5-pro/i, provider: 'gemini', text: 'Gemini 2.5 Pro — deep reasoning and coding with built-in \u201cthinking\u201d.' },
  { re: /2\.5-flash/i, provider: 'gemini', text: 'Gemini 2.5 Flash — workhorse for reasoning, coding, and 1M-token context.' },
  { re: /computer-use/i, provider: 'gemini', text: 'Gemini for GUI automation — sees and drives the screen.' },
  { re: /2\.0-flash/i, provider: 'gemini', text: 'Fast, cheap Gemini 2.0 Flash for everyday tasks.' },

  // --- Anthropic (Claude) ----------------------------------------
  { re: /opus/i, provider: 'anthropic', text: 'Claude flagship — demanding reasoning, coding and long-horizon agents.' },
  { re: /sonnet-5/i, provider: 'anthropic', text: 'Frontier Sonnet-class with adaptive thinking and selectable effort.' },
  { re: /sonnet/i, provider: 'anthropic', text: 'Strong all-round Claude for coding and reasoning tasks.' },
  { re: /haiku/i, provider: 'anthropic', text: 'Fastest, cheapest Claude — near-Sonnet intelligence at a fraction of cost.' },
]

const FALLBACK: Record<ProviderId, string> = {
  openai: 'OpenAI model — check provider docs for exact capabilities.',
  gemini: 'Google Gemini model — check provider docs for exact capabilities.',
  anthropic: 'Anthropic Claude model — check provider docs for exact capabilities.',
}

export function describeModel(provider: ProviderId, modelId: string): string {
  for (const rule of RULES) {
    if (rule.provider === provider && rule.re.test(modelId)) return rule.text
  }
  return FALLBACK[provider]
}