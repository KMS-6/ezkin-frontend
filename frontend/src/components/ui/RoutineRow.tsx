import { Check } from 'lucide-react'
import type { RoutineStep } from '../../types/briefing'
import { StatusBadge } from './StatusBadge'

interface RoutineRowProps {
  index: number
  step: RoutineStep
  isLast?: boolean
}

export function RoutineRow({ index, step, isLast = false }: RoutineRowProps) {
  return (
    <div className="relative flex items-center gap-3.5 px-4 py-3.5">
      {!isLast && <span className="absolute left-[29px] top-[43px] h-[20px] w-px bg-ez-border" aria-hidden="true" />}
      <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full bg-ez-primary-soft text-[10px] font-extrabold text-ez-primary">
        {String(index).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-ez-text">{step.name}</p>
        <p className="mt-0.5 text-xs text-ez-muted">{step.instruction}</p>
      </div>
      <StatusBadge tone={step.badgeTone}>
        {step.badge === '필수' && <Check size={11} strokeWidth={3} className="mr-1" aria-hidden="true" />}
        {step.badge}
      </StatusBadge>
    </div>
  )
}
