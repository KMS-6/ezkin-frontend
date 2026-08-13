export function getSafeReturnPath(state: unknown): string | null {
  if (!state || typeof state !== 'object' || !('returnTo' in state)) return null
  const returnTo = (state as { returnTo?: unknown }).returnTo
  if (typeof returnTo !== 'string' || !returnTo.startsWith('/') || returnTo.startsWith('//')) return null
  return returnTo
}
