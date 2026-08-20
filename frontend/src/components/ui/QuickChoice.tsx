import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../utils/cn'

interface Choice<T extends string> {
  label: string
  value: T
}

interface QuickChoiceProps<T extends string> {
  question: string
  compactLabel: string
  choices: Choice<T>[]
  value: T | null
  onChange: (value: T) => void
  confirmation?: string
}

export function QuickChoice<T extends string>({
  question,
  compactLabel,
  choices,
  value,
  onChange,
  confirmation = '반영했어요',
}: QuickChoiceProps<T>) {
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setIsEditing(false)
  }, [value])

  if (value && !isEditing) {
    const selected = choices.find((choice) => choice.value === value)
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="flex min-h-8 w-full items-center justify-between gap-3 text-left text-[12px] text-ez-muted"
        aria-label={`${compactLabel} 수정`}
      >
        <span>
          {compactLabel} · <strong className="font-medium text-ez-text">{selected?.label}</strong>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#287d61]">
          <Check size={14} strokeWidth={2.8} aria-hidden="true" /> {confirmation}
        </span>
      </button>
    )
  }

  return (
    <div>
      <h2 className="mb-2.5 text-[13px] font-semibold text-ez-text">{question}</h2>
      <div className="grid grid-cols-3 gap-1.5">
        {choices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            onClick={() => {
              onChange(choice.value)
              setIsEditing(false)
            }}
            className={cn(
              'min-h-10 rounded-[11px] border px-1.5 text-[12px] font-semibold transition active:scale-[0.98]',
              value === choice.value
                ? 'border-ez-primary bg-ez-primary-soft text-ez-primary'
                : 'border-ez-border bg-white text-ez-secondary hover:border-ez-primary hover:bg-ez-primary-soft',
            )}
            aria-pressed={value === choice.value}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  )
}
