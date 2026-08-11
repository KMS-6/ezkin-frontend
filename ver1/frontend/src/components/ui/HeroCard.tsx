import type { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export function HeroCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[24px] border border-white/70 bg-gradient-to-br from-[#eee8ff] via-[#f7f3ff] to-white p-5 shadow-hero',
        className,
      )}
      {...props}
    />
  )
}
