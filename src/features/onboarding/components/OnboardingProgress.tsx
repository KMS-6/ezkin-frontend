import type { OnboardingStep } from '../../../types/onboarding'
import { cn } from '../../../utils/cn'

interface OnboardingProgressProps {
  step: OnboardingStep
}

export function OnboardingProgress({ step }: OnboardingProgressProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5" role="progressbar" aria-label={`온보딩 ${step}단계`} aria-valuemin={1} aria-valuemax={4} aria-valuenow={step}>
      {([1, 2, 3, 4] as const).map((value) => (
        <span
          key={value}
          className={cn(
            'h-1 rounded-full transition-colors duration-200',
            value <= step ? 'bg-ez-primary' : 'bg-[#e5e0eb]',
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
