import { ArrowRight, Check } from 'lucide-react'
import { PrimaryButton } from '../../../components/ui/Button'
import { concernOptions, skinTypeOptions } from '../../../mocks/onboarding'
import type { SkinConcern, SkinType } from '../../../types/onboarding'
import { cn } from '../../../utils/cn'
import { ConcernSelector } from '../components/ConcernSelector'
import { OnboardingStepLayout } from '../components/OnboardingStepLayout'

interface SkinStepProps {
  skinType: SkinType
  selectedConcerns: SkinConcern[]
  limitMessage: string | null
  onSkinTypeChange: (skinType: SkinType) => void
  onConcernToggle: (concern: SkinConcern) => void
  onNext: () => void
}

export function SkinStep({
  skinType,
  selectedConcerns,
  limitMessage,
  onSkinTypeChange,
  onConcernToggle,
  onNext,
}: SkinStepProps) {
  return (
    <OnboardingStepLayout
      eyebrow="오늘 케어를 고르는 기준이에요"
      title="평소 피부를 알려주세요."
      description="잘 모르겠다면 그대로 선택해도 괜찮아요."
      footer={
        <PrimaryButton type="button" fullWidth onClick={onNext} icon={<ArrowRight size={17} aria-hidden="true" />}>
          다음
        </PrimaryButton>
      }
    >
      <fieldset>
        <legend className="text-[13px] font-semibold text-ez-text">피부 타입</legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {skinTypeOptions.map((option) => {
            const selected = skinType === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSkinTypeChange(option.id)}
                className={cn(
                  'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition',
                  selected
                    ? 'border-ez-primary bg-ez-primary-soft text-ez-primary-dark'
                    : 'border-ez-border bg-white text-ez-secondary hover:border-[#cfc4ed]',
                )}
                aria-pressed={selected}
              >
                {selected && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                {option.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="my-5 h-px bg-ez-border/80" />

      <fieldset>
        <legend className="text-[13px] font-semibold text-ez-text">요즘 신경 쓰이는 건?</legend>
        <p className="mt-1 text-[11px] text-ez-muted">없다면 고르지 않아도 돼요 · 최대 3개</p>
        <div className="mt-3">
          <ConcernSelector options={concernOptions} selected={selectedConcerns} onToggle={onConcernToggle} />
        </div>
        <p className="mt-3 min-h-5 text-[12px] font-medium text-ez-primary" role="status">
          {limitMessage ?? (selectedConcerns.length > 0 ? `${selectedConcerns.length}개 골랐어요` : '')}
        </p>
      </fieldset>
    </OnboardingStepLayout>
  )
}
