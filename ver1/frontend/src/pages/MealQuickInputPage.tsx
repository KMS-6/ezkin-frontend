import { useState } from 'react'
import { Check, Utensils } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { PageContainer } from '../components/PageContainer'
import { Card } from '../components/ui/Card'
import { useAuth } from '../features/auth/authContextValue'
import { getTodayMealQuickInput, saveMealQuickInput, type MealPeriod } from '../services/quickInputService'
import type { DietChoice } from '../types/briefing'

const choices: Array<{ value: DietChoice; label: string; detail: string }> = [
  { value: 'usual', label: '평소처럼', detail: '오늘도 평소와 비슷했어요' },
  { value: 'spicy', label: '조금 자극적', detail: '맵거나 짜고 기름진 음식이 있었어요' },
]

export function MealQuickInputPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const meal: MealPeriod = searchParams.get('meal') === 'dinner' ? 'dinner' : 'lunch'
  const [selected, setSelected] = useState<DietChoice | null>(() => user ? getTodayMealQuickInput(user.id, meal)?.choice ?? null : null)
  const [error, setError] = useState(false)

  const choose = async (choice: DietChoice) => {
    if (selected || !user) return
    setError(false)
    setSelected(choice)
    try {
      await saveMealQuickInput({ userId: user.id, meal, choice, recordedAt: new Date().toISOString() })
    } catch {
      setSelected(null)
      setError(true)
    }
  }

  return (
    <>
      <AppHeader title="식사 Quick Input" backTo="/home" />
      <PageContainer className="pt-6">
        <section className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-[20px] bg-ez-primary-soft text-ez-primary"><Utensils size={24} /></span>
          {selected ? (
            <>
              <h1 className="mt-5 text-[22px] font-bold text-ez-text">기록했어요</h1>
              <p className="mt-2 text-[13px] text-ez-muted">오늘 피부 분석에 가볍게 반영할게요.</p>
              <span className="mx-auto mt-5 grid size-12 place-items-center rounded-full bg-[#e8f7f1] text-ez-success"><Check size={24} strokeWidth={2.5} /></span>
              <Link to="/home" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-[14px] bg-ez-primary-soft px-6 text-[13px] font-semibold text-ez-primary">끝내기</Link>
            </>
          ) : (
            <>
              <p className="mt-5 text-[12px] font-semibold text-ez-primary">{meal === 'dinner' ? '저녁' : '점심'} 기록</p>
              <h1 className="mt-1 text-[22px] font-bold tracking-[-0.03em] text-ez-text">{meal === 'dinner' ? '저녁은 어땠어요?' : '점심은 어땠어요?'}</h1>
              <p className="mt-2 text-[13px] text-ez-muted">가까운 답 하나만 골라주세요.</p>
              <div className="mt-6 grid gap-3 text-left">
                {choices.map((choice) => (
                  <Card key={choice.value} className="overflow-hidden">
                    <button type="button" onClick={() => void choose(choice.value)} className="flex min-h-[76px] w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-ez-primary-soft/40 active:bg-ez-primary-soft">
                      <span><strong className="block text-[15px] text-ez-text">{choice.label}</strong><span className="mt-1 block text-[11px] text-ez-muted">{choice.detail}</span></span>
                      <span className="size-5 shrink-0 rounded-full border-2 border-[#d8d2e2]" />
                    </button>
                  </Card>
                ))}
              </div>
              {error && <p className="mt-4 text-[12px] font-medium text-ez-danger" role="alert">저장하지 못했어요. 다시 눌러주세요.</p>}
            </>
          )}
        </section>
      </PageContainer>
    </>
  )
}
