import { useCallback, useEffect, useState } from 'react'
import { PackageOpen, Plus, RefreshCw } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { PageContainer } from '../components/PageContainer'
import { PrimaryButton } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../features/auth/authContextValue'
import { ProductRegistrationFlow } from '../features/product-registration/components/ProductRegistrationFlow'
import { ProductList } from '../features/shelf/components/ProductList'
import { ShelfSummary } from '../features/shelf/components/ShelfSummary'
import {
  addMyProducts,
  getProductCatalog,
  getTodayProductRecommendations,
} from '../services/productService'
import type { Product, ProductWithRecommendation } from '../types/product'

export function ShelfPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<ProductWithRecommendation[]>([])
  const [catalog, setCatalog] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addFeedback, setAddFeedback] = useState<string | null>(null)

  const loadShelf = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const [recommendations, products] = await Promise.all([
        getTodayProductRecommendations(user.id),
        getProductCatalog(),
      ])
      setItems(recommendations)
      setCatalog(products)
    } catch {
      setError('화장대를 불러오지 못했어요.')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    void loadShelf()
  }, [loadShelf])

  useEffect(() => {
    if (!addFeedback) return
    const timeoutId = window.setTimeout(() => setAddFeedback(null), 2400)
    return () => window.clearTimeout(timeoutId)
  }, [addFeedback])

  if (!user) return null

  const recommended = items.filter(({ recommendation }) => recommendation.status === 'recommended')
  const available = items.filter(({ recommendation }) => recommendation.status === 'available')
  const paused = items.filter(({ recommendation }) => recommendation.status === 'pause')
  const registeredIds = items.map(({ product }) => product.id)

  const handleAddProducts = async (productIds: string[]) => {
    setError(null)
    try {
      await addMyProducts(user.id, productIds)
      const recommendations = await getTodayProductRecommendations(user.id)
      setItems(recommendations)
      setAddFeedback('내 화장대에 추가했어요 ✓')
      return true
    } catch {
      setError('제품을 추가하지 못했어요. 다시 시도해주세요.')
      return false
    }
  }

  return (
    <>
      <AppHeader
        showLogo
        trailing={items.length > 0 ? (
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-ez-primary-soft px-3 text-[12px] font-semibold text-ez-primary"
          >
            <Plus size={14} aria-hidden="true" /> 제품 추가
          </button>
        ) : undefined}
      />

      <PageContainer className="pt-3">
        <header className="mb-4">
          <h1 className="text-[22px] font-bold tracking-[-0.035em] text-ez-text">내 화장대</h1>
        </header>

        {addFeedback && (
          <p className="mb-3 rounded-xl bg-[#eaf8f2] px-3 py-2 text-center text-[12px] font-semibold text-[#287d61]" role="status">
            {addFeedback}
          </p>
        )}

        {isLoading ? (
          <ShelfSkeleton />
        ) : error && items.length === 0 ? (
          <EmptyState
            icon={<RefreshCw size={21} />}
            title="화장대를 불러오지 못했어요"
            description="잠시 후 다시 시도해주세요."
            action={<PrimaryButton type="button" onClick={() => void loadShelf()}>다시 시도</PrimaryButton>}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<PackageOpen size={23} />}
            title="아직 등록한 제품이 없어요"
            description="제품을 추가하면 오늘 쓸 조합을 정리해드려요."
            action={
              <PrimaryButton type="button" onClick={() => setIsPickerOpen(true)} icon={<Plus size={16} aria-hidden="true" />}>
                제품 추가
              </PrimaryButton>
            }
          />
        ) : (
          <div className="space-y-7">
            <ShelfSummary
              totalCount={items.length}
              recommendedCount={recommended.length}
              pauseCount={paused.length}
            />
            {error && <p className="rounded-xl bg-[#fff0f1] px-3 py-2 text-center text-[11px] text-[#b54852]" role="status">{error}</p>}
            <ProductList
              title="오늘 추천"
              items={recommended}
            />
            <ProductList title="사용 가능" items={available} />
            <ProductList
              title="오늘 쉬어가기"
              items={paused}
              soft
            />
          </div>
        )}
      </PageContainer>

      {isPickerOpen && (
        <ProductRegistrationFlow
          products={catalog}
          registeredIds={registeredIds}
          onClose={() => setIsPickerOpen(false)}
          onAdd={handleAddProducts}
        />
      )}
    </>
  )
}

function ShelfSkeleton() {
  return (
    <div className="animate-pulse" aria-label="내 화장대 불러오는 중">
      <div className="h-28 rounded-[20px] bg-[#eeeaf5]" />
      <div className="mt-7 h-5 w-36 rounded-md bg-[#e9e5ef]" />
      <div className="mt-3 space-y-2.5">
        {[1, 2, 3].map((item) => <div key={item} className="h-24 rounded-[18px] bg-[#efecf4]" />)}
      </div>
    </div>
  )
}
