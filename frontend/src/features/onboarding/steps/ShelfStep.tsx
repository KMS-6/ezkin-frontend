import { useState } from 'react'
import { ArrowRight, Camera, Check } from 'lucide-react'
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button'
import { ProductCameraFrame } from '../../product-registration/components/ProductCameraFrame'
import { ProductRegistrationFlow } from '../../product-registration/components/ProductRegistrationFlow'
import { productCatalog } from '../../../mocks/products'
import { OnboardingStepLayout } from '../components/OnboardingStepLayout'

interface ShelfStepProps {
  selectedProductIds: string[]
  onAddProducts: (productIds: string[]) => Promise<boolean>
  onNext: () => void
}

export function ShelfStep({ selectedProductIds, onAddProducts, onNext }: ShelfStepProps) {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const hasProducts = selectedProductIds.length > 0

  return (
    <>
      <OnboardingStepLayout
        eyebrow="있는 제품부터"
        title="지금 있는 제품부터 활용할게요."
        description="사진 한 장이면 EZkin이 제품을 찾아볼게요."
        footer={
          hasProducts ? (
            <div className="space-y-2.5">
              <PrimaryButton type="button" fullWidth onClick={onNext} icon={<ArrowRight size={17} aria-hidden="true" />}>
                다음
              </PrimaryButton>
              <SecondaryButton type="button" fullWidth onClick={() => setIsRegistrationOpen(true)} icon={<Camera size={16} aria-hidden="true" />}>
                제품 하나 더 등록
              </SecondaryButton>
            </div>
          ) : (
            <div className="space-y-2.5">
              <PrimaryButton type="button" fullWidth onClick={() => setIsRegistrationOpen(true)} icon={<Camera size={17} aria-hidden="true" />}>
                제품 촬영
              </PrimaryButton>
              <SecondaryButton type="button" fullWidth onClick={onNext}>
                나중에 할게요
              </SecondaryButton>
            </div>
          )
        }
      >
        {hasProducts ? (
          <div className="rounded-[20px] bg-ez-primary-soft px-5 py-6 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-white text-ez-primary">
              <Check size={20} strokeWidth={2.6} aria-hidden="true" />
            </span>
            <p className="mt-3 text-[14px] font-semibold text-ez-primary-dark">내 화장대에 {selectedProductIds.length}개 담았어요.</p>
          </div>
        ) : (
          <ProductCameraFrame compact />
        )}
      </OnboardingStepLayout>

      {isRegistrationOpen && (
        <ProductRegistrationFlow
          products={productCatalog}
          registeredIds={selectedProductIds}
          onClose={() => setIsRegistrationOpen(false)}
          onAdd={onAddProducts}
        />
      )}
    </>
  )
}
