import type { ReactNode } from 'react'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden max-w-xs -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-2.5 text-[11px] font-normal leading-snug text-gray-600 shadow-lg group-hover:block dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        {content}
      </span>
    </span>
  )
}

interface ModelInfoRowProps {
  label: string
  value: ReactNode
}

export function ModelInfoRow({ label, value }: ModelInfoRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-gray-400 dark:text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-700 dark:text-gray-200">
        {value}
      </span>
    </div>
  )
}