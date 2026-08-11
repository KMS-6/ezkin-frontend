import type { ReactNode } from 'react'
import { Card } from './Card'

interface MetricCardProps {
  label: string
  value: string
  icon?: ReactNode
  helper?: string
}

export function MetricCard({ label, value, icon, helper }: MetricCardProps) {
  return (
    <Card className="p-3.5">
      <div className="mb-2 flex items-center justify-between text-ez-primary">{icon}</div>
      <p className="text-xs text-ez-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-ez-text">{value}</p>
      {helper && <p className="mt-1 text-[11px] text-ez-muted">{helper}</p>}
    </Card>
  )
}
