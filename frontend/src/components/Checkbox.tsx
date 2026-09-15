import type { ReactNode } from 'react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  disabled?: boolean
  className?: string
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
  className,
}: CheckboxProps) {
  return (
    <label
      className={
        'flex cursor-pointer items-start gap-2 text-sm select-none ' +
        (disabled ? 'cursor-not-allowed opacity-50 ' : '') +
        (className ?? '')
      }
    >
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-gray-800 dark:accent-gray-200"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  )
}