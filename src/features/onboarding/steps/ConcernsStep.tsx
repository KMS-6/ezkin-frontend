import { ArrowRight } from 'lucide-react'
import { PrimaryButton } from '../../../components/ui/Button'
import { concernOptions } from '../../../mocks/onboarding'
import type { SkinConcern } from '../../../types/onboarding'
import { ConcernSelector } from '../components/ConcernSelector'
import { OnboardingStepLayout } from '../components/OnboardingStepLayout'

interface ConcernsStepProps {
  selectedConcerns: SkinConcern[]
  limitMessage: string | null
  onToggle: (concern: SkinConcern) => void
  onNext: () => void
}

export function ConcernsStep({
  selectedConcerns,
  limitMessage,
  onToggle,
  onNext,
}: ConcernsStepProps) {
  return (
    <OnboardingStepLayout
      eyebrow="오늘 케어를 고르는 기준이에요"
      title="요즘 가장 신경 쓰이는 건?"
      description="최대 3개만 골라주세요. 피부 타입은 따로 묻지 않을게요."
      footer={
        <PrimaryButton
          type="button"
          fullWidth
          onClick={onNext}
          disabled={selectedConcerns.length === 0}
          icon={<ArrowRight size={17} aria-hidden="true" />}
        >
          다음
        </PrimaryButton>
      }
    >
      <ConcernSelector options={concernOptions} selected={selectedConcerns} onToggle={onToggle} />
      <p className="mt-3 min-h-5 text-[12px] font-medium text-ez-primary" role="status">
        {limitMessage ?? (selectedConcerns.length > 0 ? `${selectedConcerns.length}개 골랐어요` : '')}
      </p>
    </OnboardingStepLayout>
  )
}
