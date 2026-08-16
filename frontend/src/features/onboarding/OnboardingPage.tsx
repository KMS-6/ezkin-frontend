import { useEffect, useState } from 'react'
import { ChevronLeft, LoaderCircle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EZkinLogo } from '../../components/EZkinLogo'
import { addMyProducts } from '../../services/productService'
import { connectHealthData } from '../../services/healthConnectionService'
import { useAuth } from '../auth/authContextValue'
import {
  completeOnboardingProfile,
  getOnboardingProfile,
  saveBasicProfile,
  saveConcerns,
  saveConnectionSettings,
  saveCurrentStep,
  saveSkinType,
} from '../../services/onboardingService'
import type {
  BasicProfile,
  OnboardingProfile,
  OnboardingStep,
  SkinConcern,
  SkinType,
} from '../../types/onboarding'
import type { HealthPermissionStatus } from '../../types/healthConnection'
import { OnboardingProgress } from './components/OnboardingProgress'
import { ConnectionStep } from './steps/ConnectionStep'
import { ProfileStep } from './steps/ProfileStep'
import { ShelfStep } from './steps/ShelfStep'
import { SkinStep } from './steps/SkinStep'
import { WelcomeStep } from './steps/WelcomeStep'
import { ANDROID_HARDWARE_BACK_EVENT } from '../navigation/androidBackEvent'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, completeOnboarding } = useAuth()
  const [profile, setProfile] = useState<OnboardingProfile | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [limitMessage, setLimitMessage] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [healthConnectionStatus, setHealthConnectionStatus] = useState<HealthPermissionStatus>('not_requested')

  useEffect(() => {
    if (!user) return
    let isActive = true

    void getOnboardingProfile(user.id)
      .then((savedProfile) => {
        if (isActive) {
          setProfile(savedProfile)
          setHealthConnectionStatus(savedProfile.lifeDataConnected ? 'connected' : 'not_requested')
        }
      })
      .catch(() => {
        if (isActive) setLoadError('온보딩 정보를 불러오지 못했어요.')
      })

    return () => {
      isActive = false
    }
  }, [user])

  useEffect(() => {
    const handleAndroidHardwareBack = (event: Event) => {
      if (!user || !profile || profile.currentStep <= 1) return

      event.preventDefault()
      const previousStep = (profile.currentStep - 1) as OnboardingStep
      setProfile((current) => current ? { ...current, currentStep: previousStep } : current)
      setSaveMessage(null)
      void saveCurrentStep(user.id, previousStep).catch(() => {
        setSaveMessage('이전 단계로 이동하지 못했어요. 잠시 후 다시 시도해주세요.')
      })
    }

    window.addEventListener(ANDROID_HARDWARE_BACK_EVENT, handleAndroidHardwareBack)
    return () => window.removeEventListener(ANDROID_HARDWARE_BACK_EVENT, handleAndroidHardwareBack)
  }, [profile, user])

  if (!user) return null
  if (loadError) return <OnboardingLoadError message={loadError} />
  if (!profile) return <OnboardingLoading />

  const persist = (request: Promise<OnboardingProfile>) => {
    setSaveMessage(null)
    void request.catch(() => setSaveMessage('선택을 저장하지 못했어요. 잠시 후 다시 선택해주세요.'))
  }

  const moveToStep = (nextStep: OnboardingStep) => {
    setProfile((current) => current ? { ...current, currentStep: nextStep } : current)
    persist(saveCurrentStep(user.id, nextStep))
  }

  const handleBack = () => {
    if (profile.currentStep <= 1) return
    moveToStep((profile.currentStep - 1) as OnboardingStep)
  }

  const handleConcernToggle = (concern: SkinConcern) => {
    const isSelected = profile.selectedConcerns.includes(concern)

    if (!isSelected && profile.selectedConcerns.length >= 3) {
      setLimitMessage('3개까지만 선택할 수 있어요.')
      return
    }

    const selectedConcerns = isSelected
      ? profile.selectedConcerns.filter((item) => item !== concern)
      : [...profile.selectedConcerns, concern]

    setLimitMessage(null)
    setProfile({ ...profile, selectedConcerns })
    persist(saveConcerns(user.id, selectedConcerns))
  }

  const handleBasicProfileChange = (update: Partial<BasicProfile>) => {
    setProfile({ ...profile, ...update })
    persist(saveBasicProfile(user.id, update))
  }

  const handleSkinTypeChange = (skinType: SkinType) => {
    setProfile({ ...profile, skinType })
    persist(saveSkinType(user.id, skinType))
  }

  const handleAddProducts = async (productIds: string[]) => {
    setSaveMessage(null)
    try {
      const products = await addMyProducts(user.id, productIds)
      setProfile({ ...profile, registeredProductIds: products.map((product) => product.id) })
      return true
    } catch {
      setSaveMessage('제품을 추가하지 못했어요. 다시 시도해주세요.')
      return false
    }
  }

  const handleWeatherToggle = () => {
    const settings = {
      lifeDataConnected: profile.lifeDataConnected,
      weatherConnected: !profile.weatherConnected,
    }

    setProfile({ ...profile, ...settings })
    persist(saveConnectionSettings(user.id, settings))
  }

  const handleLifeDataConnect = async () => {
    if (healthConnectionStatus === 'requesting' || profile.lifeDataConnected) return
    setHealthConnectionStatus('requesting')
    setSaveMessage(null)

    try {
      const connection = await connectHealthData(user.id)
      setHealthConnectionStatus(connection.status)
      setProfile({ ...profile, lifeDataConnected: connection.status === 'connected' || connection.status === 'limited' })
    } catch {
      setHealthConnectionStatus('denied')
      setSaveMessage('지금은 연결하지 않아도 괜찮아요. 나중에 다시 시도할 수 있어요.')
    }
  }

  const handleComplete = async () => {
    if (isCompleting) return
    setIsCompleting(true)
    setSaveMessage(null)

    try {
      await completeOnboardingProfile(user.id)
      await completeOnboarding()
      navigate('/home', { replace: true })
    } catch {
      setSaveMessage('준비를 마무리하지 못했어요. 다시 시도해주세요.')
      setIsCompleting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ez-bg sm:min-h-[calc(100vh-32px)]">
      <header className="px-5 pt-4">
        <div className="flex h-10 items-center justify-between">
          {profile.currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
            className="grid size-10 place-items-center rounded-full text-ez-muted transition hover:bg-ez-primary-soft hover:text-ez-primary"
              aria-label="이전 단계로"
            >
              <ChevronLeft size={21} aria-hidden="true" />
            </button>
          ) : <span className="size-10" aria-hidden="true" />}
          <EZkinLogo compact />
          <span className="size-10" aria-hidden="true" />
        </div>
        <div className="mt-3">
          <OnboardingProgress step={profile.currentStep} />
        </div>
      </header>

      {saveMessage && (
        <p className="mx-5 mt-3 rounded-xl bg-[#fff0f1] px-3 py-2 text-center text-[11px] text-[#b54852]" role="status">
          {saveMessage}
        </p>
      )}

      <main className="flex min-h-[calc(100dvh-92px)] flex-1 flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-7 sm:min-h-[calc(100vh-124px)]">
        {profile.currentStep === 1 && <WelcomeStep onNext={() => moveToStep(2)} />}
        {profile.currentStep === 2 && (
          <ProfileStep
            nickname={profile.nickname}
            birthYear={profile.birthYear}
            gender={profile.gender}
            healthConcerns={profile.healthConcerns}
            onChange={handleBasicProfileChange}
            onNext={() => moveToStep(3)}
          />
        )}
        {profile.currentStep === 3 && (
          <SkinStep
            skinType={profile.skinType}
            selectedConcerns={profile.selectedConcerns}
            limitMessage={limitMessage}
            onSkinTypeChange={handleSkinTypeChange}
            onConcernToggle={handleConcernToggle}
            onNext={() => moveToStep(4)}
          />
        )}
        {profile.currentStep === 4 && (
          <ShelfStep
            selectedProductIds={profile.registeredProductIds}
            onAddProducts={handleAddProducts}
            onNext={() => moveToStep(5)}
          />
        )}
        {profile.currentStep === 5 && (
          <ConnectionStep
            lifeDataConnected={profile.lifeDataConnected}
            weatherConnected={profile.weatherConnected}
            healthConnectionStatus={healthConnectionStatus}
            isCompleting={isCompleting}
            onConnectLifeData={() => void handleLifeDataConnect()}
            onToggleWeather={handleWeatherToggle}
            onComplete={handleComplete}
          />
        )}
      </main>
    </div>
  )
}

function OnboardingLoading() {
  return (
    <div className="grid min-h-dvh place-items-center sm:min-h-[calc(100vh-32px)]" role="status" aria-label="온보딩 불러오는 중">
      <div className="flex flex-col items-center gap-4">
        <EZkinLogo />
        <LoaderCircle size={20} className="animate-spin text-ez-primary" aria-hidden="true" />
      </div>
    </div>
  )
}

function OnboardingLoadError({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center sm:min-h-[calc(100vh-32px)]" role="alert">
      <EZkinLogo />
      <p className="mt-5 text-[14px] font-medium text-ez-text">{message}</p>
      <p className="mt-1 text-[12px] text-ez-muted">잠시 후 다시 시도해주세요.</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-ez-primary-soft px-4 text-[13px] font-semibold text-ez-primary"
      >
        <RefreshCw size={15} aria-hidden="true" />
        다시 불러오기
      </button>
    </div>
  )
}
