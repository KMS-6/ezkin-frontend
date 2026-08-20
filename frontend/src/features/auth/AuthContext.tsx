import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  completeOnboarding as completeOnboardingService,
  getEntryUser,
  login as loginService,
  logout as logoutService,
  signup as signupService,
} from '../../services/authService'
import { resolveDemoScenarioEntryUser } from '../../services/demoScenarioService'
import type { LoginRequest, SignupRequest, User } from '../../types/auth'
import { AuthContext } from './authContextValue'
import type { AuthContextValue } from './authContextValue'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    void getEntryUser()
      .then(resolveDemoScenarioEntryUser)
      .then((currentUser) => {
        if (isActive) setUser(currentUser)
      })
      .catch(() => {
        if (isActive) setUser(null)
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await loginService(credentials)
    setUser(response.user)
    return response.user
  }, [])

  const signup = useCallback(async (payload: SignupRequest) => {
    const response = await signupService(payload)
    setUser(response.user)
    return response.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutService()
    } finally {
      setUser(null)
    }
  }, [])

  const completeOnboarding = useCallback(async (targetUser?: User) => {
    const updatedUser = await completeOnboardingService(targetUser ?? user ?? undefined)
    setUser(updatedUser)
    return updatedUser
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      signup,
      logout,
      completeOnboarding,
    }),
    [completeOnboarding, isLoading, login, logout, signup, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
