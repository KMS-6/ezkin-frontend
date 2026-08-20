const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const TOKEN_KEY = 'ezkin:access-token'
const SESSION_KEY = 'ezkin:auth-session'

interface StoredSession {
  user?: { id?: unknown }
}

const BACKEND_PERSONA_IDS: Readonly<Record<string, string>> = {
  persona_a1_seoyeon: 'persona_001',
  persona_b1_eunji: 'persona_002',
  persona_c1_minjun: 'persona_003',
}

function getActivePersonaId(): string | null {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as StoredSession | null
    const userId = session?.user?.id
    if (typeof userId !== 'string' || !userId.startsWith('persona_')) return null
    return BACKEND_PERSONA_IDS[userId] ?? userId
  } catch {
    return null
  }
}

export class ApiClientError extends Error {
  readonly status?: number

  constructor(
    message: string,
    status?: number,
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
  }
}

export interface ApiClientOptions {
  baseUrl?: string
  fetcher?: typeof fetch
  personaId?: string
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiClientOptions = {},
): Promise<T> {
  const baseUrl = (options.baseUrl ?? API_BASE_URL)?.replace(/\/$/, '')
  if (!baseUrl) throw new ApiClientError('API 주소가 설정되지 않았어요.')

  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const token = localStorage.getItem(TOKEN_KEY)
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
  const explicitPersonaId = options.personaId
  const personaId = explicitPersonaId
    ? BACKEND_PERSONA_IDS[explicitPersonaId] ?? explicitPersonaId
    : getActivePersonaId()
  if (personaId && !headers.has('X-Mock-Persona-Id')) {
    headers.set('X-Mock-Persona-Id', personaId)
  }

  let response: Response
  try {
    response = await (options.fetcher ?? fetch)(`${baseUrl}/${path.replace(/^\//, '')}`, {
      ...init,
      credentials: 'include',
      headers,
    })
  } catch {
    throw new ApiClientError('서버에 연결하지 못했어요.')
  }

  if (!response.ok) {
    let message = '요청을 처리하지 못했어요.'
    try {
      const body = await response.json() as { detail?: unknown; message?: unknown }
      if (typeof body.message === 'string') message = body.message
      else if (typeof body.detail === 'string') message = body.detail
      else if (
        body.detail
        && typeof body.detail === 'object'
        && 'message' in body.detail
        && typeof body.detail.message === 'string'
      ) message = body.detail.message
    } catch {
      // JSON 오류 본문이 아니면 사용자용 기본 문구를 유지합니다.
    }
    throw new ApiClientError(message, response.status)
  }
  if (response.status === 204) return undefined as T

  try {
    return await response.json() as T
  } catch {
    throw new ApiClientError('서버 응답을 확인하지 못했어요.', response.status)
  }
}
