import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  Camera,
  Check,
  ChevronLeft,
  Images,
  LoaderCircle,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button'
import { recognizeProduct } from '../../../services/productRecognitionService'
import type { Product } from '../../../types/product'
import type {
  ProductAddStep,
  ProductCameraErrorCode,
  ProductImageSource,
  RecognitionCandidate,
} from '../../../types/productRecognition'
import { ProductSelector } from './ProductSelector'
import { ProductCameraCapture } from './ProductCameraCapture'
import { ProductCameraFrame } from './ProductCameraFrame'

interface ProductRegistrationFlowProps {
  products: Product[]
  registeredIds: string[]
  onClose: () => void
  onAdd: (productIds: string[]) => Promise<boolean>
}

const stepTitles: Record<ProductAddStep, string> = {
  intro: '제품 추가',
  requestingPermission: '제품 촬영',
  camera: '제품 촬영',
  cameraError: '제품 촬영',
  preview: '사진 확인',
  analyzing: '제품 확인',
  confirm: '제품 확인',
  candidates: '후보 확인',
  notFound: '제품 확인',
  fallback: '직접 검색',
  complete: '제품 추가',
}

export function ProductRegistrationFlow({
  products,
  registeredIds,
  onClose,
  onAdd,
}: ProductRegistrationFlowProps) {
  const [step, setStep] = useState<ProductAddStep>('intro')
  const [capturedImage, setCapturedImage] = useState<Blob | File | null>(null)
  const [imageSource, setImageSource] = useState<ProductImageSource>('camera')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [candidate, setCandidate] = useState<RecognitionCandidate | null>(null)
  const [candidates, setCandidates] = useState<RecognitionCandidate[]>([])
  const [fallbackSelectedIds, setFallbackSelectedIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraErrorCode, setCameraErrorCode] = useState<ProductCameraErrorCode>('camera_unavailable')
  const isMounted = useRef(true)
  const closeTimerRef = useRef<number | null>(null)
  const availableProducts = useMemo(
    () => products.filter((product) => !registeredIds.includes(product.id)),
    [products, registeredIds],
  )

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    isMounted.current = true
    return () => {
      document.body.style.overflow = previousOverflow
      isMounted.current = false
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!capturedImage) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(capturedImage)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [capturedImage])

  const setImageForPreview = (image: Blob | File, source: ProductImageSource) => {
    setCapturedImage(image)
    setImageSource(source)
    setCandidate(null)
    setCandidates([])
    setError(null)
    setStep('preview')
  }

  const handleSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일을 선택해주세요.')
      return
    }
    setImageForPreview(file, 'library')
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    handleSelectedFile(file)
  }

  const analyzeImage = async () => {
    if (!capturedImage) {
      setError('먼저 제품 사진을 찍거나 선택해주세요.')
      setStep('intro')
      return
    }

    setStep('analyzing')
    setError(null)

    try {
      const result = await recognizeProduct(capturedImage, {
        source: imageSource,
        availableProducts,
      })
      if (!isMounted.current) return

      if (result.status === 'match') {
        setCandidate(result.candidate)
        setStep('confirm')
      } else if (result.status === 'candidates') {
        setCandidates(result.candidates)
        setStep('candidates')
      } else {
        setStep('notFound')
      }
    } catch {
      if (!isMounted.current) return
      setError('제품을 확인하지 못했어요. 사진을 다시 찍거나 직접 찾을 수 있어요.')
      setStep('notFound')
    }
  }

  const saveProductIds = async (productIds: string[]) => {
    if (isSaving || productIds.length === 0) return
    setIsSaving(true)
    setError(null)

    try {
      const wasAdded = await onAdd(productIds)
      if (!isMounted.current) return
      if (wasAdded) {
        setStep('complete')
        closeTimerRef.current = window.setTimeout(onClose, 650)
      } else {
        setError('제품을 추가하지 못했어요. 다시 시도해주세요.')
      }
    } finally {
      if (isMounted.current) setIsSaving(false)
    }
  }

  const openCamera = () => {
    setCapturedImage(null)
    setCandidate(null)
    setCandidates([])
    setError(null)
    setStep('requestingPermission')
  }

  const handleCameraReady = useCallback(() => {
    setStep((current) => current === 'requestingPermission' ? 'camera' : current)
  }, [])

  const handleCameraError = useCallback((code: ProductCameraErrorCode) => {
    setCameraErrorCode(code)
    setStep('cameraError')
  }, [])

  const handleBack = () => {
    setError(null)
    if (step === 'requestingPermission' || step === 'camera' || step === 'cameraError') setStep('intro')
    else if (step === 'preview') setStep(imageSource === 'camera' ? 'requestingPermission' : 'intro')
    else if (step === 'confirm' || step === 'candidates' || step === 'notFound') setStep('preview')
    else if (step === 'fallback') setStep('notFound')
  }

  const toggleFallbackProduct = (productId: string) => {
    setFallbackSelectedIds((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId])
  }

  const canGoBack = !['intro', 'analyzing', 'complete'].includes(step)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#21182f]/20 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="product-registration-title">
      <div className="max-h-[90dvh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-ez-bg px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_35px_rgba(35,24,55,0.12)] sm:mb-4 sm:rounded-[28px]">
        <div className="sticky top-0 z-10 flex min-h-11 items-center justify-between bg-ez-bg/95 pb-2 backdrop-blur">
          <div className="flex min-w-0 items-center gap-1">
            {canGoBack && (
              <button type="button" onClick={handleBack} className="grid size-10 shrink-0 place-items-center rounded-full text-ez-muted hover:bg-ez-primary-soft" aria-label="이전 제품 추가 단계로">
                <ChevronLeft size={19} aria-hidden="true" />
              </button>
            )}
            <h2 id="product-registration-title" className="truncate text-[18px] font-bold text-ez-text">
              {stepTitles[step]}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full text-ez-muted hover:bg-ez-primary-soft" aria-label="제품 추가 닫기">
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        {step === 'intro' && (
          <ProductAddIntro
            error={error}
            onOpenCamera={openCamera}
            onFileChange={handleFileChange}
          />
        )}

        {(step === 'requestingPermission' || step === 'camera') && (
          <ProductCameraCapture
            onReady={handleCameraReady}
            onError={handleCameraError}
            onCaptured={(image) => setImageForPreview(image, 'camera')}
            onFileSelected={handleSelectedFile}
          />
        )}

        {step === 'cameraError' && (
          <ProductCameraError
            code={cameraErrorCode}
            onRetry={openCamera}
            onFileChange={handleFileChange}
          />
        )}

        {step === 'preview' && previewUrl && (
          <ProductPreview
            previewUrl={previewUrl}
            onUse={() => void analyzeImage()}
            onRetake={openCamera}
          />
        )}

        {step === 'analyzing' && <ProductAnalyzing />}

        {step === 'confirm' && candidate && previewUrl && (
          <ProductConfirm
            candidate={candidate}
            previewUrl={previewUrl}
            isSaving={isSaving}
            error={error}
            onConfirm={() => candidate.productId && void saveProductIds([candidate.productId])}
            onReviewAgain={() => setStep('preview')}
          />
        )}

        {step === 'candidates' && previewUrl && (
          <ProductCandidates
            candidates={candidates}
            previewUrl={previewUrl}
            onSelect={(selectedCandidate) => {
              setCandidate(selectedCandidate)
              setStep('confirm')
            }}
            onNotFound={() => setStep('notFound')}
          />
        )}

        {step === 'notFound' && (
          <ProductNotFound
            previewUrl={previewUrl}
            error={error}
            onRetake={openCamera}
            onFallback={() => setStep('fallback')}
          />
        )}

        {step === 'fallback' && (
          <ProductFallback
            products={products}
            registeredIds={registeredIds}
            selectedIds={fallbackSelectedIds}
            isSaving={isSaving}
            error={error}
            onToggle={toggleFallbackProduct}
            onAdd={() => void saveProductIds(fallbackSelectedIds)}
            onCamera={openCamera}
          />
        )}

        {step === 'complete' && <ProductAddComplete />}
      </div>
    </div>
  )
}

function ProductAddIntro({
  error,
  onOpenCamera,
  onFileChange,
}: {
  error: string | null
  onOpenCamera: () => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="pt-5 text-center">
      <ProductCameraFrame compact />
      <h3 className="mt-5 text-[20px] font-bold tracking-[-0.03em] text-ez-text">제품을 보여주세요.</h3>
      <p className="mx-auto mt-2 max-w-[280px] text-[13px] font-normal leading-5 text-ez-muted">
        앞면의 제품명과 라벨이 잘 보이게 찍어주세요.
      </p>
      {error && <p className="mt-3 text-[11px] text-ez-danger" role="status">{error}</p>}
      <PrimaryButton type="button" fullWidth className="mt-6" onClick={onOpenCamera} icon={<Camera size={17} aria-hidden="true" />}>
        제품 촬영
      </PrimaryButton>
      <label className="mt-2 inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 px-4 text-[12px] font-semibold text-ez-primary">
        <Images size={15} aria-hidden="true" /> 사진에서 가져오기
        <input type="file" accept="image/*" className="sr-only" onChange={onFileChange} />
      </label>
      <p className="mt-1 text-[11px] leading-4 text-ez-muted">현재 데모에서는 사진이 서버에 저장되지 않아요.</p>
    </div>
  )
}

function ProductPreview({
  previewUrl,
  onUse,
  onRetake,
}: {
  previewUrl: string
  onUse: () => void
  onRetake: () => void
}) {
  return (
    <div className="pt-5 text-center">
      <h3 className="text-[20px] font-bold tracking-[-0.03em] text-ez-text">이 사진으로 확인할까요?</h3>
      <ImagePreview src={previewUrl} className="mt-5 aspect-[3/4] max-h-[390px]" />
      <PrimaryButton type="button" fullWidth className="mt-5" onClick={onUse} icon={<Sparkles size={16} aria-hidden="true" />}>
        이 사진 사용
      </PrimaryButton>
      <SecondaryButton type="button" fullWidth className="mt-2" onClick={onRetake} icon={<RotateCcw size={15} aria-hidden="true" />}>
        다시 찍기
      </SecondaryButton>
    </div>
  )
}

const cameraErrorMessages: Record<ProductCameraErrorCode, { title: string; description: string }> = {
  permission_denied: {
    title: '카메라를 사용할 수 없어요.',
    description: '사진에서 가져오기를 이용해도 괜찮아요.',
  },
  unsupported: {
    title: '이 브라우저에서는 카메라를 사용할 수 없어요.',
    description: '저장된 제품 사진을 선택해도 괜찮아요.',
  },
  camera_unavailable: {
    title: '카메라를 열지 못했어요.',
    description: '다른 앱에서 카메라를 사용 중인지 확인하거나 사진을 선택해주세요.',
  },
  capture_failed: {
    title: '제품 사진을 찍지 못했어요.',
    description: '괜찮아요. 다시 시도하거나 사진에서 가져올 수 있어요.',
  },
}

function ProductCameraError({
  code,
  onRetry,
  onFileChange,
}: {
  code: ProductCameraErrorCode
  onRetry: () => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const message = cameraErrorMessages[code]
  return (
    <div className="grid min-h-[390px] place-items-center text-center" role="alert">
      <div className="w-full">
        <span className="mx-auto grid size-14 place-items-center rounded-[20px] bg-ez-primary-soft text-ez-primary">
          <Camera size={23} aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-[19px] font-bold text-ez-text">{message.title}</h3>
        <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-5 text-ez-muted">{message.description}</p>
        <label className="mt-6 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-ez-primary px-4 text-[14px] font-semibold text-white">
          <Images size={17} aria-hidden="true" /> 사진에서 가져오기
          <input type="file" accept="image/*" className="sr-only" onChange={onFileChange} />
        </label>
        <SecondaryButton type="button" fullWidth className="mt-2" onClick={onRetry} icon={<RotateCcw size={15} aria-hidden="true" />}>
          다시 시도
        </SecondaryButton>
      </div>
    </div>
  )
}

function ProductAnalyzing() {
  return (
    <div className="grid min-h-[390px] place-items-center text-center" role="status" aria-live="polite">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-[20px] bg-ez-primary-soft text-ez-primary">
          <LoaderCircle size={24} className="animate-spin" aria-hidden="true" />
        </span>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-[15px] font-semibold text-ez-text">
          <Sparkles size={15} className="text-ez-primary" aria-hidden="true" /> 제품을 찾고 있어요.
        </p>
      </div>
    </div>
  )
}

function ProductConfirm({
  candidate,
  previewUrl,
  isSaving,
  error,
  onConfirm,
  onReviewAgain,
}: {
  candidate: RecognitionCandidate
  previewUrl: string
  isSaving: boolean
  error: string | null
  onConfirm: () => void
  onReviewAgain: () => void
}) {
  return (
    <div className="pt-5">
      <h3 className="text-center text-[20px] font-bold tracking-[-0.03em] text-ez-text">이 제품 맞나요?</h3>
      <div className="mt-5 flex items-center gap-4 rounded-[20px] border border-ez-border bg-white p-4">
        <ImagePreview src={previewUrl} className="h-28 w-24 shrink-0" />
        <CandidateDetails candidate={candidate} />
      </div>
      {error && <p className="mt-3 text-center text-[11px] text-ez-danger" role="status">{error}</p>}
      <PrimaryButton type="button" fullWidth className="mt-5" onClick={onConfirm} disabled={isSaving || !candidate.productId} icon={isSaving ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}>
        {isSaving ? '추가하는 중' : '내 화장대에 추가'}
      </PrimaryButton>
      <SecondaryButton type="button" fullWidth className="mt-2" onClick={onReviewAgain} icon={<RotateCcw size={15} aria-hidden="true" />}>
        사진 다시 보기
      </SecondaryButton>
    </div>
  )
}

function ProductCandidates({
  candidates,
  previewUrl,
  onSelect,
  onNotFound,
}: {
  candidates: RecognitionCandidate[]
  previewUrl: string
  onSelect: (candidate: RecognitionCandidate) => void
  onNotFound: () => void
}) {
  return (
    <div className="pt-5">
      <div className="flex items-center gap-3">
        <ImagePreview src={previewUrl} className="h-20 w-16 shrink-0" />
        <div>
          <h3 className="text-[19px] font-bold tracking-[-0.03em] text-ez-text">비슷한 제품을 찾았어요.</h3>
          <p className="mt-1 text-[12px] text-ez-muted">맞는 제품만 한 번 골라주세요.</p>
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        {candidates.slice(0, 3).map((item) => (
          <button key={item.productId ?? item.productName} type="button" onClick={() => onSelect(item)} className="flex min-h-[70px] w-full items-center gap-3 rounded-[16px] border border-ez-border bg-white px-4 py-3 text-left transition hover:border-ez-primary hover:bg-ez-primary-soft/40">
            <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-ez-primary-soft text-ez-primary">
              <Search size={17} aria-hidden="true" />
            </span>
            <CandidateDetails candidate={item} compact />
          </button>
        ))}
      </div>
      <button type="button" onClick={onNotFound} className="mt-4 min-h-10 w-full text-[11px] font-medium text-ez-muted hover:text-ez-primary">
        여기에 제품이 없어요
      </button>
    </div>
  )
}

function ProductNotFound({
  previewUrl,
  error,
  onRetake,
  onFallback,
}: {
  previewUrl: string | null
  error: string | null
  onRetake: () => void
  onFallback: () => void
}) {
  return (
    <div className="pt-5 text-center">
      {previewUrl && <ImagePreview src={previewUrl} className="mx-auto h-36 w-28" />}
      <h3 className="mt-5 text-[19px] font-bold tracking-[-0.03em] text-ez-text">제품을 찾지 못했어요.</h3>
      <p className="mx-auto mt-2 max-w-[270px] text-[13px] leading-5 text-ez-muted">
        라벨이 보이게 다시 찍거나, 직접 찾을 수 있어요.
      </p>
      {error && <p className="mt-2 text-[11px] text-ez-danger" role="status">{error}</p>}
      <PrimaryButton type="button" fullWidth className="mt-5" onClick={onRetake} icon={<Camera size={16} aria-hidden="true" />}>
        다시 찍기
      </PrimaryButton>
      <button type="button" onClick={onFallback} className="mt-2 min-h-10 w-full text-[11px] font-medium text-ez-muted hover:text-ez-primary">
        직접 검색
      </button>
    </div>
  )
}

function ProductFallback({
  products,
  registeredIds,
  selectedIds,
  isSaving,
  error,
  onToggle,
  onAdd,
  onCamera,
}: {
  products: Product[]
  registeredIds: string[]
  selectedIds: string[]
  isSaving: boolean
  error: string | null
  onToggle: (productId: string) => void
  onAdd: () => void
  onCamera: () => void
}) {
  const hasAvailableProducts = products.some((product) => !registeredIds.includes(product.id))

  return (
    <div className="pt-4">
      {error && <p className="mb-3 rounded-xl bg-[#fff0f1] px-3 py-2 text-center text-[11px] text-[#b54852]" role="status">{error}</p>}
      {hasAvailableProducts ? (
        <>
          <ProductSelector
            products={products}
            selectedIds={[...registeredIds, ...selectedIds]}
            lockedIds={registeredIds}
            onToggle={onToggle}
          />
          <PrimaryButton type="button" fullWidth className="sticky bottom-0 mt-4" onClick={onAdd} disabled={selectedIds.length === 0 || isSaving} icon={isSaving ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}>
            {isSaving ? '추가하는 중' : selectedIds.length > 0 ? '내 화장대에 추가' : '추가할 제품을 골라주세요'}
          </PrimaryButton>
        </>
      ) : (
        <div className="rounded-[18px] bg-ez-primary-soft px-4 py-6 text-center">
          <Check size={20} className="mx-auto text-ez-primary" aria-hidden="true" />
          <p className="mt-2 text-[13px] font-semibold text-ez-primary-dark">Demo 제품이 모두 화장대에 있어요.</p>
        </div>
      )}
      <button type="button" onClick={onCamera} className="mt-2 min-h-10 w-full text-[11px] font-medium text-ez-muted hover:text-ez-primary">
        사진으로 다시 찾아보기
      </button>
    </div>
  )
}

function ProductAddComplete() {
  return (
    <div className="grid min-h-[300px] place-items-center text-center" role="status" aria-live="polite">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#eaf8f2] text-[#287d61]">
          <Check size={24} aria-hidden="true" />
        </span>
        <p className="mt-4 text-[15px] font-semibold text-ez-text">내 화장대에 추가했어요.</p>
      </div>
    </div>
  )
}

function ImagePreview({ src, className = '' }: { src: string; className?: string }) {
  return (
    <div className={`mx-auto overflow-hidden rounded-[18px] border border-ez-border bg-white ${className}`}>
      <img src={src} alt="촬영한 제품" className="h-full w-full object-cover" />
    </div>
  )
}

function CandidateDetails({ candidate, compact = false }: { candidate: RecognitionCandidate; compact?: boolean }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-medium text-ez-muted">{candidate.brand}</p>
      <p className={compact ? 'mt-0.5 truncate text-[14px] font-semibold text-ez-text' : 'mt-1 text-[16px] font-semibold leading-6 text-ez-text'}>
        {candidate.productName}
      </p>
      <p className="mt-1 truncate text-[11px] text-ez-muted">
        {[candidate.category, ...(candidate.ingredients ?? [])].join(' · ')}
      </p>
    </div>
  )
}
