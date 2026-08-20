import { Droplets, HeartPulse, MoonStar, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { BriefingMetric } from '../../../types/briefing'

interface BriefingFactorsProps {
  metrics: BriefingMetric[]
}

const metricIcons: Record<BriefingMetric['icon'], LucideIcon> = {
  sleep: MoonStar,
  hrv: HeartPulse,
  humidity: Droplets,
  uv: Sun,
}

export function BriefingFactors({ metrics }: BriefingFactorsProps) {
  const groups = [
    { source: 'health' as const, label: 'Health', metrics: metrics.filter((metric) => metric.source === 'health') },
    { source: 'environment' as const, label: 'Environment', metrics: metrics.filter((metric) => metric.source === 'environment') },
  ].filter((group) => group.metrics.length > 0)

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ez-text">오늘 함께 본 것</h2>
      </div>
      <Card className="overflow-hidden">
        {groups.map((group, groupIndex) => (
          <div key={group.source} className={groupIndex > 0 ? 'border-t border-ez-border/80' : ''}>
            <p className="bg-[#f8fffd] px-4 py-2 text-[11px] font-semibold text-[#178873]">{group.label}</p>
            <div className="divide-y divide-ez-border/70 px-4">
              {group.metrics.map((metric) => {
                const Icon = metricIcons[metric.icon]
                return (
                  <div key={metric.id} className="flex min-h-[68px] items-center gap-3 py-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-[11px] bg-[#e3fbf6] text-[#178873]">
                      <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ez-text">{metric.label}</p>
                      <p className="mt-0.5 text-[11px] font-normal text-ez-muted">{metric.description}</p>
                    </div>
                    <strong className="shrink-0 text-[14px] font-semibold text-ez-text">{metric.value}</strong>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </Card>
    </section>
  )
}
