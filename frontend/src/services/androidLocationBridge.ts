import { registerPlugin } from '@capacitor/core'

export type AndroidLocationStatus = 'granted' | 'denied' | 'unavailable'
export type AndroidLocationPermissionState = AndroidLocationStatus | 'prompt'

interface EzkinLocationPlugin {
  checkPermission(): Promise<{ status: AndroidLocationPermissionState }>
  requestCurrentPosition(): Promise<{
    status: AndroidLocationStatus
    latitude?: number
    longitude?: number
  }>
}

export const androidLocationBridge = registerPlugin<EzkinLocationPlugin>('EzkinLocation')
