import { useCallback, useEffect, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  RefreshCw,
  ScanFace,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { PageContainer } from '../components/PageContainer'
import { PrimaryButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeader } from '../components/ui/SectionHeader'
import { useAuth } from '../features/auth/authContextValue'
import { getAnalysisEligibility, getAnalysisReport } from '../services/analysisService'
import { getRecentTriggerAnalysisReference } from '../services/skinScanService'
import type { AnalysisEligibility } from '../types/analysis'
import type {
  AnalysisPeriod,
  AnalysisReport,
} from '../types/analysisReport'
import type { RecentTriggerAnalysisReference } from '../types/skinScan'
import { cn } from '../utils/cn'
import { isAnalysisAvailableForUser } from '../services/userFeatureAvailability'
import { isDemoPersonaUser } from '../utils/appDateTime'

interface AnalysisState {
  eligibility: AnalysisEligibility
  report: AnalysisReport | null
  recentTrigger: RecentTriggerAnalysisReference | null
}

export function AnalysisReportPage() {
  const { user } = useAuth()
  const isAnalysisAvailable = isAnalysisAvailableForUser(user?.id)
  const [period, setPeriod] = useState<AnalysisPeriod>(14)
  const [data, setData] = useState<AnalysisState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadReport = useCallback(async () => {
    if (!user || !isAnalysisAvailable) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setHasError(false)

    try {
      const eligibility = await getAnalysisEligibility(user.id)
      const report = eligibility.eligible ? await getAnalysisReport(user.id, period) : null
      const recentTrigger = getRecentTriggerAnalysisReference(user.id)
      setData({ eligibility, report, recentTrigger })
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [isAnalysisAvailable, period, user])

  useEffect(() => {
    void loadReport()
  }, [loadReport])

  if (!user) return null
  if (!isAnalysisAvailable) {
    return (
      <>
        <AppHeader title="분석" />
        <PageContainer className="pt-3">
          <EmptyState
            icon={<CalendarDays size={22} aria-hidden="true" />}
            title="분석 기능을 준비 중이에요."
            description="내 데이터가 연결되면 이곳에서 피부 변화 흐름을 확인할 수 있어요."
          />
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <AppHeader title="분석" />
      <PageContainer className="pt-1">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-[12px] font-medium text-ez-muted">내 피부와 생활의 흐름</p>
          <PeriodToggle value={period} onChange={setPeriod} />
        </div>

        {isLoading ? (
          <ReportSkeleton />
        ) : hasError || !data ? (
          <ReportError onRetry={() => void loadReport()} />
        ) : (
          <>
            {data.report
              ? data.report.status === 'completed'
                ? <ReportContent report={data.report} isDemo={isDemoPersonaUser(user.id)} />
                : <ReportStatusState status={data.report.status} />
              : <WaitingState eligibility={data.eligibility} />}
            <RecentTriggerSection reference={data.recentTrigger} />
          </>
        )}
      </PageContainer>
    </>
  )
}

function RecentTriggerSection({ reference }: { reference: RecentTriggerAnalysisReference | null }) {
  const capturedDate = reference
    ? new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date(reference.capturedAt))
    : null
  return (
    <section className="mt-7">
      <SectionHeader title="최근 트리거 분석" />
      <Card className="p-4">
        {reference ? (
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[#e3fbf6] text-[#178873]">
              <ScanFace size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ez-text">최근 피부 변화 전 72시간</p>
              <p className="mt-0.5 text-[11px] leading-5 text-ez-muted">{capturedDate} · 스캔 직전의 기록</p>
            </div>
            <Link
              to={`/analysis/trigger/${reference.scanId}`}
              state={{ backTo: '/analysis' }}
              className="inline-flex min-h-10 shrink-0 items-center gap-1 text-[12px] font-semibold text-ez-primary"
            >
              다시 보기 <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-[#f2eff7] text-ez-muted">
              <ScanFace size={16} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-ez-text">아직 확인할 트리거 분석이 없어요.</p>
              <p className="mt-1 text-[11px] leading-5 text-ez-muted">피부 변화가 신경 쓰일 때 스캔하면 직전 72시간을 함께 살펴볼 수 있어요.</p>
            </div>
          </div>
        )}
      </Card>
    </section>
  )
}

function PeriodToggle({ value, onChange }: { value: AnalysisPeriod; onChange: (value: AnalysisPeriod) => void }) {
  return (
    <div className="flex rounded-[11px] bg-[#eeecf2] p-0.5" role="group" aria-label="리포트 기간">
      {([14, 30] as const).map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => onChange(period)}
          className={cn(
            'min-h-8 rounded-[9px] px-3 text-[12px] font-semibold text-ez-muted',
            value === period && 'bg-white text-ez-primary shadow-[0_1px_4px_rgba(35,26,55,0.06)]',
          )}
          aria-pressed={value === period}
        >
          {period}일
        </button>
      ))}
    </div>
  )
}

function ReportContent({ report, isDemo }: { report: AnalysisReport; isDemo: boolean }) {
  return (
    <>
      <section className="rounded-[24px] border border-[#ddd3ff] bg-[#f1edff] p-5 shadow-hero">
        {isDemo && <p className="mb-2 inline-flex rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-ez-primary">장기 사용자 Mock 데이터</p>}
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ez-primary">
          <CalendarDays size={14} aria-hidden="true" /> 최근 {report.period}일 리포트
        </p>
        <h1 className="mt-2.5 text-[21px] font-bold leading-[1.4] tracking-[-0.03em] text-ez-text">{report.summary}</h1>
      </section>

      <section className="mt-7">
        <SectionHeader title="함께 본 신호" />
        <EvidenceList items={report.observations} />
      </section>

      <section className="mt-7">
        <SectionHeader title="반복해서 함께 보인 패턴" />
        <EvidenceList items={report.patterns} />
      </section>

      {report.recommendations.length > 0 && <section className="mt-7 rounded-[18px] bg-ez-primary-soft p-4">
        <p className="text-[11px] font-semibold text-ez-primary">다음에는 이렇게</p>
        <p className="mt-1.5 text-[13px] font-medium leading-6 text-ez-primary-dark">{report.recommendations[0].text}</p>
      </section>}

      <section className="mt-5 border-t border-ez-border pt-4">
        <p className="text-[11px] leading-5 text-ez-muted">{report.limitations}</p>
      </section>
    </>
  )
}

function EvidenceList({ items }: { items: AnalysisReport['observations'] }) {
  return (
    <Card className="overflow-hidden px-4">
      {items.map((item, index) => (
        <div key={`${item.text}-${index}`} className="py-4 [&+&]:border-t [&+&]:border-ez-border/80">
          <p className="text-[13px] leading-6 text-ez-secondary">{item.text}</p>
          {item.evidence_ids.length > 0 && (
            <p className="mt-1 text-[10px] text-ez-muted">확인한 기록 {item.evidence_ids.length}건</p>
          )}
          </div>
      ))}
    </Card>
  )
}

function WaitingState({ eligibility }: { eligibility: AnalysisEligibility }) {
  const description = eligibility.eligible
    ? '선택한 기간에 사용할 수 있는 리포트가 아직 없어요.\n새로운 내용을 만들어 보여주지는 않아요.'
    : `현재 ${eligibility.dataDays}일 / 최소 ${eligibility.requiredDays}일\n따로 기록할 건 없어요. 평소처럼 지내면 됩니다.`
  return (
    <EmptyState
      icon={<CalendarDays size={22} aria-hidden="true" />}
      title="리포트를 준비하고 있어요"
      description={description}
    />
  )
}

function ReportStatusState({ status }: { status: AnalysisReport['status'] }) {
  return (
    <EmptyState
      icon={<CalendarDays size={22} aria-hidden="true" />}
      title={status === 'failed' ? '리포트를 만들지 못했어요' : '리포트를 정리하고 있어요'}
      description={status === 'failed' ? '잠시 후 다시 확인해주세요.' : '완료되면 같은 화면에서 확인할 수 있어요.'}
    />
  )
}

function ReportSkeleton() {
  return <div className="animate-pulse" aria-label="리포트 불러오는 중"><div className="h-48 rounded-[24px] bg-[#eee9f8]" /><div className="mt-7 h-40 rounded-[20px] bg-[#efecf4]" /><div className="mt-7 h-72 rounded-[20px] bg-[#efecf4]" /></div>
}

function ReportError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="px-6 py-8 text-center">
      <h1 className="text-[16px] font-semibold text-ez-text">리포트를 불러오지 못했어요.</h1>
      <PrimaryButton type="button" className="mt-5 min-h-10" onClick={onRetry}><RefreshCw size={15} aria-hidden="true" /> 다시 시도</PrimaryButton>
    </Card>
  )
}
