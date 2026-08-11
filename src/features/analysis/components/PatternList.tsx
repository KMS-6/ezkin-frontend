import { Droplets, Moon, Sun, Utensils } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { TriggerCategory, TriggerPattern } from '../../../types/analysis'

const patternIcons: Record<TriggerCategory, LucideIcon> = {
  sleep: Moon,
  humidity: Droplets,
  uv: Sun,
  diet: Utensils,
}

export function PatternList({ patterns }: { patterns: TriggerPattern[] }) {
  return (
    <Card className="overflow-hidden">
      {patterns.map((pattern) => {
        const Icon = patternIcons[pattern.category]

        return (
          <div key={pattern.id} className="px-4 py-4 [&+&]:border-t [&+&]:border-ez-border/70">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-ez-primary-soft text-ez-primary">
                <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-ez-text">{pattern.label}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-ez-primary">{pattern.qualitativeLabel}</p>
                  </div>
                  <p className="shrink-0 text-right text-[11px] font-medium text-ez-muted">
                    패턴 점수 <span className="text-[14px] font-semibold text-ez-text">{pattern.score}</span>
                  </p>
                </div>

                <div
                  className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#eeebf2]"
                  role="img"
                  aria-label={`${pattern.label} 패턴 점수 ${pattern.score}점`}
                >
                  <div className="h-full rounded-full bg-ez-primary/75" style={{ width: `${pattern.score}%` }} />
                </div>
                <p className="mt-2 text-[11px] font-normal leading-4 text-ez-muted">{pattern.description}</p>
              </div>
            </div>
          </div>
        )
      })}
    </Card>
  )
}
