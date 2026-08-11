import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { PrimaryButton } from '../../../components/ui/Button'
import { OnboardingStepLayout } from '../components/OnboardingStepLayout'

interface WelcomeStepProps {
  onNext: () => void
}

const benefits = [
  '매일 기록할 필요 없이',
  '가지고 있는 제품부터',
  '오늘 필요한 것만',
]

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <OnboardingStepLayout
      eyebrow="처음 한 번만 알려주세요"
      title={<>피부 관리는 챙기고,<br />기록은 EZkin에게 맡겨요.</>}
      description="그다음부터는 EZkin이 먼저 살펴볼게요."
      footer={
        <PrimaryButton
          type="button"
          fullWidth
          onClick={onNext}
          icon={<ArrowRight size={17} aria-hidden="true" />}
        >
          3분 만에 시작하기
        </PrimaryButton>
      }
    >
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#eee8ff] to-[#faf8ff] p-5">
        <Sparkles className="absolute -right-2 -top-2 text-white/80" size={58} aria-hidden="true" />
        <div className="relative space-y-3">
          {benefits.map((benefit) => (
            <p key={benefit} className="flex items-center gap-2.5 text-[13px] font-medium text-ez-secondary">
              <span className="grid size-5 place-items-center rounded-full bg-white text-ez-primary">
                <Check size={12} strokeWidth={2.8} aria-hidden="true" />
              </span>
              {benefit}
            </p>
          ))}
        </div>
      </div>
    </OnboardingStepLayout>
  )
}
