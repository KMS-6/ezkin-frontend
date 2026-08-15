import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { EZkinLogo } from '../components/EZkinLogo'
import { useAuth } from '../features/auth/authContextValue'

export const SPLASH_DURATION_MS = 950

export function SplashPage() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    const timer = window.setTimeout(() => {
      navigate(user?.onboardingCompleted ? '/home' : '/onboarding', { replace: true })
    }, SPLASH_DURATION_MS)

    return () => window.clearTimeout(timer)
  }, [isLoading, navigate, user?.onboardingCompleted])

  return (
    <main
      className="grid min-h-dvh place-items-center px-6 sm:min-h-[calc(100vh-32px)]"
      aria-label="EZkin 시작 화면"
    >
      <div className="flex -translate-y-3 flex-col items-center text-center" role="status" aria-live="polite">
        <EZkinLogo size="large" stacked />
        <p className="mt-1 text-[13px] font-medium text-ez-muted">오늘 필요한 피부 케어만.</p>
      </div>
    </main>
  )
}
