import type { ReactNode } from 'react'
import { Card } from './Card'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="px-6 py-8 text-center">
      {icon && <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-ez-primary-soft text-ez-primary">{icon}</div>}
      <h2 className="text-lg font-bold text-ez-text">{title}</h2>
      <p className="mx-auto mt-2 max-w-[290px] whitespace-pre-line text-sm leading-6 text-ez-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  )
}
