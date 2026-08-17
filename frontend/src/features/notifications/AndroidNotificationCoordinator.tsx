import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  addNotificationTapListener,
  consumePendingNotificationRoute,
  isAndroidNotificationAvailable,
  synchronizePendingQuickInputs,
} from '../../services/androidNotificationService'

export function AndroidNotificationCoordinator() {
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  useEffect(() => {
    if (!isAndroidNotificationAvailable()) return
    let isActive = true
    let removeTapListener: (() => Promise<void>) | undefined

    const synchronizeNativeState = async () => {
      await synchronizePendingQuickInputs()
      const route = await consumePendingNotificationRoute()
      if (route) navigateRef.current(route)
    }

    void addNotificationTapListener((route) => navigateRef.current(route)).then((handle) => {
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

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      isActive = false
      document.removeEventListener('visibilitychange', handleVisibility)
      if (removeTapListener) void removeTapListener()
    }
  }, [])

  return null
}
