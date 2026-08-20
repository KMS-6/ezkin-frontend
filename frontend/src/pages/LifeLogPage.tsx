import { useCallback, useEffect, useState } from 'react'
import { Check, Droplets, RefreshCw, Utensils } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { PageContainer } from '../components/PageContainer'
import { PrimaryButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeader } from '../components/ui/SectionHeader'
import { useAuth } from '../features/auth/authContextValue'
import { ConnectionEmptyState } from '../features/lifelog/components/ConnectionEmptyState'
import { LifeLogMetricGroup } from '../features/lifelog/components/LifeLogMetricGroup'
import { getTodayLifeLog } from '../services/lifeLogService'
import type { TodayLifeLog } from '../types/lifeLog'
import { QUICK_INPUT_SYNCED_EVENT } from '../types/androidNotification'

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

  useEffect(() => {
    const handleQuickInputSync = () => void loadLifeLog()
    window.addEventListener(QUICK_INPUT_SYNCED_EVENT, handleQuickInputSync)
    return () => window.removeEventListener(QUICK_INPUT_SYNCED_EVENT, handleQuickInputSync)
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
  return (
    <>
      <p className="mb-1 text-[11px] font-medium text-ez-muted">{lifeLog.dateLabel}</p>

      <section className="mt-5">
        <SectionHeader
          title="Health"
          action={lifeLog.connections.lifeDataConnected ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ez-success">
              워치 연결됨 <Check size={12} strokeWidth={2.5} aria-hidden="true" />
            </span>
          ) : undefined}
        />
        {lifeLog.connections.lifeDataConnected ? (
          lifeLog.lifestyleEntries.length > 0 ? (
            <>
              <LifeLogMetricGroup entries={lifeLog.lifestyleEntries} tone="health" />
              {lifeLog.healthBaselineStatus === 'building' && (
                <p className="mt-2 text-[11px] text-ez-muted">개인 평균을 만드는 중이에요.</p>
              )}
            </>
          ) : (
            <Card className="px-4 py-4">
              <p className="text-[12px] text-ez-muted">아직 가져온 건강 데이터가 없어요.</p>
            </Card>
          )
        ) : (
          <ConnectionEmptyState kind="health" />
        )}
      </section>

      <section className="mt-7">
        <SectionHeader title="Environment" />
        {lifeLog.connections.weatherConnected && lifeLog.environmentEntries.length > 0 ? (
          <LifeLogMetricGroup entries={lifeLog.environmentEntries} layout="columns" tone="environment" />
        ) : (
          <ConnectionEmptyState kind="environment" connected={lifeLog.connections.weatherConnected} />
        )}
      </section>

      <section className="mt-7">
        <h2 className="text-[16px] font-bold text-ez-text">오늘 기록</h2>
        {lifeLog.manualEntries.length > 0 ? (
          <div className="mt-2.5 overflow-hidden rounded-[16px] border border-ez-border bg-white">
            {lifeLog.manualEntries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3 [&+&]:border-t [&+&]:border-ez-border/70">
                <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-ez-primary-soft text-ez-primary">
                  {entry.type === 'water'
                    ? <Droplets size={16} strokeWidth={1.8} aria-hidden="true" />
                    : <Utensils size={16} strokeWidth={1.8} aria-hidden="true" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-ez-muted">{entry.label}</p>
                  <p className="mt-0.5 text-[14px] font-semibold text-ez-text">{entry.value}</p>
                </div>
                <p className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-ez-success">
                  <Check size={12} strokeWidth={2.5} aria-hidden="true" /> 반영했어요
                </p>
              </div>
            ))}
          </div>
        ) : (
          <Card className="mt-2.5 px-4 py-4"><p className="text-[12px] text-ez-muted">오늘 알려준 내용은 아직 없어요.</p></Card>
        )}
      </section>
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
      <h1 className="mt-4 text-[16px] font-semibold text-ez-text">라이프로그를 불러오지 못했어요.</h1>
      <PrimaryButton type="button" className="mt-5 min-h-10" onClick={onRetry}>
        다시 시도
      </PrimaryButton>
    </Card>
  )
}
