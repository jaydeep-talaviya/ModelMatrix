import { createPortal } from 'react-dom'
import { useCallback, useRef, useState, type ReactNode } from 'react'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
}

interface Coords {
  top: number
  left: number
}

export function Tooltip({ content, children }: TooltipProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [coords, setCoords] = useState<Coords | null>(null)

  const show = useCallback(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setCoords({ top: rect.top, left: rect.left + rect.width / 2 })
  }, [])

  const hide = useCallback(() => setCoords(null), [])

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex"
      >
        {children}
      </span>
      {coords &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-50 max-w-xs -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-2.5 text-[11px] font-normal leading-snug text-gray-600 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            style={{ bottom: window.innerHeight - coords.top + 8, left: coords.left }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
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