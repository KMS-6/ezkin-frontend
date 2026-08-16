export type AndroidBackAction = 'back' | 'home' | 'stay'

function isEntryRoute(pathname: string): boolean {
  return pathname === '/' || pathname === '/login' || pathname === '/signup'
}

export function resolveAndroidBackAction({
  pathname,
  previousPathname,
  canGoBack,
}: {
  pathname: string
  previousPathname?: string
  canGoBack: boolean
}): AndroidBackAction {
  if (pathname === '/home' || pathname === '/onboarding' || isEntryRoute(pathname)) {
    return 'stay'
  }

  if (canGoBack && previousPathname && !isEntryRoute(previousPathname)) {
    return 'back'
  }

  return 'home'
}

