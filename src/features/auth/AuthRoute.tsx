import { LoaderCircle } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'
import { EZkinLogo } from '../../components/EZkinLogo'
import { useAuth } from './authContextValue'

interface ProtectedRouteProps {
  onboarding?: 'required' | 'incomplete'
}

export function ProtectedRoute({ onboarding = 'required' }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <AuthLoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (onboarding === 'required' && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }
  if (onboarding === 'incomplete' && user.onboardingCompleted) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <AuthLoadingScreen />
  if (user) {
    return <Navigate to={user.onboardingCompleted ? '/home' : '/onboarding'} replace />
  }

  return <Outlet />
}

export function RootRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <AuthLoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.onboardingCompleted ? '/home' : '/onboarding'} replace />
}

function AuthLoadingScreen() {
  return (
    <div className="grid min-h-dvh place-items-center sm:min-h-[calc(100vh-32px)]" role="status" aria-label="로그인 상태 확인 중">
      <div className="flex flex-col items-center gap-4">
        <EZkinLogo />
        <LoaderCircle size={20} className="animate-spin text-ez-primary" aria-hidden="true" />
      </div>
    </div>
  )
}
