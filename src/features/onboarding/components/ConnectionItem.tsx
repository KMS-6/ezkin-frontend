import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../../utils/cn'

interface ConnectionItemProps {
  icon: ReactNode
  title: string
  dataLabel: string
  description: string
  connected: boolean
  onToggle: () => void
}

export function ConnectionItem({
  icon,
  title,
  dataLabel,
  description,
  connected,
  onToggle,
}: ConnectionItemProps) {
  return (
    <div className={cn(
      'rounded-[18px] border bg-white p-4 transition duration-200',
      connected ? 'border-[#cec2ef]' : 'border-ez-border',
    )}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-ez-primary-soft text-ez-primary">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-ez-text">{title}</h2>
          <p className="mt-0.5 text-[12px] font-medium text-ez-primary">{dataLabel}</p>
          <p className="mt-2 text-[12px] font-normal leading-5 text-ez-muted">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'mt-3 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl text-[12px] font-semibold transition',
          connected
            ? 'bg-[#eaf8f2] text-[#287d61]'
            : 'bg-ez-primary-soft text-ez-primary hover:bg-[#e4dcff]',
        )}
        aria-pressed={connected}
      >
        {connected && <Check size={14} strokeWidth={2.8} aria-hidden="true" />}
        {connected ? '연결됐어요' : '연결하기'}
      </button>
    </div>
  )
}
