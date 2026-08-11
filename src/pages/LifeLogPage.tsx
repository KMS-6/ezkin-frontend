import { useCallback, useEffect, useState } from 'react'
import { Check, ChevronRight, RefreshCw, Sparkles, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { PageContainer } from '../components/PageContainer'
import { PrimaryButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { HeroCard } from '../components/ui/HeroCard'
import { SectionHeader } from '../components/ui/SectionHeader'
import { useAuth } from '../features/auth/authContextValue'
import { ConnectionEmptyState } from '../features/lifelog/components/ConnectionEmptyState'
import { LifeLogMetricGroup } from '../features/lifelog/components/LifeLogMetricGroup'
import { getTodayLifeLog } from '../services/lifeLogService'
import type { TodayLifeLog } from '../types/lifeLog'

export function LifeLogPage() {
  const { user } = useAuth()
  const [lifeLog, setLifeLog] = useState<TodayLifeLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadLifeLog = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setHasError(false)

    try {
      setLifeLog(await getTodayLifeLog(user.id))
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    void loadLifeLog()
  }, [loadLifeLog])

  if (!user) return null

  return (
    <>
      <AppHeader title="라이프로그" />
      <PageContainer className="pt-1">
        {isLoading ? (
          <LifeLogSkeleton />
        ) : hasError || !lifeLog ? (
          <LifeLogError onRetry={() => void loadLifeLog()} />
        ) : (
          <LifeLogContent lifeLog={lifeLog} />
        )}
      </PageContainer>
    </>
  )
}

function LifeLogContent({ lifeLog }: { lifeLog: TodayLifeLog }) {
  const hasAutomaticData = lifeLog.automaticCount > 0
  const dietEntry = lifeLog.manualEntries.find((entry) => entry.type === 'diet')

  return (
    <>
      <p className="mb-2 text-[11px] font-medium text-ez-muted">{lifeLog.dateLabel}</p>

      <HeroCard className="p-5">
        <div className="pointer-events-none absolute -right-12 -top-16 size-40 rounded-full bg-white/45" aria-hidden="true" />
        <div className="relative">
          <span className="grid size-9 place-items-center rounded-[13px] bg-white/70 text-ez-primary">
            <Sparkles size={17} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <h1 className="mt-3 text-[20px] font-bold leading-[1.35] tracking-[-0.03em] text-ez-text">
            {hasAutomaticData ? '오늘도 알아서 기록 중이에요.' : '아직 연결된 데이터가 많지 않아요.'}
          </h1>
          <p className="mt-1.5 text-[13px] font-normal leading-5 text-ez-secondary">
            {hasAutomaticData
              ? `${lifeLog.automaticCount}개 데이터 자동 수집`
              : '괜찮아요. 지금 상태로도 EZkin을 사용할 수 있어요.'}
          </p>
        </div>
      </HeroCard>

      <section className="mt-7">
        <SectionHeader title="EZkin이 확인한 오늘" />
        {lifeLog.connections.lifeDataConnected ? (
          <LifeLogMetricGroup
            entries={lifeLog.lifestyleEntries}
            sourceLabel="생활 데이터"
          />
        ) : (
          <ConnectionEmptyState kind="생활 데이터" />
        )}
      </section>

      <section className="mt-7">
        <SectionHeader title="오늘 환경" />
        {lifeLog.connections.weatherConnected ? (
          <LifeLogMetricGroup
            entries={lifeLog.environmentEntries}
            sourceLabel="현재 위치"
            layout="grid"
          />
        ) : (
          <ConnectionEmptyState kind="날씨" />
        )}
      </section>

      <section className="mt-7">
        <h2 className="text-[15px] font-semibold text-ez-text">오늘 한 번 알려준 것</h2>
        {dietEntry ? (
          <div className="mt-2.5 flex items-center gap-3 rounded-[16px] border border-ez-border bg-white px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-ez-primary-soft text-ez-primary">
              <Utensils size={16} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-ez-muted">{dietEntry.label} · 직접 알려줌</p>
              <p className="mt-0.5 text-[14px] font-semibold text-ez-text">{dietEntry.value}</p>
            </div>
            <p className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-ez-success">
              <Check size={12} strokeWidth={2.5} aria-hidden="true" /> 반영했어요
            </p>
          </div>
        ) : (
          <p className="mt-2 text-[12px] font-normal text-ez-muted">
            오늘은 따로 알려준 내용이 없어요.
          </p>
        )}
      </section>

      <Link
        to="/briefing"
        className="mt-6 flex items-center justify-between border-t border-ez-border px-1 py-4 text-[12px] font-medium text-ez-muted transition hover:text-ez-primary"
      >
        이 데이터가 오늘 케어에 어떻게 반영됐는지 보기
        <ChevronRight size={15} aria-hidden="true" />
      </Link>
    </>
  )
}

function LifeLogSkeleton() {
  return (
    <div className="animate-pulse" aria-label="오늘의 라이프로그 불러오는 중">
      <div className="h-4 w-28 rounded bg-[#e8e4ef]" />
      <div className="mt-3 h-48 rounded-[24px] bg-[#eee9f8]" />
      <div className="mt-7 h-60 rounded-[20px] bg-[#efecf4]" />
      <div className="mt-7 h-64 rounded-[20px] bg-[#efecf4]" />
    </div>
  )
}

function LifeLogError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="mt-3 px-6 py-8 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-[15px] bg-ez-primary-soft text-ez-primary">
        <RefreshCw size={20} aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-[16px] font-semibold text-ez-text">
        오늘의 라이프로그를 불러오지 못했어요.
      </h1>
      <p className="mt-2 text-[12px] text-ez-muted">저장된 내용은 그대로 있으니 한 번만 다시 시도해주세요.</p>
      <PrimaryButton type="button" className="mt-5 min-h-10" onClick={onRetry}>
        다시 시도
      </PrimaryButton>
    </Card>
  )
}
