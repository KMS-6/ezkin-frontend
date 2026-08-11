import type { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-[20px] border border-ez-border bg-white shadow-card', className)}
      {...props}
    />
  )
}
