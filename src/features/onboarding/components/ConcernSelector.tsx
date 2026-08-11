import { Check } from 'lucide-react'
import type { ConcernOption, SkinConcern } from '../../../types/onboarding'
import { cn } from '../../../utils/cn'

interface ConcernSelectorProps {
  options: ConcernOption[]
  selected: SkinConcern[]
  onToggle: (concern: SkinConcern) => void
}

export function ConcernSelector({ options, selected, onToggle }: ConcernSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2.5" aria-label="피부 고민 선택">
      {options.map((option) => {
        const isSelected = selected.includes(option.id)
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onToggle(option.id)}
            className={cn(
              'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[14px] font-medium transition duration-200',
              isSelected
                ? 'border-ez-primary bg-ez-primary-soft text-ez-primary-dark'
                : 'border-ez-border bg-white text-ez-secondary hover:border-[#cfc4ed]',
            )}
            aria-pressed={isSelected}
          >
            {isSelected && <Check size={14} strokeWidth={2.8} aria-hidden="true" />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
