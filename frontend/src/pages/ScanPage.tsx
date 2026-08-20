import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Camera,
  Check,
  Home,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { PageContainer } from '../components/PageContainer'
import { PrimaryButton, SecondaryButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ScanAction } from '../features/scan/components/ScanAction'
import { ScanCamera } from '../features/scan/components/ScanCamera'
import type { ScanCameraHandle } from '../features/scan/components/ScanCamera'
import { ScanFrame } from '../features/scan/components/ScanFrame'
import { getScanCountdownDelay } from '../features/scan/scanCountdown'
import {
  PatternAnalysisContent,
  PatternAnalysisInsufficient,
} from '../features/analysis/components/PatternAnalysisContent'
import { getPatternAnalysis } from '../services/analysisService'
import {
  analyzeSkin,
  clearRecentTriggerAnalysisReference,
  rememberLatestSkinScanResult,
  rememberTriggerAnalysisReference,
} from '../services/skinScanService'
import { useAuth } from '../features/auth/authContextValue'
import type {
  SkinScanErrorCode,
  SkinScanResult,
  SkinScanState,
} from '../types/skinScan'
import type { TriggerAnalysisDetail } from '../types/analysisReport'

const errorMessages: Record<SkinScanErrorCode, { title: string; description: string }> = {
  permission_denied: {
    title: '카메라를 사용할 수 없어요.',
    description: '지금 스캔하지 않아도 괜찮아요. 나중에 다시 시도할 수 있어요.',
  },
  unsupported: {
    title: '이 브라우저에서는 카메라를 사용할 수 없어요.',
    description: '카메라를 지원하는 모바일 브라우저에서 다시 열어주세요.',
  },
  camera_unavailable: {
    title: '카메라를 열지 못했어요.',
    description: '다른 앱에서 카메라를 사용 중인지 확인한 뒤 다시 시도해주세요.',
  },
  capture_failed: {
    title: '사진을 찍지 못했어요.',
    description: '괜찮아요. 카메라를 다시 열어 한 번만 더 시도해주세요.',
  },
  analysis_failed: {
    title: '사진을 살펴보지 못했어요.',
    description: '촬영한 사진은 저장되지 않았어요. 원할 때 다시 시도할 수 있어요.',
  },
}

export function ScanPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const cameraRef = useRef<ScanCameraHandle>(null)
  const analysisRunRef = useRef(0)
  const [state, setState] = useState<SkinScanState>('idle')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<SkinScanResult | null>(null)
  const [patternAnalysis, setPatternAnalysis] = useState<TriggerAnalysisDetail | null>(null)
  const [errorCode, setErrorCode] = useState<SkinScanErrorCode>('camera_unavailable')
  const [analysisErrorMessage, setAnalysisErrorMessage] = useState<string | null>(null)

  const cameraActive = state === 'requestingPermission' || state === 'camera' || state === 'countdown'

  useEffect(() => {
    if (!capturedImage) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(capturedImage)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [capturedImage])

  useEffect(() => () => {
    analysisRunRef.current += 1
  }, [])

  const handleCameraError = useCallback((code: SkinScanErrorCode) => {
    setErrorCode(code)
    if (code !== 'analysis_failed') setAnalysisErrorMessage(null)
    setCountdown(null)
    setState('error')
  }, [])

  const handleCameraReady = useCallback(() => {
    setState((current) => current === 'requestingPermission' ? 'camera' : current)
  }, [])

  const openCamera = () => {
    analysisRunRef.current += 1
    setCapturedImage(null)
    setResult(null)
    setCountdown(null)
    setAnalysisErrorMessage(null)
    setState('requestingPermission')
  }

  const captureFrame = useCallback(async () => {
    try {
      const image = await cameraRef.current?.capture()
      if (!image) throw new Error('Camera is not ready.')
      setCapturedImage(image)
      setCountdown(null)
      setState('preview')
    } catch {
      handleCameraError('capture_failed')
    }
  }, [handleCameraError])

  useEffect(() => {
    if (state !== 'countdown' || countdown === null) return

    const timeoutId = window.setTimeout(() => {
      if (countdown > 1) setCountdown(countdown - 1)
      else void captureFrame()
    }, getScanCountdownDelay(countdown))

    return () => window.clearTimeout(timeoutId)
  }, [captureFrame, countdown, state])

  const startCountdown = () => {
    if (state !== 'camera') return
    setCountdown(3)
    setState('countdown')
  }

  const startAnalysis = async () => {
    if (!capturedImage) return
    const runId = analysisRunRef.current + 1
    analysisRunRef.current = runId
    setState('analyzing')

    try {
      const nextResult = await analyzeSkin(capturedImage, user?.id)
      if (analysisRunRef.current !== runId) return
      if (user) {
        rememberLatestSkinScanResult(user.id, nextResult)
        try {
          const nextPattern = await getPatternAnalysis(user.id, nextResult.id)
          setPatternAnalysis(nextPattern)
          if (nextPattern) {
            rememberTriggerAnalysisReference(user.id, {
              scanId: nextPattern.scan_id,
              capturedAt: nextPattern.window.end,
            })
          } else {
            clearRecentTriggerAnalysisReference(user.id)
          }
        } catch {
          setPatternAnalysis(null)
        }
      }
      setResult(nextResult)
      setState('result')
    } catch (error) {
      if (analysisRunRef.current !== runId) return
      setAnalysisErrorMessage(error instanceof Error ? error.message : null)
      handleCameraError('analysis_failed')
    }
  }

  const resetToIdle = () => {
    analysisRunRef.current += 1
    setCapturedImage(null)
    setResult(null)
    setPatternAnalysis(null)
    setCountdown(null)
    setAnalysisErrorMessage(null)
    setState('idle')
  }

  return (
    <>
      <AppHeader title="피부 스캔" />
      <PageContainer className="pt-3">
        {state === 'idle' && <IdleScan onStart={openCamera} />}

        {cameraActive && (
          <section>
            <header className="text-center">
              <h1 className="text-[19px] font-bold tracking-[-0.025em] text-ez-text">얼굴을 가이드 안에 맞춰주세요.</h1>
            </header>
            <ScanCamera
              ref={cameraRef}
              isRequesting={state === 'requestingPermission'}
              countdown={countdown}
              onReady={handleCameraReady}
              onError={handleCameraError}
            />
            <ScanAction
              onStart={startCountdown}
              disabled={state !== 'camera'}
              label={state === 'requestingPermission' ? '카메라 여는 중' : state === 'countdown' ? `${countdown}초` : '3초 스캔'}
            />
            <button type="button" onClick={resetToIdle} className="mt-1 min-h-10 w-full text-[12px] font-medium text-ez-muted hover:text-ez-primary">
              취소
            </button>
          </section>
        )}

        {state === 'preview' && previewUrl && (
          <ScanPreview
            imageUrl={previewUrl}
            onAnalyze={() => void startAnalysis()}
            onRetake={openCamera}
          />
        )}

        {state === 'analyzing' && <ScanAnalyzing imageUrl={previewUrl} />}

        {state === 'result' && result && (
          <ScanResultView
            result={result}
            patternAnalysis={patternAnalysis}
            onReset={resetToIdle}
          />
        )}

        {state === 'error' && (
          <ScanError
            code={errorCode}
            description={analysisErrorMessage}
            onRetry={openCamera}
            onHome={() => navigate('/home')}
          />
        )}
      </PageContainer>
    </>
  )
}

function IdleScan({ onStart }: { onStart: () => void }) {
  return (
    <>
      <header>
        <h1 className="text-[21px] font-bold tracking-[-0.03em] text-ez-text">변화가 궁금할 때만 찍어요.</h1>
        <p className="mt-2 text-[13px] leading-5 text-ez-muted">매일 스캔하지 않아도 괜찮아요.</p>
      </header>
      <ScanFrame />
      <ScanAction onStart={onStart} />
    </>
  )
}

function ScanPreview({ imageUrl, onAnalyze, onRetake }: { imageUrl: string; onAnalyze: () => void; onRetake: () => void }) {
  return (
    <section className="text-center">
      <h1 className="text-[21px] font-bold tracking-[-0.03em] text-ez-text">이 사진으로 볼까요?</h1>
      <div className="mx-auto mt-5 aspect-[3/4] max-h-[470px] overflow-hidden rounded-[24px] border border-ez-border bg-white">
        <img src={imageUrl} alt="촬영한 피부 스캔 사진" className="h-full w-full object-cover" />
      </div>
      <PrimaryButton type="button" fullWidth className="mt-5" onClick={onAnalyze} icon={<Sparkles size={17} aria-hidden="true" />}>
        이 사진으로 분석
      </PrimaryButton>
      <SecondaryButton type="button" fullWidth className="mt-2" onClick={onRetake} icon={<RotateCcw size={16} aria-hidden="true" />}>
        다시 찍기
      </SecondaryButton>
      <p className="mt-3 text-[11px] text-ez-muted">촬영 사진은 피부 분석을 위해 서버로 전송돼요.</p>
    </section>
  )
}

function ScanAnalyzing({ imageUrl }: { imageUrl: string | null }) {
  return (
    <section className="grid min-h-[520px] place-items-center text-center" role="status" aria-live="polite">
      <div>
        {imageUrl && (
          <div className="mx-auto size-24 overflow-hidden rounded-[24px] border-2 border-white opacity-65 shadow-card">
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <span className="mx-auto mt-5 grid size-14 place-items-center rounded-[20px] bg-ez-primary-soft text-ez-primary">
          <LoaderCircle size={24} className="animate-spin" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-[18px] font-bold text-ez-text">피부 변화를 살펴보고 있어요.</h1>
      </div>
    </section>
  )
}

function ScanResultView({
  result,
  patternAnalysis,
  onReset,
}: {
  result: SkinScanResult
  patternAnalysis: TriggerAnalysisDetail | null
  onReset: () => void
}) {
  return (
    <section>
      <p className="text-[11px] font-semibold text-ez-primary">스캔 결과</p>
      <h1 className="mt-1.5 text-[22px] font-bold leading-8 tracking-[-0.03em] text-ez-text">{result.overallStatus}</h1>

      <Card className="mt-5 p-4">
        <p className="text-[12px] font-semibold text-ez-muted">관찰 영역</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {result.observedAreas.map((area) => (
            <span key={area} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-ez-primary-soft px-3 text-[12px] font-semibold text-ez-primary-dark">
              <Check size={13} aria-hidden="true" /> {area}
            </span>
          ))}
        </div>
        <div className="mt-4 border-t border-ez-border pt-4">
          <p className="text-[13px] leading-6 text-ez-text">{result.recommendation}</p>
        </div>
      </Card>

      <p className="mt-4 text-[11px] leading-5 text-ez-muted">EZkin의 안내는 의료 진단을 대신하지 않아요.</p>
      <div className="mt-8 border-t border-ez-border pt-7">
        {patternAnalysis
          ? <PatternAnalysisContent analysis={patternAnalysis} />
          : <PatternAnalysisInsufficient />}
      </div>
      <button type="button" onClick={onReset} className="mt-4 min-h-10 w-full text-[12px] font-medium text-ez-muted hover:text-ez-primary">스캔 마치기</button>
    </section>
  )
}

function ScanError({
  code,
  description,
  onRetry,
  onHome,
}: {
  code: SkinScanErrorCode
  description?: string | null
  onRetry: () => void
  onHome: () => void
}) {
  const message = errorMessages[code]
  return (
    <section className="grid min-h-[520px] place-items-center text-center" role="alert">
      <div className="w-full">
        <span className="mx-auto grid size-14 place-items-center rounded-[20px] bg-ez-primary-soft text-ez-primary">
          <Camera size={23} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-[19px] font-bold text-ez-text">{message.title}</h1>
        <p className="mx-auto mt-2 max-w-[290px] text-[13px] leading-5 text-ez-muted">{description ?? message.description}</p>
        <PrimaryButton type="button" fullWidth className="mt-6" onClick={onRetry} icon={<RefreshCw size={16} aria-hidden="true" />}>
          다시 시도
        </PrimaryButton>
        <SecondaryButton type="button" fullWidth className="mt-2" onClick={onHome} icon={<Home size={16} aria-hidden="true" />}>
          홈으로
        </SecondaryButton>
      </div>
    </section>
  )
}
