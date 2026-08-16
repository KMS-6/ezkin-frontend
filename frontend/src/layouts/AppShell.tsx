import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { useAuth } from '../features/auth/authContextValue'

const routesWithoutNav = ['/login', '/signup', '/onboarding', '/briefing', '/sos', '/analysis/trigger']

export function AppShell() {
  const { pathname } = useLocation()
  const { user, isLoading } = useAuth()
  const showBottomNav = !isLoading
    && Boolean(user?.onboardingCompleted)
    && pathname !== '/'
    && !routesWithoutNav.some((route) => pathname.startsWith(route))

  return (
    <div className="app-shell">
      <div className="flex min-h-dvh flex-col bg-ez-bg sm:min-h-[calc(100vh-32px)]">
        <Outlet />
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  )
}
