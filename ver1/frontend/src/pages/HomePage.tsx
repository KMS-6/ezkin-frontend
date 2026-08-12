import { useEffect, useState } from 'react'
import { ChevronRight, MessageCircleQuestion, PackageOpen, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { PageContainer } from '../components/PageContainer'
import { Card } from '../components/ui/Card'
import { HeroCard } from '../components/ui/HeroCard'
import { QuickChoice } from '../components/ui/QuickChoice'
import { useAuth } from '../features/auth/authContextValue'
import { getSavedDietChoice, getTodayBriefing, saveDietChoice } from '../services/briefingService'
import { getTodayRoutineForUser } from '../services/productService'
import type { BriefingData, DietChoice } from '../types/briefing'
import type { RoutinePeriod, TodayShelfRoutine } from '../types/product'
import { cn } from '../utils/cn'

const dietChoices: Array<{ label: string; value: DietChoice }> = [
  { label: '평소처럼', value: 'usual' },
  { label: '조금 자극적', value: 'spicy' },
]

export function HomePage() {
  const { user } = useAuth()
  const [briefing, setBriefing] = useState<BriefingData | null>(null)
  const [todayRoutine, setTodayRoutine] = useState<TodayShelfRoutine | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [period, setPeriod] = useState<RoutinePeriod>('am')
  const [dietChoice, setDietChoice] = useState<DietChoice | null>(() => {
    try {
      return user ? getSavedDietChoice(user.id) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (!user) return
    let isActive = true
    setLoadError(false)

    void Promise.all([
      getTodayBriefing(),
      getTodayRoutineForUser(user.id),
    ]).then(([briefingData, routineData]) => {
      if (!isActive) return
      setBriefing(briefingData)
      setTodayRoutine(routineData)
      if (briefingData.dietChoice) setDietChoice(briefingData.dietChoice)
    }).catch(() => {
      if (isActive) setLoadError(true)
    })

    return () => {
      isActive = false
    }
  }, [user])

  const handleDietChoice = (choice: DietChoice) => {
    if (!user) return
    setDietChoice(choice)
    void saveDietChoice(user.id, choice).catch(() => setDietChoice(null))
  }

  if (!user) return null
  if (loadError) return <HomeLoadError />
  if (!briefing || !todayRoutine) return <HomeSkeleton />

  const routine = todayRoutine[period]
  const isShelfEmpty = todayRoutine.shelfProductCount === 0
  return (
    <>
      <AppHeader
        showLogo
        trailing={
          <div className="flex items-center gap-0.5">
            <Link
              to="/settings"
              className="grid size-10 place-items-center rounded-full text-ez-muted transition hover:bg-ez-primary-soft hover:text-ez-primary"
              aria-label="설정 열기"
              title="설정"
            >
              <Settings size={18} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <Link
              to="/sos"
              className="grid size-10 place-items-center rounded-full text-ez-muted transition hover:bg-ez-primary-soft hover:text-ez-primary"
              aria-label="SOS에게 물어보기"
              title="SOS에게 물어보기"
            >
              <MessageCircleQuestion size={19} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        }
      />

      <PageContainer className="pt-2">
        <HeroCard className="p-5">
          <div
            className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-white/45"
            aria-hidden="true"
          />

          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ez-primary">
              Today
            </p>
            <h1 className="mt-2 text-[22px] font-bold leading-[1.3] tracking-[-0.03em] text-ez-text">
              {briefing.skinHeadline}
            </h1>
            <p className="mt-3 text-[13px] font-normal leading-[1.65] text-ez-secondary">
              {briefing.summary}
            </p>
            <div className="mt-3.5 flex justify-end border-t border-white/80 pt-3">
              <Link
                to="/briefing"
                className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-ez-primary hover:text-ez-primary-dark"
              >
                자세히 보기
                <ChevronRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </HeroCard>

        <section className="mt-5">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ez-text">오늘 루틴</h2>
            {!isShelfEmpty && (
              <div
                className="flex rounded-[10px] bg-[#eeecf2] p-0.5"
                role="group"
                aria-label="오전 또는 오후 루틴 선택"
              >
                {(['am', 'pm'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPeriod(value)}
                    className={cn(
                      'min-w-10 rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase text-ez-muted transition',
                      period === value && 'bg-white text-ez-primary shadow-[0_1px_4px_rgba(35,26,55,0.06)]',
                    )}
                    aria-pressed={period === value}
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isShelfEmpty ? (
            <Card className="flex items-center gap-3.5 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-ez-primary-soft text-ez-primary">
                <PackageOpen size={19} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-ez-text">아직 등록한 제품이 없어요.</p>
                <Link to="/shelf" className="mt-1.5 inline-flex items-center gap-0.5 text-[12px] font-semibold text-ez-primary">
                  제품 추가 <ChevronRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              {routine.length > 0 ? (
                <ol className="px-4 py-3" aria-label={`${period.toUpperCase()} 피부 루틴`}>
                  {routine.map((item, index) => (
                    <li key={item.product.id} className="relative flex min-h-8 items-center gap-3">
                      {index < routine.length - 1 && (
                        <span
                          className="absolute left-[3px] top-5 h-5 w-px bg-[#dcd5ed]"
                          aria-hidden="true"
                        />
                      )}
                      <span className="relative z-10 size-[7px] shrink-0 rounded-full bg-ez-primary" aria-hidden="true" />
                      <span className="text-[14px] font-medium text-ez-text">{item.product.name}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="px-4 py-4 text-[13px] font-medium leading-5 text-ez-muted">
                  오늘은 가진 제품을 더하지 않고 피부를 편안하게 쉬어가도 좋아요.
                </p>
              )}

              {todayRoutine.paused.length > 0 && (
                <div className="border-t border-ez-border/80 bg-[#f7f4ff] px-4 py-2.5">
                  <p className="text-[12px] font-medium text-ez-primary-dark">
                    {todayRoutine.paused.map(({ product }) => product.name).join(' · ')}는 오늘 쉬어요
                  </p>
                </div>
              )}
            </Card>
          )}
        </section>

        <section className="mt-5">
          <Card className={cn(dietChoice ? 'px-4 py-3' : 'p-4')}>
            {!dietChoice && (
              <div className="mb-3">
                <h2 className="text-[14px] font-semibold text-ez-text">오늘 식사는 어땠어요?</h2>
              </div>
            )}
            <QuickChoice
              choices={dietChoices}
              value={dietChoice}
              onChange={handleDietChoice}
              confirmation="반영했어요"
            />
          </Card>
        </section>
      </PageContainer>
    </>
  )
}

function HomeSkeleton() {
  return (
    <>
      <AppHeader showLogo />
      <PageContainer className="animate-pulse pt-2" aria-label="오늘 브리핑 불러오는 중">
        <div className="h-[210px] rounded-[24px] bg-[#eee9f8]" />
        <div className="mt-5 h-[200px] rounded-[20px] bg-[#f0edf5]" />
      </PageContainer>
    </>
  )
}

function HomeLoadError() {
  return (
    <>
      <AppHeader showLogo />
      <PageContainer className="grid place-items-center py-10">
        <Card className="w-full p-6 text-center">
          <h1 className="text-[16px] font-semibold text-ez-text">오늘의 케어를 불러오지 못했어요.</h1>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 min-h-10 rounded-xl bg-ez-primary-soft px-4 text-[13px] font-semibold text-ez-primary"
          >
            다시 시도
          </button>
        </Card>
      </PageContainer>
    </>
  )
}
