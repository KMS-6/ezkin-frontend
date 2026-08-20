import type { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export function Pill({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/75 px-2.5 py-1.5 text-xs text-ez-secondary backdrop-blur-sm', className)}
      {...props}
    />
  )
}
