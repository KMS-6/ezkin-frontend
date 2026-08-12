import { Droplets, MoonStar, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { BriefingMetric } from '../../../types/briefing'

interface BriefingFactorsProps {
  metrics: BriefingMetric[]
}

const metricIcons: Record<BriefingMetric['icon'], LucideIcon> = {
  sleep: MoonStar,
  humidity: Droplets,
  uv: Sun,
}

export function BriefingFactors({ metrics }: BriefingFactorsProps) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ez-text">오늘 함께 본 것</h2>
      </div>
      <Card className="divide-y divide-ez-border/80 overflow-hidden px-4">
        {metrics.map((metric) => {
          const Icon = metricIcons[metric.icon]
          return (
            <div key={metric.id} className="flex min-h-[72px] items-center gap-3 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-[11px] bg-ez-primary-soft text-ez-primary">
                <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ez-text">{metric.label}</p>
                <p className="mt-0.5 text-[11px] font-normal text-ez-muted">{metric.description}</p>
              </div>
              <strong className="shrink-0 text-[14px] font-semibold text-ez-primary-dark">{metric.value}</strong>
            </div>
          )
        })}
      </Card>
    </section>
  )
}
