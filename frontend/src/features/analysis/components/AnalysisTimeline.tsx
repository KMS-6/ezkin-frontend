import { Card } from '../../../components/ui/Card'
import type { TriggerTimelineItem } from '../../../types/analysis'
import { cn } from '../../../utils/cn'

export function AnalysisTimeline({ items }: { items: TriggerTimelineItem[] }) {
  return (
    <Card className="px-4 py-2">
      <ol aria-label="최근 피부 변화 전 72시간의 관찰 기록">
        {items.map((item, index) => (
          <li key={item.id} className="relative flex gap-3 py-3.5">
            {index < items.length - 1 && (
              <span className="absolute left-[42px] top-8 h-[calc(100%-16px)] w-px bg-[#dcd5ed]" aria-hidden="true" />
            )}
            <span className="w-8 shrink-0 pt-0.5 text-right text-[10px] font-semibold text-ez-muted">
              {item.offsetLabel}
            </span>
            <span
              className={cn(
                'relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full border-2 border-white bg-[#c5b8e8] ring-1 ring-[#cfc4eb]',
                item.kind === 'observation' && 'bg-ez-primary ring-ez-primary/30',
              )}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-ez-muted">{item.dateLabel}</p>
              <div className="mt-0.5 flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-medium text-ez-text">{item.label}</p>
                <p className="text-[13px] font-semibold text-ez-primary-dark">{item.value}</p>
              </div>
              <p className="mt-0.5 text-[11px] font-normal text-ez-muted">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}
