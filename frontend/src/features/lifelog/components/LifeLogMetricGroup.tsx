import {
  CloudSun,
  Droplets,
  Flame,
  HeartPulse,
  Moon,
  Sun,
  Wind,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { LifeLogEntry, LifeLogMetricType } from '../../../types/lifeLog'
import { cn } from '../../../utils/cn'

type AutomaticMetricType = Exclude<LifeLogMetricType, 'diet' | 'water'>

const metricIcons: Record<AutomaticMetricType, LucideIcon> = {
  sleep: Moon,
  hrv: HeartPulse,
  active_energy_kcal: Flame,
  temperature: CloudSun,
  humidity: Droplets,
  uv: Sun,
  pm25: Wind,
}

interface LifeLogMetricGroupProps {
  entries: LifeLogEntry[]
  layout?: 'rows' | 'columns'
  tone?: 'health' | 'environment'
}

export function LifeLogMetricGroup({
  entries,
  layout = 'rows',
  tone = 'health',
}: LifeLogMetricGroupProps) {
  return (
    <Card className="overflow-hidden">
      <div className={cn(layout === 'columns' && 'grid grid-cols-3 divide-x divide-ez-border/70')}>
        {entries.map((entry) => {
          const Icon = metricIcons[entry.type as AutomaticMetricType]

          return (
            <div
              key={entry.id}
              className={cn(
                layout === 'rows'
                  ? 'flex min-h-[68px] items-center gap-3 px-4 py-3 [&+&]:border-t [&+&]:border-ez-border/70'
                  : 'flex min-h-[112px] min-w-0 flex-col items-center px-2 py-3.5 text-center',
              )}
            >
              <span className={cn(
                'grid size-9 shrink-0 place-items-center rounded-[12px]',
                tone === 'health' ? 'bg-[#e3fbf6] text-[#178873]' : 'bg-[#e8faf5] text-[#178873]',
              )}>
                <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              </span>

              <div className={cn('min-w-0', layout === 'columns' ? 'mt-2' : 'flex-1')}>
                <div className={cn(layout === 'rows' && 'flex items-baseline justify-between gap-3')}>
                  <p className="text-[12px] font-medium text-ez-muted">{entry.label}</p>
                  <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.02em] text-ez-text">
                    {entry.value}{entry.unit && <span className="ml-0.5 text-[12px]">{entry.unit}</span>}
                  </p>
                </div>
                {entry.description && layout === 'rows' && (
                  <p className={cn(
                    'mt-0.5 text-[11px]',
                    tone === 'health' ? 'font-medium text-[#287d61]' : 'font-normal text-ez-muted',
                  )}>
                    {entry.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
