import { useMemo, useState } from 'react'
import { Check, Droplets, Utensils } from 'lucide-react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { StickyDetailHeader } from '../components/StickyDetailHeader'
import { Card } from '../components/ui/Card'
import { SecondaryButton } from '../components/ui/Button'
import { useAuth } from '../features/auth/authContextValue'
import { saveDietChoice, saveWaterChoice } from '../services/quickInputService'
import type { DietChoice, WaterChoice } from '../types/androidNotification'
import { DIET_CHOICE_OPTIONS } from '../utils/dietChoice'
import { cn } from '../utils/cn'

const WATER_OPTIONS: Array<{ label: string; detail: string; value: WaterChoice }> = [
  { label: '3잔 미만', detail: '오늘 물을 많이 못 마셨어요', value: 'under_3' },
  { label: '3~5잔', detail: '평소와 비슷하게 마셨어요', value: '3_to_5' },
  { label: '5잔 이상', detail: '충분히 챙겨 마셨어요', value: 'over_5' },
]

type QuickInputKind = 'meal' | 'water'

export function QuickInputPage() {
  const { kind } = useParams<{ kind: QuickInputKind }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [savedLabel, setSavedLabel] = useState<string | null>(null)
  const [error, setError] = useState(false)

  const mealLabel = useMemo(() => {
    const meal = searchParams.get('meal')
    if (meal === 'lunch') return '점심'
    if (meal === 'dinner') return '저녁'
    return '식사'
  }, [searchParams])

  if (kind !== 'meal' && kind !== 'water') return <Navigate to="/home" replace />
  if (!user) return null

  const isMeal = kind === 'meal'
  const title = isMeal ? `${mealLabel} 기록` : '물 섭취 기록'
  const question = isMeal ? `${mealLabel}은 어땠어요?` : '오늘 물은 얼마나 마셨어요?'
  const options = isMeal
    ? DIET_CHOICE_OPTIONS.map((option) => ({ ...option, detail: '한 번 탭하면 기록이 끝나요' }))
    : WATER_OPTIONS

  const save = async (value: DietChoice | WaterChoice, label: string) => {
    if (isSaving) return
    setIsSaving(true)
    setError(false)
    try {
      if (isMeal) await saveDietChoice(user.id, value as DietChoice)
      else await saveWaterChoice(user.id, value as WaterChoice)
      setSavedLabel(label)
    } catch {
      setError(true)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <StickyDetailHeader title={title} backTo="/home" />
      <PageContainer className="pt-5">
        <div className="mx-auto max-w-md">
          <div className="grid size-14 place-items-center rounded-[20px] bg-ez-primary-soft text-ez-primary">
            {isMeal ? <Utensils size={25} aria-hidden="true" /> : <Droplets size={26} aria-hidden="true" />}
          </div>
          <p className="mt-5 text-[12px] font-semibold text-ez-primary">Quick Input</p>
          <h1 className="mt-1.5 text-[24px] font-bold tracking-[-0.035em] text-ez-text">{question}</h1>
          <p className="mt-2 text-[13px] leading-6 text-ez-secondary">
            정확하게 계산하지 않아도 괜찮아요. 가장 가까운 항목만 골라주세요.
          </p>

          {savedLabel ? (
            <Card className="mt-6 p-6 text-center" role="status">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#e8f8ef] text-[#23975a]">
                <Check size={24} strokeWidth={2.4} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-[18px] font-bold text-ez-text">{savedLabel}(으)로 기록했어요</h2>
              <p className="mt-2 text-[13px] text-ez-secondary">오늘 기록에 바로 반영됐어요.</p>
              <SecondaryButton fullWidth className="mt-5" onClick={() => navigate('/home', { replace: true })}>
                홈으로 돌아가기
              </SecondaryButton>
            </Card>
          ) : (
            <div className="mt-6 space-y-3" role="group" aria-label={question}>
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={isSaving}
                  onClick={() => void save(option.value, option.label)}
                  className={cn(
                    'flex min-h-[72px] w-full items-center rounded-[18px] border border-ez-border bg-white px-5 text-left shadow-card transition',
                    'hover:border-ez-primary/40 hover:bg-ez-primary-soft/40 active:scale-[0.99] disabled:opacity-60',
                  )}
                >
                  <span className="flex-1">
                    <strong className="block text-[15px] font-semibold text-ez-text">{option.label}</strong>
                    <span className="mt-1 block text-[11px] text-ez-muted">{option.detail}</span>
                  </span>
                  <span className="ml-3 size-5 rounded-full border-2 border-[#d8d1e8]" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-[#fff0f0] px-4 py-3 text-[12px] font-medium text-[#b84343]" role="alert">
              기록하지 못했어요. 항목을 다시 눌러주세요.
            </p>
          )}
        </div>
      </PageContainer>
    </>
  )
}
