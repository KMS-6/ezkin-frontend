import { Capacitor } from '@capacitor/core'
import type { OnboardingProfile } from '../types/onboarding'
import { androidLocationBridge } from './androidLocationBridge'
import { getOnboardingProfile, saveConnectionSettings } from './onboardingService'
import {
  clearCurrentWeatherData,
  refreshCurrentWeatherData,
  type TransientWeatherPosition,
} from './weatherDataService'

export type WeatherLocationPermissionStatus = 'granted' | 'denied' | 'unavailable'
export type WeatherLocationPermissionState = WeatherLocationPermissionStatus | 'prompt'

export interface WeatherConnectionResult {
  status: WeatherLocationPermissionStatus
  profile: OnboardingProfile
}

interface WeatherPermissionAccess {
  status: WeatherLocationPermissionStatus
  position?: TransientWeatherPosition
}

export type WeatherPermissionRequester = () => Promise<WeatherLocationPermissionStatus | WeatherPermissionAccess>
export type WeatherPermissionChecker = () => Promise<WeatherLocationPermissionState>

function usesAndroidNativeLocation(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

function isPermissionState(value: unknown): value is WeatherLocationPermissionState {
  return value === 'granted' || value === 'denied' || value === 'unavailable' || value === 'prompt'
}

function isPermissionStatus(value: unknown): value is WeatherLocationPermissionStatus {
  return value === 'granted' || value === 'denied' || value === 'unavailable'
}

function normalizePermissionAccess(
  value: WeatherLocationPermissionStatus | WeatherPermissionAccess,
): WeatherPermissionAccess {
  return typeof value === 'string' ? { status: value } : value
}

export async function getWeatherLocationPermissionState(): Promise<WeatherLocationPermissionState> {
  if (usesAndroidNativeLocation()) {
    try {
      const result = await androidLocationBridge.checkPermission()
      return isPermissionState(result.status) ? result.status : 'unavailable'
    } catch {
      return 'unavailable'
    }
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) return 'unavailable'
  if (!navigator.permissions?.query) return 'prompt'

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' })
    return permission.state
  } catch {
    return 'prompt'
  }
}

export async function requestWeatherLocationPermission(): Promise<WeatherPermissionAccess> {
  if (usesAndroidNativeLocation()) {
    try {
      const result = await androidLocationBridge.requestCurrentPosition()
      if (!isPermissionStatus(result.status)) return { status: 'unavailable' }
      if (
        result.status === 'granted'
        && Number.isFinite(result.latitude)
        && Number.isFinite(result.longitude)
      ) {
        return {
          status: 'granted',
          position: {
            coords: {
              latitude: result.latitude as number,
              longitude: result.longitude as number,
            },
          },
        }
      }
      return { status: result.status === 'granted' ? 'unavailable' : result.status }
    } catch {
      return { status: 'unavailable' }
    }
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { status: 'unavailable' }
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        status: 'granted',
        position: {
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        },
      }),
      (error) => resolve({ status: error.code === 1 ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60 * 1000 },
    )
  })
}

export async function connectWeatherData(
  userId: string,
  requestPermission: WeatherPermissionRequester = requestWeatherLocationPermission,
): Promise<WeatherConnectionResult> {
  // Start geolocation before the first await so the browser retains the click activation.
  const permissionRequest = requestPermission()
  const currentProfile = await getOnboardingProfile(userId)
  const permission = normalizePermissionAccess(await permissionRequest)
  const { status } = permission
  if (status !== 'granted') {
    const profile = currentProfile.weatherConnected
      ? await saveConnectionSettings(userId, {
          lifeDataConnected: currentProfile.lifeDataConnected,
          weatherConnected: false,
        })
      : currentProfile
    return { status, profile }
  }

  const profile = await saveConnectionSettings(userId, {
    lifeDataConnected: currentProfile.lifeDataConnected,
    weatherConnected: true,
  })
  await refreshCurrentWeatherData(userId, {
    ...(permission.position ? { position: permission.position } : {}),
  }).catch(() => undefined)
  return { status, profile }
}

export async function reconcileWeatherConnectionPermission(
  userId: string,
  checkPermission: WeatherPermissionChecker = getWeatherLocationPermissionState,
): Promise<OnboardingProfile> {
  const currentProfile = await getOnboardingProfile(userId)
  if (!currentProfile.weatherConnected) return currentProfile

  const status = await checkPermission()
  if (status === 'granted') return currentProfile

  clearCurrentWeatherData(userId)
  return saveConnectionSettings(userId, {
    lifeDataConnected: currentProfile.lifeDataConnected,
    weatherConnected: false,
  })
}

export async function disconnectWeatherData(userId: string): Promise<OnboardingProfile> {
  const currentProfile = await getOnboardingProfile(userId)
  clearCurrentWeatherData(userId)
  return saveConnectionSettings(userId, {
    lifeDataConnected: currentProfile.lifeDataConnected,
    weatherConnected: false,
  })
}
