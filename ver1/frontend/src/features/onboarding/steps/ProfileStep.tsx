import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { PrimaryButton } from '../../../components/ui/Button'
import { genderOptions, healthConcernOptions } from '../../../mocks/onboarding'
import type { BasicProfile, Gender, HealthConcern } from '../../../types/onboarding'
import { cn } from '../../../utils/cn'
import { OnboardingStepLayout } from '../components/OnboardingStepLayout'

interface ProfileStepProps extends BasicProfile {
  onChange: (update: Partial<BasicProfile>) => void
  onNext: () => void
}

const minimumBirthYear = 1900
const maximumBirthYear = new Date().getFullYear()

export function ProfileStep({
  nickname,
  birthYear,
  gender,
  healthConcerns,
  onChange,
  onNext,
}: ProfileStepProps) {
  const [birthYearInput, setBirthYearInput] = useState(birthYear?.toString() ?? '')
  const [limitMessage, setLimitMessage] = useState<string | null>(null)
  const parsedBirthYear = Number(birthYearInput)
  const hasBirthYearError = birthYearInput.length > 0
    && (birthYearInput.length !== 4 || parsedBirthYear < minimumBirthYear || parsedBirthYear > maximumBirthYear)

  const handleBirthYearChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4)
    setBirthYearInput(numericValue)

    if (!numericValue) onChange({ birthYear: undefined })
    else {
      const nextYear = Number(numericValue)
      if (numericValue.length === 4 && nextYear >= minimumBirthYear && nextYear <= maximumBirthYear) {
        onChange({ birthYear: nextYear })
      }
    }
  }

  const handleGenderSelect = (value: Gender) => {
    onChange({ gender: gender === value ? null : value })
  }

  const handleHealthToggle = (value: HealthConcern) => {
    if (value === 'none') {
      setLimitMessage(null)
      onChange({ healthConcerns: healthConcerns.includes('none') ? [] : ['none'] })
      return
    }

    const withoutNone = healthConcerns.filter((item) => item !== 'none')
    if (withoutNone.includes(value)) {
      setLimitMessage(null)
      onChange({ healthConcerns: withoutNone.filter((item) => item !== value) })
      return
    }

    if (withoutNone.length >= 3) {
      setLimitMessage('3개까지만 선택할 수 있어요.')
      return
    }

    setLimitMessage(null)
    onChange({ healthConcerns: [...withoutNone, value] })
  }

  return (
    <OnboardingStepLayout
      eyebrow="모두 선택사항이에요"
      title="조금만 알려주세요."
      description="처음 한 번만 알려주시면 더 나답게 살펴볼게요."
      footer={
        <PrimaryButton type="button" fullWidth onClick={onNext} disabled={hasBirthYearError} icon={<ArrowRight size={17} aria-hidden="true" />}>
          다음
        </PrimaryButton>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-[1fr_112px] gap-3">
          <label className="block">
            <span className="text-[12px] font-semibold text-ez-text">뭐라고 불러드릴까요?</span>
            <input
              type="text"
              value={nickname ?? ''}
              maxLength={16}
              placeholder="닉네임"
              onChange={(event) => onChange({ nickname: event.target.value || undefined })}
              className="mt-2 h-12 w-full rounded-[14px] border border-ez-border bg-white px-3.5 text-[14px] text-ez-text outline-none transition placeholder:text-[#aaa4b1] focus:border-ez-primary"
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-semibold text-ez-text">출생연도</span>
            <input
              type="text"
              inputMode="numeric"
              value={birthYearInput}
              placeholder="2002"
              aria-invalid={hasBirthYearError}
              onChange={(event) => handleBirthYearChange(event.target.value)}
              className="mt-2 h-12 w-full rounded-[14px] border border-ez-border bg-white px-3.5 text-[14px] text-ez-text outline-none transition placeholder:text-[#aaa4b1] focus:border-ez-primary"
            />
          </label>
        </div>
        {hasBirthYearError && <p className="-mt-3 text-right text-[11px] text-ez-danger" role="alert">연도를 확인해주세요.</p>}

        <fieldset>
          <legend className="text-[12px] font-semibold text-ez-text">성별</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {genderOptions.map((option) => (
              <ChoiceChip
                key={option.id}
                label={option.label}
                selected={gender === option.id}
                onClick={() => handleGenderSelect(option.id)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[12px] font-semibold text-ez-text">평소 함께 살펴볼 점</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {healthConcernOptions.map((option) => (
              <ChoiceChip
                key={option.id}
                label={option.label}
                selected={healthConcerns.includes(option.id)}
                onClick={() => handleHealthToggle(option.id)}
                wide
              />
            ))}
          </div>
          <p className="mt-2 min-h-4 text-[11px] font-medium text-ez-primary" role="status">{limitMessage}</p>
        </fieldset>
      </div>
    </OnboardingStepLayout>
  )
}

function ChoiceChip({
  label,
  selected,
  onClick,
  wide = false,
}: {
  label: string
  selected: boolean
  onClick: () => void
  wide?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[13px] border px-3 text-[12px] font-medium leading-4 transition',
        wide && 'min-h-12 text-left',
        selected
          ? 'border-ez-primary bg-ez-primary-soft text-ez-primary-dark'
          : 'border-ez-border bg-white text-ez-secondary hover:border-[#cfc4ed]',
      )}
      aria-pressed={selected}
    >
      {selected && <Check size={13} strokeWidth={2.7} className="shrink-0" aria-hidden="true" />}
      {label}
    </button>
  )
}
