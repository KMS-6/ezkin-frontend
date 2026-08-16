import { useEffect, useState } from 'react'
import { ChevronRight, MessageCircleQuestion, PackageOpen, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { PageContainer } from '../components/PageContainer'
import { Card } from '../components/ui/Card'
import { HeroCard } from '../components/ui/HeroCard'
import { QuickChoice } from '../components/ui/QuickChoice'
import { useAuth } from '../features/auth/authContextValue'
import { applyCareContextToBriefing, getTodayBriefing } from '../services/briefingService'
import { getTodayRoutineForUser } from '../services/productService'
import { getLatestSkinScanResult } from '../services/skinScanService'
import {
  getTodayQuickInput,
  saveDietChoice,
  saveWaterChoice,
} from '../services/quickInputService'
import type { BriefingData } from '../types/briefing'
import type { RoutinePeriod, TodayShelfRoutine } from '../types/product'
import { cn } from '../utils/cn'
import type { DietChoice, WaterChoice } from '../types/androidNotification'
import type { SkinScanResult } from '../types/skinScan'
import { QUICK_INPUT_SYNCED_EVENT } from '../types/androidNotification'
import { DIET_CHOICE_OPTIONS } from '../utils/dietChoice'

const waterChoices: Array<{ label: string; value: WaterChoice }> = [
  { label: '3잔 미만', value: 'under_3' },
  { label: '3~5잔', value: '3_to_5' },
  { label: '5잔 이상', value: 'over_5' },
]

export function HomePage() {
  const { user } = useAuth()
  const [briefing, setBriefing] = useState<BriefingData | null>(null)
  const [todayRoutine, setTodayRoutine] = useState<TodayShelfRoutine | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [period, setPeriod] = useState<RoutinePeriod>('am')
  const [waterChoice, setWaterChoice] = useState<WaterChoice | null>(null)
  const [dietChoice, setDietChoice] = useState<DietChoice | null>(null)
  const [latestScan, setLatestScan] = useState<SkinScanResult | null>(null)

  useEffect(() => {
    if (!user) return
    let isActive = true
    setLoadError(false)

    try {
      const quickInput = getTodayQuickInput(user.id)
      setWaterChoice(quickInput?.waterChoice ?? null)
      setDietChoice(quickInput?.dietChoice ?? null)
      setLatestScan(getLatestSkinScanResult(user.id))
    } catch {
      setWaterChoice(null)
      setDietChoice(null)
    }

    void Promise.all([
      getTodayBriefing(user.id),
      getTodayRoutineForUser(user.id),
    ]).then(([briefingData, routineData]) => {
      if (!isActive) return
      setBriefing(briefingData)
      setTodayRoutine(routineData)
      void applyCareContextToBriefing(briefingData).then((careContextBriefing) => {
        if (isActive) setBriefing(careContextBriefing)
      })
    }).catch(() => {
      if (isActive) setLoadError(true)
    })

    return () => {
      isActive = false
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    const handleQuickInputSync = () => {
      const quickInput = getTodayQuickInput(user.id)
      setWaterChoice(quickInput?.waterChoice ?? null)
      setDietChoice(quickInput?.dietChoice ?? null)
    }
    window.addEventListener(QUICK_INPUT_SYNCED_EVENT, handleQuickInputSync)
    return () => window.removeEventListener(QUICK_INPUT_SYNCED_EVENT, handleQuickInputSync)
  }, [user])

  const handleWaterChoice = (choice: WaterChoice) => {
    if (!user) return
    const previous = waterChoice
    setWaterChoice(choice)
    void saveWaterChoice(user.id, choice).catch(() => setWaterChoice(previous))
  }

  const handleDietChoice = (choice: DietChoice) => {
    if (!user) return
    const previous = dietChoice
    setDietChoice(choice)
    void saveDietChoice(user.id, choice).catch(() => setDietChoice(previous))
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
              className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[#f6b8d6] bg-[#fff1f7] px-2.5 text-[#d72f82] shadow-[0_2px_8px_rgba(236,72,153,0.08)] transition hover:bg-[#ffe5f1]"
              aria-label="SOS에게 물어보기"
              title="SOS에게 물어보기"
            >
              <MessageCircleQuestion size={19} strokeWidth={2} aria-hidden="true" />
              <span className="text-[11px] font-bold">SOS</span>
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
            <CompactSignalSummary briefing={briefing} latestScan={latestScan} />
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
          <Card className="overflow-hidden">
            <div className="px-4 py-3.5">
              <QuickChoice
                question="오늘 물은 얼마나 마셨어요?"
                compactLabel="오늘 물"
                choices={waterChoices}
                value={waterChoice}
                onChange={handleWaterChoice}
              />
            </div>
            <div className="border-t border-ez-border/80 px-4 py-3.5">
              <QuickChoice
                question="오늘 식단은 어땠어요?"
                compactLabel="오늘 식단"
                choices={DIET_CHOICE_OPTIONS}
                value={dietChoice}
                onChange={handleDietChoice}
              />
            </div>
          </Card>
        </section>
      </PageContainer>
    </>
  )
}

function CompactSignalSummary({ briefing, latestScan }: { briefing: BriefingData; latestScan: SkinScanResult | null }) {
  const factors = briefing.contributingFactors ?? briefing.metrics
  const health = factors.filter((metric) => metric.source === 'health')
  const environment = factors.filter((metric) => metric.source === 'environment')
  const signals = [
    ...(health.length > 0 ? [{ label: 'Health', value: health.map((metric) => `${metric.label} ${metric.value}`).join(' · ') }] : []),
    ...(environment.length > 0 ? [{ label: '환경', value: environment.map((metric) => `${metric.label} ${metric.value}`).join(' · ') }] : []),
    ...(latestScan ? [{ label: 'Skin', value: `최근 ${latestScan.observedAreas[0] ?? '피부'} 변화` }] : []),
  ]

  if (signals.length === 0) return null

  return (
    <div className="mt-4 border-t border-white/80 pt-3">
      <p className="text-[10px] font-semibold text-ez-primary">오늘 피부에 반영된 신호</p>
      <div className="mt-2 space-y-1.5">
        {signals.map((signal) => (
          <div key={signal.label} className="flex items-start gap-2 text-[10px] leading-4">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#34d399]" aria-hidden="true" />
            <strong className="w-11 shrink-0 font-semibold text-ez-text">{signal.label}</strong>
            <span className="text-ez-secondary">{signal.value}</span>
          </div>
        ))}
      </div>
    </div>
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
