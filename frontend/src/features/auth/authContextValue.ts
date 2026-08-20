import { createContext, useContext } from 'react'
import type { LoginRequest, SignupRequest, User } from '../../types/auth'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<User>
  signup: (payload: SignupRequest) => Promise<User>
  logout: () => Promise<void>
  completeOnboarding: (targetUser?: User) => Promise<User>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.')
  return context
}
