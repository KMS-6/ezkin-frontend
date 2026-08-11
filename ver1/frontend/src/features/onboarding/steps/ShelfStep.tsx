import { useState } from 'react'
import { ArrowRight, Camera } from 'lucide-react'
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button'
import { ProductCameraFrame } from '../../shelf/components/ProductCameraFrame'
import { productCatalog } from '../../../mocks/products'
import { ProductSelector } from '../components/ProductSelector'
import { OnboardingStepLayout } from '../components/OnboardingStepLayout'

interface ShelfStepProps {
  selectedProductIds: string[]
  onToggleProduct: (productId: string) => void
  onNext: () => void
}

export function ShelfStep({ selectedProductIds, onToggleProduct, onNext }: ShelfStepProps) {
  const [isRegistering, setIsRegistering] = useState(selectedProductIds.length > 0)

  if (isRegistering) {
    return (
      <OnboardingStepLayout
        eyebrow="인식 후보를 확인해주세요"
        title="이 제품이 맞나요?"
        description="찾은 후보만 한 번 확인하면 돼요."
        footer={
          <div className="space-y-2.5">
            <PrimaryButton
              type="button"
              fullWidth
              onClick={onNext}
              disabled={selectedProductIds.length === 0}
              icon={<ArrowRight size={17} aria-hidden="true" />}
            >
              네, 이 제품들이 맞아요
            </PrimaryButton>
            <button type="button" onClick={onNext} className="min-h-10 w-full text-[12px] font-medium text-ez-muted hover:text-ez-primary">
              나중에 할게요
            </button>
          </div>
        }
      >
        {/* Frontend 2: shared product camera recognition result로 이 후보 목록을 교체합니다. */}
        <ProductSelector
          products={productCatalog}
          selectedIds={selectedProductIds}
          onToggle={onToggleProduct}
        />
      </OnboardingStepLayout>
    )
  }

  return (
    <OnboardingStepLayout
      eyebrow="있는 제품부터"
      title="지금 있는 제품부터 활용할게요."
      description="사진 한 장이면 EZkin이 제품을 찾아볼게요."
      footer={
        <div className="space-y-2.5">
          <PrimaryButton
            type="button"
            fullWidth
            onClick={() => setIsRegistering(true)}
            icon={<Camera size={17} aria-hidden="true" />}
          >
            제품 사진으로 등록하기
          </PrimaryButton>
          <SecondaryButton type="button" fullWidth onClick={onNext}>
            나중에 할게요
          </SecondaryButton>
        </div>
      }
    >
      <ProductCameraFrame compact />
    </OnboardingStepLayout>
  )
}
