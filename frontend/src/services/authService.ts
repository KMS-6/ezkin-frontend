import type {
  AuthErrorCode,
  AuthResponse,
  LoginRequest,
  SignupRequest,
  User,
} from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

const SESSION_KEY = 'ezkin:auth-session'
const TOKEN_KEY = 'ezkin:access-token'
const MOCK_USERS_KEY = 'ezkin:mock-users'
const LEGACY_MOCK_USERS_KEYS = ['ezkin_mock_users', 'ezkin_users']

interface StoredMockUser {
  user: User
  password: string
}

const demoAccount: StoredMockUser = {
  user: {
    id: 'ezkin-demo-user',
    email: 'demo@ezkin.app',
    nickname: 'EZkin 데모',
    onboardingCompleted: true,
  },
  password: 'ezkin1234',
}

export class AuthServiceError extends Error {
  code: AuthErrorCode

  constructor(code: AuthErrorCode, message: string) {
    super(message)
    this.name = 'AuthServiceError'
    this.code = code
  }
}

function delay(milliseconds = 450): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<User>
  return typeof candidate.id === 'string'
    && typeof candidate.email === 'string'
    && typeof candidate.onboardingCompleted === 'boolean'
}

function parseStoredAccount(value: unknown): StoredMockUser | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as {
    user?: unknown
    password?: unknown
    id?: unknown
    email?: unknown
    nickname?: unknown
    onboardingCompleted?: unknown
  }

  if (isUser(candidate.user) && typeof candidate.password === 'string') {
    return {
      user: { ...candidate.user, email: normalizeEmail(candidate.user.email) },
      password: candidate.password,
    }
  }

  // 이전 Mock 버전의 flat user 레코드도 현재 credential 구조로 안전하게 옮깁니다.
  if (
    typeof candidate.id === 'string'
    && typeof candidate.email === 'string'
    && typeof candidate.password === 'string'
    && typeof candidate.onboardingCompleted === 'boolean'
  ) {
    return {
      user: {
        id: candidate.id,
        email: normalizeEmail(candidate.email),
        nickname: typeof candidate.nickname === 'string' ? candidate.nickname : undefined,
        onboardingCompleted: candidate.onboardingCompleted,
      },
      password: candidate.password,
    }
  }

  return null
}

function parseMockUserStore(saved: string): StoredMockUser[] {
  try {
    const parsed = JSON.parse(saved) as unknown
    const records = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as { users?: unknown }).users)
        ? (parsed as { users: unknown[] }).users
        : []
    return records.map(parseStoredAccount).filter((account): account is StoredMockUser => Boolean(account))
  } catch {
    return []
  }
}

function normalizeMockUsers(users: StoredMockUser[]): StoredMockUser[] {
  const normalized = [demoAccount]
  const knownEmails = new Set([demoAccount.user.email])
  const knownIds = new Set([demoAccount.user.id])

  for (const account of users) {
    const email = normalizeEmail(account.user.email)
    if (knownEmails.has(email) || knownIds.has(account.user.id)) continue
    normalized.push({ ...account, user: { ...account.user, email } })
    knownEmails.add(email)
    knownIds.add(account.user.id)
  }

  return normalized
}

function readMockUsers(): StoredMockUser[] {
  const savedStores = [MOCK_USERS_KEY, ...LEGACY_MOCK_USERS_KEYS]
    .map((key) => localStorage.getItem(key))
    .filter((saved): saved is string => saved !== null)
  const users = normalizeMockUsers(savedStores.flatMap(parseMockUserStore))

  const currentStore = localStorage.getItem(MOCK_USERS_KEY)
  if (currentStore !== JSON.stringify(users)) {
    writeMockUsers(users)
  }

  return users
}

function writeMockUsers(users: StoredMockUser[]): void {
  // Mock 개발 모드 전용 저장소입니다. 실제 비밀번호 저장은 Backend가 담당합니다.
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
}

function saveSession(response: AuthResponse): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(response))
  if (response.accessToken) localStorage.setItem(TOKEN_KEY, response.accessToken)
  else localStorage.removeItem(TOKEN_KEY)
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new AuthServiceError('NETWORK_ERROR', 'API 주소가 설정되지 않았어요.')
  }

  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null
      const code: AuthErrorCode = response.status === 401
        ? 'INVALID_CREDENTIALS'
        : response.status === 409
          ? 'EMAIL_IN_USE'
          : 'UNKNOWN'
      throw new AuthServiceError(code, body?.message ?? '요청을 처리하지 못했어요.')
    }

    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof AuthServiceError) throw error
    throw new AuthServiceError('NETWORK_ERROR', '잠시 후 다시 시도해주세요.')
  }
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  if (!USE_MOCK_API) {
    const response = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    saveSession(response)
    return response
  }

  await delay()
  const email = normalizeEmail(credentials.email)
  const account = readMockUsers().find(
    ({ user, password }) => normalizeEmail(user.email) === email && password === credentials.password,
  )

  if (!account) {
    throw new AuthServiceError('INVALID_CREDENTIALS', '이메일 또는 비밀번호를 확인해주세요.')
  }

  const response = {
    user: account.user,
    accessToken: `mock-token-${account.user.id}`,
  }
  saveSession(response)
  return response
}

export async function signup(payload: SignupRequest): Promise<AuthResponse> {
  if (!USE_MOCK_API) {
    const response = await request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    saveSession(response)
    return response
  }

  await delay()
  const users = readMockUsers()
  const email = normalizeEmail(payload.email)

  if (users.some(({ user }) => normalizeEmail(user.email) === email)) {
    throw new AuthServiceError('EMAIL_IN_USE', '이미 가입된 이메일이에요.')
  }

  const user: User = {
    id: crypto.randomUUID(),
    email,
    nickname: payload.nickname?.trim() || undefined,
    onboardingCompleted: false,
  }
  const response = { user, accessToken: `mock-token-${user.id}` }

  writeMockUsers([...users, { user, password: payload.password }])
  saveSession(response)
  return response
}

export async function logout(): Promise<void> {
  if (!USE_MOCK_API && API_BASE_URL) {
    try {
      await request<void>('/auth/logout', { method: 'POST' })
    } finally {
      clearSession()
    }
    return
  }

  await delay(200)
  clearSession()
}

export async function getCurrentUser(): Promise<User | null> {
  if (!USE_MOCK_API) {
    if (!localStorage.getItem(TOKEN_KEY)) return null
    try {
      return await request<User>('/users/me')
    } catch (error) {
      clearSession()
      if (error instanceof AuthServiceError && error.code === 'INVALID_CREDENTIALS') return null
      throw error
    }
  }

  await delay(200)
  const saved = localStorage.getItem(SESSION_KEY)
  if (!saved) return null

  try {
    const session = JSON.parse(saved) as AuthResponse
    const account = readMockUsers().find(({ user }) => user.id === session.user.id)
    return account?.user ?? session.user
  } catch {
    clearSession()
    return null
  }
}

export async function completeOnboarding(): Promise<User> {
  if (!USE_MOCK_API) {
    const user = await request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ onboardingCompleted: true }),
    })
    const accessToken = localStorage.getItem(TOKEN_KEY) ?? undefined
    saveSession({ user, accessToken })
    return user
  }

  await delay(300)
  const saved = localStorage.getItem(SESSION_KEY)
  if (!saved) throw new AuthServiceError('INVALID_CREDENTIALS', '로그인이 필요해요.')

  const session = JSON.parse(saved) as AuthResponse
  const users = readMockUsers()
  const accountIndex = users.findIndex(({ user }) => user.id === session.user.id)
  const user = { ...session.user, onboardingCompleted: true }

  if (accountIndex >= 0) {
    users[accountIndex] = { ...users[accountIndex], user }
    writeMockUsers(users)
  }

  saveSession({ ...session, user })
  return user
}
