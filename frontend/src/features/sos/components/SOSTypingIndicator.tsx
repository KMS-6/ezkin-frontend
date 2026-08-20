import { Sparkles } from 'lucide-react'

export function SOSTypingIndicator() {
  return (
    <div className="flex items-end gap-2" role="status" aria-label="답변을 보고 있어요">
      <span className="mb-1 grid size-7 shrink-0 place-items-center rounded-full bg-ez-primary-soft text-ez-primary" aria-hidden="true">
        <Sparkles size={13} />
      </span>
      <div className="flex min-h-11 items-center gap-1.5 rounded-[16px] rounded-bl-[5px] border border-ez-border bg-white px-4 shadow-card">
        <span className="size-1.5 animate-pulse rounded-full bg-ez-primary/45" />
        <span className="size-1.5 animate-pulse rounded-full bg-ez-primary/65 [animation-delay:150ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-ez-primary/85 [animation-delay:300ms]" />
        <span className="sr-only">답변을 보고 있어요...</span>
      </div>
    </div>
  )
}
