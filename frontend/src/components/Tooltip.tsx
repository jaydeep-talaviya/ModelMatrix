import type { ReactNode } from 'react'

interface TooltipProps {
  text: string
  children: ReactNode
}

export function Tooltip({ text, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-60 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-2 text-[10px] font-normal leading-snug text-gray-600 shadow-lg group-hover:block dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        {text}
      </span>
    </span>
  )
}