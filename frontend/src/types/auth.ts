export interface User {
  id: string
  email: string
  nickname?: string
  onboardingCompleted: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  nickname?: string
}

export interface AuthResponse {
  user: User
  accessToken?: string
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_IN_USE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'
