const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const TOKEN_KEY = 'ezkin:access-token'

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
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiClientOptions = {},
): Promise<T> {
  const baseUrl = (options.baseUrl ?? API_BASE_URL)?.replace(/\/$/, '')
  if (!baseUrl) throw new ApiClientError('API 주소가 설정되지 않았어요.')

  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = localStorage.getItem(TOKEN_KEY)
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)

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
    throw new ApiClientError('요청을 처리하지 못했어요.', response.status)
  }
  if (response.status === 204) return undefined as T

  try {
    return await response.json() as T
  } catch {
    throw new ApiClientError('서버 응답을 확인하지 못했어요.', response.status)
  }
}
