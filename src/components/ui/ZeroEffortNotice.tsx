import { Check, Sparkles } from 'lucide-react'

interface ZeroEffortNoticeProps {
  sources: string[]
  count?: number
}

export function ZeroEffortNotice({ sources, count }: ZeroEffortNoticeProps) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/70 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs font-bold text-ez-primary-dark">
        <span className="grid size-6 place-items-center rounded-full bg-ez-primary-soft">
          <Sparkles size={13} aria-hidden="true" />
        </span>
        EZkin이 이미 확인했어요{count ? ` · ${count}건` : ''}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 pl-0.5">
        {sources.map((source) => (
          <span key={source} className="inline-flex items-center gap-1 text-[11px] text-ez-muted">
            <Check size={12} strokeWidth={2.7} className="text-ez-success" aria-hidden="true" />
            {source}
          </span>
        ))}
      </div>
    </div>
  )
}
