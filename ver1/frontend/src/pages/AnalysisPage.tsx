import { useCallback, useEffect, useState } from 'react'
import { ChartNoAxesCombined, Clock3, RefreshCw, Sparkles } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { PageContainer } from '../components/PageContainer'
import { PrimaryButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Disclaimer } from '../components/ui/Disclaimer'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeader } from '../components/ui/SectionHeader'
import { useAuth } from '../features/auth/authContextValue'
import { AnalysisTimeline } from '../features/analysis/components/AnalysisTimeline'
import { FaceMap } from '../features/analysis/components/FaceMap'
import { PatternList } from '../features/analysis/components/PatternList'
import { getAnalysisEligibility, getTriggerAnalysis } from '../services/analysisService'
import { getTodayProductRecommendations } from '../services/productService'
import type { AnalysisEligibility, TriggerAnalysis } from '../types/analysis'
import type { ProductWithRecommendation } from '../types/product'

interface AnalysisPageData {
  eligibility: AnalysisEligibility
  analysis: TriggerAnalysis | null
  products: ProductWithRecommendation[]
}

export function AnalysisPage() {
  const { user } = useAuth()
  const [data, setData] = useState<AnalysisPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadAnalysis = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setHasError(false)

    try {
      const eligibility = await getAnalysisEligibility(user.id)

      if (!eligibility.eligible) {
        setData({ eligibility, analysis: null, products: [] })
        return
      }

      const [analysis, products] = await Promise.all([
        getTriggerAnalysis(user.id),
        getTodayProductRecommendations(user.id),
      ])
      setData({ eligibility, analysis, products })
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    void loadAnalysis()
  }, [loadAnalysis])

  if (!user) return null

  return (
    <>
      <AppHeader
        title="내 피부 패턴"
        subtitle="피부 변화와 함께 나타난 생활 패턴을 모아봤어요."
      />
      <PageContainer className="pt-3">
        {isLoading ? (
          <AnalysisSkeleton />
        ) : hasError || !data ? (
          <AnalysisError onRetry={() => void loadAnalysis()} />
        ) : data.eligibility.eligible && data.analysis ? (
          <AnalysisReport analysis={data.analysis} products={data.products} />
        ) : (
          <AnalysisWaiting eligibility={data.eligibility} />
        )}
      </PageContainer>
    </>
  )
}

function AnalysisReport({
  analysis,
  products,
}: {
  analysis: TriggerAnalysis
  products: ProductWithRecommendation[]
}) {
  const careSuggestion = createCareSuggestion(products, analysis.suggestion)

  return (
    <>
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-ez-muted">
        <Clock3 size={13} strokeWidth={1.8} aria-hidden="true" />
        {analysis.period} · {analysis.dataDays}일 데이터 기준
      </p>

      <section className="mt-5">
        <SectionHeader title="최근 피부 변화" />
        <FaceMap events={analysis.troubleEvents} />
      </section>

      <section className="mt-7">
        <SectionHeader
          title="이런 패턴이 자주 함께 있었어요"
          description="점수는 함께 관찰된 정도예요."
        />
        <PatternList patterns={analysis.patterns} />
      </section>

      <section className="mt-7">
        <SectionHeader
          title="최근 피부 변화 전 72시간"
          description="최근 목요일 전후에 함께 있었던 조건이에요."
        />
        <AnalysisTimeline items={analysis.timeline} />
      </section>

      <section className="mt-7 rounded-[18px] bg-ez-primary-soft px-4 py-4">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ez-primary">
          <Sparkles size={14} aria-hidden="true" /> 최근 흐름 요약
        </p>
        <p className="mt-1.5 text-[14px] font-medium leading-6 text-ez-primary-dark">
          {analysis.summary}
        </p>
      </section>

      <section className="mt-7">
        <SectionHeader title="다음번엔 이렇게" />
        <Card className="p-4">
          <p className="text-[13px] font-normal leading-6 text-ez-secondary">{careSuggestion}</p>
          <p className="mt-2.5 border-t border-ez-border/70 pt-2.5 text-[11px] font-medium text-ez-primary">
            새 제품보다 이미 가진 제품을 먼저 활용했어요.
          </p>
        </Card>
      </section>

      <div className="mt-5">
        <Disclaimer>
          EZkin은 생활 데이터와 피부 변화 사이에서 함께 관찰된 패턴을 보여줍니다. 이 결과는 의학적 인과관계나 진단을 의미하지 않습니다.
        </Disclaimer>
      </div>
    </>
  )
}

function AnalysisWaiting({ eligibility }: { eligibility: AnalysisEligibility }) {
  return (
    <>
      <p className="mb-4 flex items-center gap-1.5 text-[11px] font-medium text-ez-muted">
        <Clock3 size={13} strokeWidth={1.8} aria-hidden="true" />
        최근 기록 기준 · {eligibility.dataDays}일의 흐름을 살펴보는 중
      </p>
      <EmptyState
        icon={<ChartNoAxesCombined size={22} aria-hidden="true" />}
        title="아직 조금 더 지켜보는 중이에요."
        description={'EZkin이 내 피부 패턴을 찾으려면\n약 2주의 데이터가 필요해요.\n\n따로 기록할 건 없어요.\n평소처럼 지내면 됩니다.'}
      />
    </>
  )
}

function createCareSuggestion(
  products: ProductWithRecommendation[],
  fallback: string,
): string {
  const supportiveProduct = products.find(({ product, recommendation }) => (
    recommendation.status === 'recommended'
    && product.category !== 'sunscreen'
    && (
      product.category === 'cream'
      || product.ingredients.some((ingredient) => (
        ingredient.includes('세라마이드')
        || ingredient.includes('판테놀')
        || ingredient.includes('히알루론산')
      ))
    )
  ))
  const pausedProduct = products.find(({ recommendation }) => recommendation.status === 'pause')

  if (supportiveProduct && pausedProduct) {
    return `야근한 다음 날에는 ${pausedProduct.product.name}은 하루 쉬고, ${supportiveProduct.product.name}을 중심으로 루틴을 단순하게 가져가도 좋아요.`
  }

  if (supportiveProduct) {
    return `야근한 다음 날에는 가지고 있는 ${supportiveProduct.product.name}을 중심으로 보습·진정 루틴을 단순하게 가져가도 좋아요.`
  }

  if (pausedProduct) {
    return `피부가 평소보다 예민하게 느껴지는 날에는 ${pausedProduct.product.name}을 하루 쉬고, 편안한 보습 단계만 남겨도 좋아요.`
  }

  return fallback
}

function AnalysisSkeleton() {
  return (
    <div className="animate-pulse" aria-label="피부 패턴 불러오는 중">
      <div className="h-4 w-36 rounded bg-[#e8e4ef]" />
      <div className="mt-5 h-52 rounded-[20px] bg-[#efecf4]" />
      <div className="mt-7 h-[420px] rounded-[20px] bg-[#efecf4]" />
      <div className="mt-7 h-72 rounded-[20px] bg-[#efecf4]" />
    </div>
  )
}

function AnalysisError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="px-6 py-8 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-[15px] bg-ez-primary-soft text-ez-primary">
        <RefreshCw size={20} aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-[16px] font-semibold text-ez-text">피부 패턴을 불러오지 못했어요.</h1>
      <p className="mt-2 text-[12px] text-ez-muted">저장된 데이터는 그대로 있으니 한 번만 다시 시도해주세요.</p>
      <PrimaryButton type="button" className="mt-5 min-h-10" onClick={onRetry}>
        다시 시도
      </PrimaryButton>
    </Card>
  )
}
