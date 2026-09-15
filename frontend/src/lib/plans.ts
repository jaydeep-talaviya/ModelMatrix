// Static snapshot of consumer subscription plans (as of mid-2026).
// Prices/features change often — verify on each provider's signup page.
// These are CHAT subscription plans; API usage is billed separately.

export interface Plan {
  name: string
  price: string
  priceNote: string
  usage: string
  context: string | null
  features: string[]
}

export interface ProviderPlans {
  provider: string
  plans: Plan[]
}

export const LAST_UPDATED = 'Sep 2026'

export const PROVIDER_PLANS: ProviderPlans[] = [
  {
    provider: 'OpenAI',
    plans: [
      {
        name: 'Free',
        price: '$0',
        priceNote: '/ month',
        usage: 'Rolling usage caps',
        context: null,
        features: ['Unlimited text chats with GPT-5.6', 'Limited uploads, image gen, voice', 'Limited deep research & memory'],
      },
      {
        name: 'Go',
        price: '$8',
        priceNote: '/ month',
        usage: 'Higher limits than Free',
        context: null,
        features: ['More messages with tools & uploads', 'More image creation & voice chats', 'Longer memory (may include ads)'],
      },
      {
        name: 'Plus',
        price: '$19.99',
        priceNote: '/ month',
        usage: 'Expanded limits',
        context: null,
        features: ['Advanced reasoning (GPT-5.6)', 'Deep research, projects, custom GPTs', 'Expanded Codex & ChatGPT Work'],
      },
      {
        name: 'Pro',
        price: '$100',
        priceNote: '/ month (from)',
        usage: '5× or 20× more than Plus',
        context: null,
        features: ['Pro reasoning & max deep research', 'Unlimited, faster image creation', 'Maximum Codex tasks & priority'],
      },
    ],
  },
  {
    provider: 'Google AI (Gemini)',
    plans: [
      {
        name: 'Free',
        price: '$0',
        priceNote: '/ month',
        usage: '1×',
        context: null,
        features: ['Gemini 3.6 Flash + varying 3.1 Pro', 'Image gen, Deep Research, Canvas', '15 GB cloud storage'],
      },
      {
        name: 'AI Plus',
        price: '$4.99',
        priceNote: '/ month',
        usage: '2× higher than Free',
        context: null,
        features: ['Video generation & Daily Brief', 'Gemini in Google apps', '400 GB cloud storage'],
      },
      {
        name: 'AI Pro',
        price: '$19.99',
        priceNote: '/ month',
        usage: '4× higher than Free',
        context: '1M token context',
        features: ['Top models (3.1 Pro) & premium access', 'Deep Research & video gen', '5 TB cloud storage, Gmail/Docs'],
      },
      {
        name: 'AI Ultra',
        price: '$99.99',
        priceNote: '/ month (from)',
        usage: '5× or 20× higher than Pro',
        context: '1M token context',
        features: ['Deep Think, Gemini Spark (US)', 'Veo 3.1 video & highest limits', 'From 20 TB storage + YouTube Premium'],
      },
    ],
  },
  {
    provider: 'Anthropic (Claude)',
    plans: [
      {
        name: 'Free',
        price: '$0',
        priceNote: '/ month',
        usage: 'Basic, session-capped',
        context: '200K token context',
        features: ['Chat on web, iOS, Android, desktop', 'Limited daily messages', 'Standard model access'],
      },
      {
        name: 'Pro',
        price: '$17',
        priceNote: '/ month (annual) · $20 monthly',
        usage: '≥5× usage vs Free',
        context: '1M token context',
        features: ['Claude Code, Cowork, Design, Science', 'Unlimited projects & more models', 'Claude for Microsoft 365'],
      },
      {
        name: 'Max 5×',
        price: '$100',
        priceNote: '/ month',
        usage: '5× more than Pro',
        context: '1M token context',
        features: ['Higher output limits for all tasks', 'Early access to new features', 'Priority access at high traffic'],
      },
      {
        name: 'Max 20×',
        price: '$200',
        priceNote: '/ month',
        usage: '20× more than Pro',
        context: '1M token context',
        features: ['Everything in Max 5×', 'Highest usage limits', 'Best priority access'],
      },
    ],
  },
]