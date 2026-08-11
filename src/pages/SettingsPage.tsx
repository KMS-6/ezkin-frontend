import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity,
  Check,
  ChevronRight,
  CloudSun,
  LogOut,
  Package,
  RefreshCw,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { PageContainer } from '../components/PageContainer'
import { SecondaryButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Disclaimer } from '../components/ui/Disclaimer'
import { useAuth } from '../features/auth/authContextValue'
import { concernOptions } from '../mocks/onboarding'
import { getOnboardingProfile } from '../services/onboardingService'
import type { OnboardingProfile } from '../types/onboarding'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<OnboardingProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const loadProfile = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setHasError(false)

    try {
      setProfile(await getOnboardingProfile(user.id))
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!user) return null

  return (
    <>
      <AppHeader title="설정" backTo="/home" />
      <PageContainer className="pt-3">
        <section>
          <h1 className="text-[19px] font-bold tracking-[-0.025em] text-ez-text">내 계정</h1>
          <Card className="mt-3 flex items-center gap-3 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-ez-primary-soft text-ez-primary">
              <UserRound size={19} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-ez-muted">로그인 계정</p>
              <p className="mt-0.5 truncate text-[14px] font-semibold text-ez-text">{user.email}</p>
            </div>
          </Card>
        </section>

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
          <ProfileSettings profile={profile} />
        )}

        <div className="mt-5">
          <Disclaimer>
            EZkin은 생활 데이터와 피부 변화를 바탕으로 케어를 돕는 웰니스 서비스이며, 의료적 진단이나 치료를 대신하지 않습니다.
          </Disclaimer>
        </div>

        <SecondaryButton
          type="button"
          fullWidth
          className="mt-5 text-ez-danger"
          onClick={handleLogout}
          disabled={isLoggingOut}
          icon={<LogOut size={17} aria-hidden="true" />}
        >
          {isLoggingOut ? '로그아웃 중' : '로그아웃'}
        </SecondaryButton>
        <p className="mt-3 text-center text-[11px] leading-5 text-ez-muted">
          로그아웃해도 내 정보는 유지돼요.
        </p>
      </PageContainer>
    </>
  )
}

function ProfileSettings({ profile }: { profile: OnboardingProfile }) {
  const concernLabels = concernOptions
    .filter((option) => profile.selectedConcerns.includes(option.id))
    .map((option) => option.label)

  return (
    <>
      <section className="mt-7">
        <h2 className="text-[16px] font-bold text-ez-text">내 케어 기준</h2>
        <Card className="mt-3 overflow-hidden">
          <div className="flex items-start gap-3 px-4 py-4">
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
        <h2 className="text-[16px] font-bold text-ez-text">자동 데이터</h2>
        <Card className="mt-3 overflow-hidden">
          <ConnectionStatusRow
            icon={<Activity size={17} aria-hidden="true" />}
            title="생활 데이터"
            description="수면 · 활동 · 생활 리듬"
            connected={profile.lifeDataConnected}
          />
          <ConnectionStatusRow
            icon={<CloudSun size={17} aria-hidden="true" />}
            title="날씨 데이터"
            description="기온 · 습도 · UV"
            connected={profile.weatherConnected}
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
}: {
  icon: ReactNode
  title: string
  description: string
  connected: boolean
}) {
  return (
    <div className="flex min-h-[68px] items-center gap-3 px-4 py-3 [&+&]:border-t [&+&]:border-ez-border/70">
      <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-ez-primary-soft text-ez-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ez-text">{title}</p>
        <p className="mt-0.5 text-[11px] font-normal text-ez-muted">{description}</p>
      </div>
      <span className={connected ? 'inline-flex items-center gap-1 text-[11px] font-semibold text-ez-success' : 'text-[11px] font-medium text-ez-muted'}>
        {connected && <Check size={12} strokeWidth={2.5} aria-hidden="true" />}
        {connected ? '연결됨' : '연결 안 함'}
      </span>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="mt-7 animate-pulse" aria-label="내 설정 불러오는 중">
      <div className="h-5 w-24 rounded bg-[#e8e4ef]" />
      <div className="mt-3 h-32 rounded-[20px] bg-[#efecf4]" />
      <div className="mt-7 h-5 w-24 rounded bg-[#e8e4ef]" />
      <div className="mt-3 h-36 rounded-[20px] bg-[#efecf4]" />
    </div>
  )
}
