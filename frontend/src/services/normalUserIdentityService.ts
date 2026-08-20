import type { User } from '../types/auth'

export const NORMAL_USER_ID = 'ezkin-demo-user'

const NORMAL_USER_EMAIL_KEY = 'ezkin:normal-user-email'
const NORMAL_USER_KEY = 'ezkin:normal-user'
const SESSION_KEY = 'ezkin:auth-session'
const NORMAL_BACKEND_IDENTITY_KEY = 'ezkin:normal-backend-identity'
const LEGACY_LOCAL_EMAIL = 'local@ezkin.app'

interface StoredBackendIdentity {
  frontendUserId?: unknown
  email?: unknown
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  return email.includes('@') ? email : null
}

function readJson(key: string): unknown {
  const saved = localStorage.getItem(key)
  if (!saved) return null

  try {
    return JSON.parse(saved) as unknown
  } catch {
    return null
  }
}

function isPersonaUserId(userId: string): boolean {
  return userId.startsWith('persona_')
}

function readStoredNormalUser(userId: string): User | null {
  const remembered = readJson(NORMAL_USER_KEY) as Partial<User> | null
  if (
    remembered
    && remembered.id === userId
    && !isPersonaUserId(remembered.id)
    && normalizeEmail(remembered.email)
    && typeof remembered.onboardingCompleted === 'boolean'
  ) {
    return remembered as User
  }

  const session = readJson(SESSION_KEY) as { user?: Partial<User> } | null
  if (
    session?.user?.id === userId
    && !isPersonaUserId(session.user.id)
    && normalizeEmail(session.user.email)
    && typeof session.user.onboardingCompleted === 'boolean'
  ) {
    return session.user as User
  }

  return null
}

function readStoredBackendEmail(userId: string): string | null {
  const identity = readJson(NORMAL_BACKEND_IDENTITY_KEY) as StoredBackendIdentity | null
  if (identity?.frontendUserId !== userId) return null
  return normalizeEmail(identity.email)
}

function hasStoredBackendIdentity(userId: string): boolean {
  const identity = readJson(NORMAL_BACKEND_IDENTITY_KEY) as StoredBackendIdentity | null
  return identity?.frontendUserId === userId
}

function createInstallationEmail(): string {
  return `local-${crypto.randomUUID()}@ezkin.app`
}

export function getOrCreateNormalUserEmail(
  preferredEmail?: string,
  userId = NORMAL_USER_ID,
): string {
  const storedEmail = normalizeEmail(localStorage.getItem(NORMAL_USER_EMAIL_KEY))
  const backendEmail = readStoredBackendEmail(userId)
  const rememberedEmail = normalizeEmail(preferredEmail)
    ?? normalizeEmail(readStoredNormalUser(userId)?.email)
  const backendIdentityExists = hasStoredBackendIdentity(userId)
  const reusableEmail = backendEmail
    ?? (backendIdentityExists && rememberedEmail ? rememberedEmail : null)
    ?? storedEmail
    ?? (rememberedEmail && rememberedEmail !== LEGACY_LOCAL_EMAIL
      ? rememberedEmail
      : null)
  const email = reusableEmail ?? createInstallationEmail()
  localStorage.setItem(NORMAL_USER_EMAIL_KEY, email)
  return email
}

export function createDefaultNormalUser(): User {
  return {
    id: NORMAL_USER_ID,
    email: getOrCreateNormalUserEmail(),
    onboardingCompleted: false,
  }
}

export function normalizeNormalUserIdentity(user: User): User {
  if (isPersonaUserId(user.id)) return user
  return {
    ...user,
    email: getOrCreateNormalUserEmail(user.email, user.id),
  }
}
