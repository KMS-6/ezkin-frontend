import type { User } from '../types/auth'
import { isDemoPersonaUser } from '../utils/appDateTime'
import { ACCESS_TOKEN_STORAGE_KEY, apiRequest } from './apiClient'
import { getOrCreateNormalUserEmail } from './normalUserIdentityService'

const NORMAL_BACKEND_IDENTITY_KEY = 'ezkin:normal-backend-identity'
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const USE_ONBOARDING_API = import.meta.env.VITE_USE_ONBOARDING_API === 'true'
const USE_SHELF_API = import.meta.env.VITE_USE_SHELF_API === 'true'
const USE_MANUAL_METRICS_API = import.meta.env.VITE_USE_MANUAL_METRICS_API === 'true'
const USE_BRIEFING_API = import.meta.env.VITE_USE_BRIEFING_API === 'true'
const USE_ANALYSIS_API = import.meta.env.VITE_USE_ANALYSIS_API === 'true'
const USE_SKIN_SCAN_API = import.meta.env.VITE_USE_SKIN_SCAN_API === 'true'
const USE_SOS_API = import.meta.env.VITE_USE_SOS_API === 'true'
const USE_NOTIFICATION_SETTINGS_API = import.meta.env.VITE_USE_NOTIFICATION_SETTINGS_API === 'true'

interface BackendUserResponse {
  id: string
  email: string
  nickname: string
  created_at: string
}

interface UserRegistrationResponse {
  user: BackendUserResponse
  access_token: string
  token_type: string
}

export interface NormalBackendIdentity {
  frontendUserId: string
  backendUserId: string
  accessToken: string
  email?: string
}

export class BackendIdentityRequiredError extends Error {
  constructor() {
    super('일반 사용자 backend 연결을 먼저 준비해 주세요.')
    this.name = 'BackendIdentityRequiredError'
  }
}

export function requiresNormalBackendIdentity(userId: string): boolean {
  const usesAuthenticatedApi = !USE_MOCK_API
    || USE_ONBOARDING_API
    || USE_SHELF_API
    || USE_MANUAL_METRICS_API
    || USE_BRIEFING_API
    || USE_ANALYSIS_API
    || USE_SKIN_SCAN_API
    || USE_SOS_API
    || USE_NOTIFICATION_SETTINGS_API
  return !isDemoPersonaUser(userId) && usesAuthenticatedApi
}

function readStoredIdentity(): NormalBackendIdentity | null {
  const saved = localStorage.getItem(NORMAL_BACKEND_IDENTITY_KEY)
  if (!saved) return null

  try {
    const identity = JSON.parse(saved) as Partial<NormalBackendIdentity>
    if (
      typeof identity.frontendUserId === 'string'
      && typeof identity.backendUserId === 'string'
      && typeof identity.accessToken === 'string'
      && identity.accessToken.length > 0
    ) {
      if (typeof identity.email === 'string') {
        identity.email = identity.email.trim().toLowerCase()
      }
      return identity as NormalBackendIdentity
    }
  } catch {
    // Invalid identity data is ignored without touching other user storage.
  }
  return null
}

function migrateActiveRealToken(userId: string): NormalBackendIdentity | null {
  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  if (!token || token.startsWith('mock-token-')) return null

  const identity: NormalBackendIdentity = {
    frontendUserId: userId,
    backendUserId: userId,
    accessToken: token,
    email: getOrCreateNormalUserEmail(undefined, userId),
  }
  localStorage.setItem(NORMAL_BACKEND_IDENTITY_KEY, JSON.stringify(identity))
  return identity
}

export function getNormalBackendIdentity(userId: string): NormalBackendIdentity | null {
  if (isDemoPersonaUser(userId)) return null
  const identity = readStoredIdentity() ?? migrateActiveRealToken(userId)
  return identity?.frontendUserId === userId ? identity : null
}

export function hasNormalBackendIdentity(userId: string): boolean {
  return Boolean(getNormalBackendIdentity(userId))
}

export function requireNormalBackendIdentity(userId: string): NormalBackendIdentity {
  const identity = getNormalBackendIdentity(userId)
  if (!identity) throw new BackendIdentityRequiredError()
  return identity
}

export function clearActiveBackendToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}

export function restoreNormalBackendIdentity(userId: string): boolean {
  const identity = getNormalBackendIdentity(userId)
  if (!identity) {
    clearActiveBackendToken()
    return false
  }
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, identity.accessToken)
  return true
}

export async function ensureNormalBackendIdentity(
  user: User,
  nickname: string,
): Promise<NormalBackendIdentity> {
  if (isDemoPersonaUser(user.id)) {
    throw new Error('Demo Persona는 일반 사용자 backend identity를 만들 수 없어요.')
  }

  const existing = getNormalBackendIdentity(user.id)
  if (existing) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, existing.accessToken)
    return existing
  }

  clearActiveBackendToken()
  const response = await apiRequest<UserRegistrationResponse>('/users', {
    method: 'POST',
    body: JSON.stringify({
      email: getOrCreateNormalUserEmail(user.email, user.id),
      nickname: nickname.trim() || user.nickname?.trim() || 'EZkin 사용자',
    }),
  }, { includePersona: false })

  const identity: NormalBackendIdentity = {
    frontendUserId: user.id,
    backendUserId: response.user.id,
    accessToken: response.access_token,
    email: response.user.email,
  }
  localStorage.setItem(NORMAL_BACKEND_IDENTITY_KEY, JSON.stringify(identity))
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, identity.accessToken)
  return identity
}
