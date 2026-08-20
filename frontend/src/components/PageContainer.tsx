import type { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <main className={cn('flex-1 px-5 pb-28', className)} {...props} />
}
