import type { OnboardingProfile } from '../types/onboarding'
import { getOnboardingProfile, saveConnectionSettings } from './onboardingService'

export type WeatherLocationPermissionStatus = 'granted' | 'denied' | 'unavailable'

export interface WeatherConnectionResult {
  status: WeatherLocationPermissionStatus
  profile: OnboardingProfile
}

export type WeatherPermissionRequester = () => Promise<WeatherLocationPermissionStatus>

export function requestWeatherLocationPermission(): Promise<WeatherLocationPermissionStatus> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve('unavailable')
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (error) => resolve(error.code === 1 ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60 * 1000 },
    )
  })
}

export async function connectWeatherData(
  userId: string,
  requestPermission: WeatherPermissionRequester = requestWeatherLocationPermission,
): Promise<WeatherConnectionResult> {
  const currentProfile = await getOnboardingProfile(userId)
  const status = await requestPermission()
  if (status !== 'granted') return { status, profile: currentProfile }

  const profile = await saveConnectionSettings(userId, {
    lifeDataConnected: currentProfile.lifeDataConnected,
    weatherConnected: true,
  })
  return { status, profile }
}

export async function disconnectWeatherData(userId: string): Promise<OnboardingProfile> {
  const currentProfile = await getOnboardingProfile(userId)
  return saveConnectionSettings(userId, {
    lifeDataConnected: currentProfile.lifeDataConnected,
    weatherConnected: false,
  })
}
