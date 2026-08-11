import { useState } from 'react'
import { Activity, ArrowRight, Check, CloudSun, LoaderCircle, Sparkles } from 'lucide-react'
import { PrimaryButton } from '../../../components/ui/Button'
import type { ConnectionSettings } from '../../../types/onboarding'
import { ConnectionItem } from '../components/ConnectionItem'
import { OnboardingStepLayout } from '../components/OnboardingStepLayout'

interface ConnectionStepProps extends ConnectionSettings {
  isCompleting: boolean
  onToggleLifeData: () => void
  onToggleWeather: () => void
  onComplete: () => void
}

export function ConnectionStep({
  lifeDataConnected,
  weatherConnected,
  isCompleting,
  onToggleLifeData,
  onToggleWeather,
  onComplete,
}: ConnectionStepProps) {
  const [isReady, setIsReady] = useState(false)

  if (isReady) {
    return (
      <OnboardingStepLayout
        eyebrow="이제 EZkin에게 맡겨주세요"
        title={<>준비됐어요.<br />이제 평소처럼 지내면 돼요.</>}
        footer={
          <PrimaryButton
            type="button"
            fullWidth
            onClick={onComplete}
            disabled={isCompleting}
            icon={isCompleting
              ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
              : <ArrowRight size={17} aria-hidden="true" />}
          >
            {isCompleting ? '오늘의 케어 준비 중' : '오늘의 케어 보기'}
          </PrimaryButton>
        }
      >
        <div className="grid min-h-44 place-items-center rounded-[22px] bg-gradient-to-br from-[#eee8ff] to-white">
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-white text-ez-primary shadow-card">
              <Check size={27} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-medium text-ez-muted">
              <Sparkles size={13} className="text-ez-primary" aria-hidden="true" />
              따로 기록할 건 없어요
            </p>
          </div>
        </div>
      </OnboardingStepLayout>
    )
  }

  return (
    <OnboardingStepLayout
      eyebrow="입력할 일을 줄여드릴게요"
      title="매일 물어보지 않도록 연결할게요."
      footer={
        <div className="space-y-2">
          <p className="text-center text-[11px] font-normal text-ez-muted">
            연결하지 않아도 EZkin을 사용할 수 있어요.
          </p>
          <PrimaryButton type="button" fullWidth onClick={() => setIsReady(true)}>
            준비 마치기
          </PrimaryButton>
          <button type="button" onClick={() => setIsReady(true)} className="min-h-9 w-full text-[12px] font-medium text-ez-muted hover:text-ez-primary">
            지금은 건너뛸게요
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <ConnectionItem
          icon={<Activity size={19} aria-hidden="true" />}
          title="생활 데이터"
          dataLabel="수면 · 활동 · 생활 리듬"
          description="연결하면 직접 기록하지 않아도 돼요."
          connected={lifeDataConnected}
          onToggle={onToggleLifeData}
        />
        <ConnectionItem
          icon={<CloudSun size={19} aria-hidden="true" />}
          title="날씨"
          dataLabel="UV · 습도 · 기온"
          description="오늘 환경에 맞춰 케어를 조정해요."
          connected={weatherConnected}
          onToggle={onToggleWeather}
        />
      </div>
    </OnboardingStepLayout>
  )
}
