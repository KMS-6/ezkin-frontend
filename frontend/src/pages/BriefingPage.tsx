import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { StickyDetailHeader } from '../components/StickyDetailHeader'
import { PrimaryButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Disclaimer } from '../components/ui/Disclaimer'
import { HeroCard } from '../components/ui/HeroCard'
import { BriefingFactors } from '../features/briefing/components/BriefingFactors'
import { BriefingPause, BriefingRoutine } from '../features/briefing/components/BriefingRoutine'
import { useAuth } from '../features/auth/authContextValue'
import { applyCareContextToBriefing, getTodayBriefing } from '../services/briefingService'
import { getTodayRoutineForUser } from '../services/productService'
import type { BriefingData } from '../types/briefing'
import type { RoutinePeriod, TodayShelfRoutine } from '../types/product'
import { getCurrentRoutinePeriod } from '../utils/appDateTime'
import { isBriefingAvailableForUser } from '../services/userFeatureAvailability'

export function BriefingPage() {
  const { user } = useAuth()
  const isBriefingAvailable = isBriefingAvailableForUser(user?.id)
  const [briefing, setBriefing] = useState<BriefingData | null>(null)
  const [routine, setRoutine] = useState<TodayShelfRoutine | null>(null)
  const [period, setPeriod] = useState<RoutinePeriod>('am')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadBriefing = useCallback(async () => {
    if (!user || !isBriefingAvailable) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setHasError(false)
    setPeriod(getCurrentRoutinePeriod(user.id))

    try {
      const [briefingData, routineData] = await Promise.all([
        getTodayBriefing(user.id),
        getTodayRoutineForUser(user.id),
      ])
      setBriefing(briefingData)
      setRoutine(routineData)
      void applyCareContextToBriefing(briefingData, { userId: user.id }).then(setBriefing)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [isBriefingAvailable, user])

  useEffect(() => {
    void loadBriefing()
  }, [loadBriefing])

  if (!user) return null
  if (!isBriefingAvailable) {
    return (
      <>
        <StickyDetailHeader title="오늘의 브리핑" backTo="/home" />
        <PageContainer className="pt-3">
          <Card className="px-6 py-9 text-center">
            <h1 className="text-[17px] font-semibold text-ez-text">오늘 케어 안내를 준비 중이에요.</h1>
            <p className="mt-2 text-[13px] leading-6 text-ez-muted">
              날씨와 내 화장대 정보는 다른 화면에서 계속 확인할 수 있어요.
            </p>
          </Card>
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <StickyDetailHeader title="오늘의 브리핑" backTo="/home" />
      <PageContainer className="pt-3">
        {isLoading ? (
          <BriefingSkeleton />
        ) : hasError || !briefing || !routine ? (
          <BriefingError onRetry={() => void loadBriefing()} />
        ) : (
          <>
            <HeroCard className="p-5">
              <div className="pointer-events-none absolute -right-14 -top-14 size-40 rounded-full bg-white/45" aria-hidden="true" />
              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ez-primary">Today</p>
                <h1 className="mt-2 text-[22px] font-bold leading-[1.3] tracking-[-0.03em] text-ez-text">
                  {briefing.skinHeadline}
                </h1>
                <p className="mt-3 text-[13px] font-normal leading-[1.7] text-ez-secondary">{briefing.summary}</p>
              </div>
            </HeroCard>

            <div className="mt-7">
              <BriefingFactors metrics={briefing.contributingFactors ?? briefing.metrics} />
            </div>

            <div className="mt-7">
              <BriefingRoutine data={routine} period={period} onPeriodChange={setPeriod} />
            </div>

            {routine.paused.length > 0 && (
              <div className="mt-7">
                <BriefingPause data={routine} />
              </div>
            )}

            <div className="mt-4">
              <Disclaimer>EZkin의 안내는 웰니스 가이드이며 의료 진단이나 치료를 대신하지 않습니다.</Disclaimer>
            </div>
          </>
        )}
      </PageContainer>
    </>
  )
}

function BriefingSkeleton() {
  return (
    <div className="animate-pulse" aria-label="오늘의 브리핑 불러오는 중">
      <div className="h-64 rounded-[24px] bg-[#eee9f8]" />
      <div className="mt-7 h-60 rounded-[20px] bg-[#efecf4]" />
      <div className="mt-7 h-52 rounded-[20px] bg-[#efecf4]" />
    </div>
  )
}

function BriefingError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="px-6 py-8 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-[15px] bg-ez-primary-soft text-ez-primary">
        <RefreshCw size={20} aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-[16px] font-semibold text-ez-text">브리핑을 불러오지 못했어요.</h1>
      <PrimaryButton type="button" className="mt-5 min-h-10" onClick={onRetry}>다시 시도</PrimaryButton>
    </Card>
  )
}
