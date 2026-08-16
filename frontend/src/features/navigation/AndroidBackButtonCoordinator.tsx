import { useEffect, useRef } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import {
  useLocation,
  useNavigate,
  useNavigationType,
} from 'react-router-dom'
import { ANDROID_HARDWARE_BACK_EVENT } from './androidBackEvent'
import { resolveAndroidBackAction } from './androidBackNavigation'

interface RouteEntry {
  key: string
  pathname: string
}

function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

export function AndroidBackButtonCoordinator() {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const routeStackRef = useRef<RouteEntry[]>([])
  const currentPathRef = useRef(location.pathname)

  useEffect(() => {
    currentPathRef.current = location.pathname

    const routeStack = routeStackRef.current
    const entry = { key: location.key, pathname: location.pathname }

    if (routeStack.length === 0) {
      routeStackRef.current = [entry]
      return
    }

    if (navigationType === 'REPLACE') {
      routeStackRef.current = [...routeStack.slice(0, -1), entry]
      return
    }

    if (navigationType === 'POP') {
      const existingIndex = routeStack.findIndex(({ key }) => key === location.key)
      routeStackRef.current = existingIndex >= 0
        ? routeStack.slice(0, existingIndex + 1)
        : [entry]
      return
    }

    if (routeStack.at(-1)?.key !== location.key) {
      routeStackRef.current = [...routeStack, entry]
    }
  }, [location.key, location.pathname, navigationType])

  useEffect(() => {
    if (!isAndroidNative()) return

    let isActive = true
    let removeBackListener: (() => Promise<void>) | undefined

    void CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const pathname = currentPathRef.current
      const routeBackEvent = new Event(ANDROID_HARDWARE_BACK_EVENT, { cancelable: true })
      window.dispatchEvent(routeBackEvent)
      if (routeBackEvent.defaultPrevented) return

      const routeStack = routeStackRef.current
      const previousRoute = routeStack.at(-2)
      const action = resolveAndroidBackAction({
        pathname,
        previousPathname: previousRoute?.pathname,
        canGoBack,
      })

      if (action === 'back') {
        navigate(-1)
        return
      }

      if (action === 'home') navigate('/home', { replace: true })
    }).then((handle) => {
      if (!isActive) {
        void handle.remove()
        return
      }
      removeBackListener = () => handle.remove()
    })

    return () => {
      isActive = false
      if (removeBackListener) void removeBackListener()
    }
  }, [navigate])

  return null
}

