import {
  Clock3,
  CloudSun,
  Droplets,
  Footprints,
  Moon,
  Sun,
  Wind,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { LifeLogEntry, LifeLogMetricType } from '../../../types/lifeLog'
import { cn } from '../../../utils/cn'

const metricIcons: Record<Exclude<LifeLogMetricType, 'diet'>, LucideIcon> = {
  sleep: Moon,
  steps: Footprints,
  rhythm: Clock3,
  temperature: CloudSun,
  humidity: Droplets,
  uv: Sun,
  pm25: Wind,
}

interface LifeLogMetricGroupProps {
  entries: LifeLogEntry[]
  layout?: 'rows' | 'grid'
}

export function LifeLogMetricGroup({
  entries,
  layout = 'rows',
}: LifeLogMetricGroupProps) {
  return (
    <Card className="overflow-hidden">
      <div className={cn(layout === 'grid' && 'grid grid-cols-2')}>
        {entries.map((entry, index) => {
          const Icon = metricIcons[entry.type as Exclude<LifeLogMetricType, 'diet'>]
          const isRightColumn = layout === 'grid' && index % 2 === 1
          const hasPreviousRow = layout === 'grid' && index >= 2

          return (
            <div
              key={entry.id}
              className={cn(
                layout === 'rows'
                  ? 'flex min-h-[68px] items-center gap-3 px-4 py-3 [&+&]:border-t [&+&]:border-ez-border/70'
                  : 'min-h-[106px] px-4 py-3.5',
                isRightColumn && 'border-l border-ez-border/70',
                hasPreviousRow && 'border-t border-ez-border/70',
              )}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-ez-primary-soft text-ez-primary">
                <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              </span>

              <div className={cn('min-w-0', layout === 'grid' ? 'mt-2' : 'flex-1')}>
                <div className={cn(layout === 'rows' && 'flex items-baseline justify-between gap-3')}>
                  <p className="text-[12px] font-medium text-ez-muted">{entry.label}</p>
                  <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.02em] text-ez-text">
                    {entry.value}{entry.unit && <span className="ml-0.5 text-[12px]">{entry.unit}</span>}
                  </p>
                </div>
                {entry.description && layout === 'rows' && (
                  <p className="mt-0.5 truncate text-[11px] font-normal text-ez-muted">
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
