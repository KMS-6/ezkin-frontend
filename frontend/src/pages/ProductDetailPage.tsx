import { useEffect, useState } from 'react'
import { Clock3, FlaskConical, Layers3, Pause, Sparkles } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { StickyDetailHeader } from '../components/StickyDetailHeader'
import { Card } from '../components/ui/Card'
import { Disclaimer } from '../components/ui/Disclaimer'
import { EmptyState } from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useAuth } from '../features/auth/authContextValue'
import { getRecommendedTimeLabel, getStatusPresentation } from '../features/shelf/productPresentation'
import { getProductDetail, getTodayProductRecommendations } from '../services/productService'
import type { ProductWithRecommendation } from '../types/product'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [item, setItem] = useState<ProductWithRecommendation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!id || !user) return
    let isActive = true

    void Promise.all([
      getProductDetail(id),
      getTodayProductRecommendations(user.id),
    ]).then(([product, recommendations]) => {
      if (!isActive || !product) return
      const recommendation = recommendations.find((candidate) => candidate.product.id === product.id)
      if (recommendation) setItem(recommendation)
    }).catch(() => {
      if (isActive) setLoadError(true)
    }).finally(() => {
      if (isActive) setIsLoading(false)
    })

    return () => {
      isActive = false
    }
  }, [id, user])

  if (!user) return null

  return (
    <>
      <StickyDetailHeader title="제품 상세" backTo="/shelf" />
      <PageContainer className="pt-3">
        {isLoading ? (
          <div className="animate-pulse" aria-label="제품 정보 불러오는 중">
            <div className="h-44 rounded-[24px] bg-[#eeeaf5]" />
            <div className="mt-4 h-56 rounded-[20px] bg-[#efecf4]" />
          </div>
        ) : !item ? (
          <EmptyState
            icon={<FlaskConical size={22} />}
            title={loadError ? '제품 정보를 불러오지 못했어요' : '내 화장대에서 찾지 못했어요'}
            description={loadError ? '잠시 후 다시 시도해주세요.' : '화장대에서 등록한 제품을 확인해주세요.'}
          />
        ) : <ProductDetailContent item={item} />}
      </PageContainer>
    </>
  )
}

function ProductDetailContent({ item }: { item: ProductWithRecommendation }) {
  const { product, recommendation } = item
  const status = getStatusPresentation(recommendation.status)
  const isPaused = recommendation.status === 'pause'

  return (
    <div>
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#eee9ff] to-white p-5">
        <div className="absolute -right-10 -top-10 size-36 rounded-full bg-white/55" aria-hidden="true" />
        <div className="relative flex items-center gap-4">
          <div className="relative grid size-20 shrink-0 place-items-end rounded-[22px] bg-white/70 pb-3" aria-hidden="true">
            <span className="relative h-11 w-7 rounded-lg border border-[#cbbded] bg-white shadow-[0_4px_10px_rgba(76,53,130,0.08)]">
              <span className="absolute -top-1.5 left-1/2 h-2 w-4 -translate-x-1/2 rounded-t bg-ez-primary/70" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-ez-muted">{product.brand} · {product.categoryLabel}</p>
            <h1 className="mt-1 text-[21px] font-bold leading-7 tracking-[-0.03em] text-ez-text">{product.name}</h1>
            <StatusBadge tone={status.tone} className="mt-3">{status.detailLabel}</StatusBadge>
          </div>
        </div>
      </section>

      <Card className="mt-4 p-5">
        <div className="flex items-center gap-2 text-ez-primary">
          {isPaused ? <Pause size={17} fill="currentColor" aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
          <h2 className="text-[14px] font-semibold text-ez-text">오늘 사용</h2>
        </div>
        <p className="mt-3 text-[15px] font-semibold leading-6 text-ez-text">{recommendation.summary}</p>
        <p className="mt-2 text-[13px] font-normal leading-6 text-ez-muted">{recommendation.reason}</p>

        <div className="mt-5 grid grid-cols-2 border-t border-ez-border pt-4">
          <div className="pr-3">
            <Clock3 size={15} className="text-ez-primary" aria-hidden="true" />
            <p className="mt-2 text-[10px] text-ez-muted">추천 시간</p>
            <p className="mt-0.5 text-[13px] font-semibold text-ez-text">{getRecommendedTimeLabel(recommendation.recommendedTime)}</p>
          </div>
          <div className="border-l border-ez-border pl-3">
            <Layers3 size={15} className="text-ez-primary" aria-hidden="true" />
            <p className="mt-2 text-[10px] text-ez-muted">사용 위치</p>
            <p className="mt-0.5 text-[13px] font-semibold text-ez-text">
              {recommendation.routineStep ? `루틴 ${recommendation.routineStep}단계` : '오늘은 쉬기'}
            </p>
          </div>
        </div>
      </Card>

      {recommendation.tomorrowNote && (
        <p className="mt-3 rounded-[16px] bg-ez-primary-soft px-4 py-3 text-[12px] font-medium leading-5 text-ez-primary-dark">
          {recommendation.tomorrowNote}
        </p>
      )}

      <Card className="mt-4 p-4">
        <h2 className="text-[14px] font-semibold text-ez-text">주요 성분</h2>
        <p className="mt-2 text-[13px] leading-5 text-ez-muted">{product.ingredients.join(' · ')}</p>
        <div className="my-3 h-px bg-ez-border" />
        <h2 className="text-[14px] font-semibold text-ez-text">평소 사용법</h2>
        <p className="mt-2 text-[13px] leading-5 text-ez-muted">{product.usage}</p>
      </Card>

      <div className="mt-3">
        <Disclaimer>오늘의 안내는 웰니스 가이드이며 의료적 판단이 아니에요.</Disclaimer>
      </div>
    </div>
  )
}
