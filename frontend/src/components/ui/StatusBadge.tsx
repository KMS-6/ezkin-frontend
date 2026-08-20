import type { HTMLAttributes } from 'react'
import type { BadgeTone } from '../../types/briefing'
import { cn } from '../../utils/cn'

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone | 'danger'
}

const toneStyles = {
  primary: 'bg-ez-primary-soft text-ez-primary-dark',
  success: 'bg-[#eaf8f2] text-[#287d61]',
  warning: 'bg-[#fff3df] text-[#a76818]',
  danger: 'bg-[#fff0f1] text-[#b54852]',
  neutral: 'bg-[#f2f0f5] text-ez-muted',
}

export function StatusBadge({ tone = 'neutral', className, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold', toneStyles[tone], className)}
      {...props}
    />
  )
}
