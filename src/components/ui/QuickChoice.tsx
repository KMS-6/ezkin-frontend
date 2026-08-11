import { Check } from 'lucide-react'
import { cn } from '../../utils/cn'

interface Choice<T extends string> {
  label: string
  value: T
}

interface QuickChoiceProps<T extends string> {
  choices: Choice<T>[]
  value: T | null
  onChange: (value: T) => void
  confirmation?: string
}

export function QuickChoice<T extends string>({
  choices,
  value,
  onChange,
  confirmation = '확인했어요',
}: QuickChoiceProps<T>) {
  if (value) {
    const selected = choices.find((choice) => choice.value === value)
    return (
      <div className="flex min-h-6 items-center justify-between text-[12px] text-ez-muted" role="status">
        <span>오늘 식단 · <strong className="font-medium text-ez-text">{selected?.label}</strong></span>
        <span className="inline-flex items-center gap-1 font-semibold text-[#287d61]">
          <Check size={14} strokeWidth={2.8} aria-hidden="true" /> {confirmation}
        </span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {choices.map((choice) => (
        <button
          key={choice.value}
          type="button"
          onClick={() => onChange(choice.value)}
          className={cn('min-h-10 rounded-[12px] border border-ez-border bg-white px-3 text-[13px] font-semibold text-ez-secondary transition hover:border-ez-primary hover:bg-ez-primary-soft active:scale-[0.98]')}
        >
          {choice.label}
        </button>
      ))}
    </div>
  )
}
