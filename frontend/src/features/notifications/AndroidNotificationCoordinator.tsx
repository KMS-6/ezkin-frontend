import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  addNotificationTapListener,
  consumePendingNotificationRoute,
  isAndroidNotificationAvailable,
  synchronizePendingQuickInputs,
} from '../../services/androidNotificationService'

export function AndroidNotificationCoordinator() {
  const navigate = useNavigate()

  const synchronizeNativeState = useCallback(async () => {
    if (!isAndroidNotificationAvailable()) return
    await synchronizePendingQuickInputs()
    const route = await consumePendingNotificationRoute()
    if (route) navigate(route)
  }, [navigate])

  useEffect(() => {
    if (!isAndroidNotificationAvailable()) return
    let isActive = true
    let removeTapListener: (() => Promise<void>) | undefined

    void addNotificationTapListener((route) => navigate(route)).then((handle) => {
      if (!handle) return
      if (!isActive) {
        void handle.remove()
        return
      }
      removeTapListener = () => handle.remove()
    })
    void synchronizeNativeState()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void synchronizeNativeState()
    }
    const handleFocus = () => void synchronizeNativeState()

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    return () => {
      isActive = false
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
      if (removeTapListener) void removeTapListener()
    }
  }, [navigate, synchronizeNativeState])

  return null
}
