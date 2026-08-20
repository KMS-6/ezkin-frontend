import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity,
  CalendarDays,
  Check,
  ChevronRight,
  CloudSun,
  Droplets,
  Package,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { PageContainer } from '../components/PageContainer'
import { Card } from '../components/ui/Card'
import { Disclaimer } from '../components/ui/Disclaimer'
import { useAuth } from '../features/auth/authContextValue'
import { HealthConnectionSheet } from '../features/health/components/HealthConnectionSheet'
import { AndroidNotificationTestSection } from '../features/notifications/AndroidNotificationTestSection'
import { DemoScenarioSwitch } from '../features/demo/DemoScenarioSwitch'
import { WeatherConnectionSheet } from '../features/weather/components/WeatherConnectionSheet'
import { concernOptions } from '../mocks/onboarding'
import {
  connectHealthData,
  disconnectHealthData,
  getHealthConnection,
} from '../services/healthConnectionService'
import {
  connectWeatherData,
  disconnectWeatherData,
  reconcileWeatherConnectionPermission,
} from '../services/weatherConnectionService'
import type { HealthConnection } from '../types/healthConnection'
import type { OnboardingProfile } from '../types/onboarding'
import { getAvailableHealthMetricLabels } from '../utils/healthMetrics'

export function SettingsPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<OnboardingProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [healthConnection, setHealthConnection] = useState<HealthConnection | null>(null)
  const [isHealthSheetOpen, setIsHealthSheetOpen] = useState(false)
  const [isUpdatingHealth, setIsUpdatingHealth] = useState(false)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [isWeatherSheetOpen, setIsWeatherSheetOpen] = useState(false)
  const [isUpdatingWeather, setIsUpdatingWeather] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setHasError(false)

    try {
      const [nextProfile, nextHealthConnection] = await Promise.all([
        reconcileWeatherConnectionPermission(user.id),
        getHealthConnection(user.id),
      ])
      setProfile(nextProfile)
      setHealthConnection(nextHealthConnection)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  useEffect(() => {
    const shouldOpenHealthConnection = (location.state as { openHealthConnection?: boolean } | null)?.openHealthConnection
    if (!shouldOpenHealthConnection || !healthConnection) return

    setHealthError(null)
    setIsHealthSheetOpen(true)
    navigate('/settings', { replace: true, state: null })
  }, [healthConnection, location.state, navigate])

  const handleHealthConnect = async () => {
    if (!user || isUpdatingHealth) return
    setIsUpdatingHealth(true)
    setHealthError(null)
    setHealthConnection((current) => current ? { ...current, status: 'requesting' } : current)

    try {
      const connection = await connectHealthData(user.id)
      setHealthConnection(connection)
      setProfile((current) => current ? { ...current, lifeDataConnected: true } : current)
    } catch {
      setHealthConnection((current) => current ? { ...current, status: 'denied' } : current)
      setHealthError('지금은 연결하지 않아도 괜찮아요. 나중에 다시 시도할 수 있어요.')
    } finally {
      setIsUpdatingHealth(false)
    }
  }

  const handleHealthDisconnect = async () => {
    if (!user || isUpdatingHealth) return
    setIsUpdatingHealth(true)
    setHealthError(null)

    try {
      const connection = await disconnectHealthData(user.id)
      setHealthConnection(connection)
      setProfile((current) => current ? { ...current, lifeDataConnected: false } : current)
      setIsHealthSheetOpen(false)
    } catch {
      setHealthError('연결을 끊지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsUpdatingHealth(false)
    }
  }

  const handleWeatherConnect = async () => {
    if (!user || isUpdatingWeather) return
    setIsUpdatingWeather(true)
    setWeatherError(null)

    try {
      const result = await connectWeatherData(user.id)
      setProfile(result.profile)
      if (result.status === 'denied') {
        setWeatherError('위치 권한이 허용되지 않았어요. 설정에서 허용한 뒤 다시 시도해주세요.')
      } else if (result.status === 'unavailable') {
        setWeatherError('이 기기에서는 현재 위치를 사용할 수 없어요.')
      } else {
        setIsWeatherSheetOpen(false)
      }
    } catch {
      setWeatherError('날씨 데이터를 연결하지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsUpdatingWeather(false)
    }
  }

  const handleWeatherDisconnect = async () => {
    if (!user || isUpdatingWeather) return
    setIsUpdatingWeather(true)
    setWeatherError(null)

    try {
      const nextProfile = await disconnectWeatherData(user.id)
      setProfile(nextProfile)
      setIsWeatherSheetOpen(false)
    } catch {
      setWeatherError('날씨 데이터 연결을 끊지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsUpdatingWeather(false)
    }
  }

  if (!user) return null

  return (
    <>
      <AppHeader title="설정" backTo="/home" />
      <PageContainer className="pt-3">
        {isLoading ? (
          <SettingsSkeleton />
        ) : hasError || !profile ? (
          <Card className="mt-5 flex items-center gap-3 p-4">
            <RefreshCw size={18} className="shrink-0 text-ez-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ez-text">내 설정을 불러오지 못했어요.</p>
              <button type="button" onClick={() => void loadProfile()} className="mt-1 min-h-9 text-[12px] font-semibold text-ez-primary">
                다시 불러오기
              </button>
            </div>
          </Card>
        ) : (
          <ProfileSettings
            profile={profile}
            healthConnection={healthConnection}
            onOpenHealthConnection={() => {
              setHealthError(null)
              setIsHealthSheetOpen(true)
            }}
            onOpenWeatherConnection={() => {
              setWeatherError(null)
              setIsWeatherSheetOpen(true)
            }}
          />
        )}

        <div className="mt-5">
          <Disclaimer>
            EZkin은 생활 데이터와 피부 변화를 바탕으로 케어를 돕는 웰니스 서비스이며, 의료적 진단이나 치료를 대신하지 않습니다.
          </Disclaimer>
        </div>

        <AndroidNotificationTestSection userId={user.id} />

        {import.meta.env.VITE_ENABLE_DEMO_SCENARIO === 'true' && <DemoScenarioSwitch />}

      </PageContainer>

      {isHealthSheetOpen && healthConnection && (
        <HealthConnectionSheet
          connection={healthConnection}
          isBusy={isUpdatingHealth}
          error={healthError}
          onClose={() => setIsHealthSheetOpen(false)}
          onConnect={() => void handleHealthConnect()}
          onDisconnect={() => void handleHealthDisconnect()}
        />
      )}

      {isWeatherSheetOpen && profile && (
        <WeatherConnectionSheet
          connected={profile.weatherConnected}
          isBusy={isUpdatingWeather}
          error={weatherError}
          onClose={() => setIsWeatherSheetOpen(false)}
          onConnect={() => void handleWeatherConnect()}
          onDisconnect={() => void handleWeatherDisconnect()}
        />
      )}
    </>
  )
}

function ProfileSettings({
  profile,
  healthConnection,
  onOpenHealthConnection,
  onOpenWeatherConnection,
}: {
  profile: OnboardingProfile
  healthConnection: HealthConnection | null
  onOpenHealthConnection: () => void
  onOpenWeatherConnection: () => void
}) {
  const connectedHealthMetrics = healthConnection
    ? getAvailableHealthMetricLabels(healthConnection.availableMetrics)
    : []
  const concernLabels = concernOptions
    .filter((option) => profile.selectedConcerns.includes(option.id))
    .map((option) => option.label)
  const skinTypeLabels = {
    dry: '건성',
    oily: '지성',
    combination: '복합성',
    normal: '중성',
    unknown: '잘 모르겠어요',
  }
  const basicProfileLabel = [
    profile.nickname || '닉네임 미설정',
    profile.birthYear ? `${profile.birthYear}년생` : null,
  ].filter(Boolean).join(' · ')

  return (
    <>
      <section>
        <h2 className="text-[16px] font-bold text-ez-text">내 피부</h2>
        <Card className="mt-3 overflow-hidden">
          <div className="flex items-start gap-3 px-4 py-3.5">
            <CalendarDays size={17} className="mt-0.5 shrink-0 text-ez-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-ez-muted">기본 프로필</p>
              <p className="mt-1 text-[14px] font-semibold leading-5 text-ez-text">{basicProfileLabel}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-ez-border/70 px-4 py-3.5">
            <Droplets size={17} className="mt-0.5 shrink-0 text-ez-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-ez-muted">평소 피부 타입</p>
              <p className="mt-1 text-[14px] font-semibold leading-5 text-ez-text">{skinTypeLabels[profile.skinType]}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-ez-border/70 px-4 py-3.5">
            <Sparkles size={17} className="mt-0.5 shrink-0 text-ez-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-ez-muted">신경 쓰이는 피부 고민</p>
              <p className="mt-1 text-[14px] font-semibold leading-5 text-ez-text">
                {concernLabels.length > 0 ? concernLabels.join(' · ') : '아직 선택한 고민이 없어요'}
              </p>
            </div>
          </div>
          <Link
            to="/shelf"
            className="flex min-h-14 items-center gap-3 border-t border-ez-border/70 px-4 py-3 transition hover:bg-ez-primary-soft/50"
          >
            <Package size={17} className="shrink-0 text-ez-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-ez-muted">내 화장대</p>
              <p className="mt-0.5 text-[14px] font-semibold text-ez-text">등록 제품 {profile.registeredProductIds.length}개</p>
            </div>
            <ChevronRight size={17} className="shrink-0 text-ez-muted" aria-hidden="true" />
          </Link>
        </Card>
      </section>

      <section className="mt-7">
        <h2 className="text-[16px] font-bold text-ez-text">연결</h2>
        <Card className="mt-3 overflow-hidden">
          <ConnectionStatusRow
            icon={<Activity size={17} aria-hidden="true" />}
            title="워치"
            description={profile.lifeDataConnected
              ? connectedHealthMetrics.join(' · ') || '연결됨 · 가져온 데이터 없음'
              : '연결하면 지원되는 건강 데이터를 함께 볼 수 있어요'}
            connected={profile.lifeDataConnected}
            onClick={onOpenHealthConnection}
          />
          <ConnectionStatusRow
            icon={<CloudSun size={17} aria-hidden="true" />}
            title="날씨 데이터"
            description="기온 · 습도 · UV"
            connected={profile.weatherConnected}
            onClick={onOpenWeatherConnection}
          />
        </Card>
      </section>
    </>
  )
}

function ConnectionStatusRow({
  icon,
  title,
  description,
  connected,
  onClick,
}: {
  icon: ReactNode
  title: string
  description: string
  connected: boolean
  onClick?: () => void
}) {
  const content = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-ez-primary-soft text-ez-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ez-text">{title}</p>
        <p className="mt-0.5 text-[11px] font-normal text-ez-muted">{description}</p>
      </div>
      <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] ${connected ? 'font-semibold text-ez-success' : 'font-medium text-ez-muted'}`}>
        {connected && <Check size={12} strokeWidth={2.5} aria-hidden="true" />}
        {connected ? '연결됨' : '연결하기'}
        {onClick && <ChevronRight size={14} aria-hidden="true" />}
      </span>
    </>
  )

  return onClick ? (
    <button type="button" onClick={onClick} className="flex min-h-[68px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-ez-primary-soft/35 [&+&]:border-t [&+&]:border-ez-border/70">
      {content}
    </button>
  ) : (
    <div className="flex min-h-[68px] items-center gap-3 px-4 py-3 [&+&]:border-t [&+&]:border-ez-border/70">
      {content}
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="animate-pulse" aria-label="내 설정 불러오는 중">
      <div className="h-5 w-24 rounded bg-[#e8e4ef]" />
      <div className="mt-3 h-32 rounded-[20px] bg-[#efecf4]" />
      <div className="mt-7 h-5 w-24 rounded bg-[#e8e4ef]" />
      <div className="mt-3 h-36 rounded-[20px] bg-[#efecf4]" />
    </div>
  )
}
