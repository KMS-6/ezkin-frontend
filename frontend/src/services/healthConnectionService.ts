import type { HealthConnection, HealthDataSnapshot } from '../types/healthConnection'
import { getMockPersona } from '../mocks/personas'
import { getOnboardingProfile, saveConnectionSettings } from './onboardingService'
import { isDemoPersonaUser } from '../utils/appDateTime'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const TOKEN_KEY = 'ezkin:access-token'

const demoMetrics = {
  sleep_hours: true,
  hrv_ms: true,
  active_energy_kcal: true,
}

export function getNormalHealthMockSnapshot(now = new Date()): HealthDataSnapshot {
  return {
    collectedAt: now.toISOString(),
    sleep_hours: 6.4,
    hrv_ms: 47,
    active_energy_kcal: 420,
  }
}

const unavailableMetrics = {
  sleep_hours: false,
  hrv_ms: false,
  active_energy_kcal: false,
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new Error('API 주소가 설정되지 않았어요.')
  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) throw new Error('생활 데이터 연결 상태를 변경하지 못했어요.')
  return response.json() as Promise<T>
}

export async function getHealthConnection(userId: string): Promise<HealthConnection> {
  if (!isDemoPersonaUser(userId) && !USE_MOCK_API) {
    return request<HealthConnection>('/users/me/health-connection')
  }

  const profile = await getOnboardingProfile(userId)
  const persona = getMockPersona(userId)
  const availableMetrics = persona ? {
    sleep_hours: persona.current_health?.sleep_hours !== undefined,
    hrv_ms: persona.current_health?.hrv_ms !== undefined,
    active_energy_kcal: persona.current_health?.active_energy_kcal !== undefined,
  } : demoMetrics
  return {
    provider: 'demo',
    status: profile.lifeDataConnected ? 'connected' : 'not_requested',
    availableMetrics: profile.lifeDataConnected ? availableMetrics : unavailableMetrics,
  }
}

export async function connectHealthData(userId: string): Promise<HealthConnection> {
  if (!isDemoPersonaUser(userId) && !USE_MOCK_API) {
    return request<HealthConnection>('/users/me/health-connection', { method: 'POST' })
  }

  await wait(700)
  const profile = await getOnboardingProfile(userId)
  await saveConnectionSettings(userId, {
    lifeDataConnected: true,
    weatherConnected: profile.weatherConnected,
  })

  const persona = getMockPersona(userId)
  const availableMetrics = persona ? {
    sleep_hours: persona.current_health?.sleep_hours !== undefined,
    hrv_ms: persona.current_health?.hrv_ms !== undefined,
    active_energy_kcal: persona.current_health?.active_energy_kcal !== undefined,
  } : demoMetrics

  return {
    provider: 'demo',
    status: 'connected',
    connectedAt: new Date().toISOString(),
    availableMetrics,
  }
}

export async function disconnectHealthData(userId: string): Promise<HealthConnection> {
  if (!isDemoPersonaUser(userId) && !USE_MOCK_API) {
    return request<HealthConnection>('/users/me/health-connection', { method: 'DELETE' })
  }

  await wait(350)
  const profile = await getOnboardingProfile(userId)
  await saveConnectionSettings(userId, {
    lifeDataConnected: false,
    weatherConnected: profile.weatherConnected,
  })

  return {
    provider: 'demo',
    status: 'not_requested',
    availableMetrics: unavailableMetrics,
  }
}
