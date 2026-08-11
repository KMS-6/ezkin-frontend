import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ez-text">{title}</h2>
        {description && <p className="mt-1 text-[13px] leading-5 text-ez-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
