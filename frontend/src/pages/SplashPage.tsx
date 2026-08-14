import { Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
        <span className="grid size-14 place-items-center rounded-[18px] bg-ez-primary text-white shadow-[0_8px_22px_rgba(108,76,207,0.16)]">
          <Sparkles size={27} strokeWidth={2.1} aria-hidden="true" />
        </span>
        <p className="mt-4 text-[28px] font-extrabold tracking-[-0.06em] text-ez-text">
          EZ<span className="text-ez-primary">kin</span>
        </p>
        <p className="mt-2 text-[13px] font-medium text-ez-muted">오늘 필요한 피부 케어만.</p>
      </div>
    </main>
  )
}
